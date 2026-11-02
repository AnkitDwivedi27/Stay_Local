import { Router } from 'express';
import {
  getDestinationTreasures,
  getPublicTreasures,
  getTreasureById,
} from '../controllers/local-treasure.controller';

export const localTreasureRouter = Router();

localTreasureRouter.get('/public/treasures/destination', getDestinationTreasures);
localTreasureRouter.get('/public/treasures', getPublicTreasures);
localTreasureRouter.get('/public/treasures/:id', getTreasureById);
