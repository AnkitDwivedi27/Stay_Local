import { Request, Response, NextFunction } from 'express';
import { AdminListingService } from '../services/admin-listing.service';
import { UnauthorizedError } from '../utils/errors';

export async function getVerificationQueue(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const status = req.query.status as string | undefined;
    const district = req.query.district as string | undefined;

    const queue = await AdminListingService.getVerificationQueue({ status, district });
    res.status(200).json({
      success: true,
      data: { queue },
      meta: { total: queue.length },
    });
  } catch (err) {
    next(err);
  }
}

export async function getAdminListingDetails(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const stayId = req.params.id as string;
    const listing = await AdminListingService.getAdminListingDetails(stayId);
    res.status(200).json({
      success: true,
      data: { listing },
    });
  } catch (err) {
    next(err);
  }
}

export async function verifyListing(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const stayId = req.params.id as string;
    const { action, reason } = req.body;
    const listing = await AdminListingService.verifyListing(
      req.user,
      stayId,
      action,
      reason
    );
    res.status(200).json({
      success: true,
      data: { listing },
      message:
        action === 'approve'
          ? 'Listing approved and published successfully.'
          : action === 'reject'
          ? 'Listing rejected and returned to draft.'
          : 'Additional information requested from host.',
    });
  } catch (err) {
    next(err);
  }
}

export async function suspendListing(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const stayId = req.params.id as string;
    const { reason } = req.body;
    const listing = await AdminListingService.suspendListing(
      req.user,
      stayId,
      reason
    );
    res.status(200).json({
      success: true,
      data: { listing },
      message: 'Listing suspended and archived successfully.',
    });
  } catch (err) {
    next(err);
  }
}
