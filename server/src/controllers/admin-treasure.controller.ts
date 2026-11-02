import { Request, Response, NextFunction } from 'express';
import { LocalTreasureService } from '../services/local-treasure.service';
import { UnauthorizedError } from '../utils/errors';
import { TreasureCategory, TreasureVerificationStatus } from '../types';

export async function getAllTreasuresForAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const { search, district, category, verificationStatus, isActive } = req.query;

    const treasures = await LocalTreasureService.getAllTreasuresForAdmin({
      search: typeof search === 'string' ? search : undefined,
      district: typeof district === 'string' ? district : undefined,
      category: category as TreasureCategory | undefined,
      verificationStatus: verificationStatus as TreasureVerificationStatus | undefined,
      isActive: typeof isActive === 'string' ? isActive === 'true' : undefined,
    });

    res.status(200).json({ success: true, data: { treasures } });
  } catch (err) {
    next(err);
  }
}

export async function getTreasureByIdForAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const treasureId = req.params.id as string;
    const treasure = await LocalTreasureService.getTreasureById(treasureId, true);
    res.status(200).json({ success: true, data: { treasure } });
  } catch (err) {
    next(err);
  }
}

export async function createTreasure(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const treasure = await LocalTreasureService.createTreasure(req.body);
    res.status(201).json({
      success: true,
      data: { treasure },
      message: 'Local treasure listing successfully created.',
    });
  } catch (err) {
    next(err);
  }
}

export async function updateTreasure(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const treasureId = req.params.id as string;
    const treasure = await LocalTreasureService.updateTreasure(treasureId, req.body);
    res.status(200).json({
      success: true,
      data: { treasure },
      message: 'Local treasure listing successfully updated.',
    });
  } catch (err) {
    next(err);
  }
}

export async function reviewTreasure(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const treasureId = req.params.id as string;
    const treasure = await LocalTreasureService.reviewTreasure(treasureId, req.body);
    res.status(200).json({
      success: true,
      data: { treasure },
      message: `Local treasure status successfully updated to ${treasure.verificationStatus}.`,
    });
  } catch (err) {
    next(err);
  }
}
