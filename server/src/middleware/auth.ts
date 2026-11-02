import { Request, Response, NextFunction } from 'express';
import { verifyToken, AUTH_COOKIE_NAME } from '../utils/token';
import { AuthService } from '../services/auth.service';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { AuthUser, UserRole } from '../types';

// Extend Express Request interface to include authenticated user
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    // 1. Check HttpOnly cookie first, then fallback to Authorization header
    let token = req.cookies?.[AUTH_COOKIE_NAME];

    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0]?.toLowerCase() === 'bearer') {
        token = parts[1];
      }
    }

    if (!token) {
      throw new UnauthorizedError('Authentication required. Please log in to access this resource.');
    }

    // 2. Verify JWT signature and expiration
    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      throw new UnauthorizedError('Invalid or expired authentication token. Please log in again.');
    }

    // 3. Confirm user existence and active status in database
    const user = await AuthService.getCurrentUser(payload.id);
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required.'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Forbidden: Access requires one of the following roles: [${allowedRoles.join(
            ', '
          )}]. Your active role is '${req.user.role}'.`
        )
      );
    }

    next();
  };
}
