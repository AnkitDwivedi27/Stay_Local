import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { signToken, setAuthCookie, clearAuthCookie } from '../utils/token';
import { ApiSuccessResponse, AuthResponse } from '../types';
import { UnauthorizedError } from '../utils/errors';

export async function register(
  req: Request,
  res: Response<ApiSuccessResponse<AuthResponse>>,
  next: NextFunction
): Promise<void> {
  try {
    const user = await AuthService.register(req.body);

    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    setAuthCookie(res, token);

    res.status(201).json({
      success: true,
      data: { user },
    });
  } catch (err) {
    next(err);
  }
}

export async function login(
  req: Request,
  res: Response<ApiSuccessResponse<AuthResponse>>,
  next: NextFunction
): Promise<void> {
  try {
    const user = await AuthService.login(req.body);

    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    setAuthCookie(res, token);

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (err) {
    next(err);
  }
}

export function logout(
  _req: Request,
  res: Response<ApiSuccessResponse<{ message: string }>>,
  next: NextFunction
): void {
  try {
    clearAuthCookie(res);

    res.status(200).json({
      success: true,
      data: { message: 'Logged out successfully.' },
    });
  } catch (err) {
    next(err);
  }
}

export function getMe(
  req: Request,
  res: Response<ApiSuccessResponse<AuthResponse>>,
  next: NextFunction
): void {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Not authenticated');
    }

    res.status(200).json({
      success: true,
      data: { user: req.user },
    });
  } catch (err) {
    next(err);
  }
}
