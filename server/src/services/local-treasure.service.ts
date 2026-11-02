import { LocalTreasureModel, LocalTreasureDoc } from '../models/local-treasure.model';
import { LOCAL_TREASURES_DATA } from '../data/local-treasures.data';
import {
  LocalTreasureRecord,
  CreateTreasurePayload,
  UpdateTreasurePayload,
  ReviewTreasurePayload,
  TreasureCategory,
  TreasureVerificationStatus,
} from '../types';
import { NotFoundError, BadRequestError, DatabaseError } from '../utils/errors';
import { isDatabaseConfigured, isDatabaseConnected } from '../config/db';

export interface DestinationTreasuresFilter {
  district?: string;
  locality?: string;
  category?: TreasureCategory;
}

export interface PublicTreasuresFilter {
  search?: string;
  district?: string;
  locality?: string;
  category?: TreasureCategory;
}

export interface AdminTreasuresFilter {
  search?: string;
  district?: string;
  category?: TreasureCategory;
  verificationStatus?: TreasureVerificationStatus;
  isActive?: boolean;
}

/**
 * Sanitizes contact details for public/tourist view.
 * Ensures unverified phone numbers or email leads are NEVER exposed to public tourists.
 */
function sanitizeTreasureForPublic(record: LocalTreasureRecord): LocalTreasureRecord {
  const sanitized = { ...record };
  if (sanitized.contact) {
    if (!sanitized.contact.isPubliclyVerified) {
      sanitized.contact = {
        contactPerson: sanitized.contact.contactPerson,
        isPubliclyVerified: false,
      };
    }
  }
  return sanitized;
}

function toTreasureRecord(doc: LocalTreasureDoc | Record<string, unknown>): LocalTreasureRecord {
  const maybe = doc as { toJSON?: () => unknown };
  const raw = typeof maybe.toJSON === 'function' ? maybe.toJSON() : doc;
  const json = JSON.parse(JSON.stringify(raw)) as Record<string, unknown>;
  delete json._id;
  delete json.__v;
  return json as unknown as LocalTreasureRecord;
}

export class LocalTreasureService {
  /**
   * Seeds default spreadsheet-sourced local treasures into MongoDB Atlas if the collection is empty.
   */
  public static async seedInitialTreasuresIfEmpty(): Promise<number> {
    if (!isDatabaseConfigured() || !isDatabaseConnected()) {
      return 0;
    }

    try {
      const count = await LocalTreasureModel.countDocuments();
      if (count === 0) {
        console.log(`[Seed] Initializing LocalTreasure collection with ${LOCAL_TREASURES_DATA.length} spreadsheet records...`);
        await LocalTreasureModel.insertMany(LOCAL_TREASURES_DATA);
        console.log(`[Seed] Successfully seeded ${LOCAL_TREASURES_DATA.length} local treasures into MongoDB.`);
        return LOCAL_TREASURES_DATA.length;
      }
      return 0;
    } catch (err) {
      console.warn('[Seed] Note: Could not auto-seed local treasures:', err);
      return 0;
    }
  }

