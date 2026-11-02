import { Router } from 'express';
import { getAllStays, getStayById } from '../controllers/stays.controller';
import { staysQuerySchema, validateQuery } from '../validators';

export const staysRouter = Router();

staysRouter.get('/stays', validateQuery(staysQuerySchema), getAllStays);
staysRouter.get('/stays/:id', getStayById);
