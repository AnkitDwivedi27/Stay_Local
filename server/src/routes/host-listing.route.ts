import { Router } from 'express';
import {
  getHostListings,
  getAssignedListings,
  getHostListingById,
  createListing,
  updateListing,
  submitForVerification,
  deactivateListing,
  downloadVerificationDocument,
} from '../controllers/host-listing.controller';
import { authenticate, requireRole } from '../middleware/auth';
import { validateBody } from '../validators';
import {
  createStaySchema,
  updateStaySchema,
  submitVerificationSchema,
} from '../validators/stay.validator';

export const hostListingRouter = Router();

hostListingRouter.get(
  '/host/listings',
  authenticate,
  requireRole('host', 'admin'),
  getHostListings
);

hostListingRouter.get(
  '/host/assigned-listings',
  authenticate,
  requireRole('host', 'admin'),
  getAssignedListings
);

hostListingRouter.get(
  '/host/assigned-listings/:id',
  authenticate,
  requireRole('host', 'admin'),
  getHostListingById
);

hostListingRouter.post(
  '/host/assigned-listings/:id/submit-verification',
  authenticate,
  requireRole('host', 'admin'),
  validateBody(submitVerificationSchema),
  submitForVerification
);

hostListingRouter.get(
  '/host/verification-documents/:id/:documentId',
  authenticate,
  requireRole('host', 'admin'),
  downloadVerificationDocument
);

hostListingRouter.post(
  '/host/listings',
  authenticate,
  requireRole('host', 'admin'),
  validateBody(createStaySchema),
  createListing
);

hostListingRouter.get(
  '/host/listings/:id',
  authenticate,
  requireRole('host', 'admin'),
  getHostListingById
);

hostListingRouter.put(
  '/host/listings/:id',
  authenticate,
  requireRole('host', 'admin'),
  validateBody(updateStaySchema),
  updateListing
);

hostListingRouter.post(
  '/host/listings/:id/submit-verification',
  authenticate,
  requireRole('host', 'admin'),
  validateBody(submitVerificationSchema),
  submitForVerification
);

hostListingRouter.patch(
  '/host/listings/:id/status',
  authenticate,
  requireRole('host', 'admin'),
  deactivateListing
);
