import { Router } from 'express';
import {
  getAllTreasuresForAdmin,
  getTreasureByIdForAdmin,
  createTreasure,
  updateTreasure,
  reviewTreasure,
} from '../controllers/admin-treasure.controller';
import { authenticate, requireRole } from '../middleware/auth';
import { validateBody } from '../validators';
import {
  createTreasureSchema,
  updateTreasureSchema,
  reviewTreasureSchema,
} from '../validators/local-treasure.validator';

export const adminTreasureRouter = Router();

adminTreasureRouter.get(
  '/admin/treasures',
  authenticate,
  requireRole('admin'),
  getAllTreasuresForAdmin
);

adminTreasureRouter.get(
  '/admin/treasures/:id',
  authenticate,
  requireRole('admin'),
  getTreasureByIdForAdmin
);

adminTreasureRouter.post(
  '/admin/treasures',
  authenticate,
  requireRole('admin'),
  validateBody(createTreasureSchema),
  createTreasure
);

adminTreasureRouter.put(
  '/admin/treasures/:id',
  authenticate,
  requireRole('admin'),
  validateBody(updateTreasureSchema),
  updateTreasure
);

adminTreasureRouter.post(
  '/admin/treasures/:id/review',
  authenticate,
  requireRole('admin'),
  validateBody(reviewTreasureSchema),
  reviewTreasure
);
