import { StayModel, StayDoc } from '../models/stay.model';
import { BookingModel } from '../models/booking.model';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { AvailabilityCheckResponse } from '../types';

/**
 * Parses an ISO date/date-time string into a valid UTC Date.
 * Supports:
 * - Full ISO: "2026-05-10T14:30:00.000Z"
 * - Date-time local: "2026-05-10T14:30"
 * - Date only: "2026-05-10" (defaults to defaultHour UTC, e.g. 12:00 PM check-in, 10:00 AM check-out)
 */
export function parseDateTime(dateStr: string, defaultHour: number = 12): Date {
  if (!dateStr || typeof dateStr !== 'string') {
    throw new BadRequestError('Date string is required.');
  }

  const trimmed = dateStr.trim();

  // If date-only (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [year, month, day] = trimmed.split('-').map(Number);
    if (!year || !month || !day) {
      throw new BadRequestError(`Invalid date format: '${dateStr}'. Expected YYYY-MM-DD or ISO 8601.`);
    }
    return new Date(Date.UTC(year, month - 1, day, defaultHour, 0, 0, 0));
  }

  // Parse ISO or standard date-time string
  const date = new Date(trimmed);
  if (isNaN(date.getTime())) {
    throw new BadRequestError(`Invalid date/time format: '${dateStr}'.`);
  }
  return date;
}

/**
 * Formats a UTC Date to Indian Standard Time (IST, UTC+5:30) for readable display.
 * E.g. "11 Jan 2026, 09:00 AM IST"
 */
export function formatIST(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return 'Invalid Date';

  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}

/**
 * Calculates peak occupied beds in a given time window [requestedCheckIn, requestedCheckOut]
 * taking into account cleaning buffer time after each booking.
 *
 * Overlap condition with buffer B (in ms):
 * existing.checkIn < requested.checkOut AND (existing.checkOut + B) > requested.checkIn
 */
export async function getOccupiedBedsForInterval(
  stayId: string,
  requestedCheckIn: Date,
  requestedCheckOut: Date,
  cleaningBufferMinutes: number,
  excludeBookingId?: string
): Promise<number> {
  const bufferMs = Math.max(0, cleaningBufferMinutes || 0) * 60 * 1000;
  const now = new Date();

  // Active bookings:
  // - status === 'confirmed'
  // - status === 'pending' AND (expiresAt > now OR createdAt > now - 30 minutes)
  const query: Record<string, unknown> = {
    stayId: stayId.toLowerCase(),
    $or: [
      { status: 'confirmed' },
      {
        status: 'pending',
        $or: [
          { expiresAt: { $gt: now } },
          { expiresAt: { $exists: false }, createdAt: { $gt: new Date(Date.now() - 30 * 60 * 1000) } },
        ],
      },
    ],
  };

  if (excludeBookingId) {
    query.id = { $ne: excludeBookingId };
  }

  // Fetch candidates that could overlap:
  // Candidate checkIn must be < requestedCheckOut
  query.checkIn = { $lt: requestedCheckOut };

  const candidates = await BookingModel.find(query).lean();

  // Filter overlapping bookings where:
  // candidate.checkIn < requestedCheckOut AND (candidate.checkOut + bufferMs) > requestedCheckIn
  const overlapping = candidates.filter((b) => {
    const checkIn = new Date(b.checkIn).getTime();
    const checkOutWithBuffer = new Date(b.checkOut).getTime() + bufferMs;
    const reqIn = requestedCheckIn.getTime();
    const reqOut = requestedCheckOut.getTime();

    return checkIn < reqOut && checkOutWithBuffer > reqIn;
  });

  if (overlapping.length === 0) {
    return 0;
  }

  // Calculate peak concurrent bed usage by discretizing time event boundaries
  // An event occurs at candidate.checkIn (+beds) and (candidate.checkOut + bufferMs) (-beds)
  interface TimelineEvent {
    time: number;
    delta: number;
  }

  const events: TimelineEvent[] = [];
  for (const b of overlapping) {
    const beds = b.bedsRequired || b.guestCount || 1;
    const startTime = new Date(b.checkIn).getTime();
    const endTime = new Date(b.checkOut).getTime() + bufferMs;

    events.push({ time: startTime, delta: beds });
    events.push({ time: endTime, delta: -beds });
  }

  // Sort events chronologically. If times are identical, process releases (-delta) before new arrivals (+delta)
  // to allow seamless back-to-back check-outs/check-ins.
  events.sort((a, b) => {
    if (a.time === b.time) {
      return a.delta - b.delta;
    }
    return a.time - b.time;
  });

  let currentOccupancy = 0;
  let peakOccupancy = 0;

  for (const ev of events) {
    currentOccupancy += ev.delta;
    // We only care about occupancy during the requested window
    if (ev.time >= requestedCheckIn.getTime() && ev.time < requestedCheckOut.getTime()) {
      if (currentOccupancy > peakOccupancy) {
        peakOccupancy = currentOccupancy;
      }
    } else if (ev.time < requestedCheckIn.getTime()) {
      // Prior reservation that is currently running during the start of requestedCheckIn
      if (currentOccupancy > peakOccupancy) {
        peakOccupancy = currentOccupancy;
      }
    }
  }

  return peakOccupancy;
}

