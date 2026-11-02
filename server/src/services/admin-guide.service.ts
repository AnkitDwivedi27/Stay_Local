import { GuideProfileModel, GuideProfileDoc } from '../models/guide-profile.model';
import { GuideExperienceModel, GuideExperienceDoc } from '../models/guide-experience.model';
import {
  AuthUser,
  GuideProfileRecord,
  GuideExperienceRecord,
  GuideDocument,
} from '../types';
import { NotFoundError, BadRequestError, DatabaseError } from '../utils/errors';
import { isDatabaseConfigured, isDatabaseConnected } from '../config/db';

function toAdminGuideRecord(doc: GuideProfileDoc | Record<string, unknown>): GuideProfileRecord {
  const maybe = doc as { toJSON?: () => unknown };
  const raw = typeof maybe.toJSON === 'function' ? maybe.toJSON() : doc;
  const json = JSON.parse(JSON.stringify(raw)) as Record<string, unknown>;
  delete json._id;
  delete json.__v;
  const record = json as unknown as GuideProfileRecord;
  if (record.documents) {
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

function toAdminExperienceRecord(doc: GuideExperienceDoc | Record<string, unknown>): GuideExperienceRecord {
  const maybe = doc as { toJSON?: () => unknown };
  const raw = typeof maybe.toJSON === 'function' ? maybe.toJSON() : doc;
  const json = JSON.parse(JSON.stringify(raw)) as Record<string, unknown>;
  delete json._id;
  delete json.__v;
  return json as unknown as GuideExperienceRecord;
}

export class AdminGuideService {
  /**
   * Retrieves all registered guides and their verification details for the admin verification queue.
   */
  static async getAllGuides(): Promise<GuideProfileRecord[]> {
    if (isDatabaseConfigured() && !isDatabaseConnected()) {
      throw new DatabaseError('Database service unavailable.');
    }

    const guides = await GuideProfileModel.find().sort({ updatedAt: -1 });
    return guides.map(toAdminGuideRecord);
  }

  /**
   * Admin approves, rejects, suspends, or reactivates a guide.
   */
  static async reviewGuide(
    _adminUser: AuthUser,
    guideId: string,
    action: 'approve' | 'reject' | 'suspend' | 'reactivate',
    notes?: string
  ): Promise<GuideProfileRecord> {
    if (isDatabaseConfigured() && !isDatabaseConnected()) {
      throw new DatabaseError('Database service unavailable.');
    }

    const guide = await GuideProfileModel.findOne({
      $or: [{ id: guideId }, { userId: guideId }],
    });

    if (!guide) {
      throw new NotFoundError(`Guide profile '${guideId}' was not found.`);
    }

    switch (action) {
      case 'approve':
        guide.verificationStatus = 'verified';
        guide.isActive = true;
        guide.verifiedAt = new Date();
        guide.verificationNotes = notes?.trim() || 'Guide credentials verified and approved by administrator.';
        break;

      case 'reject':
        if (!notes || notes.trim().length === 0) {
          throw new BadRequestError('A rejection reason is required.');
        }
        guide.verificationStatus = 'rejected';
        guide.verificationNotes = notes.trim();
        break;

      case 'suspend':
        if (!notes || notes.trim().length === 0) {
          throw new BadRequestError('A suspension reason is required.');
        }
        guide.verificationStatus = 'suspended';
        guide.isActive = false;
        guide.verificationNotes = notes.trim();
        // Unpublish their experiences
        await GuideExperienceModel.updateMany(
          { guideId: guide.userId, status: 'published' },
          { $set: { status: 'draft' } }
        );
        break;

      case 'reactivate':
        guide.verificationStatus = 'verified';
        guide.isActive = true;
        guide.verificationNotes = notes?.trim() || 'Guide account reactivated by administrator.';
        break;
    }

    await guide.save();
    return toAdminGuideRecord(guide);
  }

  /**
   * Retrieves all experiences created across all guides.
   */
  static async getAllExperiences(): Promise<GuideExperienceRecord[]> {
    if (isDatabaseConfigured() && !isDatabaseConnected()) {
      throw new DatabaseError('Database service unavailable.');
    }

    const experiences = await GuideExperienceModel.find().sort({ createdAt: -1 });
    return experiences.map(toAdminExperienceRecord);
  }

  /**
   * Admin deletes or moderates an inappropriate guide experience.
   */
  static async deleteExperience(
    _adminUser: AuthUser,
    experienceId: string,
    _reason?: string
  ): Promise<void> {
    if (isDatabaseConfigured() && !isDatabaseConnected()) {
      throw new DatabaseError('Database service unavailable.');
    }

    const experience = await GuideExperienceModel.findOne({ id: experienceId.toLowerCase() });
    if (!experience) {
      throw new NotFoundError(`Guide experience '${experienceId}' was not found.`);
    }

    await GuideExperienceModel.deleteOne({ id: experience.id });
  }
}
