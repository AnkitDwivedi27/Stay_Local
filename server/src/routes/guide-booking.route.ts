import { Router } from 'express';
import {
  createGuideBooking,
  getTouristGuideBookings,
  cancelGuideBooking,
} from '../controllers/guide-booking.controller';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../validators';
import { createGuideBookingSchema } from '../validators/guide.validator';

export const guideBookingRouter = Router();

guideBookingRouter.post(
  '/guide-bookings',
  authenticate,
  validateBody(createGuideBookingSchema),
  createGuideBooking
);

guideBookingRouter.get(
  '/guide-bookings/my',
  authenticate,
  getTouristGuideBookings
);

guideBookingRouter.post(
  '/guide-bookings/:id/cancel',
  authenticate,
  cancelGuideBooking
);
