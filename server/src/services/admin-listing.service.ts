import { StayModel, StayDoc } from '../models/stay.model';
import { UserModel } from '../models/user.model';
import { BookingModel } from '../models/booking.model';
import { AccommodationRecord, AuthUser, UserRecord, HostVerificationDocument } from '../types';
import {
  NotFoundError,
  ForbiddenError,
  DatabaseError,
} from '../utils/errors';
import { isDatabaseConfigured, isDatabaseConnected } from '../config/db';

function toStayRecord(doc: StayDoc | Record<string, unknown>): AccommodationRecord {
  const maybe = doc as { toJSON?: () => unknown };
  const raw = typeof maybe.toJSON === 'function' ? maybe.toJSON() : doc;
  const json = JSON.parse(JSON.stringify(raw)) as Record<string, unknown>;
  delete json._id;
  delete json.__v;
  const record = json as unknown as AccommodationRecord;
  if (record.hostAuthorization?.documents) {
    record.hostAuthorization.documents = record.hostAuthorization.documents.map((d: HostVerificationDocument & { filePath?: string }) => {
      const copy = { ...d };
      delete copy.filePath;
      if (!copy.downloadUrl && copy.id) {
        copy.downloadUrl = `/api/host/verification-documents/${record.id}/${copy.id}`;
      }
      return copy;
    });
  }
  return record;
}

export interface AdminQueueItem extends AccommodationRecord {
  hostUser?: Partial<UserRecord>;
  bookingCount?: number;
}

export class AdminListingService {
  /**
   * Retrieves listings in the verification queue or platform listings for administrative review.
   */
  static async getVerificationQueue(filters?: {
    status?: string;
    district?: string;
  }): Promise<AdminQueueItem[]> {
    if (isDatabaseConfigured() && !isDatabaseConnected()) {
      throw new DatabaseError(
        'Database service is currently unavailable. Please check MongoDB Atlas connectivity.'
      );
    }

    const query: Record<string, unknown> = {};

    if (filters?.status) {
      query.verificationStatus = filters.status;
    } else {
      // Default queue shows verification_pending listings first, followed by unverified leads
      query.verificationStatus = {
        $in: ['verification_pending', 'unverified_lead', 'rejected_or_inactive'],
      };
    }

    if (filters?.district) {
      query.district = { $regex: filters.district, $options: 'i' };
    }

    const stays = await StayModel.find(query).sort({ updatedAt: -1 });

    // Populate host information where available
    const hostIds = Array.from(new Set(stays.map((s) => s.hostId).filter(Boolean))) as string[];
    const hostUsers = await UserModel.find({ id: { $in: hostIds } }).lean();
    const hostMap = new Map<string, Partial<UserRecord>>();

    for (const u of hostUsers) {
      hostMap.set(u.id, {
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        phone: u.phone,
        role: u.role,
        status: u.status,
      });
    }

    return stays.map((stay) => {
      const record = toStayRecord(stay);
      return {
        ...record,
        hostUser: stay.hostId ? hostMap.get(stay.hostId) : undefined,
      };
    });
  }

  /**
   * Retrieves full admin inspection details for a listing,
   * including submission evidence, audit trail, host user, and booking summary.
   */
  static async getAdminListingDetails(
    stayId: string
  ): Promise<AdminQueueItem & { bookings: unknown[] }> {
    if (isDatabaseConfigured() && !isDatabaseConnected()) {
      throw new DatabaseError(
        'Database service is currently unavailable. Please check MongoDB Atlas connectivity.'
      );
    }

    const stay = await StayModel.findOne({ id: stayId.toLowerCase() });
    if (!stay) {
      throw new NotFoundError(`Homestay listing '${stayId}' was not found.`);
    }

    let hostUser: Partial<UserRecord> | undefined;
    if (stay.hostId) {
      const user = await UserModel.findOne({ id: stay.hostId }).lean();
      if (user) {
        hostUser = {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          status: user.status,
        };
      }
    }

    const bookings = await BookingModel.find({ stayId: stay.id })
      .sort({ createdAt: -1 })
      .limit(20);

    return {
      ...toStayRecord(stay),
      hostUser,
      bookings: bookings.map((b) => (typeof b.toJSON === 'function' ? b.toJSON() : b)),
    };
  }