export class AvailabilityService {
  /**
   * Resolves the authoritative total bed capacity for a homestay.
   */
  static getStayTotalBeds(stay: StayDoc): number {
    if (stay.totalBeds && stay.totalBeds > 0) {
      return stay.totalBeds;
    }
    if (stay.rooms && stay.rooms.length > 0) {
      const sumRoomBeds = stay.rooms.reduce((acc, r) => acc + (r.beds || 1), 0);
      if (sumRoomBeds > 0) return sumRoomBeds;
    }
    if (stay.guestCapacity?.roomCount && stay.guestCapacity.roomCount > 0) {
      return stay.guestCapacity.roomCount * 2;
    }
    return stay.guestCapacity?.maxGuests || 4;
  }

  /**
   * Resolves the cleaning buffer in minutes for a homestay.
   */
  static getStayCleaningBuffer(stay: StayDoc): number {
    return typeof stay.cleaningBufferMinutes === 'number' ? stay.cleaningBufferMinutes : 60;
  }

  /**
   * Checks real-time bed availability for a homestay over a requested date-time interval.
   */
  static async checkAvailability(
    stayId: string,
    checkInStr: string,
    checkOutStr: string,
    requestedBeds: number = 1
  ): Promise<AvailabilityCheckResponse> {
    const stay = await StayModel.findOne({ id: stayId.toLowerCase() });
    if (!stay) {
      throw new NotFoundError(`Homestay not found with ID '${stayId}'`);
    }

    const checkIn = parseDateTime(checkInStr, 12);
    const checkOut = parseDateTime(checkOutStr, 10);

    if (checkOut.getTime() <= checkIn.getTime()) {
      throw new BadRequestError('Check-out date/time must be strictly after check-in date/time.');
    }

    const totalBeds = this.getStayTotalBeds(stay);
    const cleaningBufferMinutes = this.getStayCleaningBuffer(stay);

    const occupiedBeds = await getOccupiedBedsForInterval(
      stay.id,
      checkIn,
      checkOut,
      cleaningBufferMinutes
    );

    const availableBeds = Math.max(0, totalBeds - occupiedBeds);
    const isAvailable = availableBeds >= requestedBeds;

    return {
      stayId: stay.id,
      checkIn: checkIn.toISOString(),
      checkOut: checkOut.toISOString(),
      totalBeds,
      occupiedBeds,
      availableBeds,
      cleaningBufferMinutes,
      isAvailable,
      requestedBeds,
    };
  }
}
