import crypto from 'crypto';
import { BookingModel } from '../models/booking.model';
import { StayModel } from '../models/stay.model';
import {
  AuthUser,
  BookingRecord,
  CreateBookingPayload,
  BookingPriceBreakdown,
} from '../types';
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from '../utils/errors';

/**
 * Normalizes a YYYY-MM-DD or ISO string into a UTC midnight Date.
 * Ensures consistent multi-timezone date arithmetic and boundaries.
 */
function parseUtcMidnight(dateStr: string): Date {
  const dateOnly = dateStr.split('T')[0] || '';
  const parts = dateOnly.split('-').map(Number);
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];
  if (
    year === undefined ||
    month === undefined ||
    day === undefined ||
    isNaN(year) ||
    isNaN(month) ||
    isNaN(day)
  ) {
    throw new BadRequestError(`Invalid date format: ${dateStr}. Expected YYYY-MM-DD.`);
  }
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}

/**
 * Calculates authoritative server-side price breakdown according to
 * the documented StayLocal Uttarakhand Community Homestay Policy:
 * - baseRate: Stay's verified nightly rate (default ₹1,800)
 * - baseAmount: nights * baseRate
 * - communityFee: 5% direct contribution to local village forest/panchayat fund
 * - taxAmount: 5% regional sustainable tourism tax / GST
 * - totalAmount: baseAmount + communityFee + taxAmount
 */
export function calculateBookingPrice(
  pricePerNight: number,
  checkIn: Date,
  checkOut: Date
): BookingPriceBreakdown {
  const diffTime = checkOut.getTime() - checkIn.getTime();
  const nights = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (nights < 1) {
    throw new BadRequestError('Check-out date must be at least 1 night after check-in date.');
  }

  const rate = pricePerNight > 0 ? pricePerNight : 1800;
  const baseAmount = rate * nights;
  const communityFee = Math.round(baseAmount * 0.05); // 5% community conservation
  const taxAmount = Math.round(baseAmount * 0.05); // 5% tourism GST
  const totalAmount = baseAmount + communityFee + taxAmount;

  return {
    nights,
    pricePerNight: rate,
    baseAmount,
    communityFee,
    taxAmount,
    totalAmount,
    currency: 'INR',
  };
}

/**
 * Generates an uppercase unique human-readable booking reference.
 * Example: SLB-7K9F2Q
 */
function generateBookingReference(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `SLB-${code}`;
}

