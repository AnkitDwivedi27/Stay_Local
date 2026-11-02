import { Request, Response, NextFunction } from 'express';
import { ExperiencesService } from '../services/experiences.service';
import { ApiSuccessResponse, ExperienceCategory, ExperienceRecord } from '../types';

export async function getAllExperiences(
  req: Request,
  res: Response<ApiSuccessResponse<ExperienceRecord[]>>,
  next: NextFunction
): Promise<void> {
  try {
    const { category, destinationId, district } = req.query as {
      category?: ExperienceCategory;
      destinationId?: string;
      district?: string;
    };

    const experiences = await ExperiencesService.getAll({ category, destinationId, district });

    res.status(200).json({
      success: true,
      data: experiences,
      meta: {
        total: experiences.length,
        filterApplied: { category, destinationId, district },
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getExperienceById(
  req: Request,
  res: Response<ApiSuccessResponse<ExperienceRecord>>,
  next: NextFunction
): Promise<void> {
  try {
    const experience = await ExperiencesService.getById(req.params.id || '');
    res.status(200).json({
      success: true,
      data: experience,
    });
  } catch (err) {
    next(err);
  }
}
