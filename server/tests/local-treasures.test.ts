import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { AuthService } from '../src/services/auth.service';
import { LocalTreasureModel } from '../src/models/local-treasure.model';
import { BookingModel } from '../src/models/booking.model';
import { StayModel } from '../src/models/stay.model';
import { UserModel } from '../src/models/user.model';
import { signToken, AUTH_COOKIE_NAME } from '../src/utils/token';
import { AuthUser, LocalTreasureRecord } from '../src/types';
import * as dbConfig from '../src/config/db';
import { LOCAL_TREASURES_DATA } from '../src/data/local-treasures.data';

describe('Discover Local Treasures (Artisan & Craft Discovery)', () => {
  const touristUser: AuthUser = {
    id: 'usr_tourist_101',
    fullName: 'Rohan Verma',
    email: 'rohan.tourist@example.com',
    role: 'tourist',
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const adminUser: AuthUser = {
    id: 'usr_admin_101',
    fullName: 'Panchayat Governance Administrator',
    email: 'ankitdwiivedi689@gmail.com',
    role: 'admin',
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const touristToken = signToken({ id: touristUser.id, email: touristUser.email, role: touristUser.role });
  const adminToken = signToken({ id: adminUser.id, email: adminUser.email, role: adminUser.role });

  let inMemoryTreasures: Map<string, LocalTreasureRecord>;

  function createMockDoc(data: any) {
    return {
      ...data,
      save: async function () {
        inMemoryTreasures.set(this.id, { ...this });
        return this;
      },
      toJSON: function () {
        const copy = { ...this };
        delete copy._id;
        delete copy.__v;
        return copy;
      },
    };
  }

  beforeEach(() => {
    vi.restoreAllMocks();

    inMemoryTreasures = new Map();
    // Seed with cloned local treasures data
    LOCAL_TREASURES_DATA.forEach((t) => inMemoryTreasures.set(t.id, { ...t }));

    vi.spyOn(dbConfig, 'isDatabaseConfigured').mockReturnValue(true);
    vi.spyOn(dbConfig, 'isDatabaseConnected').mockReturnValue(true);

    vi.spyOn(AuthService, 'getCurrentUser').mockImplementation(async (id: string) => {
      if (id === touristUser.id) return touristUser;
      if (id === adminUser.id) return adminUser;
      return null;
    });

    vi.spyOn(UserModel, 'findOne').mockImplementation(((query: any) => ({
      lean: async () => {
        if (query?.id === touristUser.id || query?.email === touristUser.email) return touristUser;
        if (query?.id === adminUser.id || query?.email === adminUser.email) return adminUser;
        return null;
      },
    })) as any);

    // Mock LocalTreasureModel methods
    vi.spyOn(LocalTreasureModel, 'find').mockImplementation(((query: any) => {
      let results = Array.from(inMemoryTreasures.values());

      if (query?.verificationStatus) {
        results = results.filter((t) => t.verificationStatus === query.verificationStatus);
      }
      if (query?.isActive !== undefined) {
        results = results.filter((t) => t.isActive === query.isActive);
      }
      if (query?.category) {
        results = results.filter((t) => t.category === query.category);
      }
      if (query?.district) {
        const distRegex = query.district instanceof RegExp ? query.district : query.district.$regex;
        results = results.filter((t) => (distRegex instanceof RegExp ? distRegex.test(t.district) : new RegExp(distRegex, 'i').test(t.district)));
      }
      if (query?.$or && Array.isArray(query.$or)) {
        results = results.filter((t) => {
          return query.$or.some((cond: any) => {
            if (cond.district) {
              const reg = cond.district instanceof RegExp ? cond.district : cond.district.$regex;
              return reg instanceof RegExp ? reg.test(t.district) : new RegExp(reg, 'i').test(t.district);
            }
            if (cond.locality) {
              const reg = cond.locality instanceof RegExp ? cond.locality : cond.locality.$regex;
              return reg instanceof RegExp ? reg.test(t.locality) : new RegExp(reg, 'i').test(t.locality);
            }
            if (cond.village && t.village) {
              const reg = cond.village instanceof RegExp ? cond.village : cond.village.$regex;
              return reg instanceof RegExp ? reg.test(t.village) : new RegExp(reg, 'i').test(t.village);
            }
            if (cond.nearbyClusters && t.nearbyClusters) {
              const reg = cond.nearbyClusters instanceof RegExp ? cond.nearbyClusters : cond.nearbyClusters.$regex;
              return t.nearbyClusters.some((c) => (reg instanceof RegExp ? reg.test(c) : new RegExp(reg, 'i').test(c)));
            }
            return false;
          });
        });
      }

      return {
        sort: () => ({
          lean: async () => results.map((r) => ({ ...r })),
        }),
      } as any;
    }) as any);

    vi.spyOn(LocalTreasureModel, 'findOne').mockImplementation(((query: any) => {
      const id = query?.id;
      const found = id ? inMemoryTreasures.get(id) : null;
      return {
        lean: async () => (found ? { ...found } : null),
        save: async function () {
          if (found) inMemoryTreasures.set(id, found);
          return found;
        },
        ...createMockDoc(found),
      } as any;
    }) as any);

    vi.spyOn(LocalTreasureModel, 'create').mockImplementation((async (payload: any) => {
      inMemoryTreasures.set(payload.id, { ...payload });
      return createMockDoc(payload);
    }) as any);

    vi.spyOn(BookingModel, 'findOne').mockImplementation(((query: any) => ({
      lean: async () => {
        if (query?.id === 'bk-mun-01') {
          return {
            id: 'bk-mun-01',
            stayDistrict: 'Pithoragarh',
            stayLocality: 'Munsiari',
            status: 'confirmed',
          };
        }
        return null;
      },
    })) as any);

    vi.spyOn(StayModel, 'findOne').mockImplementation(((query: any) => ({
      lean: async () => {
        if (query?.id === 'stay-mun-01') {
          return {
            id: 'stay-mun-01',
            district: 'Pithoragarh',
            locality: 'Munsiari',
          };
        }
        return null;
      },
    })) as any);
  });

  describe('1. Location-Based Destination Discovery', () => {
    it('returns verified authentic treasures for a confirmed homestay in Munsiyari / Pithoragarh', async () => {
      const res = await request(app)
        .get('/api/public/treasures/destination')
        .query({ district: 'Pithoragarh', locality: 'Munsiari' })
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${touristToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.treasures).toBeDefined();

      const treasures: LocalTreasureRecord[] = res.body.data.treasures;
      expect(treasures.length).toBeGreaterThan(0);

      // Verify all returned treasures are verified and active
      treasures.forEach((t) => {
        expect(t.verificationStatus).toBe('verified');
        expect(t.isActive).toBe(true);
        expect(t.district.toLowerCase()).toContain('pithoragarh');
      });

      // Verify Darkot shawls and Sarmoli produce are in the list
      const titles = treasures.map((t) => t.title);
      expect(titles.some((t) => t.includes('Darkot'))).toBe(true);
    });

    it('filters treasures by category correctly', async () => {
      const res = await request(app)
        .get('/api/public/treasures/destination')
        .query({ district: 'Pithoragarh', category: 'woollens_textiles' });

      expect(res.status).toBe(200);
      const treasures: LocalTreasureRecord[] = res.body.data.treasures;
      treasures.forEach((t) => {
        expect(t.category).toBe('woollens_textiles');
      });
    });

    it('requires district or locality parameter', async () => {
      const res = await request(app).get('/api/public/treasures/destination');
      expect(res.status).toBe(404);
    });
  });

  describe('2. Data Accuracy & Privacy Safeguards', () => {
    it('never exposes unverified contact details to public tourists', async () => {
      const res = await request(app)
        .get('/api/public/treasures')
        .query({ district: 'Pithoragarh' });

      expect(res.status).toBe(200);
      const treasures: LocalTreasureRecord[] = res.body.data.treasures;

      treasures.forEach((t) => {
        // If contact is not publicly verified, phone and email must not be exposed
        if (t.contact && !t.contact.isPubliclyVerified) {
          expect(t.contact.phone).toBeUndefined();
          expect(t.contact.email).toBeUndefined();
        }
      });
    });

    it('does not return unverified research leads to public tourists', async () => {
      const res = await request(app).get('/api/public/treasures');
      expect(res.status).toBe(200);
      const treasures: LocalTreasureRecord[] = res.body.data.treasures;

      treasures.forEach((t) => {
        expect(t.verificationStatus).toBe('verified');
      });
    });
  });

  describe('3. Admin Moderation & Excel Research Audit', () => {
    it('allows admin to view all research leads with Excel source references', async () => {
      const res = await request(app)
        .get('/api/admin/treasures')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${adminToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const treasures: LocalTreasureRecord[] = res.body.data.treasures;
      expect(treasures.length).toBe(LOCAL_TREASURES_DATA.length);

      // Ensure Excel source references are preserved
      treasures.forEach((t) => {
        expect(t.sourceReference).toBeDefined();
        expect(t.sourceReference.length).toBeGreaterThan(0);
      });
    });

    it('forbids tourists from accessing the admin treasures moderation queue', async () => {
      const res = await request(app)
        .get('/api/admin/treasures')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${touristToken}`]);

      expect(res.status).toBe(403);
    });

    it('allows admin to approve an unverified research lead into a verified master', async () => {
      // Find an unverified lead
      const lead = Array.from(inMemoryTreasures.values()).find((t) => t.verificationStatus === 'unverified_lead');
      expect(lead).toBeDefined();

      const res = await request(app)
        .post(`/api/admin/treasures/${lead!.id}/review`)
        .send({ action: 'approve', notes: 'Field verified by district coordinator' })
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${adminToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.treasure.verificationStatus).toBe('verified');
      expect(res.body.data.treasure.isActive).toBe(true);
    });

    it('allows admin to create a new treasure listing', async () => {
      const newTreasure = {
        title: 'Chaukori Himalayan Handcrafted Pinecone Crafts',
        craftName: 'Natural Pinecone & Wood Crafts',
        category: 'handicrafts_carvings',
        artisanOrShopName: 'Berinag Pine Forest Artisan Guild',
        artisanType: 'artisan_collective',
        district: 'Pithoragarh',
        locality: 'Chaukori',
        description: 'Sustainable crafts made from naturally fallen high-altitude pinecones.',
        culturalSignificance: 'Deep-rooted Kumaoni forest preservation tradition.',
        productionProcess: 'Hand-collected, solar dried, and treated with natural beeswax.',
        sourceReference: 'StayLocal_Pithoragarh_Other_Regions_Research.xlsx',
        verificationStatus: 'verified',
        isActive: true,
      };

      const res = await request(app)
        .post('/api/admin/treasures')
        .send(newTreasure)
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${adminToken}`]);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.treasure.id).toBeDefined();
      expect(res.body.data.treasure.title).toBe(newTreasure.title);
    });
  });
});
