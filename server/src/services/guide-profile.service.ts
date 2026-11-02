import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { GuideProfileModel, GuideProfileDoc } from '../models/guide-profile.model';
import { UserModel } from '../models/user.model';
import {
  AuthUser,
  GuideProfileRecord,
  GuideDocument,
  UpdateGuideProfilePayload,
  SubmitGuideVerificationPayload,
} from '../types';
import {
  NotFoundError,
  ForbiddenError,
  DatabaseError,
} from '../utils/errors';
import { isDatabaseConfigured, isDatabaseConnected } from '../config/db';

function toGuideRecord(doc: GuideProfileDoc | Record<string, unknown>, isPublic = false): GuideProfileRecord {
  const maybe = doc as { toJSON?: () => unknown };
  const raw = typeof maybe.toJSON === 'function' ? maybe.toJSON() : doc;
  const json = JSON.parse(JSON.stringify(raw)) as Record<string, unknown>;
  delete json._id;
  delete json.__v;
  const record = json as unknown as GuideProfileRecord;

  // Mask private documents and phone for public listings
  if (isPublic) {
    record.phone = undefined;
    record.documents = [];
    record.verificationNotes = undefined;
  } else if (record.documents) {
    record.documents = record.documents.map((d: GuideDocument) => {
      const copy = { ...d };
      delete copy.filePath;
      if (!copy.downloadUrl && copy.id) {
        copy.downloadUrl = `/api/guide/documents/${record.id}/${copy.id}`;
      }
      return copy;
    });
  }

  return record;
}

export class GuideProfileService {
  /**
   * Retrieves or initializes a guide profile for the authenticated guide user.
   */
  static async getOrCreateProfile(guideUser: AuthUser): Promise<GuideProfileRecord> {
    if (isDatabaseConfigured() && !isDatabaseConnected()) {
      throw new DatabaseError('Database service unavailable.');
    }

    let profile = await GuideProfileModel.findOne({ userId: guideUser.id });
    if (!profile) {
      // Auto-initialize profile using existing user registration details
      const userDoc = await UserModel.findOne({ id: guideUser.id });
      const profileId = `gprof_${guideUser.id.replace(/^usr_/, '')}`;

      profile = new GuideProfileModel({
        id: profileId,
        userId: guideUser.id,
        fullName: guideUser.fullName,
        email: guideUser.email,
        phone: userDoc?.phone || '',
        avatarUrl: userDoc?.avatarUrl || '',
        bio: userDoc?.bio || 'Certified local Uttarakhand mountain & culture guide.',
        experienceYears: 2,
        languages: ['Hindi', 'English', 'Kumaoni'],
        serviceLocations: [
          { district: 'Pithoragarh', locality: 'Munsiari', village: 'Sarmoli' },
        ],
        specialties: ['Trekking', 'Village Walks', 'Cultural Storytelling'],
        qualifications: 'Local community mountain guide certification & regional wilderness training.',
        verificationStatus: 'unverified',
        isActive: true,
      });

      await profile.save();
    }

    return toGuideRecord(profile);
  }

  /**
   * Updates guide's profile information.
   */
  static async updateProfile(
    guideUser: AuthUser,
    payload: UpdateGuideProfilePayload
  ): Promise<GuideProfileRecord> {
    if (isDatabaseConfigured() && !isDatabaseConnected()) {
      throw new DatabaseError('Database service unavailable.');
    }

    const profile = await GuideProfileModel.findOne({ userId: guideUser.id });
    if (!profile) {
      throw new NotFoundError('Guide profile not found. Please initialize your profile.');
    }

    if (payload.bio !== undefined) profile.bio = payload.bio.trim();
    if (payload.experienceYears !== undefined) profile.experienceYears = payload.experienceYears;
    if (payload.phone !== undefined) profile.phone = payload.phone.trim();
    if (payload.avatarUrl !== undefined) profile.avatarUrl = payload.avatarUrl.trim();
    if (payload.languages !== undefined) profile.languages = payload.languages;
    if (payload.serviceLocations !== undefined) profile.serviceLocations = payload.serviceLocations;
    if (payload.specialties !== undefined) profile.specialties = payload.specialties;
    if (payload.qualifications !== undefined) profile.qualifications = payload.qualifications.trim();

    await profile.save();
    return toGuideRecord(profile);
  }

