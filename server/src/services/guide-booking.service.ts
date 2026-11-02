import crypto from 'crypto';
import { GuideBookingModel, GuideBookingDoc } from '../models/guide-booking.model';
import { GuideExperienceModel } from '../models/guide-experience.model';
import { GuideProfileModel } from '../models/guide-profile.model';
import { BookingModel } from '../models/booking.model';
import {
  AuthUser,
  GuideBookingRecord,
  CreateGuideBookingPayload,
} from '../types';
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
  DatabaseError,
} from '../utils/errors';
import { isDatabaseConfigured, isDatabaseConnected } from '../config/db';

function toBookingRecord(doc: GuideBookingDoc | Record<string, unknown>): GuideBookingRecord {
  const maybe = doc as { toJSON?: () => unknown };
  const raw = typeof maybe.toJSON === 'function' ? maybe.toJSON() : doc;
  const json = JSON.parse(JSON.stringify(raw)) as Record<string, unknown>;
  delete json._id;
  delete json.__v;
  return json as unknown as GuideBookingRecord;
}

export class GuideBookingService {
  /**
   * Tourist creates a guide experience booking request.
   */
  static async createBooking(
    touristUser: AuthUser,
    payload: CreateGuideBookingPayload
  ): Promise<GuideBookingRecord> {
    if (isDatabaseConfigured() && !isDatabaseConnected()) {
      throw new DatabaseError('Database service unavailable.');
    }

    // 1. Fetch experience and verify it is published
    const experience = await GuideExperienceModel.findOne({
      id: payload.experienceId.toLowerCase(),
      status: 'published',
    });

    if (!experience) {
      throw new NotFoundError('Selected experience is not available for booking.');
    }

    // 2. Verify guide is active and verified
    const guideProfile = await GuideProfileModel.findOne({
      userId: experience.guideId,
      verificationStatus: 'verified',
      isActive: true,
    });

    if (!guideProfile) {
      throw new BadRequestError('This experience guide is currently not verified or inactive.');
    }

    if (experience.guideId === touristUser.id) {
      throw new BadRequestError('Guides cannot book their own experience.');
    }

    // 3. Date and slot validity check
    const todayStr = new Date().toISOString().split('T')[0] ?? '';
    if (payload.bookingDate < todayStr) {
      throw new BadRequestError('Booking date cannot be in the past.');
    }

    if (experience.availableSlots && experience.availableSlots.length > 0) {
      const slotForDate = experience.availableSlots.find((s) => s.date === payload.bookingDate);
      if (slotForDate && !slotForDate.timeSlots.includes(payload.timeSlot)) {
        throw new BadRequestError(
          `Time slot '${payload.timeSlot}' is not offered on ${payload.bookingDate}.`
        );
      }
    }

    // 4. Concurrency & group capacity check
    const existingBookings = await GuideBookingModel.find({
      experienceId: experience.id,
      bookingDate: payload.bookingDate,
      timeSlot: payload.timeSlot,
      status: { $in: ['pending', 'confirmed'] },
    });

    const bookedParticipants = existingBookings.reduce(
      (sum, b) => sum + (b.participantCount || 0),
      0
    );

    if (bookedParticipants + payload.participantCount > experience.maxGroupSize) {
      const availableSpots = Math.max(0, experience.maxGroupSize - bookedParticipants);
      throw new BadRequestError(
        `Requested slot capacity exceeded. Only ${availableSpots} spot(s) remaining for this time slot.`
      );
    }

    // 5. Linked Homestay verification if provided
    let linkedHomestayId: string | undefined = undefined;
    if (payload.linkedHomestayBookingId) {
      const homestayBooking = await BookingModel.findOne({
        id: payload.linkedHomestayBookingId,
        touristId: touristUser.id,
      });

      if (!homestayBooking) {
        throw new BadRequestError('Invalid or unauthorized linked homestay booking reference.');
      }
      linkedHomestayId = homestayBooking.id;
    }

    // 6. Strict server-side pricing calculation
    let totalAmount = 0;
    if (experience.pricingType === 'per_group') {
      totalAmount = experience.price;
    } else {
      totalAmount = experience.price * payload.participantCount;
    }

    const bookingId = `gbk_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`;
    const bookingReference = `SLG-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    const booking = new GuideBookingModel({
      id: bookingId,
      bookingReference,
      touristId: touristUser.id,
      touristName: touristUser.fullName,
      touristEmail: touristUser.email,
      guideId: experience.guideId,
      guideName: experience.guideName,
      experienceId: experience.id,
      experienceTitle: experience.title,
      linkedHomestayBookingId: linkedHomestayId,
      location: {
        district: experience.district,
        locality: experience.locality,
        meetingPoint: experience.meetingPoint,
      },
      bookingDate: payload.bookingDate,
      timeSlot: payload.timeSlot,
      participantCount: payload.participantCount,
      pricing: {
        basePrice: experience.price,
        pricingType: experience.pricingType,
        totalAmount,
        currency: 'INR',
      },
      status: 'pending',
      specialRequests: payload.specialRequests?.trim(),
    });

    await booking.save();
    return toBookingRecord(booking);
  }

  /**
   * Retrieves tourist's guide bookings.
   */
  static async getTouristBookings(touristUser: AuthUser): Promise<GuideBookingRecord[]> {
    if (isDatabaseConfigured() && !isDatabaseConnected()) {
      throw new DatabaseError('Database service unavailable.');
    }

    const bookings = await GuideBookingModel.find({ touristId: touristUser.id }).sort({
      createdAt: -1,
    });
    return bookings.map(toBookingRecord);
  }

  /**
   * Retrieves bookings assigned to the authenticated guide.
   */
  static async getGuideBookings(guideUser: AuthUser): Promise<GuideBookingRecord[]> {
    if (isDatabaseConfigured() && !isDatabaseConnected()) {
      throw new DatabaseError('Database service unavailable.');
    }

    const bookings = await GuideBookingModel.find({ guideId: guideUser.id }).sort({
      createdAt: -1,
    });
    return bookings.map(toBookingRecord);
  }

  /**
   * Guide responds to an incoming booking request (accept/reject).
   */
  static async respondToBooking(
    guideUser: AuthUser,
    bookingId: string,
    action: 'confirm' | 'reject',
    reason?: string
  ): Promise<GuideBookingRecord> {
    if (isDatabaseConfigured() && !isDatabaseConnected()) {
      throw new DatabaseError('Database service unavailable.');
    }

    const booking = await GuideBookingModel.findOne({ id: bookingId });
    if (!booking) {
      throw new NotFoundError(`Guide booking '${bookingId}' was not found.`);
    }

    if (booking.guideId !== guideUser.id && guideUser.role !== 'admin') {
      throw new ForbiddenError('You are not authorized to respond to this booking.');
    }

    if (booking.status !== 'pending') {
      throw new BadRequestError(`Cannot respond to booking with status '${booking.status}'.`);
    }

    if (action === 'confirm') {
      // Re-verify capacity to ensure no concurrent overbooking
      const experience = await GuideExperienceModel.findOne({ id: booking.experienceId });
      if (experience) {
        const otherConfirmed = await GuideBookingModel.find({
          experienceId: booking.experienceId,
          bookingDate: booking.bookingDate,
          timeSlot: booking.timeSlot,
          status: 'confirmed',
          id: { $ne: booking.id },
        });

        const confirmedCount = otherConfirmed.reduce(
          (sum, b) => sum + (b.participantCount || 0),
          0
        );

        if (confirmedCount + booking.participantCount > experience.maxGroupSize) {
          throw new BadRequestError(
            'Cannot confirm booking: slot capacity was filled by previously confirmed reservations.'
          );
        }
      }

      booking.status = 'confirmed';
      booking.confirmedAt = new Date();
    } else {
      booking.status = 'rejected';
      booking.rejectedAt = new Date();
      booking.rejectionReason = reason?.trim() || 'Declined by guide.';
    }

    await booking.save();
    return toBookingRecord(booking);
  }

  /**
   * Tourist, guide, or admin cancels a booking.
   */
  static async cancelBooking(
    user: AuthUser,
    bookingId: string,
    reason?: string
  ): Promise<GuideBookingRecord> {
    if (isDatabaseConfigured() && !isDatabaseConnected()) {
      throw new DatabaseError('Database service unavailable.');
    }

    const booking = await GuideBookingModel.findOne({ id: bookingId });
    if (!booking) {
      throw new NotFoundError(`Guide booking '${bookingId}' was not found.`);
    }

    const isTourist = booking.touristId === user.id;
    const isGuide = booking.guideId === user.id;
    const isAdmin = user.role === 'admin';

    if (!isTourist && !isGuide && !isAdmin) {
      throw new ForbiddenError('You are not authorized to cancel this booking.');
    }

    if (booking.status === 'cancelled' || booking.status === 'completed' || booking.status === 'rejected') {
      throw new BadRequestError(`Cannot cancel a booking with status '${booking.status}'.`);
    }

    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    booking.cancellationReason =
      reason?.trim() || (isTourist ? 'Cancelled by traveler' : 'Cancelled by guide');

    await booking.save();
    return toBookingRecord(booking);
  }

  /**
   * Guide marks a confirmed booking as completed.
   */
  static async completeBooking(
    guideUser: AuthUser,
    bookingId: string
  ): Promise<GuideBookingRecord> {
    if (isDatabaseConfigured() && !isDatabaseConnected()) {
      throw new DatabaseError('Database service unavailable.');
    }

    const booking = await GuideBookingModel.findOne({ id: bookingId });
    if (!booking) {
      throw new NotFoundError(`Guide booking '${bookingId}' was not found.`);
    }

    if (booking.guideId !== guideUser.id && guideUser.role !== 'admin') {
      throw new ForbiddenError('You are not authorized to complete this booking.');
    }

    if (booking.status !== 'confirmed') {
      throw new BadRequestError(`Only confirmed bookings can be marked as completed.`);
    }

    booking.status = 'completed';
    booking.completedAt = new Date();

    await booking.save();
    return toBookingRecord(booking);
  }
}
