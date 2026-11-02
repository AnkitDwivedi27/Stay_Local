import { z } from 'zod';

export const registerSchema = z.object({
  email: z
    .string()
    .email('Please provide a valid email address')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password must not exceed 128 characters')
    .regex(
      /^(?=.*[a-zA-Z])(?=.*[0-9\W_])/,
      'Password must contain both letters and at least one number or special symbol'
    ),
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name cannot exceed 100 characters')
    .trim(),
  // Public registration role: strictly tourists, hosts, or guides. NEVER 'admin'.
  role: z
    .enum(['tourist', 'host', 'guide'], {
      errorMap: () => ({
        message: 'Invalid role selection. Choose tourist, host, or guide. Admin registration is forbidden.',
      }),
    })
    .default('tourist'),
  phone: z.string().trim().nullish(),
  bio: z.string().trim().max(500, 'Bio cannot exceed 500 characters').nullish(),
});

export const loginSchema = z.object({
  email: z
    .string()
    .email('Please provide a valid email address')
    .toLowerCase()
    .trim(),
  password: z.string().min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
