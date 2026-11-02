import { Schema, model, Model, HydratedDocument } from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRecord } from '../types';

export interface UserDoc extends Omit<UserRecord, 'createdAt' | 'updatedAt'> {
  password?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserMethods {
  comparePassword(candidate: string): Promise<boolean>;
}

export type UserDocument = HydratedDocument<UserDoc, UserMethods>;
export type UserModelType = Model<UserDoc, Record<string, never>, UserMethods>;

const UserSchema = new Schema<UserDoc, UserModelType, UserMethods>(
  {
    id: {
      type: String,
      required: [true, 'User ID is required'],
      unique: true,
      trim: true,
      index: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Do not return password by default in queries
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters'],
      maxlength: [100, 'Full name cannot exceed 100 characters'],
    },
    role: {
      type: String,
      enum: {
        values: ['tourist', 'host', 'guide', 'admin'],
        message: 'Invalid user role',
      },
      default: 'tourist',
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'suspended', 'pending'],
        message: 'Invalid user status',
      },
      default: 'active',
      index: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
    },
    avatarUrl: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        const record = ret as Record<string, unknown>;
        delete record._id;
        delete record.__v;
        delete record.password;
        return record;
      },
    },
  }
);

// Hash password before saving if modified
UserSchema.pre<UserDocument>('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err as Error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

export const UserModel: UserModelType = model<UserDoc, UserModelType>('User', UserSchema);
