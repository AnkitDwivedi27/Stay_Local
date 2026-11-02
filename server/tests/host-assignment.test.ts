import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { AuthService } from '../src/services/auth.service';
import { StayModel } from '../src/models/stay.model';
import { BookingModel } from '../src/models/booking.model';
import { UserModel } from '../src/models/user.model';
import { signToken } from '../src/utils/token';
import { AuthUser } from '../src/types';
import * as dbConfig from '../src/config/db';

describe('StayLocal Host Assignment System for Preloaded Homestays', () => {
  // Test Users
  const adminUser: AuthUser = {
    id: 'usr_admin_901',
    fullName: 'Panchayat District Admin',
    email: 'admin@staylocal.org',
    role: 'admin',
    status: 'active',
  };

  const eligibleHost1: AuthUser = {
    id: 'usr_host_101',
    fullName: 'Devendra Nitwal',
    email: 'devendra@munsiyari.in',
    role: 'host',
    status: 'active',
    phone: '+91 94120 12345',
    bio: 'Local Shauka community leader and mountain homestay host',
  };

  const eligibleHost2: AuthUser = {
    id: 'usr_host_102',
    fullName: 'Kundan Singh Rawat',
    email: 'kundan@sarmoli.in',
    role: 'host',
    status: 'active',
    phone: '+91 94120 54321',
  };

  const suspendedHost: AuthUser = {
    id: 'usr_host_999',
    fullName: 'Suspended Host Account',
    email: 'suspended@staylocal.org',
    role: 'host',
    status: 'suspended',
  };

  const touristUser: AuthUser = {
    id: 'usr_tourist_301',
    fullName: 'Sneha Kapur',
    email: 'sneha@traveler.org',
    role: 'tourist',
    status: 'active',
  };

  const guideUser: AuthUser = {
    id: 'usr_guide_401',
    fullName: 'Trek Leader Anand',
    email: 'anand@guide.org',
    role: 'guide',
    status: 'active',
  };

  const adminToken = signToken({ id: adminUser.id, email: adminUser.email, role: adminUser.role });
  const host1Token = signToken({ id: eligibleHost1.id, email: eligibleHost1.email, role: eligibleHost1.role });
  const host2Token = signToken({ id: eligibleHost2.id, email: eligibleHost2.email, role: eligibleHost2.role });
  const touristToken = signToken({ id: touristUser.id, email: touristUser.email, role: touristUser.role });

  let inMemoryStays: Map<string, any>;
  let inMemoryBookings: Map<string, any>;
  let inMemoryUsers: Map<string, any>;

  function createMockStayDoc(data: any) {
    const doc = {
      ...data,
      save: async function () {
        inMemoryStays.set(this.id, { ...this });
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

  function createMockBookingDoc(data: any) {
    const doc = {
      ...data,
      save: async function () {
        inMemoryBookings.set(this.id, { ...this });
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

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(dbConfig, 'isDatabaseConfigured').mockReturnValue(true);
    vi.spyOn(dbConfig, 'isDatabaseConnected').mockReturnValue(true);

    inMemoryStays = new Map();
    inMemoryBookings = new Map();
    inMemoryUsers = new Map();

    // Populate Users
    [adminUser, eligibleHost1, eligibleHost2, suspendedHost, touristUser, guideUser].forEach((u) => {
      inMemoryUsers.set(u.id, { ...u, createdAt: new Date() });
    });

    // Populate Preloaded Research Stays
    const preloadedStay1 = {
      id: 'stay-mun-01',
      name: 'Anasuya Devi Homestay',
      description: 'Family-run village residence in Sarmoli village framed by Panchachuli.',
      district: 'Pithoragarh',
      locality: 'Sarmoli',
      address: 'Sarmoli Village, Munsiyari 262554',
      category: 'village_homestay',
      dataSource: 'NIDHI+ Uttarakhand Directory',
      verificationStatus: 'unverified_lead',
      publicationStatus: 'draft',
      isPreloaded: true,
      assignmentStatus: 'unassigned',
      pricePerNight: 1800,
      guestCapacity: { maxGuests: 4, roomCount: 2 },
      amenities: ['Home-Cooked Kumaoni Meals'],
      assignmentHistory: [],
      verificationHistory: [],
    };

    const preloadedStay2 = {
      id: 'stay-bhm-01',
      name: 'Mehragaon Oak & Pine Farmstead',
      description: 'Restored stone fruit orchard cottage surrounded by oak forests.',
      district: 'Nainital',
      locality: 'Bhimtal',
      address: 'Mehragaon, Bhimtal 263136',
      category: 'heritage_farmstay',
      dataSource: 'Field Research Dataset',
      verificationStatus: 'verified',
      publicationStatus: 'published',
      isPreloaded: true,
      assignmentStatus: 'unassigned',
      pricePerNight: 2400,
      guestCapacity: { maxGuests: 6, roomCount: 3 },
      amenities: ['Organic Farming', 'Mountain View'],
      assignmentHistory: [],
      verificationHistory: [],
    };

    inMemoryStays.set(preloadedStay1.id, preloadedStay1);
    inMemoryStays.set(preloadedStay2.id, preloadedStay2);

    // Mock AuthService.getCurrentUser for authentication middleware
    vi.spyOn(AuthService, 'getCurrentUser').mockImplementation(async (userId: string) => {
      const u = inMemoryUsers.get(userId);
      if (u) return u;
      throw new Error('User not found');
    });

    // Mock UserModel queries
    vi.spyOn(UserModel, 'find').mockImplementation((query?: any) => {
      let users = Array.from(inMemoryUsers.values());
      if (query?.id?.$in) {
        users = users.filter((u) => query.id.$in.includes(u.id));
      }
      if (query?.role) {
        users = users.filter((u) => u.role === query.role);
      }
      if (query?.status) {
        users = users.filter((u) => u.status === query.status);
      }
      if (query?.$or) {
        users = users.filter((u) =>
          query.$or.some((clause: any) => {
            if (clause.fullName?.$regex) {
              return new RegExp(clause.fullName.$regex, 'i').test(u.fullName);
            }
            if (clause.email?.$regex) {
              return new RegExp(clause.email.$regex, 'i').test(u.email);
            }
            return false;
          })
        );
      }
      return {
        sort: () => ({
          lean: async () => users,
        }),
        lean: async () => users,
      } as any;
    });

    vi.spyOn(UserModel, 'findOne').mockImplementation((query: any) => {
      let found: any = null;
      if (query.id) {
        found = inMemoryUsers.get(query.id);
      } else if (query.email) {
        found = Array.from(inMemoryUsers.values()).find((u) => u.email === query.email.toLowerCase());
      }
      if (!found) {
        return {
          lean: async () => null,
          then: (resolve: any) => resolve(null),
        } as any;
      }
      const userDoc = {
        ...found,
        toJSON: () => ({ ...found }),
      };
      return {
        ...userDoc,
        lean: async () => found,
        then: (resolve: any) => resolve(userDoc),
      } as any;
    });

    // Mock StayModel queries
    vi.spyOn(StayModel, 'find').mockImplementation((query?: any) => {
      let stays = Array.from(inMemoryStays.values());
      if (query?.hostId) {
        stays = stays.filter((s) => s.hostId === query.hostId);
      }
      if (query?.district?.$regex) {
        stays = stays.filter((s) => new RegExp(query.district.$regex, 'i').test(s.district));
      }
      return {
        sort: () => stays.map(createMockStayDoc),
        then: (resolve: any) => resolve(stays.map(createMockStayDoc)),
      } as any;
    });

    vi.spyOn(StayModel, 'findOne').mockImplementation((query: any) => {
      const stay = inMemoryStays.get(query.id?.toLowerCase());
      return Promise.resolve(stay ? createMockStayDoc(stay) : null) as any;
    });

    // Mock BookingModel queries
    vi.spyOn(BookingModel, 'find').mockImplementation((query?: any) => {
      let bookings = Array.from(inMemoryBookings.values());
      if (query?.hostId) {
        bookings = bookings.filter((b) => b.hostId === query.hostId);
      }
      if (query?.stayId) {
        bookings = bookings.filter((b) => b.stayId === query.stayId);
      }
      if (query?.$or) {
        bookings = bookings.filter((b) =>
          query.$or.some((c: any) => c.hostId === b.hostId || (c.stayId?.$in && c.stayId.$in.includes(b.stayId)))
        );
      }
      const docList = bookings.map(createMockBookingDoc);
      return {
        sort: () => ({
          limit: () => docList,
          then: (resolve: any) => resolve(docList),
        }),
        then: (resolve: any) => resolve(docList),
      } as any;
    });

    vi.spyOn(BookingModel, 'findOne').mockImplementation((query: any) => {
      let found: any = null;
      if (query.id) {
        found = inMemoryBookings.get(query.id);
      } else if (query.bookingReference) {
        found = Array.from(inMemoryBookings.values()).find((b) => b.bookingReference === query.bookingReference);
      }
      return Promise.resolve(found ? createMockBookingDoc(found) : null) as any;
    });

    // Mock BookingModel constructor / save
    vi.spyOn(BookingModel.prototype, 'save').mockImplementation(async function (this: any) {
      const record = {
        ...(this.toObject ? this.toObject() : this),
        toJSON() {
          const res = { ...this };
          delete res._id;
          delete res.__v;
          return res;
        },
      };
      inMemoryBookings.set(record.id, record);
      return record;
    });

    vi.spyOn(BookingModel, 'countDocuments').mockImplementation(async (query: any) => {
      let count = 0;
      for (const b of inMemoryBookings.values()) {
        if (query.stayId && b.stayId !== query.stayId) continue;
        if (query.status && b.status !== query.status) continue;
        count++;
      }
      return count;
    });
  });

  // =========================================================================
  // 1. ADMIN HOST ASSIGNMENT WORKFLOW
  // =========================================================================
  describe('1. Admin Host Assignment Management & Authorization Checks', () => {
    it('GET /api/admin/host-assignments returns preloaded stays with assignment details', async () => {
      const res = await request(app)
        .get('/api/admin/host-assignments')
        .set('Cookie', [`staylocal_token=${adminToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.stays).toHaveLength(2);
      expect(res.body.data.stays[0].assignmentStatus).toBe('unassigned');
    });

    it('GET /api/admin/eligible-hosts returns only active hosts, excluding tourists/guides/admins', async () => {
      const res = await request(app)
        .get('/api/admin/eligible-hosts')
        .set('Cookie', [`staylocal_token=${adminToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const hosts = res.body.data;
      expect(hosts).toHaveLength(2); // Only eligibleHost1 and eligibleHost2
      expect(hosts.some((h: any) => h.id === touristUser.id)).toBe(false);
      expect(hosts.some((h: any) => h.id === guideUser.id)).toBe(false);
      expect(hosts.some((h: any) => h.id === adminUser.id)).toBe(false);
      expect(hosts.some((h: any) => h.id === suspendedHost.id)).toBe(false);
    });

    it('POST /api/admin/host-assignments allows admin to assign an eligible host to a homestay', async () => {
      const res = await request(app)
        .post('/api/admin/host-assignments')
        .set('Cookie', [`staylocal_token=${adminToken}`])
        .send({
          stayId: 'stay-mun-01',
          hostId: eligibleHost1.id,
          reason: 'Assigned following Sarmoli village panchayat onboarding',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const stay = res.body.data.listing;
      expect(stay.hostId).toBe(eligibleHost1.id);
      expect(stay.assignedHostId).toBe(eligibleHost1.id);
      expect(stay.assignedHostName).toBe(eligibleHost1.fullName);
      expect(stay.assignmentStatus).toBe('assigned');
      expect(stay.assignmentHistory).toHaveLength(1);
      expect(stay.assignmentHistory[0].action).toBe('assigned');
      expect(stay.assignmentHistory[0].assignedBy).toBe(adminUser.id);
    });

    it('POST /api/admin/host-assignments strictly forbids non-admin users (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/admin/host-assignments')
        .set('Cookie', [`staylocal_token=${touristToken}`])
        .send({
          stayId: 'stay-mun-01',
          hostId: eligibleHost1.id,
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/admin/host-assignments requires authentication (401 Unauthorized)', async () => {
      const res = await request(app)
        .post('/api/admin/host-assignments')
        .send({
          stayId: 'stay-mun-01',
          hostId: eligibleHost1.id,
        });

      expect(res.status).toBe(401);
    });

    it('POST /api/admin/host-assignments rejects assigning ineligible users (tourist, guide, or suspended host)', async () => {
      // Attempt to assign tourist
      const touristAttempt = await request(app)
        .post('/api/admin/host-assignments')
        .set('Cookie', [`staylocal_token=${adminToken}`])
        .send({
          stayId: 'stay-mun-01',
          hostId: touristUser.id,
        });

      expect(touristAttempt.status).toBe(400);
      expect(touristAttempt.body.error.message).toContain('Only registered host accounts can be assigned');

      // Attempt to assign suspended host
      const suspendedAttempt = await request(app)
        .post('/api/admin/host-assignments')
        .set('Cookie', [`staylocal_token=${adminToken}`])
        .send({
          stayId: 'stay-mun-01',
          hostId: suspendedHost.id,
        });

      expect(suspendedAttempt.status).toBe(400);
      expect(suspendedAttempt.body.error.message).toContain('Only active accounts are eligible');
    });

    it('POST /api/admin/host-assignments rejects invalid or non-existent stay IDs (404 Not Found)', async () => {
      const res = await request(app)
        .post('/api/admin/host-assignments')
        .set('Cookie', [`staylocal_token=${adminToken}`])
        .send({
          stayId: 'non-existent-stay-id',
          hostId: eligibleHost1.id,
        });

      expect(res.status).toBe(404);
      expect(res.body.error.message).toContain('was not found');
    });

    it('PATCH /api/admin/host-assignments/:id allows admin to reassign a homestay with audit reason', async () => {
      // First assign to host 1
      await request(app)
        .post('/api/admin/host-assignments')
        .set('Cookie', [`staylocal_token=${adminToken}`])
        .send({
          stayId: 'stay-mun-01',
          hostId: eligibleHost1.id,
        });

      // Now reassign to host 2
      const res = await request(app)
        .patch('/api/admin/host-assignments/stay-mun-01')
        .set('Cookie', [`staylocal_token=${adminToken}`])
        .send({
          hostId: eligibleHost2.id,
          reason: 'Host 1 requested lease transfer to cooperative partner Kundan Rawat',
        });

      expect(res.status).toBe(200);
      const updated = res.body.data.listing;
      expect(updated.hostId).toBe(eligibleHost2.id);
      expect(updated.assignedHostName).toBe(eligibleHost2.fullName);
      expect(updated.assignmentHistory).toHaveLength(2);
      expect(updated.assignmentHistory[1].action).toBe('reassigned');
      expect(updated.assignmentHistory[1].reason).toContain('lease transfer');
    });

    it('DELETE /api/admin/host-assignments/:id removes assignment safely when no active bookings exist', async () => {
      // Assign first
      await request(app)
        .post('/api/admin/host-assignments')
        .set('Cookie', [`staylocal_token=${adminToken}`])
        .send({
          stayId: 'stay-mun-01',
          hostId: eligibleHost1.id,
        });

      // Remove assignment
      const res = await request(app)
        .delete('/api/admin/host-assignments/stay-mun-01')
        .set('Cookie', [`staylocal_token=${adminToken}`])
        .send({
          reason: 'Host left village cooperative',
        });

      expect(res.status).toBe(200);
      const unassigned = res.body.data.listing;
      expect(unassigned.hostId).toBeUndefined();
      expect(unassigned.assignmentStatus).toBe('unassigned');
      expect(unassigned.publicationStatus).toBe('draft');
      expect(unassigned.assignmentHistory).toHaveLength(2);
      expect(unassigned.assignmentHistory[1].action).toBe('unassigned');
    });

    it('DELETE /api/admin/host-assignments/:id blocks unassignment if active upcoming bookings exist', async () => {
      // Assign stay
      await request(app)
        .post('/api/admin/host-assignments')
        .set('Cookie', [`staylocal_token=${adminToken}`])
        .send({
          stayId: 'stay-bhm-01',
          hostId: eligibleHost1.id,
        });

      // Add a confirmed upcoming booking
      inMemoryBookings.set('bk_101', {
        id: 'bk_101',
        stayId: 'stay-bhm-01',
        hostId: eligibleHost1.id,
        status: 'confirmed',
        checkIn: new Date(Date.now() + 86400000),
        checkOut: new Date(Date.now() + 86400000 * 3),
      });

      const res = await request(app)
        .delete('/api/admin/host-assignments/stay-bhm-01')
        .set('Cookie', [`staylocal_token=${adminToken}`])
        .send({ reason: 'Attempting removal with bookings' });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('active upcoming confirmed booking');
    });
  });

  // =========================================================================
  // 2. HOST DASHBOARD INTEGRATION & OWNERSHIP ISOLATION
  // =========================================================================
  describe('2. Host Dashboard Integration & Ownership Isolation', () => {
    it('Assigned homestay appears in the assigned host listings section', async () => {
      // Admin assigns stay-mun-01 to host 1
      await request(app)
        .post('/api/admin/host-assignments')
        .set('Cookie', [`staylocal_token=${adminToken}`])
        .send({
          stayId: 'stay-mun-01',
          hostId: eligibleHost1.id,
        });

      // Host 1 requests their listings
      const res = await request(app)
        .get('/api/host/listings')
        .set('Cookie', [`staylocal_token=${host1Token}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.listings.some((l: any) => l.id === 'stay-mun-01')).toBe(true);
    });

    it('GET /api/host/assigned-listings retrieves only assigned preloaded properties', async () => {
      await request(app)
        .post('/api/admin/host-assignments')
        .set('Cookie', [`staylocal_token=${adminToken}`])
        .send({
          stayId: 'stay-mun-01',
          hostId: eligibleHost1.id,
        });

      const res = await request(app)
        .get('/api/host/assigned-listings')
        .set('Cookie', [`staylocal_token=${host1Token}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.listings).toHaveLength(1);
      expect(res.body.data.listings[0].id).toBe('stay-mun-01');
    });

    it('Host A cannot access details of a homestay assigned to Host B (403 Forbidden)', async () => {
      // Assign stay-mun-01 to Host 1
      await request(app)
        .post('/api/admin/host-assignments')
        .set('Cookie', [`staylocal_token=${adminToken}`])
        .send({
          stayId: 'stay-mun-01',
          hostId: eligibleHost1.id,
        });

      // Host 2 attempts to access Host 1's listing
      const res = await request(app)
        .get('/api/host/listings/stay-mun-01')
        .set('Cookie', [`staylocal_token=${host2Token}`]);

      expect(res.status).toBe(403);
      expect(res.body.error.message).toContain('not authorized');
    });

    it('Host can submit authorization/ownership proof for assigned homestay', async () => {
      // Assign stay to host 1
      await request(app)
        .post('/api/admin/host-assignments')
        .set('Cookie', [`staylocal_token=${adminToken}`])
        .send({
          stayId: 'stay-mun-01',
          hostId: eligibleHost1.id,
        });

      // Host submits verification evidence
      const res = await request(app)
        .post('/api/host/assigned-listings/stay-mun-01/submit-verification')
        .set('Cookie', [`staylocal_token=${host1Token}`])
        .send({
          submissionEvidence: 'Panchayat Gram Pradhan ownership certificate Ref #UK-MUN-2026-9081 and water test approval',
        });

      expect(res.status).toBe(200);
      const stay = res.body.data.listing;
      expect(stay.verificationStatus).toBe('verification_pending');
      expect(stay.submissionEvidence).toContain('Panchayat Gram Pradhan');
    });
  });

  // =========================================================================
  // 3. BOOKING INTEGRATION & CONCURRENCY PROTECTIONS
  // =========================================================================
  describe('3. Booking Integration with Assigned Homestays', () => {
    it('Unassigned homestay strictly cannot accept tourist bookings', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Cookie', [`staylocal_token=${touristToken}`])
        .send({
          stayId: 'stay-bhm-01', // verified but unassigned
          checkIn: '2026-11-20',
          checkOut: '2026-11-23',
          guestCount: 2,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('not currently assigned to a verified host');
    });

    it('Tourist booking against verified assigned homestay routes correctly to assigned host', async () => {
      // Set stay as assigned and verified
      const stay = inMemoryStays.get('stay-bhm-01');
      stay.hostId = eligibleHost1.id;
      stay.assignedHostId = eligibleHost1.id;
      stay.assignmentStatus = 'assigned';
      stay.verificationStatus = 'verified';
      stay.publicationStatus = 'published';

      // Tourist books stay
      const res = await request(app)
        .post('/api/bookings')
        .set('Cookie', [`staylocal_token=${touristToken}`])
        .send({
          stayId: 'stay-bhm-01',
          checkIn: '2026-11-20',
          checkOut: '2026-11-23',
          guestCount: 2,
        });

      expect(res.status).toBe(201);
      const booking = res.body.data.booking;
      expect(booking.hostId).toBe(eligibleHost1.id);
      expect(booking.stayId).toBe('stay-bhm-01');

      // The booking appears in Host 1's bookings dashboard
      const hostBookingsRes = await request(app)
        .get('/api/host/bookings')
        .set('Cookie', [`staylocal_token=${host1Token}`]);

      expect(hostBookingsRes.status).toBe(200);
      expect(hostBookingsRes.body.data.bookings.some((b: any) => b.id === booking.id)).toBe(true);
    });
  });
});
