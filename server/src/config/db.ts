import mongoose from 'mongoose';
import { env } from './env';
import { ConfigurationError } from '../utils/errors';

export type DatabaseConnectionStatus =
  | 'connected'
  | 'connecting'
  | 'disconnected'
  | 'not_configured';

export function isDatabaseConfigured(): boolean {
  return Boolean(env.MONGODB_URI && env.MONGODB_URI.trim().length > 0);
}

export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export function sanitizeMongoUri(uri?: string): string {
  if (!uri) return '';
  return uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
}

export function getDatabaseStatus(): DatabaseConnectionStatus {
  if (!isDatabaseConfigured()) {
    return 'not_configured';
  }

  const state = mongoose.connection.readyState;
  switch (state) {
    case 1:
      return 'connected';
    case 2:
      return 'connecting';
    default:
      return 'disconnected';
  }
}

export async function connectDB(retries = 2): Promise<void> {
  const uri = env.MONGODB_URI?.trim();

  if (!uri) {
    if (env.NODE_ENV === 'production') {
      throw new ConfigurationError(
        'Missing required MONGODB_URI in production environment. A valid MongoDB Atlas connection string is required.'
      );
    }

    console.info(
      '[Database] MONGODB_URI is not configured. Running in offline/read-only mode using research dataset.'
    );
    return;
  }

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      console.info(`[Database] Connecting to MongoDB Atlas (attempt ${attempt})...`);
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 8000,
        autoIndex: env.NODE_ENV !== 'production',
      });
      console.info('[Database] Successfully connected to MongoDB Atlas.');
      return;
    } catch (err) {
      const rawMsg = err instanceof Error ? err.message : String(err);
      const sanitizedMsg = sanitizeMongoUri(rawMsg);
      if (attempt <= retries) {
        console.warn(`[Database] Connection attempt ${attempt} failed (${sanitizedMsg}). Retrying in 1.5s...`);
        await new Promise((r) => setTimeout(r, 1500));
      } else {
        console.error('[Database] Connection error to MongoDB Atlas:', sanitizedMsg);
        if (env.NODE_ENV === 'production') {
          throw new ConfigurationError(
            'Failed to connect to MongoDB Atlas in production environment.'
          );
        }
      }
    }
  }
}

export async function disconnectDB(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.info('[Database] MongoDB connection closed.');
  }
}
