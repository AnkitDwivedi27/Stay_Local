import { Request, Response, NextFunction } from 'express';
import { DestinationsService } from '../services/destinations.service';
import { ApiSuccessResponse, DestinationRecord } from '../types';

export async function getAllDestinations(
  req: Request,
  res: Response<ApiSuccessResponse<DestinationRecord[]>>,
  next: NextFunction
): Promise<void> {
  try {
    const { search, district, division } = req.query as {
      search?: string;
      district?: string;
      division?: 'Kumaon' | 'Garhwal';
    };

    const destinations = await DestinationsService.getAll({ search, district, division });

    res.status(200).json({
      success: true,
      data: destinations,
      meta: {
        total: destinations.length,
        filterApplied: { search, district, division },
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getDestinationById(
  req: Request,
  res: Response<ApiSuccessResponse<DestinationRecord>>,
  next: NextFunction
): Promise<void> {
  try {
    const destination = await DestinationsService.getById(req.params.id || '');
    res.status(200).json({
      success: true,
      data: destination,
    });
  } catch (err) {
    next(err);
  }
}
