import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { StayModel, StayDoc } from '../models/stay.model';
import { BookingModel } from '../models/booking.model';
import {
  AccommodationRecord,
  AuthUser,
  VerificationHistoryItem,
  SubmitHostAuthorizationPayload,
  HostVerificationDocument,
  PropertyRelationship,
} from '../types';
import {
  CreateStayInput,
  UpdateStayInput,
} from '../validators/stay.validator';
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

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 30);
}

export class HostListingService {
  /**
   * Retrieves all listings owned by the authenticated host,
   * including summary booking counts.
   */
  static async getHostListings(hostId: string): Promise<AccommodationRecord[]> {
    if (isDatabaseConfigured() && !isDatabaseConnected()) {
      throw new DatabaseError(
        'Database service is currently unavailable. Please check MongoDB Atlas connectivity.'
      );
    }

    const stays = await StayModel.find({ hostId }).sort({ updatedAt: -1 });
    return stays.map(toStayRecord);
  }

  /**
   * Retrieves all preloaded or admin-assigned listings managed by the host.
   */
  static async getAssignedListings(hostId: string): Promise<AccommodationRecord[]> {
    if (isDatabaseConfigured() && !isDatabaseConnected()) {
      throw new DatabaseError(
        'Database service is currently unavailable. Please check MongoDB Atlas connectivity.'
      );
    }

    const stays = await StayModel.find({
      hostId,
      $or: [{ isPreloaded: true }, { assignmentStatus: 'assigned' }],
    }).sort({ updatedAt: -1 });

    return stays.map(toStayRecord);
  }

  /**
   * Retrieves single listing owned by the host with full private details.
   */
  static async getHostListingById(
    hostUser: AuthUser,
    stayId: string
  ): Promise<AccommodationRecord & { activeBookingsCount?: number }> {
    if (isDatabaseConfigured() && !isDatabaseConnected()) {
      throw new DatabaseError(
        'Database service is currently unavailable. Please check MongoDB Atlas connectivity.'
      );
    }

    const stay = await StayModel.findOne({ id: stayId.toLowerCase() });
    if (!stay) {
      throw new NotFoundError(`Homestay listing '${stayId}' was not found.`);
    }

    // Ownership check: must be the host owner or admin
    if (stay.hostId !== hostUser.id && hostUser.role !== 'admin') {
      throw new ForbiddenError('You are not authorized to access this homestay listing.');
    }

    // Count active confirmed future bookings
    const now = new Date();
    const activeBookingsCount = await BookingModel.countDocuments({
      stayId: stay.id,
      status: 'confirmed',
      checkOut: { $gte: now },
    });

    const record = toStayRecord(stay);
    return {
      ...record,
      activeBookingsCount,
    };
  }

  /**
   * Creates a new homestay listing strictly bound to the authenticated host ID.
   */
  static async createListing(
    hostUser: AuthUser,
    input: CreateStayInput
  ): Promise<AccommodationRecord> {
    if (isDatabaseConfigured() && !isDatabaseConnected()) {
      throw new DatabaseError(
        'Database service is currently unavailable. Please check MongoDB Atlas connectivity.'
      );
    }

    // Generate stable unique listing ID
    const slug = slugify(input.name);
    const randomSuffix = crypto.randomBytes(3).toString('hex');
    const stayId = `stay-${slug}-${randomSuffix}`;

    const isSubmitted = Boolean(input.submitForVerification);
    const verificationHistory: VerificationHistoryItem[] = [];

    if (isSubmitted) {
      verificationHistory.push({
        decision: 'submitted',
        reason: input.submissionEvidence || 'Submitted by host for administrative review.',
        reviewedBy: hostUser.id,
        reviewerName: hostUser.fullName,
        timestamp: new Date().toISOString(),
      });
    }

    const stay = new StayModel({
      id: stayId,
      name: input.name.trim(),
      description: input.description.trim(),
      destinationId: input.destinationId?.trim() || undefined,
      district: input.district.trim(),
      locality: input.locality.trim(),
      address: input.address.trim(),
      category: input.category,
      pricePerNight: input.pricePerNight,
      guestCapacity: {
        maxGuests: input.guestCapacity.maxGuests,
        roomCount: input.guestCapacity.roomCount || 1,
      },
      hostId: hostUser.id, // Strictly derived from authenticated session
      amenities: input.amenities || [],
      localSpecialties: input.localSpecialties || [],
      accessibilityNotes: input.accessibilityNotes?.trim(),
      travelTip: input.travelTip?.trim(),
      submissionEvidence: input.submissionEvidence?.trim(),
      contactDetails: input.contactDetails || {
        phone: hostUser.phone,
        email: hostUser.email,
        contactPerson: hostUser.fullName,
        isPubliclyListed: false,
      },
      images: input.images || [],
      imagePlaceholder:
        input.images && input.images.length > 0
          ? input.images[0]
          : 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
      dataSource: 'host_portal',
      leadType: 'direct_homestay',
      verificationStatus: isSubmitted ? 'verification_pending' : 'unverified_lead',
      publicationStatus: isSubmitted ? 'published' : 'draft',
      verificationNotes: isSubmitted
        ? 'Submitted by host. Pending administrator verification.'
        : 'Draft listing created by host.',
      verificationHistory,
    });

    await stay.save();
    return toStayRecord(stay);
  }

