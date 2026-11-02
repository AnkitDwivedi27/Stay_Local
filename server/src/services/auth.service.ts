import { UserModel, UserDocument } from '../models/user.model';
import { RegisterInput, LoginInput } from '../validators/auth.validator';
import { AuthUser } from '../types';
import { BadRequestError, UnauthorizedError, DatabaseError } from '../utils/errors';
import { isDatabaseConfigured, isDatabaseConnected } from '../config/db';

function toAuthUser(doc: UserDocument): AuthUser {
  const json = doc.toJSON() as Record<string, unknown>;
  delete json.password;
  delete json._id;
  delete json.__v;
  return json as unknown as AuthUser;
}

export class AuthService {
  public static async register(input: RegisterInput): Promise<AuthUser> {
    if (isDatabaseConfigured() && !isDatabaseConnected()) {
      throw new DatabaseError(
        'Database service is currently unavailable. Please verify MongoDB Atlas network connectivity.'
      );
    }

    const normalizedEmail = input.email.toLowerCase().trim();

    // Check if user already exists
    const existing = await UserModel.findOne({ email: normalizedEmail }).lean();
    if (existing) {
      throw new BadRequestError('An account with this email address already exists.');
    }

    // Role safety: Public registration must never allow 'admin'
    const assignedRole = input.role === 'host' || input.role === 'guide' ? input.role : 'tourist';

    // Generate unique user identifier
    const uniqueId = `usr-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;

    const user = new UserModel({
      id: uniqueId,
      email: normalizedEmail,
      password: input.password,
      fullName: input.fullName.trim(),
      role: assignedRole,
      status: 'active',
      phone: input.phone?.trim() || undefined,
      bio: input.bio?.trim() || undefined,
    });

    await user.save();
    return toAuthUser(user);
  }

  public static async login(input: LoginInput): Promise<AuthUser> {
    if (isDatabaseConfigured() && !isDatabaseConnected()) {
      throw new DatabaseError(
        'Database service is currently unavailable. Please verify MongoDB Atlas network connectivity.'
      );
    }

    const normalizedEmail = input.email.toLowerCase().trim();

    // Find user and explicitly select password field
    const user = await UserModel.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      // Intentionally generic message to prevent email enumeration
      throw new UnauthorizedError('Invalid email or password.');
    }

    // Check password
    const isPasswordValid = await user.comparePassword(input.password);
    if (!isPasswordValid) {
      // Identical generic error message
      throw new UnauthorizedError('Invalid email or password.');
    }

    if (user.status === 'suspended') {
      throw new UnauthorizedError(
        'Your StayLocal account has been suspended. Please reach out to community support.'
      );
    }

    return toAuthUser(user);
  }

  public static async getCurrentUser(userId: string): Promise<AuthUser> {
    if (isDatabaseConfigured() && !isDatabaseConnected()) {
      throw new DatabaseError(
        'Database service is currently unavailable. Please verify MongoDB Atlas network connectivity.'
      );
    }

    const user = await UserModel.findOne({ id: userId });
    if (!user) {
      throw new UnauthorizedError('User session expired or user no longer exists.');
    }

    if (user.status === 'suspended') {
      throw new UnauthorizedError('Your account has been suspended.');
    }

    return toAuthUser(user);
  }
}
