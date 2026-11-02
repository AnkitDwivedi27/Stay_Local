import { Schema, model, Model, HydratedDocument } from 'mongoose';
import { GuideExperienceRecord } from '../types';

export interface GuideExperienceDoc extends Omit<GuideExperienceRecord, 'createdAt' | 'updatedAt'> {
  createdAt?: Date;
  updatedAt?: Date;
}

export type GuideExperienceDocument = HydratedDocument<GuideExperienceDoc>;
export type GuideExperienceModelType = Model<GuideExperienceDoc>;

const GuideAvailableSlotSchema = new Schema(
  {
    date: { type: String, required: true, trim: true }, // YYYY-MM-DD
    timeSlots: { type: [String], default: [] },
  },
  { _id: false }
);

const GuideExperienceSchema = new Schema<GuideExperienceDoc, GuideExperienceModelType>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    guideId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    guideName: {
      type: String,
      required: true,
      trim: true,
    },
    guideAvatarUrl: {
      type: String,
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Experience title is required'],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Experience description is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      index: true,
    },
    district: {
      type: String,
      required: [true, 'District is required'],
      trim: true,
      index: true,
    },
    locality: {
      type: String,
      required: [true, 'Locality is required'],
      trim: true,
      index: true,
    },
    meetingPoint: {
      type: String,
      required: [true, 'Meeting point is required'],
      trim: true,
    },
    duration: {
      type: String,
      required: [true, 'Duration is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be positive'],
    },
    pricingType: {
      type: String,
      enum: ['per_person', 'per_group'],
      default: 'per_person',
    },
    maxGroupSize: {
      type: Number,
      required: true,
      min: [1, 'Maximum group size must be at least 1'],
      default: 8,
    },
    images: {
      type: [String],
      default: [],
    },
    requirements: {
      type: String,
      trim: true,
    },
    availableSlots: {
      type: [GuideAvailableSlotSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
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

GuideExperienceSchema.index({ district: 1, status: 1 });
GuideExperienceSchema.index({ locality: 1, status: 1 });
GuideExperienceSchema.index({ guideId: 1, status: 1 });

export const GuideExperienceModel: GuideExperienceModelType = model<GuideExperienceDoc>(
  'GuideExperience',
  GuideExperienceSchema
);
