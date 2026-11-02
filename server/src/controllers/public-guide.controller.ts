import { Request, Response, NextFunction } from 'express';
import { GuideProfileService } from '../services/guide-profile.service';
import { GuideExperienceService } from '../services/guide-experience.service';
import { StayModel } from '../models/stay.model';
import { BookingModel } from '../models/booking.model';
import { NotFoundError } from '../utils/errors';

export async function getPublicGuides(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { district, locality, search } = req.query;
    const guides = await GuideProfileService.getPublicGuides({
      district: typeof district === 'string' ? district : undefined,
      locality: typeof locality === 'string' ? locality : undefined,
      search: typeof search === 'string' ? search : undefined,
    });
    res.status(200).json({ success: true, data: { guides } });
  } catch (err) {
    next(err);
  }
}

export async function getPublicGuideById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const guideId = req.params.id as string;
    const guide = await GuideProfileService.getPublicGuide(guideId);
    const experiences = await GuideExperienceService.getPublicExperiences({ guideId: guide.userId });
    res.status(200).json({ success: true, data: { guide, experiences } });
  } catch (err) {
    next(err);
  }
}

export async function getGuidesForHomestayLocation(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { stayId, bookingId, district, locality } = req.query;

    let targetDistrict = typeof district === 'string' ? district : '';
    let targetLocality = typeof locality === 'string' ? locality : '';

    // If bookingId is provided, pull actual location from homestay booking
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

    if (!targetDistrict) {
      throw new NotFoundError('Location information (district) is required to explore guides.');
    }

    const guides = await GuideProfileService.getGuidesForHomestayLocation(
      targetDistrict,
      targetLocality
    );

    // Also fetch experiences for these location-based guides
    const guideUserIds = guides.map((g) => g.userId);
    const experiences = await GuideExperienceService.getPublicExperiences({
      district: targetDistrict,
    });

    res.status(200).json({
      success: true,
      data: {
        district: targetDistrict,
        locality: targetLocality,
        guides,
        experiences: experiences.filter((e) => guideUserIds.includes(e.guideId)),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getPublicExperiences(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { district, locality, category, guideId } = req.query;
    const experiences = await GuideExperienceService.getPublicExperiences({
      district: typeof district === 'string' ? district : undefined,
      locality: typeof locality === 'string' ? locality : undefined,
      category: typeof category === 'string' ? category : undefined,
      guideId: typeof guideId === 'string' ? guideId : undefined,
    });
    res.status(200).json({ success: true, data: { experiences } });
  } catch (err) {
    next(err);
  }
}

export async function getPublicExperienceById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const experienceId = req.params.id as string;
    const experience = await GuideExperienceService.getPublicExperienceById(experienceId);
    const guide = await GuideProfileService.getPublicGuide(experience.guideId);
    res.status(200).json({ success: true, data: { experience, guide } });
  } catch (err) {
    next(err);
  }
}
