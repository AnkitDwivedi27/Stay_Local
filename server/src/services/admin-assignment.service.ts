import { StayModel, StayDoc } from '../models/stay.model';
import { UserModel } from '../models/user.model';
import { BookingModel } from '../models/booking.model';
import {
  AccommodationRecord,
  AuthUser,
  EligibleHostRecord,
  AssignHostPayload,
  ReassignHostPayload,
  HostVerificationDocument,
} from '../types';
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
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

export interface AdminAssignmentFilters {
  search?: string;
  district?: string;
  locality?: string;
  status?: 'all' | 'assigned' | 'unassigned';
  isPreloaded?: boolean;
}

export class AdminAssignmentService {
  /**
   * Retrieves all homestays with their host assignment status and details.
   */
  static async getAssignments(
    filters?: AdminAssignmentFilters
  ): Promise<{ stays: AccommodationRecord[]; total: number }> {
    if (isDatabaseConfigured() && !isDatabaseConnected()) {
      throw new DatabaseError(
        'Database service is currently unavailable. Please verify MongoDB Atlas connectivity.'
      );
    }

    const query: Record<string, unknown> = {};

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.trim();
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { locality: { $regex: q, $options: 'i' } },
        { district: { $regex: q, $options: 'i' } },
        { id: { $regex: q, $options: 'i' } },
      ];
    }

    if (filters?.district && filters.district.trim()) {
      query.district = { $regex: filters.district.trim(), $options: 'i' };
    }

    if (filters?.locality && filters.locality.trim()) {
      query.locality = { $regex: filters.locality.trim(), $options: 'i' };
    }

    if (filters?.status === 'assigned') {
      query.hostId = { $exists: true, $ne: null };
    } else if (filters?.status === 'unassigned') {
      query.$and = [
        ...(query.$and ? (query.$and as Record<string, unknown>[]) : []),
        {
          $or: [
            { hostId: { $exists: false } },
            { hostId: null },
            { hostId: '' },
            { assignmentStatus: 'unassigned' },
          ],
        },
      ];
    }

    const stays = await StayModel.find(query).sort({ createdAt: 1, updatedAt: -1 });

    // Populate missing host details or assignmentStatus for older preloaded records
    const missingHostIds = Array.from(
      new Set(
        stays
          .filter((s) => s.hostId && (!s.assignedHostName || !s.assignedHostEmail))
          .map((s) => s.hostId as string)
      )
    );

    const hostUsers =
      missingHostIds.length > 0
        ? await UserModel.find({ id: { $in: missingHostIds } }).lean()
        : [];
    const hostMap = new Map(hostUsers.map((u) => [u.id, u]));

    const processedStays: AccommodationRecord[] = [];

    for (const stay of stays) {
      let isDirty = false;

      // Ensure assignmentStatus and isPreloaded consistency
      if (!stay.assignmentStatus) {
        stay.assignmentStatus = stay.hostId ? 'assigned' : 'unassigned';
        isDirty = true;
      }
      if (stay.isPreloaded === undefined) {
        stay.isPreloaded = true;
        isDirty = true;
      }

      if (stay.hostId && (!stay.assignedHostName || !stay.assignedHostEmail)) {
        const hostUser = hostMap.get(stay.hostId);
        if (hostUser) {
          stay.assignedHostId = hostUser.id;
          stay.assignedHostName = hostUser.fullName;
          stay.assignedHostEmail = hostUser.email;
          isDirty = true;
        }
      }

      if (isDirty) {
        await stay.save().catch((err) => {
          console.warn(`[AdminAssignmentService] Non-critical stay save notice for '${stay.id}':`, err);
        });
      }

      processedStays.push(toStayRecord(stay));
    }

    return {
      stays: processedStays,
      total: processedStays.length,
    };
  }

  /**
   * Retrieves active, registered hosts who are eligible to be assigned properties.
   * Strictly excludes tourists, guides, admins, and suspended accounts.
   */
  static async getEligibleHosts(search?: string): Promise<EligibleHostRecord[]> {
    if (isDatabaseConfigured() && !isDatabaseConnected()) {
      throw new DatabaseError(
        'Database service is currently unavailable. Please verify MongoDB Atlas connectivity.'
      );
    }

    const query: Record<string, unknown> = {
      role: 'host',
      status: 'active',
    };

    if (search && search.trim()) {
      const q = search.trim();
      query.$or = [
        { fullName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { id: { $regex: q, $options: 'i' } },
      ];
    }

    const hosts = await UserModel.find(query).sort({ fullName: 1 }).lean();

    return hosts.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      phone: u.phone,
      bio: u.bio,
      status: u.status,
      role: u.role,
      createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : undefined,
    }));
  }

  /**
   * Assigns an existing homestay to an eligible registered host.
   */
  static async assignHost(
    adminUser: AuthUser,
    payload: AssignHostPayload
  ): Promise<AccommodationRecord> {
    if (adminUser.role !== 'admin') {
      throw new ForbiddenError('Only authenticated platform administrators can assign hosts to properties.');
    }

    if (isDatabaseConfigured() && !isDatabaseConnected()) {
      throw new DatabaseError(
        'Database service is currently unavailable. Please verify MongoDB Atlas connectivity.'
      );
    }

    const stay = await StayModel.findOne({ id: payload.stayId.toLowerCase() });
    if (!stay) {
      throw new NotFoundError(`Homestay listing '${payload.stayId}' was not found.`);
    }

    const host = await UserModel.findOne({ id: payload.hostId });
    if (!host) {
      throw new NotFoundError(`Host account with ID '${payload.hostId}' was not found.`);
    }

    // Role check: strictly only hosts
    if (host.role !== 'host') {
      throw new BadRequestError(
        `User '${host.fullName}' is registered as '${host.role}'. Only registered host accounts can be assigned to homestays.`
      );
    }

    // Status check
    if (host.status !== 'active') {
      throw new BadRequestError(
        `Cannot assign homestay to host '${host.fullName}' because the account status is '${host.status}'. Only active accounts are eligible.`
      );
    }

    // Check if already assigned to this host
    if (stay.hostId === host.id && stay.assignmentStatus === 'assigned') {
      throw new BadRequestError(`'${stay.name}' is already assigned to host '${host.fullName}'.`);
    }

    // Check if already assigned to another host (must use reassign)
    if (stay.hostId && stay.hostId !== host.id && stay.assignmentStatus === 'assigned') {
      throw new BadRequestError(
        `'${stay.name}' is currently assigned to another host (${stay.assignedHostName || stay.hostId}). Please use the Reassignment action to transfer assignment.`
      );
    }

    const assignedAt = new Date();
    const reasonText = payload.reason?.trim() || 'Admin assigned host to preloaded homestay';

    stay.hostId = host.id;
    stay.assignedHostId = host.id;
    stay.assignedHostName = host.fullName;
    stay.assignedHostEmail = host.email;
    stay.assignedAt = assignedAt;
    stay.assignedBy = adminUser.id;
    stay.assignedByName = adminUser.fullName;
    stay.assignmentStatus = 'assigned';
    stay.isPreloaded = true;

    // Requirement 6: Assignment and property verification must be separate states.
    // If the stay was not verified, it remains unverified. If it was verified, we set it to
    // verification_pending to require the new host to submit proof of authorization to manage it.
    if (stay.verificationStatus === 'verified') {
      stay.verificationStatus = 'verification_pending';
      stay.publicationStatus = 'draft';
      stay.verificationNotes = `Assigned to host ${host.fullName}. Awaiting host authorization verification submission.`;
    }

    if (!stay.assignmentHistory) {
      stay.assignmentHistory = [];
    }

    stay.assignmentHistory.push({
      hostId: host.id,
      hostName: host.fullName,
      hostEmail: host.email,
      assignedBy: adminUser.id,
      assignedByName: adminUser.fullName,
      assignedAt,
      action: 'assigned',
      reason: reasonText,
    });

    await stay.save();
    return toStayRecord(stay);
  }

  /**
   * Reassigns an existing homestay to a different eligible host with full audit trail.
   */
  static async reassignHost(
    adminUser: AuthUser,
    stayId: string,
    payload: ReassignHostPayload
  ): Promise<AccommodationRecord> {
    if (adminUser.role !== 'admin') {
      throw new ForbiddenError('Only authenticated platform administrators can reassign properties.');
    }

    if (isDatabaseConfigured() && !isDatabaseConnected()) {
      throw new DatabaseError(
        'Database service is currently unavailable. Please verify MongoDB Atlas connectivity.'
      );
    }

    const stay = await StayModel.findOne({ id: stayId.toLowerCase() });
    if (!stay) {
      throw new NotFoundError(`Homestay listing '${stayId}' was not found.`);
    }

    const newHost = await UserModel.findOne({ id: payload.hostId });
    if (!newHost) {
      throw new NotFoundError(`New host account with ID '${payload.hostId}' was not found.`);
    }

    if (newHost.role !== 'host') {
      throw new BadRequestError(
        `User '${newHost.fullName}' is registered as '${newHost.role}'. Only registered host accounts can be assigned.`
      );
    }

    if (newHost.status !== 'active') {
      throw new BadRequestError(
        `Cannot reassign to host '${newHost.fullName}' because account status is '${newHost.status}'.`
      );
    }

    if (stay.hostId === newHost.id) {
      throw new BadRequestError(`'${stay.name}' is already assigned to host '${newHost.fullName}'.`);
    }

    const assignedAt = new Date();
    const reasonText = payload.reason.trim();

    stay.hostId = newHost.id;
    stay.assignedHostId = newHost.id;
    stay.assignedHostName = newHost.fullName;
    stay.assignedHostEmail = newHost.email;
    stay.assignedAt = assignedAt;
    stay.assignedBy = adminUser.id;
    stay.assignedByName = adminUser.fullName;
    stay.assignmentStatus = 'assigned';
    stay.isPreloaded = true;

    // Reset verification status so the new host must verify authorization
    stay.verificationStatus = 'verification_pending';
    stay.publicationStatus = 'draft';
    stay.verificationNotes = `Reassigned to host ${newHost.fullName}. Awaiting new host authorization verification.`;

    if (!stay.assignmentHistory) {
      stay.assignmentHistory = [];
    }

    stay.assignmentHistory.push({
      hostId: newHost.id,
      hostName: newHost.fullName,
      hostEmail: newHost.email,
      assignedBy: adminUser.id,
      assignedByName: adminUser.fullName,
      assignedAt,
      action: 'reassigned',
      reason: reasonText,
    });

    await stay.save();
    return toStayRecord(stay);
  }

  /**
   * Removes host assignment from a homestay.
   * Safety check: strictly rejects if active upcoming confirmed bookings exist!
   */
  static async unassignHost(
    adminUser: AuthUser,
    stayId: string,
    reason?: string
  ): Promise<AccommodationRecord> {
    if (adminUser.role !== 'admin') {
      throw new ForbiddenError('Only authenticated platform administrators can unassign properties.');
    }

    if (isDatabaseConfigured() && !isDatabaseConnected()) {
      throw new DatabaseError(
        'Database service is currently unavailable. Please verify MongoDB Atlas connectivity.'
      );
    }

    const stay = await StayModel.findOne({ id: stayId.toLowerCase() });
    if (!stay) {
      throw new NotFoundError(`Homestay listing '${stayId}' was not found.`);
    }

    if (!stay.hostId && stay.assignmentStatus === 'unassigned') {
      throw new BadRequestError(`'${stay.name}' is already unassigned.`);
    }

    // Safety rule: check active upcoming confirmed bookings
    const activeBookingsCount = await BookingModel.countDocuments({
      stayId: stay.id,
      status: 'confirmed',
      checkOut: { $gte: new Date() },
    });

    if (activeBookingsCount > 0) {
      throw new BadRequestError(
        `Cannot remove host assignment: '${stay.name}' has ${activeBookingsCount} active upcoming confirmed booking(s). Please manage or complete these reservations before unassigning.`
      );
    }

    const previousHostId = stay.hostId || stay.assignedHostId || 'unassigned';
    const previousHostName = stay.assignedHostName || 'Assigned Host';
    const previousHostEmail = stay.assignedHostEmail || '';
    const assignedAt = new Date();
    const reasonText = reason?.trim() || 'Host assignment removed by administrator';

    if (!stay.assignmentHistory) {
      stay.assignmentHistory = [];
    }

    stay.assignmentHistory.push({
      hostId: previousHostId,
      hostName: previousHostName,
      hostEmail: previousHostEmail,
      assignedBy: adminUser.id,
      assignedByName: adminUser.fullName,
      assignedAt,
      action: 'unassigned',
      reason: reasonText,
    });

    stay.hostId = undefined;
    stay.assignedHostId = undefined;
    stay.assignedHostName = undefined;
    stay.assignedHostEmail = undefined;
    stay.assignedAt = undefined;
    stay.assignedBy = undefined;
    stay.assignedByName = undefined;
    stay.assignmentStatus = 'unassigned';
    stay.publicationStatus = 'draft';
    stay.verificationStatus = 'unverified_lead';
    stay.verificationNotes = `Assignment removed by administrator (${adminUser.fullName}). Unassigned property is unlisted and cannot accept bookings.`;

    await stay.save();
    return toStayRecord(stay);
  }
}
