import { z } from 'zod';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}(?:T.*)?$/;

export const createBookingSchema = z
  .object({
    stayId: z
      .string({ required_error: 'Stay ID is required' })
      .trim()
      .min(1, 'Stay ID cannot be empty'),
    checkIn: z
      .string({ required_error: 'Check-in date is required' })
      .regex(DATE_REGEX, 'Check-in date must be formatted as YYYY-MM-DD'),
    checkOut: z
      .string({ required_error: 'Check-out date is required' })
      .regex(DATE_REGEX, 'Check-out date must be formatted as YYYY-MM-DD'),
    guestCount: z
      .number({ required_error: 'Guest count is required' })
      .int('Guest count must be an integer')
      .positive('Guest count must be at least 1')
      .max(20, 'Guest count cannot exceed 20 guests per reservation'),
    specialRequests: z
      .string()
      .trim()
      .max(1000, 'Special requests cannot exceed 1000 characters')
      .optional(),
  })
  .refine(
    (data) => {
      const checkInDate = new Date(data.checkIn);
      const checkOutDate = new Date(data.checkOut);
      return !isNaN(checkInDate.getTime()) && !isNaN(checkOutDate.getTime());
    },
    {
      message: 'Invalid check-in or check-out date',
      path: ['checkIn'],
    }
  )
  .refine(
    (data) => {
      const checkInDate = new Date(data.checkIn);
      const checkOutDate = new Date(data.checkOut);
      return checkOutDate.getTime() > checkInDate.getTime();
    },
    {
      message: 'Check-out date must be strictly after check-in date',
      path: ['checkOut'],
    }
  )
  .refine(
    (data) => {
      // Normalize today in UTC to midnight
      const now = new Date();
      const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      const checkIn = new Date(data.checkIn);
      const checkInUtc = new Date(Date.UTC(checkIn.getUTCFullYear(), checkIn.getUTCMonth(), checkIn.getUTCDate()));
      return checkInUtc.getTime() >= todayUtc.getTime();
    },
    {
      message: 'Check-in date cannot be in the past',
      path: ['checkIn'],
    }
  );

export const cancelBookingSchema = z.object({
  reason: z.string().trim().max(500, 'Cancellation reason cannot exceed 500 characters').optional(),
});

export const rejectBookingSchema = z.object({
  reason: z.string().trim().max(500, 'Rejection reason cannot exceed 500 characters').optional(),
});
