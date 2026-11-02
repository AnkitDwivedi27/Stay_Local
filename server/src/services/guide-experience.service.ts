import crypto from 'crypto';
import { GuideExperienceModel, GuideExperienceDoc } from '../models/guide-experience.model';
import { GuideProfileModel } from '../models/guide-profile.model';
import {
  AuthUser,
  GuideExperienceRecord,
  CreateGuideExperiencePayload,
  UpdateGuideExperiencePayload,
} from '../types';
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
  DatabaseError,
} from '../utils/errors';
import { isDatabaseConfigured, isDatabaseConnected } from '../config/db';

function toExperienceRecord(doc: GuideExperienceDoc | Record<string, unknown>): GuideExperienceRecord {
  const maybe = doc as { toJSON?: () => unknown };
  const raw = typeof maybe.toJSON === 'function' ? maybe.toJSON() : doc;
  const json = JSON.parse(JSON.stringify(raw)) as Record<string, unknown>;
  delete json._id;
  delete json.__v;
  return json as unknown as GuideExperienceRecord;
}

export class GuideExperienceService {
  /**
   * Guide creates a new experience.
   */
  static async createExperience(
    guideUser: AuthUser,
    payload: CreateGuideExperiencePayload
  ): Promise<GuideExperienceRecord> {
    if (isDatabaseConfigured() && !isDatabaseConnected()) {
      throw new DatabaseError('Database service unavailable.');
    }

    const profile = await GuideProfileModel.findOne({ userId: guideUser.id });
    const experienceId = `gexp_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`;

    const experience = new GuideExperienceModel({
      id: experienceId,
      guideId: guideUser.id,
      guideName: guideUser.fullName,
      guideAvatarUrl: profile?.avatarUrl || '',
      title: payload.title.trim(),
      description: payload.description.trim(),
      category: payload.category.trim(),
      district: payload.district.trim(),
      locality: payload.locality.trim(),
      meetingPoint: payload.meetingPoint.trim(),
      duration: payload.duration.trim(),
      price: payload.price,
      pricingType: payload.pricingType || 'per_person',
      maxGroupSize: payload.maxGroupSize || 8,
      images: payload.images || [],
      requirements: payload.requirements?.trim(),
      availableSlots: payload.availableSlots || [],
      status: 'draft',
    });

    await experience.save();
    return toExperienceRecord(experience);
  }

  /**
   * Guide updates their experience.
   */
  static async updateExperience(
    guideUser: AuthUser,
    experienceId: string,
    payload: UpdateGuideExperiencePayload
  ): Promise<GuideExperienceRecord> {
    if (isDatabaseConfigured() && !isDatabaseConnected()) {
      throw new DatabaseError('Database service unavailable.');
    }

    const experience = await GuideExperienceModel.findOne({ id: experienceId.toLowerCase() });
    if (!experience) {
      throw new NotFoundError(`Guide experience '${experienceId}' was not found.`);
    }

    if (experience.guideId !== guideUser.id && guideUser.role !== 'admin') {
      throw new ForbiddenError('You are not authorized to edit this guide experience.');
    }

    if (payload.title !== undefined) experience.title = payload.title.trim();
    if (payload.description !== undefined) experience.description = payload.description.trim();
    if (payload.category !== undefined) experience.category = payload.category.trim();
    if (payload.district !== undefined) experience.district = payload.district.trim();
    if (payload.locality !== undefined) experience.locality = payload.locality.trim();
    if (payload.meetingPoint !== undefined) experience.meetingPoint = payload.meetingPoint.trim();
    if (payload.duration !== undefined) experience.duration = payload.duration.trim();
    if (payload.price !== undefined) experience.price = payload.price;
    if (payload.pricingType !== undefined) experience.pricingType = payload.pricingType;
    if (payload.maxGroupSize !== undefined) experience.maxGroupSize = payload.maxGroupSize;
    if (payload.images !== undefined) experience.images = payload.images;
    if (payload.requirements !== undefined) experience.requirements = payload.requirements?.trim();
    if (payload.availableSlots !== undefined) experience.availableSlots = payload.availableSlots;

    await experience.save();
    return toExperienceRecord(experience);
  }

