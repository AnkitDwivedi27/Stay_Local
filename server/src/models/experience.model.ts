import { Schema, model, Model } from 'mongoose';
import { ExperienceRecord } from '../types';

export interface ExperienceDoc extends Omit<ExperienceRecord, 'createdAt' | 'updatedAt'> {
  createdAt?: Date;
  updatedAt?: Date;
}

const ExperienceSchema = new Schema<ExperienceDoc>(
  {
    id: {
      type: String,
      required: [true, 'Experience ID is required'],
      unique: true,
      trim: true,
      index: true,
      lowercase: true,
    },
    title: {
      type: String,
      required: [true, 'Experience title is required'],
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: [
          'craft_and_weaving',
          'village_culture',
          'culinary_and_farming',
          'nature_and_trekking',
        ],
        message: 'Invalid experience category',
      },
      index: true,
    },
    destinationId: {
      type: String,
      required: [true, 'Destination ID is required'],
      trim: true,
      index: true,
      lowercase: true,
    },
    destinationName: {
      type: String,
      required: [true, 'Destination name is required'],
      trim: true,
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
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    highlights: {
      type: [String],
      default: [],
    },
    potentialStakeholders: {
      type: String,
      trim: true,
    },
    evidenceSource: {
      type: String,
      required: [true, 'Evidence source is required'],
      trim: true,
    },
    sourceType: {
      type: String,
      required: [true, 'Source type is required'],
      trim: true,
    },
    verificationStatus: {
      type: String,
      required: [true, 'Verification status is required'],
      enum: {
        values: [
          'grounded_regional_heritage',
          'lead_under_verification',
          'verified_host_experience',
        ],
        message: 'Invalid experience verification status',
      },
      index: true,
    },
    responsibleTravelGuideline: {
      type: String,
      required: [true, 'Responsible travel guideline is required'],
      trim: true,
    },
    seasonality: {
      type: String,
      required: [true, 'Seasonality is required'],
      trim: true,
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

ExperienceSchema.index({ destinationId: 1, category: 1 });
ExperienceSchema.index({ district: 1, category: 1 });

export const ExperienceModel: Model<ExperienceDoc> =
  model<ExperienceDoc>('Experience', ExperienceSchema);
