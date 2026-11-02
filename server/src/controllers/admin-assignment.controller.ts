import { Request, Response, NextFunction } from 'express';
import {
  AdminAssignmentService,
  AdminAssignmentFilters,
} from '../services/admin-assignment.service';
import { ApiSuccessResponse, AccommodationRecord, EligibleHostRecord } from '../types';
import { UnauthorizedError } from '../utils/errors';

export async function getHostAssignments(
  req: Request,
  res: Response<ApiSuccessResponse<{ stays: AccommodationRecord[]; total: number }>>,
  next: NextFunction
): Promise<void> {
  try {
    const filters: AdminAssignmentFilters = {
      search: typeof req.query.search === 'string' ? req.query.search : undefined,
      district: typeof req.query.district === 'string' ? req.query.district : undefined,
      locality: typeof req.query.locality === 'string' ? req.query.locality : undefined,
      status:
        req.query.status === 'assigned' || req.query.status === 'unassigned' || req.query.status === 'all'
          ? req.query.status
          : undefined,
    };

    const data = await AdminAssignmentService.getAssignments(filters);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function getEligibleHosts(
  req: Request,
  res: Response<ApiSuccessResponse<EligibleHostRecord[]>>,
  next: NextFunction
): Promise<void> {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const hosts = await AdminAssignmentService.getEligibleHosts(search);

    res.status(200).json({
      success: true,
      data: hosts,
    });
  } catch (err) {
    next(err);
  }
}

export async function assignHost(
  req: Request,
  res: Response<ApiSuccessResponse<{ listing: AccommodationRecord }>>,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required.');
    }

    const listing = await AdminAssignmentService.assignHost(req.user, req.body);

    res.status(200).json({
      success: true,
      data: { listing },
    });
  } catch (err) {
    next(err);
  }
}

export async function reassignHost(
  req: Request,
  res: Response<ApiSuccessResponse<{ listing: AccommodationRecord }>>,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required.');
    }

    const stayId = req.params.id as string;
    const listing = await AdminAssignmentService.reassignHost(req.user, stayId, req.body);

    res.status(200).json({
      success: true,
      data: { listing },
    });
  } catch (err) {
    next(err);
  }
}

export async function unassignHost(
  req: Request,
  res: Response<ApiSuccessResponse<{ listing: AccommodationRecord; message: string }>>,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required.');
    }

    const stayId = req.params.id as string;
    const reason = typeof req.body.reason === 'string' ? req.body.reason : undefined;
    const listing = await AdminAssignmentService.unassignHost(req.user, stayId, reason);

    res.status(200).json({
      success: true,
      data: {
        listing,
        message: `Host assignment removed for '${listing.name}'. Property is now unassigned.`,
      },
    });
  } catch (err) {
    next(err);
  }
}