  /**
   * Location-based discovery for confirmed homestay bookings.
   * Matches by district, locality, or nearby craft clusters.
   * Returns only verified and active artisan/craft treasures.
   */
  public static async getTreasuresForDestination(
    filter: DestinationTreasuresFilter
  ): Promise<LocalTreasureRecord[]> {
    const { district, locality, category } = filter;

    if (isDatabaseConfigured() && isDatabaseConnected()) {
      try {
        const query: Record<string, unknown> = {
          verificationStatus: 'verified',
          isActive: true,
        };

        if (category) {
          query.category = category;
        }

        const conditions: Record<string, unknown>[] = [];

        if (district) {
          conditions.push({ district: { $regex: new RegExp(`^${district.trim()}$`, 'i') } });
        }

        if (locality) {
          const locRegex = { $regex: locality.trim(), $options: 'i' };
          conditions.push(
            { locality: locRegex },
            { village: locRegex },
            { nearbyClusters: locRegex }
          );
        }

        if (conditions.length > 0) {
          query.$or = conditions;
        }

        const docs = await LocalTreasureModel.find(query).sort({ district: 1, locality: 1 }).lean();
        return docs.map(toTreasureRecord).map(sanitizeTreasureForPublic);
      } catch (err) {
        if (err instanceof DatabaseError) throw err;
        throw new DatabaseError('Failed to query local treasures for destination', err);
      }
    }

    // In-memory fallback (when database unconfigured or testing)
    let records = LOCAL_TREASURES_DATA.filter(
      (t) => t.verificationStatus === 'verified' && t.isActive
    );

    if (category) {
      records = records.filter((t) => t.category === category);
    }

    if (district || locality) {
      records = records.filter((t) => {
        const matchesDistrict = district
          ? t.district.toLowerCase() === district.trim().toLowerCase()
          : false;

        const loc = locality?.trim().toLowerCase();
        const matchesLocality = loc
          ? t.locality.toLowerCase().includes(loc) ||
            (t.village && t.village.toLowerCase().includes(loc)) ||
            t.nearbyClusters.some((c) => c.toLowerCase().includes(loc))
          : false;

        return matchesDistrict || matchesLocality;
      });
    }

    return records.map(sanitizeTreasureForPublic);
  }

  /**
   * Public discovery catalog for browsing authentic local treasures.
   */
  public static async getPublicTreasures(
    filter: PublicTreasuresFilter = {}
  ): Promise<LocalTreasureRecord[]> {
    const { search, district, locality, category } = filter;

    if (isDatabaseConfigured() && isDatabaseConnected()) {
      try {
        const query: Record<string, unknown> = {
          verificationStatus: 'verified',
          isActive: true,
        };

        if (category) {
          query.category = category;
        }

        if (district) {
          query.district = { $regex: new RegExp(district.trim(), 'i') };
        }

        if (locality) {
          query.$or = [
            { locality: { $regex: locality.trim(), $options: 'i' } },
            { village: { $regex: locality.trim(), $options: 'i' } },
            { nearbyClusters: { $regex: locality.trim(), $options: 'i' } },
          ];
        }

        if (search) {
          const s = search.trim();
          const searchRegex = { $regex: s, $options: 'i' };
          query.$or = [
            { title: searchRegex },
            { craftName: searchRegex },
            { artisanOrShopName: searchRegex },
            { description: searchRegex },
            { locality: searchRegex },
            { village: searchRegex },
            { culturalSignificance: searchRegex },
          ];
        }

        const docs = await LocalTreasureModel.find(query).sort({ updatedAt: -1 }).lean();
        return docs.map(toTreasureRecord).map(sanitizeTreasureForPublic);
      } catch (err) {
        if (err instanceof DatabaseError) throw err;
        throw new DatabaseError('Failed to query public treasures', err);
      }
    }

    // In-memory fallback
    let records = LOCAL_TREASURES_DATA.filter(
      (t) => t.verificationStatus === 'verified' && t.isActive
    );

    if (category) {
      records = records.filter((t) => t.category === category);
    }

    if (district) {
      records = records.filter((t) =>
        t.district.toLowerCase().includes(district.trim().toLowerCase())
      );
    }

    if (locality) {
      const loc = locality.trim().toLowerCase();
      records = records.filter(
        (t) =>
          t.locality.toLowerCase().includes(loc) ||
          (t.village && t.village.toLowerCase().includes(loc)) ||
          t.nearbyClusters.some((c) => c.toLowerCase().includes(loc))
      );
    }

    if (search) {
      const s = search.trim().toLowerCase();
      records = records.filter(
        (t) =>
          t.title.toLowerCase().includes(s) ||
          t.craftName.toLowerCase().includes(s) ||
          t.artisanOrShopName.toLowerCase().includes(s) ||
          t.description.toLowerCase().includes(s) ||
          t.locality.toLowerCase().includes(s) ||
          (t.village && t.village.toLowerCase().includes(s))
      );
    }

    return records.map(sanitizeTreasureForPublic);
  }

