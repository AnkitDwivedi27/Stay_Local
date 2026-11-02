import { Request, Response } from 'express';
import { env } from '../config/env';
import { getDatabaseStatus, isDatabaseConfigured, isDatabaseConnected } from '../config/db';

export function getHealth(_req: Request, res: Response): void {
  const dbStatus = getDatabaseStatus();

  res.status(200).json({
    status: 'ok',
    service: 'StayLocal API',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: env.NODE_ENV,
    database: {
      status: dbStatus,
      configured: Boolean(env.MONGODB_URI && env.MONGODB_URI.trim().length > 0),
    },
  });
}

export function getReadiness(_req: Request, res: Response): void {
  const isConfigured = isDatabaseConfigured();
  const isConnected = isDatabaseConnected();
  const status = getDatabaseStatus();

  if (isConfigured && !isConnected) {
    res.status(503).json({
      ready: false,
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: {
        configured: true,
        status,
        message: 'MongoDB Atlas is configured but currently disconnected or unreachable',
      },
    });
    return;
  }

  if (env.NODE_ENV === 'production' && !isConfigured) {
    res.status(503).json({
      ready: false,
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: {
        configured: false,
        status: 'not_configured',
        message: 'MONGODB_URI must be configured in production',
      },
    });
    return;
  }

  res.status(200).json({
    ready: true,
    status: 'ready',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      configured: isConfigured,
      status,
    },
  });
}
