import { Request, Response, NextFunction } from 'express';
import { LocalTreasureService } from '../services/local-treasure.service';
import { BookingModel } from '../models/booking.model';
import { StayModel } from '../models/stay.model';
import { TreasureCategory } from '../types';
import { NotFoundError } from '../utils/errors';

export async function getDestinationTreasures(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { bookingId, stayId, district, locality, category } = req.query;

    let targetDistrict = typeof district === 'string' ? district : '';
    let targetLocality = typeof locality === 'string' ? locality : '';

    if (bookingId && typeof bookingId === 'string') {
      const booking = await BookingModel.findOne({ id: bookingId });
      if (booking) {
        targetDistrict = booking.stayDistrict || targetDistrict;
        targetLocality = booking.stayLocality || targetLocality;
      }
    } else if (stayId && typeof stayId === 'string') {
      const stay = await StayModel.findOne({ id: stayId });
      if (stay) {
        targetDistrict = stay.district || targetDistrict;
        targetLocality = stay.locality || targetLocality;
      }
    }

    if (!targetDistrict && !targetLocality) {
      throw new NotFoundError('Location information (district or locality) is required to explore local treasures.');
    }

    const treasures = await LocalTreasureService.getTreasuresForDestination({
      district: targetDistrict,
      locality: targetLocality,
      category: category as TreasureCategory | undefined,
    });

    res.status(200).json({
      success: true,
      data: {
        district: targetDistrict,
        locality: targetLocality,
        treasures,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getPublicTreasures(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { search, district, locality, category } = req.query;
    const treasures = await LocalTreasureService.getPublicTreasures({
      search: typeof search === 'string' ? search : undefined,
      district: typeof district === 'string' ? district : undefined,
      locality: typeof locality === 'string' ? locality : undefined,
      category: category as TreasureCategory | undefined,
    });
    res.status(200).json({ success: true, data: { treasures } });
  } catch (err) {
    next(err);
  }
}

export async function getTreasureById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const treasureId = req.params.id as string;
    const treasure = await LocalTreasureService.getTreasureById(treasureId, false);
    res.status(200).json({ success: true, data: { treasure } });
  } catch (err) {
    next(err);
  }
}
