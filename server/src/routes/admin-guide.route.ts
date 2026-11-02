import { Router } from 'express';
import {
  getAllGuides,
  reviewGuide,
  getAllGuideExperiences,
  deleteGuideExperience,
} from '../controllers/admin-guide.controller';
import { authenticate, requireRole } from '../middleware/auth';
import { validateBody } from '../validators';
import { adminReviewGuideSchema } from '../validators/guide.validator';

export const adminGuideRouter = Router();

adminGuideRouter.get(
  '/admin/guides',
  authenticate,
  requireRole('admin'),
  getAllGuides
);

adminGuideRouter.post(
  '/admin/guides/:id/review',
  authenticate,
  requireRole('admin'),
  validateBody(adminReviewGuideSchema),
  reviewGuide
);

adminGuideRouter.get(
  '/admin/guide-experiences',
  authenticate,
  requireRole('admin'),
  getAllGuideExperiences
);

adminGuideRouter.delete(
  '/admin/guide-experiences/:id',
  authenticate,
  requireRole('admin'),
  deleteGuideExperience
);
