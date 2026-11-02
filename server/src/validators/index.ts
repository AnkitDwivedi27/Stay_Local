import { Request, Response, NextFunction } from 'express';
import { z, AnyZodObject } from 'zod';

// Helper to preprocess empty query strings to undefined
const optionalString = z.preprocess(
  (val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
  z.string().optional()
);

const optionalEnum = <T extends [string, ...string[]]>(values: T) =>
  z.preprocess(
    (val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
    z.enum(values).optional()
  );

export const destinationsQuerySchema = z.object({
  search: optionalString,
  district: optionalString,
  division: optionalEnum(['Kumaon', 'Garhwal']),
});

export const staysQuerySchema = z.object({
  destination: optionalString,
  district: optionalString,
  category: optionalEnum([
    'village_homestay',
    'heritage_farmstay',
    'eco_lodge',
    'mountain_cottage',
    'bed_and_breakfast',
  ]),
  verificationStatus: optionalEnum([
    'unverified_lead',
    'verification_pending',
    'verified',
    'rejected_or_inactive',
  ]),
  minGuests: z
    .preprocess(
      (val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
      z.string().optional()
    )
    .transform((val) => (val !== undefined ? parseInt(val, 10) : undefined))
    .refine((val) => val === undefined || (!isNaN(val) && val >= 0), {
      message: 'minGuests must be a non-negative number',
    }),
});

export const experiencesQuerySchema = z.object({
  category: optionalEnum([
    'craft_and_weaving',
    'village_culture',
    'culinary_and_farming',
    'nature_and_trekking',
  ]),
  destinationId: optionalString,
  district: optionalString,
});

export function validateQuery(schema: AnyZodObject) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (err) {
      next(err);
    }
  };
}

export function validateBody(schema: z.ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      next(err);
    }
  };
}

export * from './auth.validator';
export * from './booking.validator';
export * from './stay.validator';
export * from './guide.validator';
export * from './local-treasure.validator';