export class BookingService {
  /**
   * Creates a new booking request by an authenticated tourist.
   */
  static async createBooking(
    user: AuthUser,
    payload: CreateBookingPayload
  ): Promise<BookingRecord> {
    const checkInDate = parseUtcMidnight(payload.checkIn);
    const checkOutDate = parseUtcMidnight(payload.checkOut);

    if (checkOutDate.getTime() <= checkInDate.getTime()) {
      throw new BadRequestError('Check-out date must be strictly after check-in date.');
    }

    // 1. Fetch the requested stay
    const stay = await StayModel.findOne({ id: payload.stayId.toLowerCase() });
    if (!stay) {
      throw new NotFoundError(`Homestay not found with ID '${payload.stayId}'`);
    }

    // 2. Enforce Host Assignment & Verification Policy
    // Unassigned, unverified, unpublished or suspended properties must not accept bookings.
    if (stay.verificationStatus !== 'verified') {
      throw new BadRequestError(
        `This homestay is currently listed with verification status '${stay.verificationStatus}' and cannot accept direct booking reservations. Only verified homestays can be booked.`
      );
    }
    if (stay.publicationStatus !== 'published') {
      throw new BadRequestError(
        `This homestay is currently not accepting new bookings (status: '${stay.publicationStatus}').`
      );
    }
    if (!stay.hostId || stay.assignmentStatus === 'unassigned') {
      throw new BadRequestError(
        `This homestay is not currently assigned to a verified host and cannot accept direct booking reservations.`
      );
    }

    // 3. Enforce guest capacity policy
    const maxCapacity = stay.guestCapacity?.maxGuests || 4;
    if (payload.guestCount > maxCapacity) {
      throw new BadRequestError(
        `Guest count (${payload.guestCount}) exceeds maximum capacity of ${maxCapacity} guests for '${stay.name}'.`
      );
    }

    // 4. Overlap Check: Prevent booking against any confirmed reservation
    const hasOverlap = await BookingModel.findOne({
      stayId: stay.id,
      status: 'confirmed',
      checkIn: { $lt: checkOutDate },
      checkOut: { $gt: checkInDate },
    });

    if (hasOverlap) {
      throw new ConflictError(
        'The selected dates overlap with an existing confirmed reservation for this homestay. Please choose alternative dates.'
      );
    }

    // 5. Calculate authoritative price breakdown
    const pricing = calculateBookingPrice(stay.pricePerNight || 1800, checkInDate, checkOutDate);

    // 6. Generate IDs and save booking record
    const internalId = `bk_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    let bookingReference = generateBookingReference();

    // Ensure collision resistance for reference code
    let refExists = await BookingModel.findOne({ bookingReference });
    while (refExists) {
      bookingReference = generateBookingReference();
      refExists = await BookingModel.findOne({ bookingReference });
    }

    const booking = new BookingModel({
      id: internalId,
      bookingReference,
      touristId: user.id,
      touristName: user.fullName,
      touristEmail: user.email,
      touristPhone: user.phone,
      stayId: stay.id,
      stayName: stay.name,
      stayLocality: stay.locality,
      stayDistrict: stay.district,
      hostId: stay.hostId,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guestCount: payload.guestCount,
      pricing,
      status: 'pending',
      specialRequests: payload.specialRequests,
    });

    await booking.save();
    return booking.toJSON() as unknown as BookingRecord;
  }

  /**
   * Retrieves all bookings created by the authenticated tourist.
   */
  static async getTouristBookings(touristId: string): Promise<BookingRecord[]> {
    const bookings = await BookingModel.find({ touristId }).sort({ createdAt: -1 });
    return bookings.map((b) => b.toJSON() as unknown as BookingRecord);
  }

  /**
   * Retrieves a single booking by ID with participant authorization.
   */
  static async getBookingById(user: AuthUser, bookingId: string): Promise<BookingRecord> {
    const booking = await BookingModel.findOne({ id: bookingId });
    if (!booking) {
      throw new NotFoundError(`Booking reservation not found with ID '${bookingId}'`);
    }

    // Authorization: User must be the tourist who booked, the host of the stay, or an admin
    const isTouristOwner = booking.touristId === user.id;
    const isHostOwner = booking.hostId === user.id;
    const isAdmin = user.role === 'admin';

    if (!isTouristOwner && !isHostOwner && !isAdmin) {
      // Also check if the user is registered as host of the stay if hostId wasn't initially copied
      const stay = await StayModel.findOne({ id: booking.stayId });
      const isStayHost = stay && stay.hostId === user.id;

      if (!isStayHost) {
        throw new ForbiddenError('You are not authorized to view this booking reservation.');
      }
    }

    return booking.toJSON() as unknown as BookingRecord;
  }

  /**
   * Cancels a booking reservation by authorized participant (tourist, host, or admin).
   * Releases reserved dates immediately.
   */
  static async cancelBooking(
    user: AuthUser,
    bookingId: string,
    reason?: string
  ): Promise<BookingRecord> {
    const booking = await BookingModel.findOne({ id: bookingId });
    if (!booking) {
      throw new NotFoundError(`Booking reservation not found with ID '${bookingId}'`);
    }

    // Authorization
    const isTouristOwner = booking.touristId === user.id;
    const isHostOwner = booking.hostId === user.id;
    const isAdmin = user.role === 'admin';

    if (!isTouristOwner && !isHostOwner && !isAdmin) {
      throw new ForbiddenError('You are not authorized to cancel this booking reservation.');
    }

    // Status transition validation
    if (booking.status === 'cancelled') {
      throw new BadRequestError('This booking reservation has already been cancelled.');
    }
    if (booking.status === 'rejected') {
      throw new BadRequestError('Cannot cancel a booking request that was already rejected.');
    }
    if (booking.status === 'completed') {
      throw new BadRequestError('Completed bookings cannot be cancelled.');
    }

    // Atomic update
    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    booking.cancellationReason = reason || (isTouristOwner ? 'Cancelled by tourist' : 'Cancelled by host/admin');
    await booking.save();

    return booking.toJSON() as unknown as BookingRecord;
  }

  /**
   * Retrieves booking requests for stays owned or managed by the authenticated host.
   */
  static async getHostBookings(hostUser: AuthUser): Promise<BookingRecord[]> {
    if (hostUser.role === 'admin') {
      const allBookings = await BookingModel.find().sort({ createdAt: -1 });
      return allBookings.map((b) => b.toJSON() as unknown as BookingRecord);
    }

    // Find all stays linked to this host
    const ownedStays = await StayModel.find({ hostId: hostUser.id });
    const stayIds = ownedStays.map((s) => s.id);

    const bookings = await BookingModel.find({
      $or: [{ hostId: hostUser.id }, { stayId: { $in: stayIds } }],
    }).sort({ createdAt: -1 });

    return bookings.map((b) => b.toJSON() as unknown as BookingRecord);
  }

  /**
   * Host confirms a pending booking request.
   * Performs an atomic concurrency conflict check against any other confirmed reservations.
   */
  static async confirmBooking(hostUser: AuthUser, bookingId: string): Promise<BookingRecord> {
    const booking = await BookingModel.findOne({ id: bookingId });
    if (!booking) {
      throw new NotFoundError(`Booking reservation not found with ID '${bookingId}'`);
    }

    // Authorization check: Verify host ownership
    const isHostOwner = booking.hostId === hostUser.id;
    const isAdmin = hostUser.role === 'admin';

    if (!isHostOwner && !isAdmin) {
      const stay = await StayModel.findOne({ id: booking.stayId });
      if (!stay || stay.hostId !== hostUser.id) {
        throw new ForbiddenError('You are not authorized to manage bookings for this homestay.');
      }
    }

    // Status transition validation
    if (booking.status === 'confirmed') {
      throw new BadRequestError('This booking reservation has already been confirmed.');
    }
    if (booking.status === 'cancelled') {
      throw new BadRequestError('Cannot confirm a booking that has been cancelled.');
    }
    if (booking.status === 'rejected') {
      throw new BadRequestError('Cannot confirm a booking that has been rejected.');
    }
    if (booking.status !== 'pending') {
      throw new BadRequestError(`Cannot confirm booking in '${booking.status}' status.`);
    }

    // Revalidate listing eligibility: Stay must be verified and published
    const stay = await StayModel.findOne({ id: booking.stayId });
    if (!stay) {
      throw new NotFoundError(`Listing '${booking.stayId}' not found.`);
    }
    if (stay.verificationStatus !== 'verified') {
      throw new BadRequestError(
        `Cannot confirm booking: homestay verification status is '${stay.verificationStatus}'. Only verified listings can confirm reservations.`
      );
    }
    if (stay.publicationStatus !== 'published') {
      throw new BadRequestError(
        `Cannot confirm booking: homestay publication status is '${stay.publicationStatus}'. Stays must be active and published to confirm reservations.`
      );
    }

    // Acquire atomic confirmation lock on Stay to serialize simultaneous confirmation evaluations
    let lockAcquired = false;
    const now = new Date();
    try {
      const lockedStay = await StayModel.findOneAndUpdate(
        {
          id: booking.stayId,
          $or: [
            { confirmationLock: false },
            { confirmationLock: { $exists: false } },
            { confirmationLockExpiresAt: { $lt: now } },
          ],
        },
        {
          $set: {
            confirmationLock: true,
            confirmationLockExpiresAt: new Date(Date.now() + 5000),
          },
        },
        { new: true }
      );

      if (!lockedStay) {
        throw new ConflictError(
          'Concurrent booking confirmation in progress for this homestay. Please try again in a few moments.'
        );
      }
      lockAcquired = true;

      // Concurrency Check: Check for overlapping confirmed reservations under lock
      const conflict = await BookingModel.findOne({
        stayId: booking.stayId,
        id: { $ne: booking.id },
        status: 'confirmed',
        checkIn: { $lt: booking.checkOut },
        checkOut: { $gt: booking.checkIn },
      });

      if (conflict) {
        throw new ConflictError(
          `Cannot confirm booking: conflicting dates overlap with existing confirmed reservation '${conflict.bookingReference}'.`
        );
      }

      // Atomic conditional status update ensuring no race condition alters state
      const confirmedBooking = await BookingModel.findOneAndUpdate(
        {
          id: booking.id,
          status: 'pending', // Precondition: must still be pending
        },
        {
          $set: {
            status: 'confirmed',
            confirmedAt: new Date(),
          },
        },
        { new: true }
      );

      if (!confirmedBooking) {
        throw new ConflictError(
          'Concurrent modification conflict: this booking status was changed by another operation.'
        );
      }

      return confirmedBooking.toJSON() as unknown as BookingRecord;
    } finally {
      if (lockAcquired) {
        try {
          await StayModel.updateOne(
            { id: booking.stayId },
            { $set: { confirmationLock: false }, $unset: { confirmationLockExpiresAt: 1 } }
          );
        } catch {
          // ignore lock release error if database disconnected
        }
      }
    }
  }

  /**
   * Host rejects a pending booking request.
   * Releases any dates held for review.
   */
  static async rejectBooking(
    hostUser: AuthUser,
    bookingId: string,
    reason?: string
  ): Promise<BookingRecord> {
    const booking = await BookingModel.findOne({ id: bookingId });
    if (!booking) {
      throw new NotFoundError(`Booking reservation not found with ID '${bookingId}'`);
    }

    // Authorization check
    const isHostOwner = booking.hostId === hostUser.id;
    const isAdmin = hostUser.role === 'admin';

    if (!isHostOwner && !isAdmin) {
      const stay = await StayModel.findOne({ id: booking.stayId });
      if (!stay || stay.hostId !== hostUser.id) {
        throw new ForbiddenError('You are not authorized to manage bookings for this homestay.');
      }
    }

    // Status transition validation
    if (booking.status !== 'pending') {
      throw new BadRequestError(
        `Only pending booking requests can be rejected. Current status is '${booking.status}'.`
      );
    }

    // Atomic update
    booking.status = 'rejected';
    booking.rejectedAt = new Date();
    booking.cancellationReason = reason || 'Declined by host';
    await booking.save();

    return booking.toJSON() as unknown as BookingRecord;
  }
}