  /**
   * Guide submits profile for administrator verification with supporting documents.
   */
  static async submitVerification(
    guideUser: AuthUser,
    payload: SubmitGuideVerificationPayload
  ): Promise<GuideProfileRecord> {
    if (isDatabaseConfigured() && !isDatabaseConnected()) {
      throw new DatabaseError('Database service unavailable.');
    }

    let profile = await GuideProfileModel.findOne({ userId: guideUser.id });
    if (!profile) {
      await GuideProfileService.getOrCreateProfile(guideUser);
      profile = await GuideProfileModel.findOne({ userId: guideUser.id });
      if (!profile) throw new NotFoundError('Failed to initialize guide profile.');
    }

    if (payload.bio !== undefined) profile.bio = payload.bio.trim();
    if (payload.experienceYears !== undefined) profile.experienceYears = payload.experienceYears;
    if (payload.languages !== undefined) profile.languages = payload.languages;
    if (payload.serviceLocations !== undefined) profile.serviceLocations = payload.serviceLocations;
    if (payload.specialties !== undefined) profile.specialties = payload.specialties;
    if (payload.qualifications !== undefined) profile.qualifications = payload.qualifications.trim();

    // Ensure upload directory exists
    const uploadDir = path.resolve(
      process.cwd(),
      process.cwd().endsWith('server') ? 'uploads/guide-documents' : 'server/uploads/guide-documents'
    );
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    type ProfileDocItem = GuideProfileDoc['documents'][number];
    const savedDocs: ProfileDocItem[] = [];
    if (payload.documents && payload.documents.length > 0) {
      for (const doc of payload.documents) {
        if (!doc.dataUrl) continue;
        const docId = `gdoc_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`;
        let ext = 'bin';
        if (doc.fileType.includes('pdf')) ext = 'pdf';
        else if (doc.fileType.includes('png')) ext = 'png';
        else if (doc.fileType.includes('jpeg') || doc.fileType.includes('jpg')) ext = 'jpg';

        const safeDiskName = `${profile.id}_${docId}.${ext}`;
        const fullDiskPath = path.join(uploadDir, safeDiskName);

        const base64Content = doc.dataUrl.replace(/^data:[^;]+;base64,/, '');
        const buffer = Buffer.from(base64Content, 'base64');
        fs.writeFileSync(fullDiskPath, buffer);

        savedDocs.push({
          id: docId,
          fileName: doc.fileName || `guide_document.${ext}`,
          fileType: doc.fileType,
          fileSize: doc.fileSize || buffer.length,
          filePath: fullDiskPath,
          downloadUrl: `/api/guide/documents/${profile.id}/${docId}`,
          uploadedAt: new Date(),
        });
      }
    }

    const existingDocs = profile.documents || [];
    profile.documents = [...existingDocs, ...savedDocs];
    profile.verificationStatus = 'verification_pending';
    profile.verificationNotes = 'Submitted by guide for verification.';

    await profile.save();
    return toGuideRecord(profile);
  }

  /**
   * Retrieves a verified public guide profile.
   */
  static async getPublicGuide(guideId: string): Promise<GuideProfileRecord> {
    const profile = await GuideProfileModel.findOne({
      $or: [{ id: guideId }, { userId: guideId }],
      verificationStatus: 'verified',
      isActive: true,
    });

    if (!profile) {
      throw new NotFoundError(`Verified guide '${guideId}' was not found or is currently inactive.`);
    }

    return toGuideRecord(profile, true);
  }

  /**
   * Public discovery for verified, active guides by location (district, locality, search).
   */
  static async getPublicGuides(filter: {
    district?: string;
    locality?: string;
    search?: string;
  }): Promise<GuideProfileRecord[]> {
    const query: Record<string, unknown> = {
      verificationStatus: 'verified',
      isActive: true,
    };

    if (filter.district) {
      query['serviceLocations.district'] = new RegExp(`^${filter.district.trim()}$`, 'i');
    }

    if (filter.locality) {
      query['serviceLocations.locality'] = new RegExp(filter.locality.trim(), 'i');
    }

    if (filter.search) {
      const searchRegex = new RegExp(filter.search.trim(), 'i');
      query.$or = [
        { fullName: searchRegex },
        { specialties: searchRegex },
        { bio: searchRegex },
        { 'serviceLocations.locality': searchRegex },
        { 'serviceLocations.district': searchRegex },
      ];
    }

    const profiles = await GuideProfileModel.find(query).sort({ updatedAt: -1 });
    return profiles.map((p) => toGuideRecord(p, true));
  }

  /**
   * Location-based guide query for homestay destinations.
   * Matches verified, active guides serving the homestay's district & locality/village.
   */
  static async getGuidesForHomestayLocation(
    district: string,
    locality?: string
  ): Promise<GuideProfileRecord[]> {
    if (!district) return [];

    const districtRegex = new RegExp(`^${district.trim()}$`, 'i');
    
    // First attempt: exact district match
    const guides = await GuideProfileModel.find({
      verificationStatus: 'verified',
      isActive: true,
      'serviceLocations.district': districtRegex,
    }).sort({ updatedAt: -1 });

    // If locality is provided, prioritize guides explicitly serving that locality
    if (locality && guides.length > 0) {
      const locLower = locality.toLowerCase();
      guides.sort((a, b) => {
        const aServes = a.serviceLocations.some(
          (l) => l.locality.toLowerCase().includes(locLower) || (l.village && l.village.toLowerCase().includes(locLower))
        );
        const bServes = b.serviceLocations.some(
          (l) => l.locality.toLowerCase().includes(locLower) || (l.village && l.village.toLowerCase().includes(locLower))
        );
        if (aServes && !bServes) return -1;
        if (!aServes && bServes) return 1;
        return 0;
      });
    }

    return guides.map((g) => toGuideRecord(g, true));
  }

  /**
   * Retrieves a verification document securely for authorized guide or admin.
   */
  static async getDocumentForDownload(
    caller: AuthUser,
    profileId: string,
    documentId: string
  ): Promise<{ filePath: string; fileName: string; fileType: string }> {
    const profile = await GuideProfileModel.findOne({
      $or: [{ id: profileId }, { userId: profileId }],
    });

    if (!profile) {
      throw new NotFoundError(`Guide profile '${profileId}' not found.`);
    }

    if (caller.role !== 'admin' && profile.userId !== caller.id) {
      throw new ForbiddenError('You are not authorized to view this verification document.');
    }

    const doc = profile.documents.find((d) => d.id === documentId);
    if (!doc || !doc.filePath || !fs.existsSync(doc.filePath)) {
      throw new NotFoundError(`Verification document '${documentId}' not found.`);
    }

    return {
      filePath: doc.filePath,
      fileName: doc.fileName,
      fileType: doc.fileType,
    };
  }
}
