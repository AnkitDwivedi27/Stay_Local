import { Schema, model, Model } from 'mongoose';
import { DestinationRecord } from '../types';

export interface DestinationDoc extends Omit<DestinationRecord, 'createdAt' | 'updatedAt'> {
  createdAt?: Date;
  updatedAt?: Date;
}

const GeoCoordinatesSchema = new Schema(
  {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  { _id: false }
);

const DestinationSchema = new Schema<DestinationDoc>(
  {
    id: {
      type: String,
      required: [true, 'Destination ID/slug is required'],
      unique: true,
      trim: true,
      index: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: [true, 'Destination name is required'],
      trim: true,
      index: true,
    },
    district: {
      type: String,
      required: [true, 'District is required'],
      trim: true,
      index: true,
    },
    division: {
      type: String,
      required: [true, 'Division is required'],
      enum: {
        values: ['Kumaon', 'Garhwal'],
        message: 'Division must be either Kumaon or Garhwal',
      },
      index: true,
    },
    tagline: {
      type: String,
      required: [true, 'Tagline is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    altitudeMeters: {
      type: Number,
      required: [true, 'Altitude in meters is required'],
      min: [0, 'Altitude must be a non-negative number'],
    },
    coordinates: {
      type: GeoCoordinatesSchema,
      required: false,
    },
    bestTimeToVisit: {
      type: String,
      required: [true, 'Best time to visit is required'],
      trim: true,
    },
    characterTags: {
      type: [String],
      default: [],
    },
    featuredSpecialties: {
      type: [String],
      default: [],
    },
    knownLocalities: {
      type: [String],
      default: [],
    },
    accessibilityNotes: {
      type: String,
      required: [true, 'Accessibility notes are required'],
      trim: true,
    },
    travelTip: {
      type: String,
      required: [true, 'Travel tip is required'],
      trim: true,
    },
    leadCountEstimate: {
      type: Number,
      default: 0,
      min: 0,
    },
    verifiedCountEstimate: {
      type: Number,
      default: 0,
      min: 0,
    },
    heroImage: {
      type: String,
      required: [true, 'Hero image URL is required'],
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

// Search text index for flexible text search
DestinationSchema.index({
  name: 'text',
  district: 'text',
  tagline: 'text',
  knownLocalities: 'text',
});

export const DestinationModel: Model<DestinationDoc> =
  model<DestinationDoc>('Destination', DestinationSchema);
