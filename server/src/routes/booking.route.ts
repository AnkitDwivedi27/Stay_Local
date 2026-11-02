import { Router } from 'express';
import {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  getHostBookings,
  confirmBooking,
  rejectBooking,
} from '../controllers/booking.controller';
import { authenticate, requireRole } from '../middleware/auth';
import { validateBody } from '../validators';
import {
  createBookingSchema,
  cancelBookingSchema,
  rejectBookingSchema,
} from '../validators/booking.validator';

export const bookingRouter = Router();

// Tourist booking endpoints
bookingRouter.post(
  '/bookings',
  authenticate,
  requireRole('tourist', 'admin'),
  validateBody(createBookingSchema),
  createBooking
);

bookingRouter.get(
  '/bookings/my',
  authenticate,
  requireRole('tourist', 'admin'),
  getMyBookings
);

bookingRouter.get('/bookings/:id', authenticate, getBookingById);

bookingRouter.patch(
  '/bookings/:id/cancel',
  authenticate,
  validateBody(cancelBookingSchema),
  cancelBooking
);

// Host booking management endpoints
bookingRouter.get(
  '/host/bookings',
  authenticate,
  requireRole('host', 'admin'),
  getHostBookings
);

bookingRouter.patch(
  '/host/bookings/:id/confirm',
  authenticate,
  requireRole('host', 'admin'),
  confirmBooking
);

bookingRouter.patch(
  '/host/bookings/:id/reject',
  authenticate,
  requireRole('host', 'admin'),
  validateBody(rejectBookingSchema),
  rejectBooking
);
