import { Schema, model, Model } from 'mongoose';
import { AccommodationRecord } from '../types';

export interface StayDoc extends Omit<AccommodationRecord, 'createdAt' | 'updatedAt' | 'assignedAt' | 'assignmentHistory' | 'hostAuthorization'> {
  assignedAt?: Date;
  assignmentHistory?: Array<{
    hostId: string;
    hostName: string;
    hostEmail: string;
    assignedBy: string;
    assignedByName: string;
    assignedAt: Date;
    action: 'assigned' | 'reassigned' | 'unassigned';
    reason?: string;
  }>;
  hostAuthorization?: {
    relationship: 'owner' | 'family_member' | 'authorized_manager' | 'other';
    relationshipExplanation?: string;
    notes?: string;
    declarationConfirmed: boolean;
    declaredAt?: Date;
    submittedAt?: Date;
    documents: Array<{
      id: string;
      fileName: string;
      fileType: string;
      fileSize: number;
      documentType: 'ownership_document' | 'owner_authorization' | 'other_evidence';
      filePath?: string;
      downloadUrl?: string;
      uploadedAt?: Date;
    }>;
  };
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

const ContactDetailsSchema = new Schema(
  {
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    contactPerson: { type: String, trim: true },
    isPubliclyListed: { type: Boolean, default: false },
  },
  { _id: false }
);

const GuestCapacitySchema = new Schema(
  {
    maxGuests: { type: Number, min: 0 },
    roomCount: { type: Number, min: 0 },
  },
  { _id: false }
);

const AssignmentHistorySchema = new Schema(
  {
    hostId: { type: String, required: true, trim: true },
    hostName: { type: String, required: true, trim: true },
    hostEmail: { type: String, required: true, trim: true, lowercase: true },
    assignedBy: { type: String, required: true, trim: true },
    assignedByName: { type: String, required: true, trim: true },
    assignedAt: { type: Date, default: Date.now },
    action: {
      type: String,
      enum: ['assigned', 'reassigned', 'unassigned'],
      required: true,
    },
    reason: { type: String, trim: true },
  },
  { _id: false }
);

const HostVerificationDocumentSchema = new Schema(
  {
    id: { type: String, required: true },
    fileName: { type: String, required: true, trim: true },
    fileType: { type: String, required: true, trim: true },
    fileSize: { type: Number, required: true },
    documentType: {
      type: String,
      enum: ['ownership_document', 'owner_authorization', 'other_evidence'],
      required: true,
    },
    filePath: { type: String, trim: true },
    downloadUrl: { type: String, trim: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const HostAuthorizationSchema = new Schema(
  {
    relationship: {
      type: String,
      enum: ['owner', 'family_member', 'authorized_manager', 'other'],
      required: true,
    },
    relationshipExplanation: { type: String, trim: true },
    notes: { type: String, trim: true },
    declarationConfirmed: { type: Boolean, default: false },
    declaredAt: { type: Date, default: Date.now },
    submittedAt: { type: Date, default: Date.now },
    documents: { type: [HostVerificationDocumentSchema], default: [] },
  },
  { _id: false }
);

const StaySchema = new Schema<StayDoc>(
  {
    id: {
      type: String,
      required: [true, 'Stay ID is required'],
      unique: true,
      trim: true,
      index: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: [true, 'Stay name is required'],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
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
      index: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    coordinates: {
      type: GeoCoordinatesSchema,
      required: false,
    },
    category: {
      type: String,
      required: [true, 'Accommodation category is required'],
      enum: {
        values: [
          'village_homestay',
          'heritage_farmstay',
          'eco_lodge',
          'mountain_cottage',
          'bed_and_breakfast',
        ],
        message: 'Invalid accommodation category',
      },
      index: true,
    },
    leadType: {
      type: String,
      enum: {
        values: [
          'direct_homestay',
          'community_cooperative',
          'local_host',
          'directory_entry',
        ],
        message: 'Invalid lead type',
      },
      required: false,
    },
    contactDetails: {
      type: ContactDetailsSchema,
      required: false,
    },
    localSpecialties: {
      type: [String],
      default: [],
    },
    dataSource: {
      type: String,
      required: [true, 'Data source is required'],
      trim: true,
    },
    sourceReference: {
      type: String,
      trim: true,
    },
    verificationStatus: {
      type: String,
      required: [true, 'Verification status is required'],
      enum: {
        values: [
          'unverified_lead',
          'verification_pending',
          'verified',
          'rejected_or_inactive',
        ],
        message: 'Invalid verification status',
      },
      index: true,
    },
    publicationStatus: {
      type: String,
      required: [true, 'Publication status is required'],
      enum: {
        values: ['draft', 'published', 'archived'],
        message: 'Invalid publication status',
      },
      default: 'published',
      index: true,
    },
    verificationNotes: {
      type: String,
      trim: true,
    },
    nextVerificationStep: {
      type: String,
      trim: true,
    },
    guestCapacity: {
      type: GuestCapacitySchema,
      required: false,
    },
    pricePerNight: {
      type: Number,
      default: 1800,
      min: 0,
    },
    hostId: {
      type: String,
      trim: true,
      index: true,
    },
    isPreloaded: {
      type: Boolean,
      default: false,
      index: true,
    },
    assignmentStatus: {
      type: String,
      enum: ['unassigned', 'assigned'],
      default: 'unassigned',
      index: true,
    },
    assignedAt: {
      type: Date,
    },
    assignedBy: {
      type: String,
      trim: true,
    },
    assignedByName: {
      type: String,
      trim: true,
    },
    assignedHostId: {
      type: String,
      trim: true,
      index: true,
    },
    assignedHostName: {
      type: String,
      trim: true,
    },
    assignedHostEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    assignmentHistory: {
      type: [AssignmentHistorySchema],
      default: [],
    },
    amenities: {
      type: [String],
      default: [],
    },
    imagePlaceholder: {
      type: String,
      trim: true,
    },
    destinationId: {
      type: String,
      trim: true,
      index: true,
    },
    images: {
      type: [String],
      default: [],
    },
    submissionEvidence: {
      type: String,
      trim: true,
    },
    hostAuthorization: {
      type: HostAuthorizationSchema,
      required: false,
    },
    accessibilityNotes: {
      type: String,
      trim: true,
    },
    travelTip: {
      type: String,
      trim: true,
    },
    verificationHistory: [
      {
        decision: {
          type: String,
          enum: ['submitted', 'approved', 'rejected', 'suspended', 'info_requested'],
          required: true,
        },
        reason: { type: String, trim: true },
        reviewedBy: { type: String, trim: true },
        reviewerName: { type: String, trim: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    confirmationLock: {
      type: Boolean,
      default: false,
      index: true,
    },
    confirmationLockExpiresAt: {
      type: Date,
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

// Compound indexes for common queries
StaySchema.index({ district: 1, verificationStatus: 1 });
StaySchema.index({ locality: 1, category: 1 });
StaySchema.index({ assignmentStatus: 1, isPreloaded: 1 });

export const StayModel: Model<StayDoc> = model<StayDoc>('Stay', StaySchema);
