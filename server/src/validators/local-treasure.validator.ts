import { z } from 'zod';

const optionalString = z.preprocess(
  (val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
  z.string().optional()
);

export const treasureCategoryEnum = z.enum([
  'woollens_textiles',
  'traditional_art',
  'handicrafts_carvings',
  'local_food_produce',
  'cultural_heritage',
]);

export const treasureVerificationStatusEnum = z.enum([
  'verified',
  'unverified_lead',
  'draft',
  'inactive',
]);

export const treasureArtisanTypeEnum = z.enum([
  'individual_artisan',
  'artisan_collective',
  'village_cluster',
  'heritage_workshop',
  'local_shop',
]);

const treasureContactSchema = z.object({
  phone: z.string().trim().optional(),
  email: z.string().trim().email().optional().or(z.literal('')),
  contactPerson: z.string().trim().optional(),
  isPubliclyVerified: z.boolean().default(false),
});

const coordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const destinationTreasuresQuerySchema = z.object({
  district: optionalString,
  locality: optionalString,
  category: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
    treasureCategoryEnum.optional()
  ),
});

export const publicTreasuresQuerySchema = z.object({
  search: optionalString,
  district: optionalString,
  locality: optionalString,
  category: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
    treasureCategoryEnum.optional()
  ),
});

export const adminTreasuresQuerySchema = z.object({
  search: optionalString,
  district: optionalString,
  category: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
    treasureCategoryEnum.optional()
  ),
  verificationStatus: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
    treasureVerificationStatusEnum.optional()
  ),
  isActive: z.preprocess((val) => {
    if (typeof val === 'string') {
      if (val.toLowerCase() === 'true') return true;
      if (val.toLowerCase() === 'false') return false;
      return undefined;
    }
    return val;
  }, z.boolean().optional()),
});

export const createTreasureSchema = z.object({
  title: z.string().trim().min(2, 'Title is required'),
  craftName: z.string().trim().min(2, 'Craft name is required'),
  category: treasureCategoryEnum,
  artisanOrShopName: z.string().trim().min(2, 'Artisan or workshop name is required'),
  artisanType: treasureArtisanTypeEnum.default('individual_artisan'),
  district: z.string().trim().min(2, 'District is required'),
  locality: z.string().trim().min(2, 'Locality is required'),
  village: z.string().trim().optional(),
  address: z.string().trim().optional(),
  coordinates: coordinatesSchema.optional(),
  description: z.string().trim().min(10, 'Description must be at least 10 characters'),
  culturalSignificance: z.string().trim().min(10, 'Cultural significance must be at least 10 characters'),
  productionProcess: z.string().trim().min(10, 'Production process must be at least 10 characters'),
  visitingInfo: z.string().trim().optional(),
  contact: treasureContactSchema.optional(),
  locationLink: z.string().trim().optional(),
  images: z.array(z.string().trim()).optional().default([]),
  verificationStatus: treasureVerificationStatusEnum.optional().default('unverified_lead'),
  verificationNotes: z.string().trim().optional(),
  sourceReference: z.string().trim().min(3, 'Source research reference is required'),
  researchNotes: z.string().trim().optional(),
  nearbyClusters: z.array(z.string().trim()).optional().default([]),
  isActive: z.boolean().optional().default(true),
});

export const updateTreasureSchema = z.object({
  title: z.string().trim().min(2).optional(),
  craftName: z.string().trim().min(2).optional(),
  category: treasureCategoryEnum.optional(),
  artisanOrShopName: z.string().trim().min(2).optional(),
  artisanType: treasureArtisanTypeEnum.optional(),
  district: z.string().trim().min(2).optional(),
  locality: z.string().trim().min(2).optional(),
  village: z.string().trim().optional(),
  address: z.string().trim().optional(),
  coordinates: coordinatesSchema.optional(),
  description: z.string().trim().min(10).optional(),
  culturalSignificance: z.string().trim().min(10).optional(),
  productionProcess: z.string().trim().min(10).optional(),
  visitingInfo: z.string().trim().optional(),
  contact: treasureContactSchema.optional(),
  locationLink: z.string().trim().optional(),
  images: z.array(z.string().trim()).optional(),
  verificationStatus: treasureVerificationStatusEnum.optional(),
  verificationNotes: z.string().trim().optional(),
  sourceReference: z.string().trim().min(3).optional(),
  researchNotes: z.string().trim().optional(),
  nearbyClusters: z.array(z.string().trim()).optional(),
  isActive: z.boolean().optional(),
});

export const reviewTreasureSchema = z.object({
  action: z.enum(['approve', 'reject', 'deactivate', 'activate']),
  notes: z.string().trim().optional(),
});
