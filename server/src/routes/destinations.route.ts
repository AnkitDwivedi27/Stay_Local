import { Router } from 'express';
import { getAllDestinations, getDestinationById } from '../controllers/destinations.controller';
import { destinationsQuerySchema, validateQuery } from '../validators';

export const destinationsRouter = Router();

destinationsRouter.get(
  '/destinations',
  validateQuery(destinationsQuerySchema),
  getAllDestinations
);

destinationsRouter.get('/destinations/:id', getDestinationById);