  /**
   * Approves or rejects a homestay listing.
   * Records decision, admin identity, timestamp, and explanation in verificationHistory.
   */
  static async verifyListing(
    adminUser: AuthUser,
    stayId: string,
    action: 'approve' | 'reject' | 'request_info',
    reason: string
  ): Promise<AccommodationRecord> {
    if (adminUser.role !== 'admin') {
      throw new ForbiddenError('Only authenticated platform administrators can verify homestay listings.');
    }

    if (isDatabaseConfigured() && !isDatabaseConnected()) {
      throw new DatabaseError(
        'Database service is currently unavailable. Please check MongoDB Atlas connectivity.'
      );
    }

    const stay = await StayModel.findOne({ id: stayId.toLowerCase() });
    if (!stay) {
      throw new NotFoundError(`Homestay listing '${stayId}' was not found.`);
    }

    const trimmedReason = reason.trim();

    if (action === 'approve') {
      stay.verificationStatus = 'verified';
      stay.publicationStatus = 'published';
      stay.verificationNotes = `Approved by Admin (${adminUser.fullName}): ${trimmedReason}`;
      stay.nextVerificationStep = 'Approved and published for tourist discovery';
    } else if (action === 'reject') {
      stay.verificationStatus = 'rejected_or_inactive';
      stay.publicationStatus = 'draft';
      stay.verificationNotes = `Rejected by Admin (${adminUser.fullName}): ${trimmedReason}`;
      stay.nextVerificationStep = 'Host to address feedback and resubmit authorization documents';
    } else if (action === 'request_info') {
      stay.verificationStatus = 'verification_pending';
      stay.publicationStatus = 'draft';
      stay.verificationNotes = `Additional Information Requested by Admin (${adminUser.fullName}): ${trimmedReason}`;
      stay.nextVerificationStep = `Host to provide requested info: ${trimmedReason}`;
    }

    if (!stay.verificationHistory) {
      stay.verificationHistory = [];
    }

    stay.verificationHistory.push({
      decision: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'info_requested',
      reason: trimmedReason,
      reviewedBy: adminUser.id,
      reviewerName: adminUser.fullName,
      timestamp: new Date().toISOString(),
    });

    await stay.save();
    return toStayRecord(stay);
  }

  /**
   * Suspends or deactivates a listing due to policy violations, safety issues, or invalid evidence.
   */
  static async suspendListing(
    adminUser: AuthUser,
    stayId: string,
    reason: string
  ): Promise<AccommodationRecord> {
    if (adminUser.role !== 'admin') {
      throw new ForbiddenError('Only authenticated platform administrators can suspend listings.');
    }

    if (isDatabaseConfigured() && !isDatabaseConnected()) {
      throw new DatabaseError(
        'Database service is currently unavailable. Please check MongoDB Atlas connectivity.'
      );
    }

    const stay = await StayModel.findOne({ id: stayId.toLowerCase() });
    if (!stay) {
      throw new NotFoundError(`Homestay listing '${stayId}' was not found.`);
    }

    const trimmedReason = reason.trim();

    stay.verificationStatus = 'rejected_or_inactive';
    stay.publicationStatus = 'archived';
    stay.verificationNotes = `Suspended by Admin (${adminUser.fullName}): ${trimmedReason}`;

    if (!stay.verificationHistory) {
      stay.verificationHistory = [];
    }

    stay.verificationHistory.push({
      decision: 'suspended',
      reason: trimmedReason,
      reviewedBy: adminUser.id,
      reviewerName: adminUser.fullName,
      timestamp: new Date().toISOString(),
    });

    await stay.save();
    return toStayRecord(stay);
  }
}
