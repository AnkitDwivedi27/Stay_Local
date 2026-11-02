import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors';
import { env } from '../config/env';
import { ApiErrorResponse } from '../types';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response<ApiErrorResponse>,
  _next: NextFunction
): void {
  // 1. Zod Validation Errors
  if (err instanceof ZodError) {
    const formattedErrors = err.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));

    const detailSummary = formattedErrors.map((e) => e.message).join('. ');

    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: detailSummary || 'Invalid request payload or query parameters.',
        details: formattedErrors,
      },
    });
    return;
  }

  // 2. Custom App Operational Errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  // 3. Express JSON parse syntax error
  if ('type' in err && (err as { type: string }).type === 'entity.parse.failed') {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: 'Malformed JSON payload in request body.',
      },
    });
    return;
  }

  // 4. Uncaught Internal Server Errors
  console.error('[ServerError] Unhandled exception:', err);

  const isProduction = env.NODE_ENV === 'production';
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: isProduction
        ? 'An unexpected internal server error occurred.'
        : err.message || 'Internal server error',
      details: isProduction ? undefined : { stack: err.stack },
    },
  });
}
