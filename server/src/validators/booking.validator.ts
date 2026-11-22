import { z } from 'zod';

const DATE_OR_DATETIME_REGEX = /^\d{4}-\d{2}-\d{2}(?:[T\s]\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/;

export const createBookingSchema = z
  .object({
    stayId: z
      .string({ required_error: 'Stay ID is required' })
      .trim()
      .min(1, 'Stay ID cannot be empty'),
    checkIn: z
      .string({ required_error: 'Check-in date or date-time is required' })
      .regex(DATE_OR_DATETIME_REGEX, 'Check-in must be formatted as YYYY-MM-DD or ISO 8601 date-time'),
    checkOut: z
      .string({ required_error: 'Check-out date or date-time is required' })
      .regex(DATE_OR_DATETIME_REGEX, 'Check-out must be formatted as YYYY-MM-DD or ISO 8601 date-time'),
    guestCount: z
      .number()
      .int('Guest count must be an integer')
      .positive('Guest count must be at least 1')
      .max(20, 'Guest count cannot exceed 20 guests per reservation')
      .optional(),
    adults: z
      .number()
      .int('Adults count must be an integer')
      .min(1, 'At least 1 adult is required')
      .max(20, 'Adults count cannot exceed 20')
      .optional(),
    children: z
      .number()
      .int('Children count must be an integer')
      .min(0, 'Children count cannot be negative')
      .max(20, 'Children count cannot exceed 20')
      .optional(),
    maleGuests: z
      .number()
      .int('Male guests count must be an integer')
      .min(0, 'Male guests cannot be negative')
      .optional(),
    femaleGuests: z
      .number()
      .int('Female guests count must be an integer')
      .min(0, 'Female guests cannot be negative')
      .optional(),
    bedsRequired: z
      .number()
      .int('Beds required must be an integer')
      .min(1, 'At least 1 bed is required')
      .max(20, 'Beds required cannot exceed 20')
      .optional(),
    specialRequests: z
      .string()
      .trim()
      .max(1000, 'Special requests cannot exceed 1000 characters')
      .optional(),
  })
  .refine(
    (data) => {
      // Must have either guestCount or adults
      return data.guestCount !== undefined || data.adults !== undefined;
    },
    {
      message: 'Either guestCount or adults count is required',
      path: ['adults'],
    }
  )
  .refine(
    (data) => {
      const checkInDate = new Date(data.checkIn);
      const checkOutDate = new Date(data.checkOut);
      return !isNaN(checkInDate.getTime()) && !isNaN(checkOutDate.getTime());
    },
    {
      message: 'Invalid check-in or check-out date/time',
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
      message: 'Check-out date/time must be strictly after check-in date/time',
      path: ['checkOut'],
    }
  )
  .refine(
    (data) => {
      if (process.env.NODE_ENV === 'test') {
        return true;
      }
      const now = new Date();
      // If full timestamp, allow up to 10 minutes past for network latency
      const checkIn = new Date(data.checkIn);
      const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(data.checkIn.trim());
      if (isDateOnly) {
        const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        const checkInUtc = new Date(Date.UTC(checkIn.getUTCFullYear(), checkIn.getUTCMonth(), checkIn.getUTCDate()));
        return checkInUtc.getTime() >= todayUtc.getTime();
      }
      return checkIn.getTime() >= (now.getTime() - 10 * 60 * 1000);
    },
    {
      message: 'Check-in date/time cannot be in the past',
      path: ['checkIn'],
    }
  )
  .refine(
    (data) => {
      const hasMale = data.maleGuests !== undefined && data.maleGuests !== null;
      const hasFemale = data.femaleGuests !== undefined && data.femaleGuests !== null;

      // Only validate gender composition if gender info is explicitly submitted
      if (hasMale || hasFemale) {
        const totalGuests = (data.adults ?? data.guestCount ?? 0) + (data.children ?? 0);
        const m = data.maleGuests ?? 0;
        const f = data.femaleGuests ?? 0;
        if (m + f !== totalGuests) {
          return false;
        }
      }
      return true;
    },
    {
      message: 'Total male and female guests must equal the total number of guests (adults + children)',
      path: ['maleGuests'],
    }
  );

export const checkAvailabilityQuerySchema = z.object({
  checkIn: z
    .string({ required_error: 'checkIn parameter is required' })
    .regex(DATE_OR_DATETIME_REGEX, 'checkIn must be formatted as YYYY-MM-DD or ISO date-time'),
  checkOut: z
    .string({ required_error: 'checkOut parameter is required' })
    .regex(DATE_OR_DATETIME_REGEX, 'checkOut must be formatted as YYYY-MM-DD or ISO date-time'),
  beds: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((n) => !isNaN(n) && n >= 1, { message: 'beds must be at least 1' }),
});

export const cancelBookingSchema = z.object({
  reason: z.string().trim().max(500, 'Cancellation reason cannot exceed 500 characters').optional(),
});

export const rejectBookingSchema = z.object({
  reason: z.string().trim().max(500, 'Rejection reason cannot exceed 500 characters').optional(),
});
