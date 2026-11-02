import { z } from 'zod';

const guideServiceLocationSchema = z.object({
  district: z.string().trim().min(2, 'District is required'),
  locality: z.string().trim().min(2, 'Locality is required'),
  village: z.string().trim().optional(),
});

const guideDocumentSchema = z.object({
  fileName: z.string().trim().min(1, 'File name is required'),
  fileType: z.enum(
    ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
    {
      errorMap: () => ({
        message: 'Unsupported document format. Only PDF, JPG, JPEG, and PNG files are accepted.',
      }),
    }
  ),
  fileSize: z
    .number()
    .min(1, 'File cannot be empty')
    .max(5 * 1024 * 1024, 'Document size cannot exceed 5MB'),
  dataUrl: z
    .string()
    .regex(/^data:(application\/pdf|image\/(jpeg|jpg|png));base64,/i, {
      message: 'Document must be a valid base64 data URL encoded file',
    }),
});

export const updateGuideProfileSchema = z.object({
  bio: z.string().trim().max(2000).optional(),
  experienceYears: z.number().min(0).max(60).optional(),
  phone: z.string().trim().max(25).optional(),
  avatarUrl: z.string().trim().url().or(z.literal('')).optional(),
  languages: z.array(z.string().trim().min(1)).min(1, 'Select at least one spoken language').optional(),
  serviceLocations: z.array(guideServiceLocationSchema).min(1, 'Add at least one service location').optional(),
  specialties: z.array(z.string().trim().min(1)).min(1, 'Select at least one specialty').optional(),
  qualifications: z.string().trim().max(2000).optional(),
});

export const submitGuideVerificationSchema = z.object({
  bio: z.string().trim().max(2000).optional(),
  experienceYears: z.number().min(0).max(60).optional(),
  languages: z.array(z.string().trim().min(1)).optional(),
  serviceLocations: z.array(guideServiceLocationSchema).optional(),
  specialties: z.array(z.string().trim().min(1)).optional(),
  qualifications: z.string().trim().max(2000).optional(),
  documents: z.array(guideDocumentSchema).optional().default([]),
});

const guideAvailableSlotSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  timeSlots: z.array(z.string().trim().min(1)).min(1, 'At least one time slot is required'),
});

export const createGuideExperienceSchema = z.object({
  title: z.string().trim().min(3, 'Experience title must be at least 3 characters').max(150),
  description: z.string().trim().min(20, 'Experience description must be at least 20 characters').max(3000),
  category: z.string().trim().min(2, 'Category is required'),
  district: z.string().trim().min(2, 'District is required'),
  locality: z.string().trim().min(2, 'Locality is required'),
  meetingPoint: z.string().trim().min(3, 'Meeting point details are required'),
  duration: z.string().trim().min(2, 'Duration is required'),
  price: z.number().min(0, 'Price must be positive'),
  pricingType: z.enum(['per_person', 'per_group']).default('per_person'),
  maxGroupSize: z.number().int().min(1, 'Group size must be at least 1').max(50).default(8),
  images: z.array(z.string().trim()).optional().default([]),
  requirements: z.string().trim().max(2000).optional(),
  availableSlots: z.array(guideAvailableSlotSchema).optional().default([]),
});

export const updateGuideExperienceSchema = z.object({
  title: z.string().trim().min(3).max(150).optional(),
  description: z.string().trim().min(20).max(3000).optional(),
  category: z.string().trim().min(2).optional(),
  district: z.string().trim().min(2).optional(),
  locality: z.string().trim().min(2).optional(),
  meetingPoint: z.string().trim().min(3).optional(),
  duration: z.string().trim().min(2).optional(),
  price: z.number().min(0).optional(),
  pricingType: z.enum(['per_person', 'per_group']).optional(),
  maxGroupSize: z.number().int().min(1).max(50).optional(),
  images: z.array(z.string().trim()).optional(),
  requirements: z.string().trim().max(2000).optional(),
  availableSlots: z.array(guideAvailableSlotSchema).optional(),
});

export const createGuideBookingSchema = z.object({
  experienceId: z.string().trim().min(1, 'Experience ID is required'),
  bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  timeSlot: z.string().trim().min(1, 'Time slot is required'),
  participantCount: z.number().int().min(1, 'Must have at least 1 participant').max(50),
  specialRequests: z.string().trim().max(1000).optional(),
  linkedHomestayBookingId: z.string().trim().optional(),
});

export const respondGuideBookingSchema = z.object({
  action: z.enum(['confirm', 'reject']),
  reason: z.string().trim().max(1000).optional(),
});

export const adminReviewGuideSchema = z.object({
  action: z.enum(['approve', 'reject', 'suspend', 'reactivate']),
  notes: z.string().trim().max(1000).optional(),
});
