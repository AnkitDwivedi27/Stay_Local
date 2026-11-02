import { Request, Response, NextFunction } from 'express';
import { AdminGuideService } from '../services/admin-guide.service';
import { UnauthorizedError } from '../utils/errors';

export async function getAllGuides(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const guides = await AdminGuideService.getAllGuides();
    res.status(200).json({ success: true, data: { guides } });
  } catch (err) {
    next(err);
  }
}

export async function reviewGuide(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const guideId = req.params.id as string;
    const { action, notes } = req.body;
    const guide = await AdminGuideService.reviewGuide(req.user, guideId, action, notes);
    res.status(200).json({
      success: true,
      data: { guide },
      message: `Guide verification status successfully updated to ${guide.verificationStatus}.`,
    });
  } catch (err) {
    next(err);
  }
}

export async function getAllGuideExperiences(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const experiences = await AdminGuideService.getAllExperiences();
    res.status(200).json({ success: true, data: { experiences } });
  } catch (err) {
    next(err);
  }
}

export async function deleteGuideExperience(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const experienceId = req.params.id as string;
    const { reason } = req.body || {};
    await AdminGuideService.deleteExperience(req.user, experienceId, reason);
    res.status(200).json({
      success: true,
      message: 'Guide experience removed by administrator.',
    });
  } catch (err) {
    next(err);
  }
}
