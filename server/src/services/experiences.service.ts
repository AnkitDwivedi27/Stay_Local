import { EXPERIENCES_DATA } from '../data/experiences.data';
import { ExperienceModel } from '../models/experience.model';
import { ExperienceCategory, ExperienceRecord } from '../types';
import { NotFoundError, DatabaseError } from '../utils/errors';
import { isDatabaseConfigured, isDatabaseConnected } from '../config/db';

export interface ExperiencesFilterOptions {
  category?: ExperienceCategory;
  destinationId?: string;
  district?: string;
}

export class ExperiencesService {
  public static async getAll(filters: ExperiencesFilterOptions = {}): Promise<ExperienceRecord[]> {
    if (isDatabaseConfigured()) {
      if (!isDatabaseConnected()) {
        throw new DatabaseError(
          'Database service is currently unavailable. Please verify MongoDB Atlas network connectivity and IP access rules.'
        );
      }

      try {
        const query: Record<string, unknown> = {};

        if (filters.category) {
          query.category = filters.category;
        }

        if (filters.destinationId) {
          query.destinationId = filters.destinationId.toLowerCase();
        }

        if (filters.district) {
          query.district = { $regex: filters.district, $options: 'i' };
        }

        const docs = await ExperienceModel.find(query).sort({ title: 1 }).lean();
        return docs.map((doc) => {
          const record = { ...doc } as Record<string, unknown>;
          delete record._id;
          delete record.__v;
          return record as unknown as ExperienceRecord;
        });
      } catch (err) {
        if (err instanceof DatabaseError) throw err;
        throw new DatabaseError('Failed to query experiences from database', err);
      }
    }

    // Explicit offline research dataset fallback mode when unconfigured
    let result = [...EXPERIENCES_DATA];

    if (filters.category) {
      result = result.filter((e) => e.category === filters.category);
    }

    if (filters.destinationId) {
      const destId = filters.destinationId.toLowerCase();
      result = result.filter((e) => e.destinationId.toLowerCase() === destId);
    }

    if (filters.district) {
      const dist = filters.district.toLowerCase();
      result = result.filter((e) => e.district.toLowerCase().includes(dist));
    }

    return result;
  }

  public static async getById(id: string): Promise<ExperienceRecord> {
    if (isDatabaseConfigured()) {
      if (!isDatabaseConnected()) {
        throw new DatabaseError(
          'Database service is currently unavailable. Please verify MongoDB Atlas network connectivity and IP access rules.'
        );
      }

      try {
        const doc = await ExperienceModel.findOne({ id: id.toLowerCase() }).lean();
        if (!doc) {
          throw new NotFoundError(`Experience with ID '${id}' was not found.`);
        }
        const record = { ...doc } as Record<string, unknown>;
        delete record._id;
        delete record.__v;
        return record as unknown as ExperienceRecord;
      } catch (err) {
        if (err instanceof NotFoundError || err instanceof DatabaseError) throw err;
        throw new DatabaseError(`Failed to fetch experience '${id}' from database`, err);
      }
    }

    const experience = EXPERIENCES_DATA.find((e) => e.id.toLowerCase() === id.toLowerCase());
    if (!experience) {
      throw new NotFoundError(`Experience with ID '${id}' was not found.`);
    }
    return experience;
  }
}
