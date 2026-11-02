import { Router } from 'express';
import {
  getVerificationQueue,
  getAdminListingDetails,
  verifyListing,
  suspendListing,
} from '../controllers/admin-listing.controller';
import { authenticate, requireRole } from '../middleware/auth';
import { validateBody } from '../validators';
import {
  adminVerifyStaySchema,
  adminSuspendStaySchema,
} from '../validators/stay.validator';
import { downloadVerificationDocument } from '../controllers/host-listing.controller';

export const adminListingRouter = Router();

adminListingRouter.get(
  '/admin/verification-queue',
  authenticate,
  requireRole('admin'),
  getVerificationQueue
);

adminListingRouter.get(
  '/admin/listings/:id',
  authenticate,
  requireRole('admin'),
  getAdminListingDetails
);

adminListingRouter.post(
  '/admin/listings/:id/verify',
  authenticate,
  requireRole('admin'),
  validateBody(adminVerifyStaySchema),
  verifyListing
);

adminListingRouter.post(
  '/admin/listings/:id/suspend',
  authenticate,
  requireRole('admin'),
  validateBody(adminSuspendStaySchema),
  suspendListing
);

adminListingRouter.get(
  '/admin/verification-documents/:id/:documentId',
  authenticate,
  requireRole('admin'),
  downloadVerificationDocument
);
