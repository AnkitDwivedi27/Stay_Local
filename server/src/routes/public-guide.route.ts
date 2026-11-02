import { Router } from 'express';
import {
  getPublicGuides,
  getPublicGuideById,
  getGuidesForHomestayLocation,
  getPublicExperiences,
  getPublicExperienceById,
} from '../controllers/public-guide.controller';

export const publicGuideRouter = Router();

publicGuideRouter.get('/public/guides', getPublicGuides);
publicGuideRouter.get('/public/guides/destination', getGuidesForHomestayLocation);
publicGuideRouter.get('/public/guides/:id', getPublicGuideById);
publicGuideRouter.get('/public/guide-experiences', getPublicExperiences);
publicGuideRouter.get('/public/guide-experiences/:id', getPublicExperienceById);
