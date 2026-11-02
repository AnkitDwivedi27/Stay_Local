import { Router } from 'express';
import { getAllExperiences, getExperienceById } from '../controllers/experiences.controller';
import { experiencesQuerySchema, validateQuery } from '../validators';

export const experiencesRouter = Router();

experiencesRouter.get(
  '/experiences',
  validateQuery(experiencesQuerySchema),
  getAllExperiences
);

experiencesRouter.get('/experiences/:id', getExperienceById);
