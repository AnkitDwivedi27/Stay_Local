import { Request, Response, NextFunction } from 'express';
import { StaysService } from '../services/stays.service';
import { AccommodationCategory, AccommodationRecord, ApiSuccessResponse, VerificationStatus } from '../types';

export async function getAllStays(
  req: Request,
  res: Response<ApiSuccessResponse<AccommodationRecord[]>>,
  next: NextFunction
): Promise<void> {
  try {
    const { destination, district, category, verificationStatus, minGuests } = req.query as {
      destination?: string;
      district?: string;
      category?: AccommodationCategory;
      verificationStatus?: VerificationStatus;
      minGuests?: number;
    };

    const stays = await StaysService.getAll({
      destination,
      district,
      category,
      verificationStatus,
      minGuests,
    });

    res.status(200).json({
      success: true,
      data: stays,
      meta: {
        total: stays.length,
        filterApplied: { destination, district, category, verificationStatus, minGuests },
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getStayById(
  req: Request,
  res: Response<ApiSuccessResponse<AccommodationRecord>>,
  next: NextFunction
): Promise<void> {
  try {
    const stay = await StaysService.getById(req.params.id || '');
    res.status(200).json({
      success: true,
      data: stay,
    });
  } catch (err) {
    next(err);
  }
}
