import { Router } from 'express';
import { getAllStays, getStayById } from '../controllers/stays.controller';
import { checkStayAvailability } from '../controllers/booking.controller';
import { handleStayAvailabilityStream } from '../services/realtime.service';
import { staysQuerySchema, validateQuery } from '../validators';
import { checkAvailabilityQuerySchema } from '../validators/booking.validator';

export const staysRouter = Router();

staysRouter.get('/stays', validateQuery(staysQuerySchema), getAllStays);
staysRouter.get('/stays/:id', getStayById);
staysRouter.get(
  '/stays/:id/availability',
  validateQuery(checkAvailabilityQuerySchema),
  checkStayAvailability
);
staysRouter.get('/stays/:id/availability/stream', handleStayAvailabilityStream);

