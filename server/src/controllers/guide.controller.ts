import { Request, Response, NextFunction } from 'express';
import { GuideProfileService } from '../services/guide-profile.service';
import { GuideExperienceService } from '../services/guide-experience.service';
import { GuideBookingService } from '../services/guide-booking.service';
import { UnauthorizedError } from '../utils/errors';

export async function getMyProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const profile = await GuideProfileService.getOrCreateProfile(req.user);
    res.status(200).json({ success: true, data: { profile } });
  } catch (err) {
    next(err);
  }
}

export async function updateMyProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const profile = await GuideProfileService.updateProfile(req.user, req.body);
    res.status(200).json({
      success: true,
      data: { profile },
      message: 'Guide profile updated successfully.',
    });
  } catch (err) {
    next(err);
  }
}

export async function submitProfileForVerification(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const profile = await GuideProfileService.submitVerification(req.user, req.body);
    res.status(200).json({
      success: true,
      data: { profile },
      message: 'Guide credentials submitted for administrator verification.',
    });
  } catch (err) {
    next(err);
  }
}

export async function getMyExperiences(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const experiences = await GuideExperienceService.getMyExperiences(req.user);
    res.status(200).json({ success: true, data: { experiences } });
  } catch (err) {
    next(err);
  }
}

export async function createExperience(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const experience = await GuideExperienceService.createExperience(req.user, req.body);
    res.status(201).json({
      success: true,
      data: { experience },
      message: 'Experience created as draft.',
    });
  } catch (err) {
    next(err);
  }
}

export async function updateExperience(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const experienceId = req.params.id as string;
    const experience = await GuideExperienceService.updateExperience(
      req.user,
      experienceId,
      req.body
    );
    res.status(200).json({
      success: true,
      data: { experience },
      message: 'Experience updated successfully.',
    });
  } catch (err) {
    next(err);
  }
}

export async function publishExperience(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const experienceId = req.params.id as string;
    const experience = await GuideExperienceService.publishExperience(req.user, experienceId);
    res.status(200).json({
      success: true,
      data: { experience },
      message: 'Experience published successfully for tourist discovery.',
    });
  } catch (err) {
    next(err);
  }
}

export async function unpublishExperience(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const experienceId = req.params.id as string;
    const experience = await GuideExperienceService.unpublishExperience(req.user, experienceId);
    res.status(200).json({
      success: true,
      data: { experience },
      message: 'Experience unpublished and reverted to draft.',
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteExperience(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const experienceId = req.params.id as string;
    await GuideExperienceService.deleteExperience(req.user, experienceId);
    res.status(200).json({
      success: true,
      message: 'Experience deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
}

export async function getMyBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const bookings = await GuideBookingService.getGuideBookings(req.user);
    res.status(200).json({ success: true, data: { bookings } });
  } catch (err) {
    next(err);
  }
}

export async function respondToBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const bookingId = req.params.id as string;
    const { action, reason } = req.body;
    const booking = await GuideBookingService.respondToBooking(
      req.user,
      bookingId,
      action,
      reason
    );
    res.status(200).json({
      success: true,
      data: { booking },
      message: action === 'confirm' ? 'Booking request confirmed.' : 'Booking request declined.',
    });
  } catch (err) {
    next(err);
  }
}

export async function completeBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const bookingId = req.params.id as string;
    const booking = await GuideBookingService.completeBooking(req.user, bookingId);
    res.status(200).json({
      success: true,
      data: { booking },
      message: 'Booking marked as completed.',
    });
  } catch (err) {
    next(err);
  }
}

export async function downloadGuideDocument(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const profileId = req.params.id as string;
    const documentId = req.params.documentId as string;
    const doc = await GuideProfileService.getDocumentForDownload(req.user, profileId, documentId);

    res.setHeader('Content-Type', doc.fileType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(doc.fileName)}"`);
    res.sendFile(doc.filePath);
  } catch (err) {
    next(err);
  }
}
