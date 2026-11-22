import { Request, Response, NextFunction } from 'express';
import { BookingService } from '../services/booking.service';
import { AvailabilityService } from '../services/availability.service';
import { UnauthorizedError } from '../utils/errors';
import { BookingRecord } from '../types';

export async function checkStayAvailability(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const stayId = req.params.id as string;
    const checkIn = req.query.checkIn as string;
    const checkOut = req.query.checkOut as string;
    const beds = req.query.beds ? parseInt(req.query.beds as string, 10) : 1;

    const result = await AvailabilityService.checkAvailability(stayId, checkIn, checkOut, beds);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function createBooking(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required to create a booking reservation');
    }

    const booking: BookingRecord = await BookingService.createBooking(req.user, req.body);
    res.status(201).json({
      success: true,
      data: { booking },
    });
  } catch (err) {
    next(err);
  }
}

export async function getMyBookings(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required to view your bookings');
    }

    const bookings = await BookingService.getTouristBookings(req.user.id);
    res.status(200).json({
      success: true,
      data: { bookings },
    });
  } catch (err) {
    next(err);
  }
}

export async function getBookingById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required to view booking details');
    }

    const bookingId = req.params.id as string;
    const booking = await BookingService.getBookingById(req.user, bookingId);
    res.status(200).json({
      success: true,
      data: { booking },
    });
  } catch (err) {
    next(err);
  }
}

export async function cancelBooking(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required to cancel a booking');
    }

    const bookingId = req.params.id as string;
    const booking = await BookingService.cancelBooking(
      req.user,
      bookingId,
      req.body.reason
    );
    res.status(200).json({
      success: true,
      data: { booking },
    });
  } catch (err) {
    next(err);
  }
}

export async function getHostBookings(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required to access host bookings');
    }

    const bookings = await BookingService.getHostBookings(req.user);
    res.status(200).json({
      success: true,
      data: { bookings },
    });
  } catch (err) {
    next(err);
  }
}

export async function confirmBooking(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required to confirm a booking');
    }

    const bookingId = req.params.id as string;
    const booking = await BookingService.confirmBooking(req.user, bookingId);
    res.status(200).json({
      success: true,
      data: { booking },
    });
  } catch (err) {
    next(err);
  }
}

export async function rejectBooking(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required to reject a booking');
    }

    const bookingId = req.params.id as string;
    const booking = await BookingService.rejectBooking(
      req.user,
      bookingId,
      req.body.reason
    );
    res.status(200).json({
      success: true,
      data: { booking },
    });
  } catch (err) {
    next(err);
  }
}
