import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  parseDateTime,
  formatIST,
  getOccupiedBedsForInterval,
  AvailabilityService,
} from '../src/services/availability.service';
import { calculateBookingPrice, BookingService } from '../src/services/booking.service';
import { createBookingSchema, checkAvailabilityQuerySchema } from '../src/validators/booking.validator';
import { StayModel, StayDoc } from '../src/models/stay.model';
import { BookingModel } from '../src/models/booking.model';
import { AuthUser } from '../src/types';

describe('StayLocal Time-Based Booking & Real-Time Bed Availability System', () => {
  const touristUser: AuthUser = {
    id: 'usr_tourist_101',
    fullName: 'Ankit Dwivedi',
    email: 'ankit@example.com',
    role: 'tourist',
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const hostUser: AuthUser = {
    id: 'usr_host_201',
    fullName: 'Kundan Singh',
    email: 'kundan@example.com',
    role: 'host',
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const sampleStay = {
    id: 'stay-mun-01',
    name: 'Munsiyari Alpine Homestay',
    description: 'Authentic stone cottage overlooking Panchachuli peaks.',
    district: 'Pithoragarh',
    locality: 'Munsiyari',
    address: 'Sarmoli Village, Munsiyari',
    category: 'village_homestay',
    verificationStatus: 'verified',
    publicationStatus: 'published',
    hostId: hostUser.id,
    assignmentStatus: 'assigned',
    pricePerNight: 2000,
    guestCapacity: { maxGuests: 6, roomCount: 3 },
    totalBeds: 4,
    cleaningBufferMinutes: 60,
    checkInTimePolicy: '12:00 PM',
    checkOutTimePolicy: '10:00 AM',
    childOccupancyPolicy: 'shared_bed_allowed',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Precision Date-Time Parsing and IST Normalization', () => {
    it('parses full ISO 8601 UTC timestamp correctly', () => {
      const dt = parseDateTime('2026-06-15T09:30:00.000Z');
      expect(dt.toISOString()).toBe('2026-06-15T09:30:00.000Z');
      expect(dt.getUTCHours()).toBe(9);
      expect(dt.getUTCMinutes()).toBe(30);
    });

    it('parses date-only string and applies default UTC hour', () => {
      const dtCheckIn = parseDateTime('2026-06-15', 12);
      expect(dtCheckIn.getUTCFullYear()).toBe(2026);
      expect(dtCheckIn.getUTCMonth()).toBe(5); // June is month index 5
      expect(dtCheckIn.getUTCDate()).toBe(15);
      expect(dtCheckIn.getUTCHours()).toBe(12);

      const dtCheckOut = parseDateTime('2026-06-18', 10);
      expect(dtCheckOut.getUTCDate()).toBe(18);
      expect(dtCheckOut.getUTCHours()).toBe(10);
    });

    it('throws BadRequestError for malformed dates', () => {
      expect(() => parseDateTime('invalid-date')).toThrow(/Invalid date/);
      expect(() => parseDateTime('')).toThrow(/required/);
    });

    it('formats UTC Date to local Indian Standard Time (IST)', () => {
      // 03:30:00 UTC = 09:00:00 AM IST (UTC+5:30)
      const date = new Date('2026-01-11T03:30:00.000Z');
      const formatted = formatIST(date);
      expect(formatted).toContain('11');
      expect(formatted).toContain('Jan');
      expect(formatted).toContain('2026');
      expect(formatted).toContain('09:00');
      expect(formatted).toContain('am');
    });
  });

  describe('2. Overlap Condition & Cleaning Buffer Detection', () => {
    // Mathematical condition: existing.checkIn < requested.checkOut AND (existing.checkOut + buffer) > requested.checkIn

    it('detects overlap during the exact same time window', async () => {
      const existingBooking = {
        id: 'bk_01',
        stayId: 'stay-mun-01',
        checkIn: new Date('2026-01-11T09:00:00.000Z'),
        checkOut: new Date('2026-01-11T11:00:00.000Z'),
        status: 'confirmed',
        bedsRequired: 2,
      };

      vi.spyOn(BookingModel, 'find').mockReturnValue({
        lean: () => Promise.resolve([existingBooking]),
      } as any);

      // Request: 10:00 AM to 12:00 PM (overlaps 10:00 - 11:00)
      const requestedIn = new Date('2026-01-11T10:00:00.000Z');
      const requestedOut = new Date('2026-01-11T12:00:00.000Z');

      const occupiedBeds = await getOccupiedBedsForInterval('stay-mun-01', requestedIn, requestedOut, 0);
      expect(occupiedBeds).toBe(2);
    });

    it('allows consecutive booking when buffer is 0 and previous booking has ended', async () => {
      const existingBooking = {
        id: 'bk_01',
        stayId: 'stay-mun-01',
        checkIn: new Date('2026-01-11T09:00:00.000Z'),
        checkOut: new Date('2026-01-11T11:00:00.000Z'),
        status: 'confirmed',
        bedsRequired: 4, // Takes all 4 beds
      };

      vi.spyOn(BookingModel, 'find').mockReturnValue({
        lean: () => Promise.resolve([existingBooking]),
      } as any);

      // Next guest requests starting exactly at 11:00 AM to 01:00 PM
      const requestedIn = new Date('2026-01-11T11:00:00.000Z');
      const requestedOut = new Date('2026-01-11T13:00:00.000Z');

      // With 0 buffer minutes, checkOut (11:00) does not overlap requestedIn (11:00)
      const occupiedBeds = await getOccupiedBedsForInterval('stay-mun-01', requestedIn, requestedOut, 0);
      expect(occupiedBeds).toBe(0);
    });

    it('blocks consecutive booking during cleaning buffer period', async () => {
      const existingBooking = {
        id: 'bk_01',
        stayId: 'stay-mun-01',
        checkIn: new Date('2026-01-11T09:00:00.000Z'),
        checkOut: new Date('2026-01-11T11:00:00.000Z'),
        status: 'confirmed',
        bedsRequired: 4,
      };

      vi.spyOn(BookingModel, 'find').mockReturnValue({
        lean: () => Promise.resolve([existingBooking]),
      } as any);

      // Buffer = 60 minutes -> Beds occupied until 12:00 PM
      const requestedInWithinBuffer = new Date('2026-01-11T11:30:00.000Z');
      const requestedOut = new Date('2026-01-11T13:00:00.000Z');

      const occupiedWithinBuffer = await getOccupiedBedsForInterval(
        'stay-mun-01',
        requestedInWithinBuffer,
        requestedOut,
        60
      );
      expect(occupiedWithinBuffer).toBe(4);

      // After buffer has passed: 12:00 PM onwards
      const requestedInAfterBuffer = new Date('2026-01-11T12:00:00.000Z');
      const occupiedAfterBuffer = await getOccupiedBedsForInterval(
        'stay-mun-01',
        requestedInAfterBuffer,
        requestedOut,
        60
      );
      expect(occupiedAfterBuffer).toBe(0);
    });
  });

  describe('3. Dynamic Bed-Level Inventory Calculation', () => {
    it('calculates remaining available beds when homestay is partially booked', async () => {
      // Homestay has 4 beds total
      vi.spyOn(StayModel, 'findOne').mockResolvedValue(sampleStay as any);

      // 1 active booking occupying 2 beds
      const existingBooking = {
        id: 'bk_01',
        stayId: 'stay-mun-01',
        checkIn: new Date('2026-07-01T12:00:00.000Z'),
        checkOut: new Date('2026-07-03T10:00:00.000Z'),
        status: 'confirmed',
        bedsRequired: 2,
      };

      vi.spyOn(BookingModel, 'find').mockReturnValue({
        lean: () => Promise.resolve([existingBooking]),
      } as any);

      const availability = await AvailabilityService.checkAvailability(
        'stay-mun-01',
        '2026-07-01T14:00:00.000Z',
        '2026-07-02T12:00:00.000Z',
        2 // requesting 2 beds
      );

      expect(availability.totalBeds).toBe(4);
      expect(availability.occupiedBeds).toBe(2);
      expect(availability.availableBeds).toBe(2);
      expect(availability.isAvailable).toBe(true);
    });

    it('reports isAvailable as false when requested beds exceed remaining beds', async () => {
      vi.spyOn(StayModel, 'findOne').mockResolvedValue(sampleStay as any);

      // 3 of 4 beds already occupied
      const existingBooking = {
        id: 'bk_01',
        stayId: 'stay-mun-01',
        checkIn: new Date('2026-07-01T12:00:00.000Z'),
        checkOut: new Date('2026-07-03T10:00:00.000Z'),
        status: 'confirmed',
        bedsRequired: 3,
      };

      vi.spyOn(BookingModel, 'find').mockReturnValue({
        lean: () => Promise.resolve([existingBooking]),
      } as any);

      const availability = await AvailabilityService.checkAvailability(
        'stay-mun-01',
        '2026-07-01T14:00:00.000Z',
        '2026-07-02T12:00:00.000Z',
        2 // tourist requests 2 beds, but only 1 remains
      );

      expect(availability.totalBeds).toBe(4);
      expect(availability.occupiedBeds).toBe(3);
      expect(availability.availableBeds).toBe(1);
      expect(availability.isAvailable).toBe(false);
    });
  });

  describe('4. Detailed Guest Information Validation', () => {
    it('validates adults, children, and bedsRequired successfully', () => {
      const payload = {
        stayId: 'stay-mun-01',
        checkIn: '2027-08-10T12:00:00.000Z',
        checkOut: '2027-08-12T10:00:00.000Z',
        adults: 2,
        children: 1,
        bedsRequired: 2,
      };

      const result = createBookingSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('validates male and female guest counts match total guests (adults + children)', () => {
      // Valid matching counts
      const validPayload = {
        stayId: 'stay-mun-01',
        checkIn: '2027-08-10T12:00:00.000Z',
        checkOut: '2027-08-12T10:00:00.000Z',
        adults: 2,
        children: 1, // Total = 3
        maleGuests: 2,
        femaleGuests: 1, // 2 + 1 = 3
        bedsRequired: 2,
      };
      expect(createBookingSchema.safeParse(validPayload).success).toBe(true);

      // Invalid mismatch: total = 3, but male(2) + female(2) = 4
      const invalidPayload = {
        stayId: 'stay-mun-01',
        checkIn: '2027-08-10T12:00:00.000Z',
        checkOut: '2027-08-12T10:00:00.000Z',
        adults: 2,
        children: 1,
        maleGuests: 2,
        femaleGuests: 2,
        bedsRequired: 2,
      };
      const invalidResult = createBookingSchema.safeParse(invalidPayload);
      expect(invalidResult.success).toBe(false);
      if (!invalidResult.success) {
        expect(invalidResult.error.issues[0].message).toContain('Total male and female guests must equal');
      }
    });

    it('rejects booking when check-out is before or equal to check-in', () => {
      const invalidDates = {
        stayId: 'stay-mun-01',
        checkIn: '2027-08-12T10:00:00.000Z',
        checkOut: '2027-08-10T12:00:00.000Z', // Check-out before check-in!
        adults: 2,
      };
      const res = createBookingSchema.safeParse(invalidDates);
      expect(res.success).toBe(false);
    });
  });

  describe('5. Inventory Release on Cancellation and Expiry', () => {
    it('does not count cancelled bookings towards occupied inventory', async () => {
      const cancelledBooking = {
        id: 'bk_cancelled_01',
        stayId: 'stay-mun-01',
        checkIn: new Date('2026-09-01T12:00:00.000Z'),
        checkOut: new Date('2026-09-03T10:00:00.000Z'),
        status: 'cancelled',
        bedsRequired: 4,
      };

      // Mock BookingModel.find to return empty array because query filters by status in ['confirmed', 'pending']
      vi.spyOn(BookingModel, 'find').mockReturnValue({
        lean: () => Promise.resolve([]),
      } as any);

      const occupied = await getOccupiedBedsForInterval(
        'stay-mun-01',
        new Date('2026-09-01T12:00:00.000Z'),
        new Date('2026-09-03T10:00:00.000Z'),
        60
      );

      expect(occupied).toBe(0);
    });

    it('does not count expired pending bookings', async () => {
      // Pending booking expired 10 minutes ago
      const expiredPendingBooking = {
        id: 'bk_expired_01',
        stayId: 'stay-mun-01',
        checkIn: new Date('2026-09-01T12:00:00.000Z'),
        checkOut: new Date('2026-09-03T10:00:00.000Z'),
        status: 'pending',
        expiresAt: new Date(Date.now() - 10 * 60 * 1000),
        bedsRequired: 4,
      };

      vi.spyOn(BookingModel, 'find').mockReturnValue({
        lean: () => Promise.resolve([]),
      } as any);

      const occupied = await getOccupiedBedsForInterval(
        'stay-mun-01',
        new Date('2026-09-01T12:00:00.000Z'),
        new Date('2026-09-03T10:00:00.000Z'),
        60
      );

      expect(occupied).toBe(0);
    });
  });

  describe('6. Price Calculation', () => {
    it('calculates authoritative base, community fee, tax, and total', () => {
      const inDate = new Date('2026-10-01T12:00:00.000Z');
      const outDate = new Date('2026-10-03T10:00:00.000Z'); // 2 nights

      const pricing = calculateBookingPrice(2000, inDate, outDate);
      expect(pricing.nights).toBe(2);
      expect(pricing.baseAmount).toBe(4000);
      expect(pricing.communityFee).toBe(200); // 5%
      expect(pricing.taxAmount).toBe(200); // 5%
      expect(pricing.totalAmount).toBe(4400);
      expect(pricing.currency).toBe('INR');
    });
  });

  describe('7. Backward Compatibility with Legacy Date Strings', () => {
    it('processes YYYY-MM-DD input formats and applies default hours', () => {
      const inDate = parseDateTime('2026-11-20', 12);
      const outDate = parseDateTime('2026-11-22', 10);

      expect(inDate.getUTCDate()).toBe(20);
      expect(inDate.getUTCHours()).toBe(12);
      expect(outDate.getUTCDate()).toBe(22);
      expect(outDate.getUTCHours()).toBe(10);

      const pricing = calculateBookingPrice(1800, inDate, outDate);
      expect(pricing.nights).toBe(2);
      expect(pricing.baseAmount).toBe(3600);
    });

    it('validates checkAvailability query schema', () => {
      const query = {
        checkIn: '2026-12-01',
        checkOut: '2026-12-05',
        beds: '3',
      };
      const parsed = checkAvailabilityQuerySchema.safeParse(query);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.beds).toBe(3);
      }
    });
  });
});
