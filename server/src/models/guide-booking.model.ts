import { Schema, model, Model, HydratedDocument } from 'mongoose';
import { GuideBookingRecord } from '../types';

export interface GuideBookingDoc extends Omit<GuideBookingRecord, 'createdAt' | 'updatedAt' | 'confirmedAt' | 'cancelledAt' | 'rejectedAt' | 'completedAt'> {
  confirmedAt?: Date;
  cancelledAt?: Date;
  rejectedAt?: Date;
  completedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export type GuideBookingDocument = HydratedDocument<GuideBookingDoc>;
export type GuideBookingModelType = Model<GuideBookingDoc>;

const GuideBookingPricingSchema = new Schema(
  {
    basePrice: { type: Number, required: true, min: 0 },
    pricingType: { type: String, enum: ['per_person', 'per_group'], required: true },
    totalAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
  },
  { _id: false }
);

const GuideBookingLocationSchema = new Schema(
  {
    district: { type: String, required: true, trim: true },
    locality: { type: String, required: true, trim: true },
    meetingPoint: { type: String, trim: true },
  },
  { _id: false }
);

const GuideBookingSchema = new Schema<GuideBookingDoc, GuideBookingModelType>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    bookingReference: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    touristId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    touristName: {
      type: String,
      required: true,
      trim: true,
    },
    touristEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    touristPhone: {
      type: String,
      trim: true,
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
    experienceId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    experienceTitle: {
      type: String,
      required: true,
      trim: true,
    },
    linkedHomestayBookingId: {
      type: String,
      trim: true,
      index: true,
    },
    location: {
      type: GuideBookingLocationSchema,
      required: true,
    },
    bookingDate: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true,
    },
    timeSlot: {
      type: String,
      required: true,
      trim: true,
    },
    participantCount: {
      type: Number,
      required: true,
      min: 1,
    },
    pricing: {
      type: GuideBookingPricingSchema,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'rejected', 'cancelled', 'completed'],
      default: 'pending',
      index: true,
    },
    specialRequests: {
      type: String,
      trim: true,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    cancellationReason: {
      type: String,
      trim: true,
    },
    confirmedAt: { type: Date },
    cancelledAt: { type: Date },
    rejectedAt: { type: Date },
    completedAt: { type: Date },
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

// Indexes for conflict detection and fast querying
GuideBookingSchema.index({ experienceId: 1, bookingDate: 1, timeSlot: 1, status: 1 });
GuideBookingSchema.index({ touristId: 1, status: 1 });
GuideBookingSchema.index({ guideId: 1, status: 1 });

export const GuideBookingModel: GuideBookingModelType = model<GuideBookingDoc>(
  'GuideBooking',
  GuideBookingSchema
);