  /**
   * Retrieves single treasure detail by id.
   */
  public static async getTreasureById(
    id: string,
    isAdmin = false
  ): Promise<LocalTreasureRecord> {
    if (isDatabaseConfigured() && isDatabaseConnected()) {
      const doc = await LocalTreasureModel.findOne({ id }).lean();
      if (!doc) {
        throw new NotFoundError(`Local treasure not found with id ${id}`);
      }

      const record = toTreasureRecord(doc);
      if (!isAdmin && (record.verificationStatus !== 'verified' || !record.isActive)) {
        throw new NotFoundError(`Local treasure not found or not published.`);
      }

      return isAdmin ? record : sanitizeTreasureForPublic(record);
    }

    // In-memory fallback
    const record = LOCAL_TREASURES_DATA.find((t) => t.id === id);
    if (!record) {
      throw new NotFoundError(`Local treasure not found with id ${id}`);
    }

    if (!isAdmin && (record.verificationStatus !== 'verified' || !record.isActive)) {
      throw new NotFoundError(`Local treasure not found or not published.`);
    }

    return isAdmin ? record : sanitizeTreasureForPublic(record);
  }

  // ==========================================
  // Admin Operations
  // ==========================================

  /**
   * Admin view of all treasures with research references and unverified leads.
   */
  public static async getAllTreasuresForAdmin(
    filter: AdminTreasuresFilter = {}
  ): Promise<LocalTreasureRecord[]> {
    const { search, district, category, verificationStatus, isActive } = filter;

    if (isDatabaseConfigured() && isDatabaseConnected()) {
      const query: Record<string, unknown> = {};

      if (category) {
        query.category = category;
      }

      if (district) {
        query.district = { $regex: new RegExp(district.trim(), 'i') };
      }

      if (verificationStatus) {
        query.verificationStatus = verificationStatus;
      }

      if (isActive !== undefined) {
        query.isActive = isActive;
      }

      if (search) {
        const s = search.trim();
        const searchRegex = { $regex: s, $options: 'i' };
        query.$or = [
          { title: searchRegex },
          { craftName: searchRegex },
          { artisanOrShopName: searchRegex },
          { locality: searchRegex },
          { sourceReference: searchRegex },
          { researchNotes: searchRegex },
        ];
      }

      const docs = await LocalTreasureModel.find(query).sort({ updatedAt: -1 }).lean();
      return docs.map(toTreasureRecord);
    }

    // In-memory fallback
    let records = [...LOCAL_TREASURES_DATA];

    if (category) {
      records = records.filter((t) => t.category === category);
    }

    if (district) {
      records = records.filter((t) =>
        t.district.toLowerCase().includes(district.trim().toLowerCase())
      );
    }

    if (verificationStatus) {
      records = records.filter((t) => t.verificationStatus === verificationStatus);
    }

    if (isActive !== undefined) {
      records = records.filter((t) => t.isActive === isActive);
    }

    if (search) {
      const s = search.trim().toLowerCase();
      records = records.filter(
        (t) =>
          t.title.toLowerCase().includes(s) ||
          t.craftName.toLowerCase().includes(s) ||
          t.artisanOrShopName.toLowerCase().includes(s) ||
          t.locality.toLowerCase().includes(s) ||
          t.sourceReference.toLowerCase().includes(s) ||
          (t.researchNotes && t.researchNotes.toLowerCase().includes(s))
      );
    }

    return records;
  }

