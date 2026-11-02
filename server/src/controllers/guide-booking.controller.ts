import { Request, Response, NextFunction } from 'express';
import { GuideBookingService } from '../services/guide-booking.service';
import { UnauthorizedError } from '../utils/errors';

export async function createGuideBooking(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const booking = await GuideBookingService.createBooking(req.user, req.body);
    res.status(201).json({
      success: true,
      data: { booking },
      message: 'Guide experience booking request submitted successfully.',
    });
  } catch (err) {
    next(err);
  }
}

export async function getTouristGuideBookings(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const bookings = await GuideBookingService.getTouristBookings(req.user);
    res.status(200).json({ success: true, data: { bookings } });
  } catch (err) {
    next(err);
  }
}

export async function cancelGuideBooking(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const bookingId = req.params.id as string;
    const { reason } = req.body || {};
    const booking = await GuideBookingService.cancelBooking(req.user, bookingId, reason);
    res.status(200).json({
      success: true,
      data: { booking },
      message: 'Guide booking cancelled successfully.',
    });
  } catch (err) {
    next(err);
  }
}
