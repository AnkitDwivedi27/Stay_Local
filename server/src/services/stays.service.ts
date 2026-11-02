import { ACCOMMODATIONS_DATA } from '../data/accommodations.data';
import { StayModel } from '../models/stay.model';
import { AccommodationCategory, AccommodationRecord, VerificationStatus } from '../types';
import { NotFoundError, DatabaseError } from '../utils/errors';
import { isDatabaseConfigured, isDatabaseConnected } from '../config/db';

export interface StaysFilterOptions {
  destination?: string;
  district?: string;
  category?: AccommodationCategory;
  verificationStatus?: VerificationStatus;
  minGuests?: number;
}

export class StaysService {
  public static async getAll(filters: StaysFilterOptions = {}): Promise<AccommodationRecord[]> {
    if (isDatabaseConfigured()) {
      if (!isDatabaseConnected()) {
        throw new DatabaseError(
          'Database service is currently unavailable. Please verify MongoDB Atlas network connectivity and IP access rules.'
        );
      }

      try {
        const query: Record<string, unknown> = {};

        if (filters.district) {
          query.district = { $regex: filters.district, $options: 'i' };
        }

        if (filters.destination) {
          const dest = filters.destination.trim();
          query.$or = [
            { locality: { $regex: dest, $options: 'i' } },
            { address: { $regex: dest, $options: 'i' } },
            { district: { $regex: dest, $options: 'i' } },
          ];
        }

        if (filters.category) {
          query.category = filters.category;
        }

        if (filters.verificationStatus) {
          query.verificationStatus = filters.verificationStatus;
        }

        if (filters.minGuests !== undefined) {
          query['guestCapacity.maxGuests'] = { $gte: filters.minGuests };
        }

        const docs = await StayModel.find(query).sort({ createdAt: -1 }).lean();
        return docs.map((doc) => {
          const record = { ...doc } as Record<string, unknown>;
          delete record._id;
          delete record.__v;
          return record as unknown as AccommodationRecord;
        });
      } catch (err) {
        if (err instanceof DatabaseError) throw err;
        throw new DatabaseError('Failed to query accommodations from database', err);
      }
    }

    // Explicit offline research dataset fallback mode when unconfigured
    let result = [...ACCOMMODATIONS_DATA];

    if (filters.district) {
      const dist = filters.district.toLowerCase();
      result = result.filter((s) => s.district.toLowerCase().includes(dist));
    }

    if (filters.destination) {
      const dest = filters.destination.toLowerCase();
      result = result.filter(
        (s) =>
          s.locality.toLowerCase().includes(dest) ||
          s.address.toLowerCase().includes(dest) ||
          s.district.toLowerCase().includes(dest)
      );
    }

    if (filters.category) {
      result = result.filter((s) => s.category === filters.category);
    }

    if (filters.verificationStatus) {
      result = result.filter((s) => s.verificationStatus === filters.verificationStatus);
    }

    if (filters.minGuests !== undefined) {
      const min = filters.minGuests;
      result = result.filter((s) => (s.guestCapacity?.maxGuests ?? 0) >= min);
    }

    return result;
  }

  public static async getById(id: string): Promise<AccommodationRecord> {
    if (isDatabaseConfigured()) {
      if (!isDatabaseConnected()) {
        throw new DatabaseError(
          'Database service is currently unavailable. Please verify MongoDB Atlas network connectivity and IP access rules.'
        );
      }

      try {
        const doc = await StayModel.findOne({ id: id.toLowerCase() }).lean();
        if (!doc) {
          throw new NotFoundError(`Accommodation with ID '${id}' was not found.`);
        }
        const record = { ...doc } as Record<string, unknown>;
        delete record._id;
        delete record.__v;
        return record as unknown as AccommodationRecord;
      } catch (err) {
        if (err instanceof NotFoundError || err instanceof DatabaseError) throw err;
        throw new DatabaseError(`Failed to fetch accommodation '${id}' from database`, err);
      }
    }

    const stay = ACCOMMODATIONS_DATA.find((s) => s.id.toLowerCase() === id.toLowerCase());
    if (!stay) {
      throw new NotFoundError(`Accommodation with ID '${id}' was not found.`);
    }
    return stay;
  }
}
