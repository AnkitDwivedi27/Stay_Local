import { Router } from 'express';
import {
  getMyProfile,
  updateMyProfile,
  submitProfileForVerification,
  getMyExperiences,
  createExperience,
  updateExperience,
  publishExperience,
  unpublishExperience,
  deleteExperience,
  getMyBookings,
  respondToBooking,
  completeBooking,
  downloadGuideDocument,
} from '../controllers/guide.controller';
import { authenticate, requireRole } from '../middleware/auth';
import { validateBody } from '../validators';
import {
  updateGuideProfileSchema,
  submitGuideVerificationSchema,
  createGuideExperienceSchema,
  updateGuideExperienceSchema,
  respondGuideBookingSchema,
} from '../validators/guide.validator';

export const guideRouter = Router();

// Guide Profile
guideRouter.get(
  '/guide/profile',
  authenticate,
  requireRole('guide', 'admin'),
  getMyProfile
);

guideRouter.put(
  '/guide/profile',
  authenticate,
  requireRole('guide', 'admin'),
  validateBody(updateGuideProfileSchema),
  updateMyProfile
);

guideRouter.post(
  '/guide/profile/submit-verification',
  authenticate,
  requireRole('guide', 'admin'),
  validateBody(submitGuideVerificationSchema),
  submitProfileForVerification
);

guideRouter.get(
  '/guide/documents/:id/:documentId',
  authenticate,
  requireRole('guide', 'admin'),
  downloadGuideDocument
);

// Guide Experiences
guideRouter.get(
  '/guide/experiences',
  authenticate,
  requireRole('guide', 'admin'),
  getMyExperiences
);

guideRouter.post(
  '/guide/experiences',
  authenticate,
  requireRole('guide', 'admin'),
  validateBody(createGuideExperienceSchema),
  createExperience
);

guideRouter.put(
  '/guide/experiences/:id',
  authenticate,
  requireRole('guide', 'admin'),
  validateBody(updateGuideExperienceSchema),
  updateExperience
);

guideRouter.post(
  '/guide/experiences/:id/publish',
  authenticate,
  requireRole('guide', 'admin'),
  publishExperience
);

guideRouter.post(
  '/guide/experiences/:id/unpublish',
  authenticate,
  requireRole('guide', 'admin'),
  unpublishExperience
);

guideRouter.delete(
  '/guide/experiences/:id',
  authenticate,
  requireRole('guide', 'admin'),
  deleteExperience
);

// Guide Bookings
guideRouter.get(
  '/guide/bookings',
  authenticate,
  requireRole('guide', 'admin'),
  getMyBookings
);

guideRouter.post(
  '/guide/bookings/:id/respond',
  authenticate,
  requireRole('guide', 'admin'),
  validateBody(respondGuideBookingSchema),
  respondToBooking
);

guideRouter.post(
  '/guide/bookings/:id/complete',
  authenticate,
  requireRole('guide', 'admin'),
  completeBooking
);