  /**
   * Updates an existing homestay listing.
   * Protects existing bookings against capacity reductions or silent price corruption.
   */
  static async updateListing(
    hostUser: AuthUser,
    stayId: string,
    input: UpdateStayInput
  ): Promise<AccommodationRecord> {
    if (isDatabaseConfigured() && !isDatabaseConnected()) {
      throw new DatabaseError(
        'Database service is currently unavailable. Please check MongoDB Atlas connectivity.'
      );
    }

    const stay = await StayModel.findOne({ id: stayId.toLowerCase() });
    if (!stay) {
      throw new NotFoundError(`Homestay listing '${stayId}' was not found.`);
    }

    // Ownership check
    if (stay.hostId !== hostUser.id && hostUser.role !== 'admin') {
      throw new ForbiddenError('You are not authorized to update this homestay listing.');
    }

    const now = new Date();

    // 1. Capacity check: Cannot reduce maxGuests below confirmed upcoming bookings
    if (input.guestCapacity?.maxGuests !== undefined) {
      const newMaxGuests = input.guestCapacity.maxGuests;
      const conflictingBooking = await BookingModel.findOne({
        stayId: stay.id,
        status: 'confirmed',
        checkOut: { $gte: now },
        guestCount: { $gt: newMaxGuests },
      });

      if (conflictingBooking) {
        throw new BadRequestError(
          `Cannot reduce maximum guest capacity to ${newMaxGuests}. Active upcoming confirmed reservation '${conflictingBooking.bookingReference}' is booked for ${conflictingBooking.guestCount} guests.`
        );
      }
    }

    // 2. Publication status check: Cannot archive listing with active confirmed upcoming bookings
    if (input.publicationStatus === 'archived') {
      const activeBooking = await BookingModel.findOne({
        stayId: stay.id,
        status: 'confirmed',
        checkOut: { $gte: now },
      });

      if (activeBooking) {
        throw new BadRequestError(
          `Cannot archive listing '${stay.name}' because active confirmed reservation '${activeBooking.bookingReference}' is scheduled through ${activeBooking.checkOut.toISOString().split('T')[0]}. Set status to 'draft' to pause new bookings while honoring confirmed reservations.`
        );
      }
    }

    // 3. Apply updates
    if (input.name !== undefined) stay.name = input.name.trim();
    if (input.description !== undefined) stay.description = input.description.trim();
    if (input.district !== undefined) stay.district = input.district.trim();
    if (input.locality !== undefined) stay.locality = input.locality.trim();
    if (input.address !== undefined) stay.address = input.address.trim();
    if (input.destinationId !== undefined) stay.destinationId = input.destinationId.trim();
    if (input.category !== undefined) stay.category = input.category;
    if (input.pricePerNight !== undefined) stay.pricePerNight = input.pricePerNight;
    if (input.guestCapacity !== undefined) {
      stay.guestCapacity = {
        maxGuests: input.guestCapacity.maxGuests,
        roomCount: input.guestCapacity.roomCount || stay.guestCapacity?.roomCount || 1,
      };
    }
    if (input.amenities !== undefined) stay.amenities = input.amenities;
    if (input.localSpecialties !== undefined) stay.localSpecialties = input.localSpecialties;
    if (input.accessibilityNotes !== undefined) stay.accessibilityNotes = input.accessibilityNotes.trim();
    if (input.travelTip !== undefined) stay.travelTip = input.travelTip.trim();
    if (input.submissionEvidence !== undefined) stay.submissionEvidence = input.submissionEvidence.trim();
    if (input.contactDetails !== undefined) stay.contactDetails = input.contactDetails;
    if (input.images !== undefined) {
      stay.images = input.images;
      if (input.images.length > 0) {
        stay.imagePlaceholder = input.images[0];
      }
    }
    if (input.publicationStatus !== undefined) {
      stay.publicationStatus = input.publicationStatus;
    }

    await stay.save();
    return toStayRecord(stay);
  }

