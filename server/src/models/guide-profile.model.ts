import { Schema, model, Model, HydratedDocument } from 'mongoose';
import { GuideProfileRecord } from '../types';

export interface GuideProfileDoc extends Omit<GuideProfileRecord, 'createdAt' | 'updatedAt' | 'verifiedAt' | 'documents'> {
  documents: Array<{
    id: string;
    fileName: string;
    fileType: string;
    fileSize?: number;
    downloadUrl?: string;
    filePath?: string;
    uploadedAt?: Date;
  }>;
  verifiedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export type GuideProfileDocument = HydratedDocument<GuideProfileDoc>;
export type GuideProfileModelType = Model<GuideProfileDoc>;

const GuideServiceLocationSchema = new Schema(
  {
    district: { type: String, required: true, trim: true },
    locality: { type: String, required: true, trim: true },
    village: { type: String, trim: true },
  },
  { _id: false }
);

const GuideDocumentSchema = new Schema(
  {
    id: { type: String, required: true },
    fileName: { type: String, required: true, trim: true },
    fileType: { type: String, required: true, trim: true },
    fileSize: { type: Number },
    filePath: { type: String, trim: true },
    downloadUrl: { type: String, trim: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const GuideProfileSchema = new Schema<GuideProfileDoc, GuideProfileModelType>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    avatarUrl: {
      type: String,
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    experienceYears: {
      type: Number,
      min: 0,
      default: 0,
    },
    languages: {
      type: [String],
      default: ['Hindi'],
    },
    serviceLocations: {
      type: [GuideServiceLocationSchema],
      default: [],
    },
    specialties: {
      type: [String],
      default: [],
    },
    qualifications: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    documents: {
      type: [GuideDocumentSchema],
      default: [],
    },
    verificationStatus: {
      type: String,
      enum: ['unverified', 'verification_pending', 'verified', 'rejected', 'suspended'],
      default: 'unverified',
      index: true,
    },
    verificationNotes: {
      type: String,
      trim: true,
    },
    verifiedAt: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete (ret as Record<string, unknown>)._id;
        delete (ret as Record<string, unknown>).__v;
        return ret;
      },
    },
  }
);

GuideProfileSchema.index({ 'serviceLocations.district': 1, verificationStatus: 1, isActive: 1 });
GuideProfileSchema.index({ 'serviceLocations.locality': 1, verificationStatus: 1 });

export const GuideProfileModel: GuideProfileModelType = model<GuideProfileDoc>(
  'GuideProfile',
  GuideProfileSchema
);
