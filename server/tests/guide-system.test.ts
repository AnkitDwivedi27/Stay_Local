import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { AuthService } from '../src/services/auth.service';
import { GuideProfileModel } from '../src/models/guide-profile.model';
import { GuideExperienceModel } from '../src/models/guide-experience.model';
import { GuideBookingModel } from '../src/models/guide-booking.model';
import { BookingModel } from '../src/models/booking.model';
import { UserModel } from '../src/models/user.model';
import { signToken, AUTH_COOKIE_NAME } from '../src/utils/token';
import { AuthUser } from '../src/types';
import * as dbConfig from '../src/config/db';

describe('StayLocal Guide Discovery & Booking System', () => {
  // Test Users
  const guideUser: AuthUser = {
    id: 'usr_guide_101',
    fullName: 'Harish Chandra Joshi',
    email: 'harish.guide@munsiari.org',
    role: 'guide',
    status: 'active',
    phone: '+91 94120 12345',
    bio: 'Panchachuli basecamp trekker and alpine herbalist.',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const otherGuideUser: AuthUser = {
    id: 'usr_guide_102',
    fullName: 'Kamla Devi',
    email: 'kamla.guide@sarmoli.org',
    role: 'guide',
    status: 'active',
    phone: '+91 94120 67890',
    bio: 'Birdwatching and Kumaoni folklore specialist.',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const touristUser: AuthUser = {
    id: 'usr_tourist_201',
    fullName: 'Aditi Sharma',
    email: 'aditi@traveler.org',
    role: 'tourist',
    status: 'active',
    phone: '+91 98765 11223',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const otherTouristUser: AuthUser = {
    id: 'usr_tourist_202',
    fullName: 'Vikram Mehta',
    email: 'vikram@traveler.org',
    role: 'tourist',
    status: 'active',
    phone: '+91 98765 43210',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const adminUser: AuthUser = {
    id: 'usr_admin_901',
    fullName: 'Panchayat Governance Administrator',
    email: 'admin@staylocal.org',
    role: 'admin',
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const guideToken = signToken({ id: guideUser.id, email: guideUser.email, role: guideUser.role });
  const otherGuideToken = signToken({ id: otherGuideUser.id, email: otherGuideUser.email, role: otherGuideUser.role });
  const touristToken = signToken({ id: touristUser.id, email: touristUser.email, role: touristUser.role });
  const otherTouristToken = signToken({ id: otherTouristUser.id, email: otherTouristUser.email, role: otherTouristUser.role });
  const adminToken = signToken({ id: adminUser.id, email: adminUser.email, role: adminUser.role });

  let inMemoryProfiles: Map<string, any>;
  let inMemoryExperiences: Map<string, any>;
  let inMemoryGuideBookings: Map<string, any>;
  let inMemoryHomestayBookings: Map<string, any>;

  function createMockMongooseDoc(data: any, store: Map<string, any>) {
    const doc = {
      ...data,
      save: async function () {
        store.set(this.id, { ...this });
        return this;
      },
      toJSON: function () {
        const copy = { ...this };
        delete copy._id;
        delete copy.__v;
        return copy;
      },
    };
    return doc;
  }

  function seedVerifiedGuideAndExperience() {
    const profile = {
      id: 'gprof_101',
      userId: guideUser.id,
      fullName: guideUser.fullName,
      email: guideUser.email,
      bio: 'Panchachuli basecamp trekker and alpine herbalist.',
      experienceYears: 8,
      languages: ['Hindi', 'English', 'Kumaoni'],
      specialties: ['Trekking & Hiking', 'Birdwatching'],
      serviceLocations: [
        { district: 'Pithoragarh', locality: 'Munsiari', village: 'Sarmoli' },
        { district: 'Pithoragarh', locality: 'Munsiari', village: 'Darkot' },
      ],
      documents: [],
      verificationStatus: 'verified',
      isActive: true,
    };
    inMemoryProfiles.set(profile.id, profile);

    const experience = {
      id: 'gexp_101',
      guideId: guideUser.id,
      guideName: guideUser.fullName,
      title: 'Khaliya Top Snow Ridge Trek',
      description: 'Guided day-hike to Khaliya Top (3,500m) with 360-degree panorama of Panchachuli.',
      category: 'Trekking & Hiking',
      district: 'Pithoragarh',
      locality: 'Munsiari',
      meetingPoint: 'KMVN Tourist Rest House, Munsiari',
      duration: '6 to 7 hours',
      price: 2000,
      pricingType: 'per_person',
      maxGroupSize: 8,
      status: 'published',
      availableSlots: [
        { date: '2026-11-15', timeSlots: ['07:00 AM'] },
        { date: '2026-11-16', timeSlots: ['07:00 AM'] },
      ],
    };
    inMemoryExperiences.set(experience.id, experience);
    return { profile, experience };
  }

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(dbConfig, 'isDatabaseConnected').mockReturnValue(true);

    inMemoryProfiles = new Map();
    inMemoryExperiences = new Map();
    inMemoryGuideBookings = new Map();
    inMemoryHomestayBookings = new Map();

    // Mock AuthService.getCurrentUser for authentication
    vi.spyOn(AuthService, 'getCurrentUser').mockImplementation(async (userId: string) => {
      if (userId === guideUser.id) return guideUser;
      if (userId === otherGuideUser.id) return otherGuideUser;
      if (userId === touristUser.id) return touristUser;
      if (userId === otherTouristUser.id) return otherTouristUser;
      if (userId === adminUser.id) return adminUser;
      throw new Error('User not found');
    });

    // Mock UserModel queries
    vi.spyOn(UserModel, 'findOne').mockImplementation((filter: any) => {
      const users = [guideUser, otherGuideUser, touristUser, otherTouristUser, adminUser];
      const match = users.find((u) => u.id === filter.id);
      return {
        lean: vi.fn().mockResolvedValue(match || null),
        then: (resolve: any) => Promise.resolve(match ? { ...match } : null).then(resolve),
      } as any;
    });

    // Mock GuideProfileModel
    vi.spyOn(GuideProfileModel.prototype, 'save').mockImplementation(async function (this: any) {
      const rec = {
        ...(this.toObject ? this.toObject() : this),
        toJSON() {
          const res = { ...this };
          delete res._id;
          delete res.__v;
          return res;
        },
      };
      inMemoryProfiles.set(rec.id, rec);
      return rec;
    });

    vi.spyOn(GuideProfileModel, 'findOne').mockImplementation((filter: any) => {
      const all = Array.from(inMemoryProfiles.values());
      const match = all.find((p) => {
        if (filter.$or) {
          const orMatch = filter.$or.some((clause: any) => {
            if (clause.id && p.id === clause.id) return true;
            if (clause.userId && p.userId === clause.userId) return true;
            return false;
          });
          if (!orMatch) return false;
        }
        if (filter.id && p.id !== filter.id) return false;
        if (filter.userId && p.userId !== filter.userId) return false;
        if (filter.verificationStatus && p.verificationStatus !== filter.verificationStatus) return false;
        if (filter.isActive !== undefined && p.isActive !== filter.isActive) return false;
        return true;
      });

      const queryObj: any = {
        select: vi.fn().mockImplementation(() => queryObj),
        lean: vi.fn().mockResolvedValue(match ? { ...match } : null),
        then: (resolve: any) => Promise.resolve(match ? createMockMongooseDoc(match, inMemoryProfiles) : null).then(resolve),
      };
      return queryObj;
    });

    vi.spyOn(GuideProfileModel, 'find').mockImplementation((filter: any) => {
      let all = Array.from(inMemoryProfiles.values());
      if (filter?.verificationStatus) {
        all = all.filter((p) => p.verificationStatus === filter.verificationStatus);
      }
      if (filter?.isActive !== undefined) {
        all = all.filter((p) => p.isActive === filter.isActive);
      }
      if (filter?.['serviceLocations.district']) {
        const dist = filter['serviceLocations.district'];
        all = all.filter((p) =>
          p.serviceLocations?.some((loc: any) =>
            dist instanceof RegExp ? dist.test(loc.district) : loc.district.toLowerCase() === String(dist).toLowerCase()
          )
        );
      }

      const queryObj: any = {
        select: vi.fn().mockImplementation(() => queryObj),
        sort: vi.fn().mockImplementation(() => queryObj),
        limit: vi.fn().mockImplementation(() => queryObj),
        lean: vi.fn().mockResolvedValue(all),
        then: (resolve: any) => Promise.resolve(all).then(resolve),
      };
      return queryObj;
    });

    // Mock GuideExperienceModel
    vi.spyOn(GuideExperienceModel.prototype, 'save').mockImplementation(async function (this: any) {
      const rec = {
        ...(this.toObject ? this.toObject() : this),
        toJSON() {
          const res = { ...this };
          delete res._id;
          delete res.__v;
          return res;
        },
      };
      inMemoryExperiences.set(rec.id, rec);
      return rec;
    });

    vi.spyOn(GuideExperienceModel, 'findOne').mockImplementation((filter: any) => {
      const all = Array.from(inMemoryExperiences.values());
      const match = all.find((e) => {
        if (filter.id && e.id !== filter.id) return false;
        if (filter.guideId && e.guideId !== filter.guideId) return false;
        if (filter.status && e.status !== filter.status) return false;
        return true;
      });

      const queryObj: any = {
        lean: vi.fn().mockResolvedValue(match ? { ...match } : null),
        then: (resolve: any) => Promise.resolve(match ? createMockMongooseDoc(match, inMemoryExperiences) : null).then(resolve),
      };
      return queryObj;
    });

    vi.spyOn(GuideExperienceModel, 'find').mockImplementation((filter: any) => {
      let all = Array.from(inMemoryExperiences.values());
      if (filter?.guideId) {
        if (filter.guideId.$in) {
          all = all.filter((e) => filter.guideId.$in.includes(e.guideId));
        } else {
          all = all.filter((e) => e.guideId === filter.guideId);
        }
      }
      if (filter?.status) {
        all = all.filter((e) => e.status === filter.status);
      }
      if (filter?.district) {
        const dist = filter.district;
        all = all.filter((e) =>
          dist instanceof RegExp ? dist.test(e.district) : e.district.toLowerCase() === String(dist).toLowerCase()
        );
      }
      if (filter?.category) {
        all = all.filter((e) => e.category === filter.category);
      }

      const queryObj: any = {
        sort: vi.fn().mockImplementation(() => queryObj),
        limit: vi.fn().mockImplementation(() => queryObj),
        lean: vi.fn().mockResolvedValue(all),
        then: (resolve: any) => Promise.resolve(all).then(resolve),
      };
      return queryObj;
    });

    vi.spyOn(GuideExperienceModel, 'updateMany').mockImplementation(async (filter: any, update: any) => {
      let updatedCount = 0;
      for (const [id, exp] of inMemoryExperiences.entries()) {
        if (filter.guideId && exp.guideId === filter.guideId) {
          inMemoryExperiences.set(id, { ...exp, ...update.$set });
          updatedCount++;
        }
      }
      return { acknowledged: true, modifiedCount: updatedCount } as any;
    });

    vi.spyOn(GuideExperienceModel, 'deleteOne').mockImplementation(async (filter: any) => {
      if (filter.id) {
        inMemoryExperiences.delete(filter.id);
      }
      return { acknowledged: true, deletedCount: 1 } as any;
    });

    // Mock GuideBookingModel
    vi.spyOn(GuideBookingModel.prototype, 'save').mockImplementation(async function (this: any) {
      const rec = {
        ...(this.toObject ? this.toObject() : this),
        toJSON() {
          const res = { ...this };
          delete res._id;
          delete res.__v;
          return res;
        },
      };
      inMemoryGuideBookings.set(rec.id, rec);
      return rec;
    });

    vi.spyOn(GuideBookingModel, 'findOne').mockImplementation((filter: any) => {
      const all = Array.from(inMemoryGuideBookings.values());
      const match = all.find((b) => {
        if (filter.id && b.id !== filter.id) return false;
        if (filter.bookingReference && b.bookingReference !== filter.bookingReference) return false;
        if (filter.touristId && b.touristId !== filter.touristId) return false;
        if (filter.guideId && b.guideId !== filter.guideId) return false;
        return true;
      });

      const queryObj: any = {
        lean: vi.fn().mockResolvedValue(match ? { ...match } : null),
        then: (resolve: any) => Promise.resolve(match ? createMockMongooseDoc(match, inMemoryGuideBookings) : null).then(resolve),
      };
      return queryObj;
    });

    vi.spyOn(GuideBookingModel, 'find').mockImplementation((filter: any) => {
      let all = Array.from(inMemoryGuideBookings.values());
      if (filter?.touristId) {
        all = all.filter((b) => b.touristId === filter.touristId);
      }
      if (filter?.guideId) {
        all = all.filter((b) => b.guideId === filter.guideId);
      }
      if (filter?.experienceId && filter?.bookingDate && filter?.timeSlot) {
        all = all.filter(
          (b) =>
            b.experienceId === filter.experienceId &&
            b.bookingDate === filter.bookingDate &&
            b.timeSlot === filter.timeSlot &&
            filter.status?.$in?.includes(b.status)
        );
      }

      const queryObj: any = {
        sort: vi.fn().mockImplementation(() => queryObj),
        limit: vi.fn().mockImplementation(() => queryObj),
        lean: vi.fn().mockResolvedValue(all),
        then: (resolve: any) => Promise.resolve(all).then(resolve),
      };
      return queryObj;
    });

    // Mock BookingModel for optional linked homestay verification
    vi.spyOn(BookingModel, 'findOne').mockImplementation((filter: any) => {
      const all = Array.from(inMemoryHomestayBookings.values());
      const match = all.find((b) => {
        if (filter.id && b.id !== filter.id) return false;
        if (filter.bookingReference && b.bookingReference !== filter.bookingReference) return false;
        if (filter.userId && b.userId !== filter.userId) return false;
        return true;
      });

      return {
        lean: vi.fn().mockResolvedValue(match ? { ...match } : null),
        then: (resolve: any) => Promise.resolve(match ? { ...match } : null).then(resolve),
      } as any;
    });
  });

  // 1. Guide Profile & Verification Workflow
  describe('1. Guide Profile & Verification Workflow', () => {
    it('should initialize and return the authenticated guide profile', async () => {
      const res = await request(app)
        .get('/api/guide/profile')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${guideToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.profile.fullName).toBe('Harish Chandra Joshi');
      expect(res.body.data.profile.verificationStatus).toBe('unverified');
      expect(res.body.data.profile.isActive).toBe(true);
    });

    it('should reject unauthenticated profile access', async () => {
      const res = await request(app).get('/api/guide/profile');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should forbid tourists from accessing guide portal routes', async () => {
      const res = await request(app)
        .get('/api/guide/profile')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${touristToken}`]);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should allow guide to update profile fields and service locations', async () => {
      // First initialize profile
      await request(app)
        .get('/api/guide/profile')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${guideToken}`]);

      const updatePayload = {
        bio: 'Specialized in Johar Valley high-altitude treks and bird trails.',
        experienceYears: 8,
        languages: ['Hindi', 'English', 'Kumaoni'],
        specialties: ['Trekking', 'Birdwatching', 'Alpine Flora'],
        serviceLocations: [
          { district: 'Pithoragarh', locality: 'Munsiari', village: 'Sarmoli' },
          { district: 'Pithoragarh', locality: 'Munsiari', village: 'Darkot' },
        ],
        phone: '+91 94120 99999',
      };

      const res = await request(app)
        .put('/api/guide/profile')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${guideToken}`])
        .send(updatePayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.profile.experienceYears).toBe(8);
      expect(res.body.data.profile.serviceLocations).toHaveLength(2);
      expect(res.body.data.profile.specialties).toContain('Birdwatching');
    });

    it('should allow guide to submit verification credentials and documents', async () => {
      // Initialize profile
      await request(app)
        .get('/api/guide/profile')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${guideToken}`]);

      const fakeBase64Doc = Buffer.from('Mock Mountaineering Certificate Content').toString('base64');
      const submitPayload = {
        qualifications: 'Certified Alpine Guide - Nehru Institute of Mountaineering',
        documents: [
          {
            fileName: 'nim_cert.pdf',
            fileType: 'application/pdf',
            fileSize: 1024,
            dataUrl: `data:application/pdf;base64,${fakeBase64Doc}`,
          },
        ],
      };

      const res = await request(app)
        .post('/api/guide/profile/submit-verification')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${guideToken}`])
        .send(submitPayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.profile.verificationStatus).toBe('verification_pending');
      expect(res.body.data.profile.documents).toHaveLength(1);
      expect(res.body.data.profile.documents[0].fileName).toBe('nim_cert.pdf');
    });
  });

  // 2. Guide Experience Management & Publishing Safeguards
  describe('2. Guide Experience Management & Publishing Safeguards', () => {
    it('should allow a guide to create a draft experience', async () => {
      // Initialize guide profile first
      await request(app)
        .get('/api/guide/profile')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${guideToken}`]);

      const expPayload = {
        title: 'Khaliya Top Snow Ridge Trek',
        description: 'Guided day-hike to Khaliya Top (3,500m) with 360-degree panorama of Panchachuli mountain range.',
        category: 'Trekking & Hiking',
        district: 'Pithoragarh',
        locality: 'Munsiari',
        meetingPoint: 'KMVN Tourist Rest House, Munsiari',
        duration: '6 to 7 hours',
        price: 1800,
        pricingType: 'per_person',
        maxGroupSize: 8,
        requirements: 'Sturdy hiking shoes, warm windproof jacket',
        availableSlots: [
          { date: '2026-11-15', timeSlots: ['07:00 AM'] },
          { date: '2026-11-16', timeSlots: ['07:00 AM'] },
        ],
      };

      const res = await request(app)
        .post('/api/guide/experiences')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${guideToken}`])
        .send(expPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.experience.title).toBe('Khaliya Top Snow Ridge Trek');
      expect(res.body.data.experience.status).toBe('draft');
    });

    it('should PREVENT unverified guide from publishing an experience', async () => {
      // Profile unverified
      await request(app)
        .get('/api/guide/profile')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${guideToken}`]);

      const draftExperience = {
        id: 'gexp_draft_1',
        guideId: guideUser.id,
        guideName: guideUser.fullName,
        title: 'Draft Trek',
        description: 'Guided day-hike to Khaliya Top (3,500m) with 360-degree panorama.',
        category: 'Trekking & Hiking',
        district: 'Pithoragarh',
        locality: 'Munsiari',
        meetingPoint: 'KMVN Munsiari',
        duration: '6 hours',
        price: 1500,
        status: 'draft',
      };
      inMemoryExperiences.set(draftExperience.id, draftExperience);

      const res = await request(app)
        .post(`/api/guide/experiences/${draftExperience.id}/publish`)
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${guideToken}`]);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Only verified and active guides can publish experiences');
    });

    it('should allow administrator to approve guide verification status', async () => {
      // Setup pending guide
      const profile = {
        id: 'gprof_pending_1',
        userId: guideUser.id,
        fullName: guideUser.fullName,
        email: guideUser.email,
        verificationStatus: 'verification_pending',
        isActive: true,
      };
      inMemoryProfiles.set(profile.id, profile);

      const reviewRes = await request(app)
        .post(`/api/admin/guides/${guideUser.id}/review`)
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${adminToken}`])
        .send({
          action: 'approve',
          notes: 'Credentials validated via Mountaineering Council registry.',
        });

      expect(reviewRes.status).toBe(200);
      expect(reviewRes.body.success).toBe(true);
      expect(reviewRes.body.data.guide.verificationStatus).toBe('verified');
    });

    it('should ALLOW verified guide to publish experience to the marketplace', async () => {
      seedVerifiedGuideAndExperience();
      const draftExperience = {
        id: 'gexp_draft_2',
        guideId: guideUser.id,
        guideName: guideUser.fullName,
        title: 'Published Trek',
        description: 'Guided day-hike to Khaliya Top (3,500m) with 360-degree panorama.',
        category: 'Trekking & Hiking',
        district: 'Pithoragarh',
        locality: 'Munsiari',
        meetingPoint: 'KMVN Munsiari',
        duration: '6 hours',
        price: 1500,
        status: 'draft',
      };
      inMemoryExperiences.set(draftExperience.id, draftExperience);

      const res = await request(app)
        .post(`/api/guide/experiences/${draftExperience.id}/publish`)
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${guideToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.experience.status).toBe('published');
    });

    it('should allow guide to unpublish and update experience details', async () => {
      const { experience } = seedVerifiedGuideAndExperience();

      // Unpublish
      const unpubRes = await request(app)
        .post(`/api/guide/experiences/${experience.id}/unpublish`)
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${guideToken}`]);

      expect(unpubRes.status).toBe(200);
      expect(unpubRes.body.data.experience.status).toBe('draft');

      // Update price
      const updateRes = await request(app)
        .put(`/api/guide/experiences/${experience.id}`)
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${guideToken}`])
        .send({ price: 2500, duration: '7 hours' });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.experience.price).toBe(2500);

      // Re-publish
      const repubRes = await request(app)
        .post(`/api/guide/experiences/${experience.id}/publish`)
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${guideToken}`]);

      expect(repubRes.status).toBe(200);
      expect(repubRes.body.data.experience.status).toBe('published');
    });
  });

  // 3. Location-Based Guide Discovery for Tourists
  describe('3. Location-Based Guide Discovery for Tourists', () => {
    it('should dynamically return verified guides serving a homestay destination (Munsiari, Pithoragarh)', async () => {
      seedVerifiedGuideAndExperience();

      const res = await request(app).get('/api/public/guides/destination?district=Pithoragarh&locality=Munsiari');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.guides).toHaveLength(1);
      expect(res.body.data.guides[0].fullName).toBe('Harish Chandra Joshi');
      expect(res.body.data.guides[0].verificationStatus).toBe('verified');
      // Private contact should NOT be exposed in public API
      expect(res.body.data.guides[0].phone).toBeUndefined();
    });

    it('should return empty list when no verified guides serve an unmatched location', async () => {
      seedVerifiedGuideAndExperience();

      const res = await request(app).get('/api/public/guides/destination?district=Chamoli&locality=Joshimath');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.guides).toHaveLength(0);
    });

    it('should return published experiences in public catalog', async () => {
      seedVerifiedGuideAndExperience();

      const res = await request(app).get('/api/public/guide-experiences?district=Pithoragarh');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.experiences).toHaveLength(1);
      expect(res.body.data.experiences[0].title).toBe('Khaliya Top Snow Ridge Trek');
      expect(res.body.data.experiences[0].price).toBe(2000);
    });
  });

  // 4. Guide Booking System, Price Calculation & Capacity Limits
  describe('4. Guide Booking System, Price Calculation & Capacity Limits', () => {
    it('should calculate price strictly server-side and create a booking reservation', async () => {
      const { experience } = seedVerifiedGuideAndExperience();

      const bookingPayload = {
        experienceId: experience.id,
        bookingDate: '2026-11-15',
        timeSlot: '07:00 AM',
        participantCount: 3,
        specialRequests: 'Vegetarian meals preferred.',
      };

      const res = await request(app)
        .post('/api/guide-bookings')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${touristToken}`])
        .send(bookingPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      // Price per person is ₹2000, 3 participants = ₹6000
      expect(res.body.data.booking.pricing.totalAmount).toBe(6000);
      expect(res.body.data.booking.status).toBe('pending');
      expect(res.body.data.booking.bookingReference).toMatch(/^SLG-[A-Z0-9]+$/);
    });

    it('should PREVENT guide from booking their own experience', async () => {
      const { experience } = seedVerifiedGuideAndExperience();

      const bookingPayload = {
        experienceId: experience.id,
        bookingDate: '2026-11-15',
        timeSlot: '07:00 AM',
        participantCount: 1,
      };

      const res = await request(app)
        .post('/api/guide-bookings')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${guideToken}`])
        .send(bookingPayload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Guides cannot book their own experience');
    });

    it('should ENFORCE group capacity limits and prevent overbooking', async () => {
      const { experience } = seedVerifiedGuideAndExperience();

      // Seed existing booking of 5 participants
      const existingBooking = {
        id: 'gbk_existing_1',
        experienceId: experience.id,
        bookingDate: '2026-11-15',
        timeSlot: '07:00 AM',
        participantCount: 5,
        status: 'confirmed',
      };
      inMemoryGuideBookings.set(existingBooking.id, existingBooking);

      // Max group size is 8. Trying to book 4 spots exceeds limit (5 + 4 = 9 > 8)
      const overbookPayload = {
        experienceId: experience.id,
        bookingDate: '2026-11-15',
        timeSlot: '07:00 AM',
        participantCount: 4,
      };

      const res = await request(app)
        .post('/api/guide-bookings')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${otherTouristToken}`])
        .send(overbookPayload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('spot(s) remaining');
    });

    it('should allow valid capacity booking up to the exact maximum', async () => {
      const { experience } = seedVerifiedGuideAndExperience();

      // Seed existing booking of 3 participants
      const existingBooking = {
        id: 'gbk_existing_2',
        experienceId: experience.id,
        bookingDate: '2026-11-15',
        timeSlot: '07:00 AM',
        participantCount: 3,
        status: 'confirmed',
      };
      inMemoryGuideBookings.set(existingBooking.id, existingBooking);

      // 3 booked, 5 remaining spots. Booking 5 spots should succeed.
      const exactPayload = {
        experienceId: experience.id,
        bookingDate: '2026-11-15',
        timeSlot: '07:00 AM',
        participantCount: 5,
      };

      const res = await request(app)
        .post('/api/guide-bookings')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${otherTouristToken}`])
        .send(exactPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.booking.pricing.totalAmount).toBe(10000); // 5 * 2000
    });

    it('should allow assigned guide to accept (confirm) an incoming booking request', async () => {
      const { experience } = seedVerifiedGuideAndExperience();

      const booking = {
        id: 'gbk_to_confirm',
        guideId: guideUser.id,
        touristId: touristUser.id,
        experienceId: experience.id,
        bookingDate: '2026-11-15',
        timeSlot: '07:00 AM',
        participantCount: 2,
        status: 'pending',
      };
      inMemoryGuideBookings.set(booking.id, booking);

      const res = await request(app)
        .post(`/api/guide/bookings/${booking.id}/respond`)
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${guideToken}`])
        .send({ action: 'confirm', reason: 'Looking forward to guiding you on Khaliya Top!' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.booking.status).toBe('confirmed');
    });

    it('should FORBID unauthorized guides from responding to another guide booking', async () => {
      const { experience } = seedVerifiedGuideAndExperience();

      const booking = {
        id: 'gbk_forbidden_respond',
        guideId: guideUser.id,
        touristId: touristUser.id,
        experienceId: experience.id,
        bookingDate: '2026-11-15',
        timeSlot: '07:00 AM',
        participantCount: 2,
        status: 'pending',
      };
      inMemoryGuideBookings.set(booking.id, booking);

      const res = await request(app)
        .post(`/api/guide/bookings/${booking.id}/respond`)
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${otherGuideToken}`])
        .send({ action: 'confirm' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should allow tourist to view their guide bookings in My Bookings tab', async () => {
      const { experience } = seedVerifiedGuideAndExperience();

      const booking = {
        id: 'gbk_tourist_view',
        guideId: guideUser.id,
        guideName: guideUser.fullName,
        touristId: touristUser.id,
        experienceId: experience.id,
        bookingDate: '2026-11-15',
        timeSlot: '07:00 AM',
        participantCount: 2,
        status: 'confirmed',
      };
      inMemoryGuideBookings.set(booking.id, booking);

      const res = await request(app)
        .get('/api/guide-bookings/my')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${touristToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.bookings).toHaveLength(1);
      expect(res.body.data.bookings[0].guideName).toBe('Harish Chandra Joshi');
    });

    it('should allow assigned guide to mark confirmed reservation as completed', async () => {
      const { experience } = seedVerifiedGuideAndExperience();

      const booking = {
        id: 'gbk_to_complete',
        guideId: guideUser.id,
        touristId: touristUser.id,
        experienceId: experience.id,
        bookingDate: '2026-11-15',
        timeSlot: '07:00 AM',
        participantCount: 2,
        status: 'confirmed',
      };
      inMemoryGuideBookings.set(booking.id, booking);

      const res = await request(app)
        .post(`/api/guide/bookings/${booking.id}/complete`)
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${guideToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.booking.status).toBe('completed');
    });
  });

  // 5. Admin Governance & Experience Moderation
  describe('5. Admin Governance & Experience Moderation', () => {
    it('should allow admin to list all guides and their verification details', async () => {
      seedVerifiedGuideAndExperience();

      const res = await request(app)
        .get('/api/admin/guides')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${adminToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.guides.length).toBeGreaterThanOrEqual(1);
    });

    it('should allow admin to suspend an active guide with mandatory reason', async () => {
      seedVerifiedGuideAndExperience();

      const res = await request(app)
        .post(`/api/admin/guides/${guideUser.id}/review`)
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${adminToken}`])
        .send({
          action: 'suspend',
          notes: 'Seasonal safety suspension due to extreme monsoon trail washouts.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.guide.verificationStatus).toBe('suspended');
      expect(res.body.data.guide.isActive).toBe(false);
    });

    it('should ensure suspended guides do NOT appear in tourist destination search', async () => {
      const { profile } = seedVerifiedGuideAndExperience();
      profile.verificationStatus = 'suspended';
      profile.isActive = false;

      const res = await request(app).get('/api/public/guides/destination?district=Pithoragarh&locality=Munsiari');

      expect(res.status).toBe(200);
      expect(res.body.data.guides).toHaveLength(0);
    });

    it('should allow admin to reactivate guide verification status', async () => {
      const { profile } = seedVerifiedGuideAndExperience();
      profile.verificationStatus = 'suspended';
      profile.isActive = false;

      const res = await request(app)
        .post(`/api/admin/guides/${guideUser.id}/review`)
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${adminToken}`])
        .send({ action: 'reactivate' });

      expect(res.status).toBe(200);
      expect(res.body.data.guide.verificationStatus).toBe('verified');
      expect(res.body.data.guide.isActive).toBe(true);
    });
  });
});