  /**
   * Host submits their listing to the administrator verification queue with authorization evidence.
   */
  static async submitForVerification(
    hostUser: AuthUser,
    stayId: string,
    payload: string | (SubmitHostAuthorizationPayload & { submissionEvidence?: string })
  ): Promise<AccommodationRecord> {
    if (isDatabaseConfigured() && !isDatabaseConnected()) {
      throw new DatabaseError(
        'Database service is currently unavailable. Please check MongoDB Atlas connectivity.'
      );
    }

    const stay = await StayModel.findOne({ id: stayId.toLowerCase() });
    if (!stay) {
      throw new NotFoundError(`Homestay listing '${stayId}' was not found.`);
    }

    // Ownership check
    if (stay.hostId !== hostUser.id && hostUser.role !== 'admin') {
      throw new ForbiddenError('You are not authorized to submit this listing for verification.');
    }

    if (stay.verificationStatus === 'verified') {
      throw new BadRequestError('This homestay is already verified by StayLocal administrators.');
    }

    // Determine payload details
    const isLegacy = typeof payload === 'string';
    const legacyEvidence = isLegacy ? payload : payload.submissionEvidence;
    const relationship = isLegacy ? 'owner' : payload.relationship || 'owner';
    const relationshipExplanation = isLegacy ? undefined : payload.relationshipExplanation;
    const notes = isLegacy ? legacyEvidence : payload.notes || legacyEvidence;
    const incomingDocuments = isLegacy ? [] : payload.documents || [];

    // Ensure uploads directory exists
    const uploadDir = path.resolve(
      process.cwd(),
      process.cwd().endsWith('server') ? 'uploads/verification-documents' : 'server/uploads/verification-documents'
    );
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Process incoming documents
    type StoredVerificationDoc = NonNullable<StayDoc['hostAuthorization']>['documents'][number];
    const savedDocs: StoredVerificationDoc[] = [];
    for (const doc of incomingDocuments) {
      if (!doc.dataUrl) continue;
      const docId = `doc_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`;
      let ext = 'bin';
      if (doc.fileType.includes('pdf')) ext = 'pdf';
      else if (doc.fileType.includes('png')) ext = 'png';
      else if (doc.fileType.includes('jpeg') || doc.fileType.includes('jpg')) ext = 'jpg';

      const safeDiskName = `${stay.id}_${docId}.${ext}`;
      const fullDiskPath = path.join(uploadDir, safeDiskName);

      const base64Content = doc.dataUrl.replace(/^data:[^;]+;base64,/, '');
      const buffer = Buffer.from(base64Content, 'base64');
      fs.writeFileSync(fullDiskPath, buffer);

      savedDocs.push({
        id: docId,
        fileName: doc.fileName || `document.${ext}`,
        fileType: doc.fileType,
        fileSize: doc.fileSize || buffer.length,
        documentType: doc.documentType || 'ownership_document',
        filePath: fullDiskPath,
        downloadUrl: `/api/host/verification-documents/${stay.id}/${docId}`,
        uploadedAt: new Date(),
      });
    }

    // Merge with existing documents if re-submitting or submitting additional requested information
    const existingDocs = stay.hostAuthorization?.documents || [];
    const allDocuments = [...existingDocs, ...savedDocs];

    stay.hostAuthorization = {
      relationship: relationship as PropertyRelationship,
      relationshipExplanation: relationshipExplanation?.trim(),
      notes: notes?.trim(),
      declarationConfirmed: true,
      declaredAt: new Date(),
      submittedAt: new Date(),
      documents: allDocuments,
    };

    stay.verificationStatus = 'verification_pending';
    stay.publicationStatus = 'draft';
    stay.submissionEvidence =
      notes?.trim() ||
      `Authorization submitted as ${relationship} with ${allDocuments.length} supporting document(s).`;
    stay.verificationNotes = 'Submitted by host for administrative review.';
    stay.nextVerificationStep = 'Pending administrator verification review';

    if (!stay.verificationHistory) {
      stay.verificationHistory = [];
    }

    stay.verificationHistory.push({
      decision: 'submitted',
      reason: notes?.trim() || `Submitted property authorization as ${relationship}`,
      reviewedBy: hostUser.id,
      reviewerName: hostUser.fullName,
      timestamp: new Date().toISOString(),
    });

    await stay.save();
    return toStayRecord(stay);
  }

