import { Schema, model, Model, HydratedDocument } from 'mongoose';
import { LocalTreasureRecord } from '../types';

export interface LocalTreasureDoc
  extends Omit<LocalTreasureRecord, 'createdAt' | 'updatedAt'> {
  createdAt?: Date;
  updatedAt?: Date;
}

export type LocalTreasureDocument = HydratedDocument<LocalTreasureDoc>;
export type LocalTreasureModelType = Model<LocalTreasureDoc>;

const GeoCoordinatesSchema = new Schema(
  {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  { _id: false }
);

const TreasureContactSchema = new Schema(
  {
    phone: { type: String, trim: true },
    email: { type: String, trim: true },
    contactPerson: { type: String, trim: true },
    isPubliclyVerified: { type: Boolean, default: false },
  },
  { _id: false }
);

const LocalTreasureSchema = new Schema<LocalTreasureDoc, LocalTreasureModelType>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    craftName: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: [
        'woollens_textiles',
        'traditional_art',
        'handicrafts_carvings',
        'local_food_produce',
        'cultural_heritage',
      ],
      required: true,
      index: true,
    },
    artisanOrShopName: {
      type: String,
      required: true,
      trim: true,
    },
    artisanType: {
      type: String,
      enum: [
        'individual_artisan',
        'artisan_collective',
        'village_cluster',
        'heritage_workshop',
        'local_shop',
      ],
      required: true,
      default: 'individual_artisan',
    },
    district: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    locality: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    village: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    coordinates: {
      type: GeoCoordinatesSchema,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    culturalSignificance: {
      type: String,
      required: true,
      trim: true,
    },
    productionProcess: {
      type: String,
      required: true,
      trim: true,
    },
    visitingInfo: {
      type: String,
      trim: true,
    },
    contact: {
      type: TreasureContactSchema,
    },
    locationLink: {
      type: String,
      trim: true,
    },
    images: {
      type: [String],
      default: [],
    },
    verificationStatus: {
      type: String,
      enum: ['verified', 'unverified_lead', 'draft', 'inactive'],
      default: 'unverified_lead',
      index: true,
    },
    verificationNotes: {
      type: String,
      trim: true,
    },
    sourceReference: {
      type: String,
      required: true,
      trim: true,
    },
    researchNotes: {
      type: String,
      trim: true,
    },
    nearbyClusters: {
      type: [String],
      default: [],
      index: true,
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

LocalTreasureSchema.index({ district: 1, locality: 1, verificationStatus: 1, isActive: 1 });
LocalTreasureSchema.index({ district: 1, verificationStatus: 1, isActive: 1 });
LocalTreasureSchema.index({ category: 1, verificationStatus: 1, isActive: 1 });
LocalTreasureSchema.index({ nearbyClusters: 1, verificationStatus: 1, isActive: 1 });

export const LocalTreasureModel: LocalTreasureModelType = model<LocalTreasureDoc>(
  'LocalTreasure',
  LocalTreasureSchema
);