  /**
   * Publishes an experience.
   * Business rule: Only verified and active guides can publish experiences.
   */
  static async publishExperience(
    guideUser: AuthUser,
    experienceId: string
  ): Promise<GuideExperienceRecord> {
    if (isDatabaseConfigured() && !isDatabaseConnected()) {
      throw new DatabaseError('Database service unavailable.');
    }

    const profile = await GuideProfileModel.findOne({ userId: guideUser.id });
    if (!profile || profile.verificationStatus !== 'verified' || !profile.isActive) {
      throw new BadRequestError(
        'Only verified and active guides can publish experiences for tourist booking. Please ensure your guide profile is verified by administrators.'
      );
    }

    const experience = await GuideExperienceModel.findOne({ id: experienceId.toLowerCase() });
    if (!experience) {
      throw new NotFoundError(`Guide experience '${experienceId}' was not found.`);
    }

    if (experience.guideId !== guideUser.id && guideUser.role !== 'admin') {
      throw new ForbiddenError('You are not authorized to publish this experience.');
    }

    experience.status = 'published';
    await experience.save();
    return toExperienceRecord(experience);
  }

  /**
   * Unpublishes an experience (sets to draft).
   */
  static async unpublishExperience(
    guideUser: AuthUser,
    experienceId: string
  ): Promise<GuideExperienceRecord> {
    if (isDatabaseConfigured() && !isDatabaseConnected()) {
      throw new DatabaseError('Database service unavailable.');
    }

    const experience = await GuideExperienceModel.findOne({ id: experienceId.toLowerCase() });
    if (!experience) {
      throw new NotFoundError(`Guide experience '${experienceId}' was not found.`);
    }

    if (experience.guideId !== guideUser.id && guideUser.role !== 'admin') {
      throw new ForbiddenError('You are not authorized to unpublish this experience.');
    }

    experience.status = 'draft';
    await experience.save();
    return toExperienceRecord(experience);
  }

  /**
   * Deletes / archives an experience.
   */
  static async deleteExperience(guideUser: AuthUser, experienceId: string): Promise<void> {
    if (isDatabaseConfigured() && !isDatabaseConnected()) {
      throw new DatabaseError('Database service unavailable.');
    }

    const experience = await GuideExperienceModel.findOne({ id: experienceId.toLowerCase() });
    if (!experience) {
      throw new NotFoundError(`Guide experience '${experienceId}' was not found.`);
    }

    if (experience.guideId !== guideUser.id && guideUser.role !== 'admin') {
      throw new ForbiddenError('You are not authorized to delete this experience.');
    }

    await GuideExperienceModel.deleteOne({ id: experience.id });
  }

  /**
   * Retrieves all experiences created by the authenticated guide.
   */
  static async getMyExperiences(guideUser: AuthUser): Promise<GuideExperienceRecord[]> {
    if (isDatabaseConfigured() && !isDatabaseConnected()) {
      throw new DatabaseError('Database service unavailable.');
    }

    const experiences = await GuideExperienceModel.find({ guideId: guideUser.id }).sort({
      createdAt: -1,
    });
    return experiences.map(toExperienceRecord);
  }

  /**
   * Public discovery for published experiences belonging to verified, active guides.
   */
  static async getPublicExperiences(filters: {
    district?: string;
    locality?: string;
    category?: string;
    guideId?: string;
  }): Promise<GuideExperienceRecord[]> {
    // 1. Find all verified and active guides
    const verifiedGuides = await GuideProfileModel.find({
      verificationStatus: 'verified',
      isActive: true,
    }).select('userId fullName avatarUrl');

    const verifiedGuideIds = verifiedGuides.map((g) => g.userId);

    const query: Record<string, unknown> = {
      status: 'published',
      guideId: { $in: verifiedGuideIds },
    };

    if (filters.district) {
      query.district = new RegExp(`^${filters.district.trim()}$`, 'i');
    }

    if (filters.locality) {
      query.locality = new RegExp(filters.locality.trim(), 'i');
    }

    if (filters.category) {
      query.category = new RegExp(filters.category.trim(), 'i');
    }

    if (filters.guideId) {
      query.guideId = filters.guideId;
    }

    const experiences = await GuideExperienceModel.find(query).sort({ createdAt: -1 });
    return experiences.map(toExperienceRecord);
  }

  /**
   * Retrieves a single public experience by ID.
   */
  static async getPublicExperienceById(id: string): Promise<GuideExperienceRecord> {
    const experience = await GuideExperienceModel.findOne({
      id: id.toLowerCase(),
      status: 'published',
    });

    if (!experience) {
      throw new NotFoundError(`Guide experience '${id}' was not found or is currently unpublished.`);
    }

    // Verify guide eligibility
    const profile = await GuideProfileModel.findOne({
      userId: experience.guideId,
      verificationStatus: 'verified',
      isActive: true,
    });

    if (!profile) {
      throw new NotFoundError('This experience is currently unavailable.');
    }

    return toExperienceRecord(experience);
  }
}