  /**
   * Retrieves a verification document securely for authorized host or admin.
   */
  static async getDocumentForDownload(
    user: AuthUser,
    stayId: string,
    documentId: string
  ): Promise<{ filePath: string; fileName: string; fileType: string }> {
    const stay = await StayModel.findOne({ id: stayId.toLowerCase() });
    if (!stay) {
      throw new NotFoundError(`Homestay listing '${stayId}' was not found.`);
    }

    // Security: Only the assigned host or admin can access verification files
    if (user.role !== 'admin' && stay.hostId !== user.id) {
      throw new ForbiddenError('You are not authorized to access this private verification document.');
    }

    const doc = stay.hostAuthorization?.documents?.find((d) => d.id === documentId);
    if (!doc || !doc.filePath || !fs.existsSync(doc.filePath)) {
      throw new NotFoundError(`Verification document '${documentId}' not found.`);
    }

    return {
      filePath: doc.filePath,
      fileName: doc.fileName,
      fileType: doc.fileType,
    };
  }

  /**
   * Deactivates or unlists a listing safely respecting confirmed bookings.
   */
  static async deactivateListing(
    hostUser: AuthUser,
    stayId: string,
    reason?: string
  ): Promise<{ stay: AccommodationRecord; message: string }> {
    if (isDatabaseConfigured() && !isDatabaseConnected()) {
      throw new DatabaseError(
        'Database service is currently unavailable. Please check MongoDB Atlas connectivity.'
      );
    }

    const stay = await StayModel.findOne({ id: stayId.toLowerCase() });
    if (!stay) {
      throw new NotFoundError(`Homestay listing '${stayId}' was not found.`);
    }

    if (stay.hostId !== hostUser.id && hostUser.role !== 'admin') {
      throw new ForbiddenError('You are not authorized to deactivate this homestay listing.');
    }

    const now = new Date();
    const activeBookingsCount = await BookingModel.countDocuments({
      stayId: stay.id,
      status: 'confirmed',
      checkOut: { $gte: now },
    });

    let message: string;

    if (activeBookingsCount > 0) {
      // Delist from public search to stop new bookings, but keep published status as draft
      stay.publicationStatus = 'draft';
      stay.verificationNotes = reason || 'Unlisted by host. Retaining draft mode for active reservations.';
      message = `Listing unlisted from public discovery. ${activeBookingsCount} active confirmed reservations remain valid and must be fulfilled.`;
    } else {
      stay.publicationStatus = 'archived';
      stay.verificationStatus = 'rejected_or_inactive';
      stay.verificationNotes = reason || 'Listing archived by host.';
      message = 'Listing has been archived and will no longer accept reservations.';
    }

    await stay.save();
    return {
      stay: toStayRecord(stay),
      message,
    };
  }
}
