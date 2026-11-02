import { Router, Request, Response } from 'express';
import { register, login, logout, getMe } from '../controllers/auth.controller';
import { validateBody } from '../validators';
import { registerSchema, loginSchema } from '../validators/auth.validator';
import { authenticate, requireRole } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimiter';

export const authRouter = Router();

authRouter.post('/auth/register', authRateLimiter, validateBody(registerSchema), register);
authRouter.post('/auth/login', authRateLimiter, validateBody(loginSchema), login);
authRouter.post('/auth/logout', logout);
authRouter.get('/auth/me', authenticate, getMe);

// Protected role-verification routes for hosts and administrators
authRouter.get(
  '/auth/host-only',
  authenticate,
  requireRole('host', 'admin'),
  (req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      data: {
        message: 'Welcome to the Host portal',
        role: req.user?.role,
      },
    });
  }
);

authRouter.get(
  '/auth/admin-only',
  authenticate,
  requireRole('admin'),
  (req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      data: {
        message: 'Welcome to the Administrator portal',
        role: req.user?.role,
      },
    });
  }
);
