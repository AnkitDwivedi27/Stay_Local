import { Router } from 'express';
import {
  getHostAssignments,
  getEligibleHosts,
  assignHost,
  reassignHost,
  unassignHost,
} from '../controllers/admin-assignment.controller';
import { authenticate, requireRole } from '../middleware/auth';
import { validateBody } from '../validators';
import {
  assignHostSchema,
  reassignHostSchema,
  unassignHostSchema,
} from '../validators/stay.validator';

export const adminAssignmentRouter = Router();

// Protected admin routes: strictly role === 'admin'
adminAssignmentRouter.get(
  '/admin/host-assignments',
  authenticate,
  requireRole('admin'),
  getHostAssignments
);

adminAssignmentRouter.get(
  '/admin/eligible-hosts',
  authenticate,
  requireRole('admin'),
  getEligibleHosts
);

adminAssignmentRouter.post(
  '/admin/host-assignments',
  authenticate,
  requireRole('admin'),
  validateBody(assignHostSchema),
  assignHost
);

adminAssignmentRouter.patch(
  '/admin/host-assignments/:id',
  authenticate,
  requireRole('admin'),
  validateBody(reassignHostSchema),
  reassignHost
);

adminAssignmentRouter.delete(
  '/admin/host-assignments/:id',
  authenticate,
  requireRole('admin'),
  validateBody(unassignHostSchema),
  unassignHost
);
