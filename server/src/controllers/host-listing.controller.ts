import { Request, Response, NextFunction } from 'express';
import { HostListingService } from '../services/host-listing.service';
import { UnauthorizedError } from '../utils/errors';

export async function getHostListings(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const listings = await HostListingService.getHostListings(req.user.id);
    res.status(200).json({
      success: true,
      data: { listings },
      meta: { total: listings.length },
    });
  } catch (err) {
    next(err);
  }
}

export async function getAssignedListings(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const listings = await HostListingService.getAssignedListings(req.user.id);
    res.status(200).json({
      success: true,
      data: { listings },
      meta: { total: listings.length },
    });
  } catch (err) {
    next(err);
  }
}

export async function getHostListingById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const stayId = req.params.id as string;
    const listing = await HostListingService.getHostListingById(req.user, stayId);
    res.status(200).json({
      success: true,
      data: { listing },
    });
  } catch (err) {
    next(err);
  }
}

export async function createListing(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const listing = await HostListingService.createListing(req.user, req.body);
    res.status(201).json({
      success: true,
      data: { listing },
      message: 'Homestay listing created successfully.',
    });
  } catch (err) {
    next(err);
  }
}

export async function updateListing(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const stayId = req.params.id as string;
    const listing = await HostListingService.updateListing(req.user, stayId, req.body);
    res.status(200).json({
      success: true,
      data: { listing },
      message: 'Homestay listing updated successfully.',
    });
  } catch (err) {
    next(err);
  }
}

export async function submitForVerification(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const stayId = req.params.id as string;
    const listing = await HostListingService.submitForVerification(
      req.user,
      stayId,
      req.body
    );
    res.status(200).json({
      success: true,
      data: { listing },
      message: 'Listing successfully submitted to administrator verification queue.',
    });
  } catch (err) {
    next(err);
  }
}

export async function downloadVerificationDocument(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const stayId = req.params.id as string;
    const documentId = req.params.documentId as string;

    const doc = await HostListingService.getDocumentForDownload(req.user, stayId, documentId);

    res.setHeader('Content-Type', doc.fileType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(doc.fileName)}"`);
    res.sendFile(doc.filePath);
  } catch (err) {
    next(err);
  }
}

export async function deactivateListing(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const stayId = req.params.id as string;
    const { reason } = req.body || {};
    const result = await HostListingService.deactivateListing(req.user, stayId, reason);
    res.status(200).json({
      success: true,
      data: { listing: result.stay },
      message: result.message,
    });
  } catch (err) {
    next(err);
  }
}
