import { Schema, model, Model, HydratedDocument } from 'mongoose';
import { BookingRecord, BookingStatus } from '../types';

export interface BookingDoc extends Omit<BookingRecord, 'createdAt' | 'updatedAt' | 'checkIn' | 'checkOut' | 'confirmedAt' | 'cancelledAt' | 'rejectedAt'> {
  checkIn: Date;
  checkOut: Date;
  confirmedAt?: Date;
  cancelledAt?: Date;
  rejectedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export type BookingDocument = HydratedDocument<BookingDoc>;
export type BookingModelType = Model<BookingDoc, Record<string, never>>;

const BookingPriceBreakdownSchema = new Schema(
  {
    nights: { type: Number, required: true, min: 1 },
    pricePerNight: { type: Number, required: true, min: 0 },
    baseAmount: { type: Number, required: true, min: 0 },
    communityFee: { type: Number, required: true, min: 0 },
    taxAmount: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: 'INR' },
  },
  { _id: false }
);

const BookingSchema = new Schema<BookingDoc, BookingModelType>(
  {
    id: {
      type: String,
      required: [true, 'Booking ID is required'],
      unique: true,
      trim: true,
      index: true,
    },
    bookingReference: {
      type: String,
      required: [true, 'Booking reference is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    touristId: {
      type: String,
      required: [true, 'Tourist ID is required'],
      trim: true,
      index: true,
    },
    touristName: {
      type: String,
      required: [true, 'Tourist name is required'],
      trim: true,
    },
    touristEmail: {
      type: String,
      required: [true, 'Tourist email is required'],
      trim: true,
      lowercase: true,
    },
    touristPhone: {
      type: String,
      trim: true,
    },
    stayId: {
      type: String,
      required: [true, 'Stay ID is required'],
      trim: true,
      index: true,
    },
    stayName: {
      type: String,
      required: [true, 'Stay name is required'],
      trim: true,
    },
    stayLocality: {
      type: String,
      required: [true, 'Stay locality is required'],
      trim: true,
    },
    stayDistrict: {
      type: String,
      required: [true, 'Stay district is required'],
      trim: true,
    },
    hostId: {
      type: String,
      trim: true,
      index: true,
    },
    checkIn: {
      type: Date,
      required: [true, 'Check-in date is required'],
      index: true,
    },
    checkOut: {
      type: Date,
      required: [true, 'Check-out date is required'],
      index: true,
    },
    guestCount: {
      type: Number,
      required: [true, 'Guest count is required'],
      min: [1, 'Guest count must be at least 1'],
    },
    pricing: {
      type: BookingPriceBreakdownSchema,
      required: true,
    },
    status: {
      type: String,
      required: [true, 'Booking status is required'],
      enum: {
        values: ['pending', 'confirmed', 'rejected', 'cancelled', 'completed'] as BookingStatus[],
        message: 'Invalid booking status',
      },
      default: 'pending',
      index: true,
    },
    specialRequests: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    cancellationReason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    confirmedAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    rejectedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        const record = ret as Record<string, unknown>;
        delete record._id;
        delete record.__v;
        if (record.checkIn instanceof Date) {
          record.checkIn = record.checkIn.toISOString().split('T')[0];
        }
        if (record.checkOut instanceof Date) {
          record.checkOut = record.checkOut.toISOString().split('T')[0];
        }
        return record;
      },
    },
  }
);

// Compound indexes for fast overlap and role lookups
BookingSchema.index({ stayId: 1, status: 1 });
BookingSchema.index({ stayId: 1, checkIn: 1, checkOut: 1 });
BookingSchema.index({ touristId: 1, createdAt: -1 });
BookingSchema.index({ hostId: 1, status: 1 });

export const BookingModel: BookingModelType = model<BookingDoc, BookingModelType>(
  'Booking',
  BookingSchema
);
