import { DESTINATIONS_DATA } from '../data/destinations.data';
import { DestinationModel } from '../models/destination.model';
import { DestinationRecord } from '../types';
import { NotFoundError, DatabaseError } from '../utils/errors';
import { isDatabaseConfigured, isDatabaseConnected } from '../config/db';

export interface DestinationFilterOptions {
  search?: string;
  district?: string;
  division?: 'Kumaon' | 'Garhwal';
}

export class DestinationsService {
  public static async getAll(filters: DestinationFilterOptions = {}): Promise<DestinationRecord[]> {
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

        if (filters.division) {
          query.division = filters.division;
        }

        if (filters.search) {
          const s = filters.search.trim();
          query.$or = [
            { name: { $regex: s, $options: 'i' } },
            { district: { $regex: s, $options: 'i' } },
            { tagline: { $regex: s, $options: 'i' } },
            { knownLocalities: { $regex: s, $options: 'i' } },
            { characterTags: { $regex: s, $options: 'i' } },
          ];
        }

        const docs = await DestinationModel.find(query).sort({ name: 1 }).lean();
        return docs.map((doc) => {
          const record = { ...doc } as Record<string, unknown>;
          delete record._id;
          delete record.__v;
          return record as unknown as DestinationRecord;
        });
      } catch (err) {
        if (err instanceof DatabaseError) throw err;
        throw new DatabaseError('Failed to query destinations from database', err);
      }
    }

    // Explicit offline research dataset fallback mode when unconfigured
    let result = [...DESTINATIONS_DATA];

    if (filters.district) {
      const dist = filters.district.toLowerCase();
      result = result.filter((d) => d.district.toLowerCase().includes(dist));
    }

    if (filters.division) {
      result = result.filter((d) => d.division === filters.division);
    }

    if (filters.search) {
      const query = filters.search.toLowerCase().trim();
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(query) ||
          d.district.toLowerCase().includes(query) ||
          d.tagline.toLowerCase().includes(query) ||
          d.knownLocalities.some((loc) => loc.toLowerCase().includes(query)) ||
          d.characterTags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    return result;
  }

  public static async getById(id: string): Promise<DestinationRecord> {
    if (isDatabaseConfigured()) {
      if (!isDatabaseConnected()) {
        throw new DatabaseError(
          'Database service is currently unavailable. Please verify MongoDB Atlas network connectivity and IP access rules.'
        );
      }

      try {
        const doc = await DestinationModel.findOne({ id: id.toLowerCase() }).lean();
        if (!doc) {
          throw new NotFoundError(`Destination with ID '${id}' was not found.`);
        }
        const record = { ...doc } as Record<string, unknown>;
        delete record._id;
        delete record.__v;
        return record as unknown as DestinationRecord;
      } catch (err) {
        if (err instanceof NotFoundError || err instanceof DatabaseError) throw err;
        throw new DatabaseError(`Failed to fetch destination '${id}' from database`, err);
      }
    }

    const destination = DESTINATIONS_DATA.find((d) => d.id.toLowerCase() === id.toLowerCase());
    if (!destination) {
      throw new NotFoundError(`Destination with ID '${id}' was not found.`);
    }
    return destination;
  }
}
