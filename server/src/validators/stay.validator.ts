import { z } from 'zod';

export const accommodationCategoryEnum = z.enum([
  'village_homestay',
  'heritage_farmstay',
  'eco_lodge',
  'mountain_cottage',
  'bed_and_breakfast',
]);

export const publicationStatusEnum = z.enum(['draft', 'published', 'archived']);

export const guestCapacitySchema = z.object({
  maxGuests: z
    .number({ required_error: 'Maximum guest capacity is required' })
    .int('Guest capacity must be an integer')
    .min(1, 'Capacity must be at least 1 guest')
    .max(50, 'Capacity cannot exceed 50 guests'),
  roomCount: z
    .number()
    .int('Room count must be an integer')
    .min(1, 'Must have at least 1 room')
    .max(25, 'Room count cannot exceed 25')
    .optional(),
});

export const contactDetailsSchema = z.object({
  phone: z.string().trim().optional(),
  email: z.string().trim().email('Invalid contact email format').optional(),
  contactPerson: z.string().trim().optional(),
  isPubliclyListed: z.boolean().default(false),
});

export const createStaySchema = z.object({
  name: z
    .string({ required_error: 'Property name is required' })
    .trim()
    .min(3, 'Property name must be at least 3 characters')
    .max(120, 'Property name cannot exceed 120 characters'),
  description: z
    .string({ required_error: 'Property description is required' })
    .trim()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description cannot exceed 2000 characters'),
  district: z
    .string({ required_error: 'District is required' })
    .trim()
    .min(2, 'District must be at least 2 characters')
    .max(60, 'District cannot exceed 60 characters'),
  locality: z
    .string({ required_error: 'Locality/Village is required' })
    .trim()
    .min(2, 'Locality must be at least 2 characters')
    .max(80, 'Locality cannot exceed 80 characters'),
  address: z
    .string({ required_error: 'Address is required' })
    .trim()
    .min(5, 'Address must be at least 5 characters')
    .max(250, 'Address cannot exceed 250 characters'),
  destinationId: z.string().trim().optional(),
  category: accommodationCategoryEnum,
  pricePerNight: z
    .number({ required_error: 'Nightly price is required' })
    .min(200, 'Nightly rate must be at least ₹200')
    .max(50000, 'Nightly rate cannot exceed ₹50,000'),
  guestCapacity: guestCapacitySchema,
  amenities: z.array(z.string().trim()).default([]),
  localSpecialties: z.array(z.string().trim()).default([]),
  accessibilityNotes: z.string().trim().max(500).optional(),
  travelTip: z.string().trim().max(500).optional(),
  submissionEvidence: z.string().trim().max(2000).optional(),
  contactDetails: contactDetailsSchema.optional(),
  images: z.array(z.string().trim()).default([]),
  submitForVerification: z.boolean().optional(),
});

export const updateStaySchema = z.object({
  name: z.string().trim().min(3).max(120).optional(),
  description: z.string().trim().min(20).max(2000).optional(),
  district: z.string().trim().min(2).max(60).optional(),
  locality: z.string().trim().min(2).max(80).optional(),
  address: z.string().trim().min(5).max(250).optional(),
  destinationId: z.string().trim().optional(),
  category: accommodationCategoryEnum.optional(),
  pricePerNight: z.number().min(200).max(50000).optional(),
  guestCapacity: guestCapacitySchema.optional(),
  amenities: z.array(z.string().trim()).optional(),
  localSpecialties: z.array(z.string().trim()).optional(),
  accessibilityNotes: z.string().trim().max(500).optional(),
  travelTip: z.string().trim().max(500).optional(),
  submissionEvidence: z.string().trim().max(2000).optional(),
  contactDetails: contactDetailsSchema.optional(),
  images: z.array(z.string().trim()).optional(),
  publicationStatus: publicationStatusEnum.optional(),
});

const verificationDocumentSchema = z.object({
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
  documentType: z.enum(
    ['ownership_document', 'owner_authorization', 'other_evidence'],
    {
      errorMap: () => ({
        message: 'Invalid document type.',
      }),
    }
  ),
  dataUrl: z
    .string()
    .regex(/^data:(application\/pdf|image\/(jpeg|jpg|png));base64,/i, {
      message: 'Document must be a valid base64 data URL encoded file',
    }),
});

export const submitVerificationSchema = z
  .object({
    relationship: z
      .enum(['owner', 'family_member', 'authorized_manager', 'other'])
      .optional()
      .default('owner'),
    relationshipExplanation: z.string().trim().max(500).optional(),
    notes: z.string().trim().max(2000).optional(),
    submissionEvidence: z.string().trim().max(2000).optional(),
    declarationConfirmed: z.boolean().optional().default(true),
    documents: z.array(verificationDocumentSchema).optional().default([]),
  })
  .refine(
    (data) => data.declarationConfirmed === true,
    {
      message: 'You must confirm the authorization declaration before submitting.',
      path: ['declarationConfirmed'],
    }
  )
  .refine(
    (data) => {
      if (data.relationship === 'other') {
        return Boolean(
          data.relationshipExplanation && data.relationshipExplanation.trim().length >= 3
        );
      }
      return true;
    },
    {
      message: 'Please provide a brief explanation for your relationship with the property',
      path: ['relationshipExplanation'],
    }
  );

export const adminVerifyStaySchema = z.object({
  action: z.enum(['approve', 'reject', 'request_info'], {
    required_error: "Action must be 'approve', 'reject', or 'request_info'",
  }),
  reason: z
    .string({ required_error: 'Decision explanation is required' })
    .trim()
    .min(5, 'Review reason must be at least 5 characters')
    .max(1000, 'Reason cannot exceed 1000 characters'),
});

export const adminSuspendStaySchema = z.object({
  reason: z
    .string({ required_error: 'Suspension justification is required' })
    .trim()
    .min(5, 'Suspension reason must be at least 5 characters')
    .max(1000, 'Reason cannot exceed 1000 characters'),
});

export const assignHostSchema = z.object({
  stayId: z.string({ required_error: 'Stay ID is required' }).trim().min(1, 'Stay ID is required'),
  hostId: z.string({ required_error: 'Host ID is required' }).trim().min(1, 'Host ID is required'),
  reason: z.string().trim().max(500, 'Reason cannot exceed 500 characters').optional(),
});

export const reassignHostSchema = z.object({
  hostId: z.string({ required_error: 'New host ID is required' }).trim().min(1, 'Host ID is required'),
  reason: z
    .string({ required_error: 'Reason for reassignment is required' })
    .trim()
    .min(5, 'Reassignment reason must be at least 5 characters')
    .max(500, 'Reason cannot exceed 500 characters'),
});

export const unassignHostSchema = z.object({
  reason: z.string().trim().max(500, 'Reason cannot exceed 500 characters').optional(),
});

export type CreateStayInput = z.infer<typeof createStaySchema>;
export type UpdateStayInput = z.infer<typeof updateStaySchema>;
export type SubmitVerificationInput = z.infer<typeof submitVerificationSchema>;
export type AdminVerifyStayInput = z.infer<typeof adminVerifyStaySchema>;
export type AdminSuspendStayInput = z.infer<typeof adminSuspendStaySchema>;
export type AssignHostInput = z.infer<typeof assignHostSchema>;
export type ReassignHostInput = z.infer<typeof reassignHostSchema>;
export type UnassignHostInput = z.infer<typeof unassignHostSchema>;
