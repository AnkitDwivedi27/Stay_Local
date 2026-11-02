import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load environment variables from root .env or server/.env
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z
    .string()
    .default('5000')
    .transform((val) => parseInt(val, 10))
    .refine((port) => !isNaN(port) && port > 0 && port < 65536, {
      message: 'PORT must be a valid port number between 1 and 65535',
    }),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  MONGODB_URI: z.string().optional(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  JWT_SECRET: z
    .string()
    .default('staylocal-super-secret-jwt-key-for-dev-environment-change-in-prod-32chars!')
    .refine((val) => val.length >= 16, {
      message: 'JWT_SECRET must be at least 16 characters long',
    }),
  JWT_EXPIRES_IN: z.string().default('7d'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  console.error('[Config] Invalid environment configuration:\n' + issues);
  throw new Error(`Configuration validation failed:\n${issues}`);
}

export const env = parsed.data;