  /**
   * Creates a new artisan or treasure listing (admin or verified curator).
   */
  public static async createTreasure(
    payload: CreateTreasurePayload
  ): Promise<LocalTreasureRecord> {
    const id = `trs-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();

    const record: LocalTreasureRecord = {
      id,
      title: payload.title,
      craftName: payload.craftName,
      category: payload.category,
      artisanOrShopName: payload.artisanOrShopName,
      artisanType: payload.artisanType || 'individual_artisan',
      district: payload.district,
      locality: payload.locality,
      village: payload.village,
      address: payload.address,
      coordinates: payload.coordinates,
      description: payload.description,
      culturalSignificance: payload.culturalSignificance,
      productionProcess: payload.productionProcess,
      visitingInfo: payload.visitingInfo,
      contact: payload.contact,
      locationLink: payload.locationLink,
      images: payload.images || [],
      verificationStatus: payload.verificationStatus || 'unverified_lead',
      verificationNotes: payload.verificationNotes,
      sourceReference: payload.sourceReference,
      researchNotes: payload.researchNotes,
      nearbyClusters: payload.nearbyClusters || [],
      isActive: payload.isActive !== undefined ? payload.isActive : true,
      createdAt: now,
      updatedAt: now,
    };

    if (isDatabaseConfigured() && isDatabaseConnected()) {
      const doc = await LocalTreasureModel.create(record);
      return toTreasureRecord(doc);
    }

    LOCAL_TREASURES_DATA.push(record);
    return record;
  }

  /**
   * Updates an existing artisan or treasure listing.
   */
  public static async updateTreasure(
    id: string,
    payload: UpdateTreasurePayload
  ): Promise<LocalTreasureRecord> {
    if (isDatabaseConfigured() && isDatabaseConnected()) {
      const existing = await LocalTreasureModel.findOne({ id });
      if (!existing) {
        throw new NotFoundError(`Local treasure not found with id ${id}`);
      }

      Object.assign(existing, payload);
      await existing.save();
      return toTreasureRecord(existing);
    }

    const index = LOCAL_TREASURES_DATA.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new NotFoundError(`Local treasure not found with id ${id}`);
    }

    const original = LOCAL_TREASURES_DATA[index];
    if (!original) {
      throw new NotFoundError(`Local treasure not found with id ${id}`);
    }

    const updated: LocalTreasureRecord = {
      id: original.id,
      title: payload.title ?? original.title,
      craftName: payload.craftName ?? original.craftName,
      category: payload.category ?? original.category,
      artisanOrShopName: payload.artisanOrShopName ?? original.artisanOrShopName,
      artisanType: payload.artisanType ?? original.artisanType,
      district: payload.district ?? original.district,
      locality: payload.locality ?? original.locality,
      village: payload.village !== undefined ? payload.village : original.village,
      address: payload.address !== undefined ? payload.address : original.address,
      coordinates: payload.coordinates !== undefined ? payload.coordinates : original.coordinates,
      description: payload.description ?? original.description,
      culturalSignificance: payload.culturalSignificance ?? original.culturalSignificance,
      productionProcess: payload.productionProcess ?? original.productionProcess,
      visitingInfo: payload.visitingInfo !== undefined ? payload.visitingInfo : original.visitingInfo,
      contact: payload.contact !== undefined ? payload.contact : original.contact,
      locationLink: payload.locationLink !== undefined ? payload.locationLink : original.locationLink,
      images: payload.images ?? original.images,
      verificationStatus: payload.verificationStatus ?? original.verificationStatus,
      verificationNotes: payload.verificationNotes !== undefined ? payload.verificationNotes : original.verificationNotes,
      sourceReference: payload.sourceReference ?? original.sourceReference,
      researchNotes: payload.researchNotes !== undefined ? payload.researchNotes : original.researchNotes,
      nearbyClusters: payload.nearbyClusters ?? original.nearbyClusters,
      isActive: payload.isActive !== undefined ? payload.isActive : original.isActive,
      createdAt: original.createdAt,
      updatedAt: new Date().toISOString(),
    };
    LOCAL_TREASURES_DATA[index] = updated;
    return updated;
  }

  /**
   * Admin approves, rejects, deactivates, or activates a treasure entry.
   */
  public static async reviewTreasure(
    id: string,
    payload: ReviewTreasurePayload
  ): Promise<LocalTreasureRecord> {
    const { action, notes } = payload;

    const updates: Partial<LocalTreasureRecord> = {
      verificationNotes: notes || undefined,
    };

    switch (action) {
      case 'approve':
        updates.verificationStatus = 'verified';
        updates.isActive = true;
        break;
      case 'reject':
        updates.verificationStatus = 'draft';
        break;
      case 'deactivate':
        updates.isActive = false;
        break;
      case 'activate':
        updates.isActive = true;
        break;
      default:
        throw new BadRequestError(`Invalid action: ${action}`);
    }

    return this.updateTreasure(id, updates);
  }
}
