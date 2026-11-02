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

describe('StayLocal Host Listing Management & Admin Verification Workflow', () => {
  // Test Users
  const hostUser: AuthUser = {
    id: 'usr_host_101',
    fullName: 'Kundan Singh Rawat',
    email: 'kundan@sarmolivalley.org',
    role: 'host',
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const otherHostUser: AuthUser = {
    id: 'usr_host_102',
    fullName: 'Mohan Joshi',
    email: 'mohan@darkotcrafts.org',
    role: 'host',
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const adminUser: AuthUser = {
    id: 'usr_admin_901',
    fullName: 'Panchayat Governance Admin',
    email: 'governance@staylocal.org',
    role: 'admin',
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const touristUser: AuthUser = {
    id: 'usr_tourist_301',
    fullName: 'Sneha Kapur',
    email: 'sneha@traveler.org',
    role: 'tourist',
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const hostToken = signToken({ id: hostUser.id, email: hostUser.email, role: hostUser.role });
  const otherHostToken = signToken({ id: otherHostUser.id, email: otherHostUser.email, role: otherHostUser.role });
  const adminToken = signToken({ id: adminUser.id, email: adminUser.email, role: adminUser.role });
  const touristToken = signToken({ id: touristUser.id, email: touristUser.email, role: touristUser.role });

  let inMemoryStays: Map<string, any>;
  let inMemoryBookings: Map<string, any>;

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

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(dbConfig, 'isDatabaseConnected').mockReturnValue(true);
    inMemoryStays = new Map();
    inMemoryBookings = new Map();

    // Mock AuthService.getCurrentUser for authentication middleware
    vi.spyOn(AuthService, 'getCurrentUser').mockImplementation(async (userId: string) => {
      if (userId === hostUser.id) return hostUser;
      if (userId === otherHostUser.id) return otherHostUser;
      if (userId === adminUser.id) return adminUser;
      if (userId === touristUser.id) return touristUser;
      throw new Error('User not found');
    });

    // Mock UserModel queries
    vi.spyOn(UserModel, 'find').mockImplementation((filter: any) => {
      const users = [hostUser, otherHostUser, adminUser, touristUser];
      const res = filter?.id?.$in
        ? users.filter((u) => filter.id.$in.includes(u.id))
        : users;
      return {
        lean: vi.fn().mockResolvedValue(res),
        then: (resolve: any) => Promise.resolve(res).then(resolve),
      } as any;
    });

    // Mock StayModel prototype save
    vi.spyOn(StayModel.prototype, 'save').mockImplementation(async function (this: any) {
      const record = {
        ...(this.toObject ? this.toObject() : this),
        toJSON() {
          const res = { ...this };
          delete res._id;
          delete res.__v;
          return res;
        },
      };
      inMemoryStays.set(record.id, record);
      return record;
    });

    // Mock StayModel queries
    vi.spyOn(StayModel, 'find').mockImplementation((filter: any) => {
      let results = Array.from(inMemoryStays.values());
      if (filter?.hostId) {
        results = results.filter((s) => s.hostId === filter.hostId);
      }
      if (filter?.verificationStatus) {
        if (typeof filter.verificationStatus === 'string') {
          results = results.filter((s) => s.verificationStatus === filter.verificationStatus);
        } else if (filter.verificationStatus?.$in) {
          results = results.filter((s) => filter.verificationStatus.$in.includes(s.verificationStatus));
        }
      }
      const queryObj: any = {
        sort: vi.fn().mockImplementation(() => results.map((r) => createMockStayDoc(r))),
      };
      return queryObj;
    });

    vi.spyOn(StayModel, 'findOne').mockImplementation((filter: any) => {
      if (filter?.id) {
        const stay = inMemoryStays.get(String(filter.id).toLowerCase());
        return Promise.resolve(stay ? createMockStayDoc(stay) : null) as any;
      }
      return Promise.resolve(null) as any;
    });

    vi.spyOn(StayModel, 'findOneAndUpdate').mockImplementation(async (filter: any, update: any) => {
      const stay = inMemoryStays.get(String(filter.id).toLowerCase());
      if (!stay) return null;

      // Handle concurrency lock condition
      if (filter?.$or) {
        if (stay.confirmationLock === true) {
          return null; // Lock already held
        }
      }

      if (update?.$set) {
        Object.assign(stay, update.$set);
      }
      inMemoryStays.set(stay.id, stay);
      return createMockStayDoc(stay) as any;
    });

    vi.spyOn(StayModel, 'updateOne').mockImplementation(async (filter: any, update: any) => {
      const stay = inMemoryStays.get(String(filter.id).toLowerCase());
      if (stay && update?.$set) {
        Object.assign(stay, update.$set);
        inMemoryStays.set(stay.id, stay);
      }
      return { acknowledged: true } as any;
    });

    // Mock BookingModel queries
    vi.spyOn(BookingModel, 'countDocuments').mockImplementation(async (filter: any) => {
      let count = 0;
      for (const b of inMemoryBookings.values()) {
        if (b.stayId === filter.stayId && (!filter.status || b.status === filter.status)) {
          count++;
        }
      }
      return count;
    });

    vi.spyOn(BookingModel, 'findOne').mockImplementation((filter: any) => {
      let found: any = null;
      for (const b of inMemoryBookings.values()) {
        if (filter.id && typeof filter.id === 'string' && b.id !== filter.id) continue;
        if (filter.id?.$ne && b.id === filter.id.$ne) continue;
        if (filter.stayId && b.stayId !== filter.stayId) continue;
        if (filter.status && b.status !== filter.status) continue;
        if (filter.bookingReference && b.bookingReference !== filter.bookingReference) continue;
        if (filter.guestCount?.$gt && b.guestCount <= filter.guestCount.$gt) continue;

        // Date overlap check: existing.checkIn < new.checkOut && existing.checkOut > new.checkIn
        if (filter.checkIn?.$lt && filter.checkOut?.$gt) {
          const reqCheckOut = filter.checkIn.$lt instanceof Date ? filter.checkIn.$lt : new Date(filter.checkIn.$lt);
          const reqCheckIn = filter.checkOut.$gt instanceof Date ? filter.checkOut.$gt : new Date(filter.checkOut.$gt);
          const bCheckIn = b.checkIn instanceof Date ? b.checkIn : new Date(b.checkIn);
          const bCheckOut = b.checkOut instanceof Date ? b.checkOut : new Date(b.checkOut);

          const overlaps = bCheckIn.getTime() < reqCheckOut.getTime() && bCheckOut.getTime() > reqCheckIn.getTime();
          if (!overlaps) continue;
        }

        found = b;
        break;
      }
      return Promise.resolve(found ? { ...found, toJSON: () => ({ ...found }) } : null) as any;
    });

    vi.spyOn(BookingModel, 'find').mockImplementation((filter: any) => {
      let results = Array.from(inMemoryBookings.values());
      if (filter?.stayId) results = results.filter((b) => b.stayId === filter.stayId);
      const queryObj: any = {
        sort: vi.fn().mockImplementation(() => ({
          limit: vi.fn().mockImplementation(() => results.map((b) => ({ ...b, toJSON: () => b }))),
        })),
      };
      return queryObj;
    });

    vi.spyOn(BookingModel, 'findOneAndUpdate').mockImplementation(async (filter: any, update: any) => {
      const booking = inMemoryBookings.get(filter.id);
      if (!booking) return null;
      if (filter.status && booking.status !== filter.status) return null;
      if (update.$set) Object.assign(booking, update.$set);
      inMemoryBookings.set(booking.id, booking);
      return {
        ...booking,
        toJSON: () => ({ ...booking }),
      } as any;
    });
  });

  // ==========================================
  // 1. HOST LISTING MANAGEMENT & RBAC
  // ==========================================
  describe('1. Host Listing Management & Ownership Isolation', () => {
    it('GET /api/host/listings requires authentication and host role', async () => {
      const resUnauth = await request(app).get('/api/host/listings');
      expect(resUnauth.status).toBe(401);

      const resTourist = await request(app)
        .get('/api/host/listings')
        .set('Cookie', [`staylocal_token=${touristToken}`]);
      expect(resTourist.status).toBe(403);
    });

    it('GET /api/host/listings returns only listings owned by the authenticated host', async () => {
      const stay1 = {
        id: 'stay-kundan-01',
        name: 'Kundan Alpine Cottage',
        district: 'Pithoragarh',
        locality: 'Sarmoli',
        address: 'Upper Sarmoli',
        category: 'village_homestay',
        hostId: hostUser.id,
        verificationStatus: 'verified',
        publicationStatus: 'published',
        pricePerNight: 2400,
      };
      const stay2 = {
        id: 'stay-mohan-02',
        name: 'Mohan Darkot Loom Stay',
        district: 'Pithoragarh',
        locality: 'Darkot',
        address: 'Weavers Lane',
        category: 'heritage_farmstay',
        hostId: otherHostUser.id,
        verificationStatus: 'verified',
        publicationStatus: 'published',
        pricePerNight: 2000,
      };
      inMemoryStays.set(stay1.id, stay1);
      inMemoryStays.set(stay2.id, stay2);

      const res = await request(app)
        .get('/api/host/listings')
        .set('Cookie', [`staylocal_token=${hostToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.listings.length).toBe(1);
      expect(res.body.data.listings[0].id).toBe('stay-kundan-01');
      expect(res.body.data.listings[0].name).toBe('Kundan Alpine Cottage');
    });

    it('GET /api/host/listings/:id prevents another host from viewing private listing details (403 Forbidden)', async () => {
      const privateStay = {
        id: 'stay-private-kundan',
        name: 'Kundan Private Homestead',
        district: 'Pithoragarh',
        locality: 'Sarmoli',
        address: 'Ridge 4',
        category: 'village_homestay',
        hostId: hostUser.id,
        verificationStatus: 'unverified_lead',
        publicationStatus: 'draft',
      };
      inMemoryStays.set(privateStay.id, privateStay);

      const res = await request(app)
        .get(`/api/host/listings/${privateStay.id}`)
        .set('Cookie', [`staylocal_token=${otherHostToken}`]);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('POST /api/host/listings creates a listing and strictly derives hostId from session', async () => {
      const payload = {
        name: 'Chaukori Mountain View Homestay',
        description: 'Spectacular views of Panchachuli and Nanda Devi peaks from high-altitude tea gardens.',
        category: 'village_homestay',
        district: 'Bageshwar',
        locality: 'Chaukori',
        address: 'Near Old Tea Estate, Chaukori Village',
        pricePerNight: 2800,
        guestCapacity: {
          maxGuests: 6,
          roomCount: 3,
        },
        amenities: ['Solar Water Heating', 'Traditional Fireplace / Bukhari'],
        // Attacker attempts to forge another host's ID:
        hostId: 'usr_hacked_attacker_999',
      };

      const res = await request(app)
        .post('/api/host/listings')
        .set('Cookie', [`staylocal_token=${hostToken}`])
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.listing.name).toBe('Chaukori Mountain View Homestay');
      // Host ID must be strictly derived from hostUser.id, ignoring the forged hostId
      expect(res.body.data.listing.hostId).toBe(hostUser.id);
      expect(res.body.data.listing.verificationStatus).toBe('unverified_lead');
      expect(res.body.data.listing.publicationStatus).toBe('draft');
    });

    it('POST /api/host/listings validates price and capacity constraints', async () => {
      const invalidPayload = {
        name: 'Hi', // too short
        description: 'short', // too short
        district: '',
        locality: '',
        address: '',
        category: 'invalid_category',
        pricePerNight: 50, // below min ₹200
        guestCapacity: {
          maxGuests: 0, // must be >= 1
        },
      };

      const res = await request(app)
        .post('/api/host/listings')
        .set('Cookie', [`staylocal_token=${hostToken}`])
        .send(invalidPayload);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // ==========================================
  // 2. LISTING EDITS & BOOKING COMPATIBILITY
  // ==========================================
  describe('2. Listing Edits & Booking Integrity Protection', () => {
    it('PUT /api/host/listings/:id blocks capacity reduction below active confirmed reservation guest count', async () => {
      const stay = {
        id: 'stay-capacity-check',
        name: 'Johar Valley Alpine Lodge',
        district: 'Pithoragarh',
        locality: 'Munsiyari',
        address: 'Main Bazaar',
        category: 'eco_lodge',
        hostId: hostUser.id,
        verificationStatus: 'verified',
        publicationStatus: 'published',
        guestCapacity: { maxGuests: 8, roomCount: 4 },
        pricePerNight: 3000,
      };
      inMemoryStays.set(stay.id, stay);

      // Existing confirmed reservation for 6 guests
      const confirmedBooking = {
        id: 'bk_active_future_01',
        bookingReference: 'SLB-FUT001',
        stayId: stay.id,
        status: 'confirmed',
        guestCount: 6,
        checkIn: new Date(Date.now() + 86400000 * 5),
        checkOut: new Date(Date.now() + 86400000 * 8),
      };
      inMemoryBookings.set(confirmedBooking.id, confirmedBooking);

      // Host attempts to reduce maxGuests to 3 (less than the 6 guests booked)
      const res = await request(app)
        .put(`/api/host/listings/${stay.id}`)
        .set('Cookie', [`staylocal_token=${hostToken}`])
        .send({
          guestCapacity: { maxGuests: 3 },
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('BAD_REQUEST');
      expect(res.body.error.message).toMatch(/cannot reduce maximum guest capacity.*SLB-FUT001/i);
    });

    it('PUT /api/host/listings/:id blocks archiving if active upcoming confirmed reservations exist', async () => {
      const stay = {
        id: 'stay-archive-guard',
        name: 'Gori Ganga Riverside Haven',
        district: 'Pithoragarh',
        locality: 'Madkot',
        address: 'Hot Springs Bank',
        category: 'village_homestay',
        hostId: hostUser.id,
        verificationStatus: 'verified',
        publicationStatus: 'published',
        guestCapacity: { maxGuests: 4 },
        pricePerNight: 2000,
      };
      inMemoryStays.set(stay.id, stay);

      const confirmedBooking = {
        id: 'bk_upcoming_02',
        bookingReference: 'SLB-FUT002',
        stayId: stay.id,
        status: 'confirmed',
        guestCount: 2,
        checkIn: new Date(Date.now() + 86400000 * 2),
        checkOut: new Date(Date.now() + 86400000 * 5),
      };
      inMemoryBookings.set(confirmedBooking.id, confirmedBooking);

      const res = await request(app)
        .put(`/api/host/listings/${stay.id}`)
        .set('Cookie', [`staylocal_token=${hostToken}`])
        .send({
          publicationStatus: 'archived',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('BAD_REQUEST');
      expect(res.body.error.message).toMatch(/cannot archive listing.*active confirmed reservation/i);
    });

    it('POST /api/host/listings/:id/submit-verification transitions to verification_pending and logs history', async () => {
      const draftStay = {
        id: 'stay-draft-submit',
        name: 'Darkot Weaver Cottage',
        district: 'Pithoragarh',
        locality: 'Darkot',
        address: 'Artisan Hub',
        category: 'heritage_farmstay',
        hostId: hostUser.id,
        verificationStatus: 'unverified_lead',
        publicationStatus: 'draft',
        verificationHistory: [],
      };
      inMemoryStays.set(draftStay.id, draftStay);

      const res = await request(app)
        .post(`/api/host/listings/${draftStay.id}/submit-verification`)
        .set('Cookie', [`staylocal_token=${hostToken}`])
        .send({
          submissionEvidence: 'Uttarakhand Homestay Scheme Reg #UK-DARK-2026-9912. Verified by Gram Pradhan.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.listing.verificationStatus).toBe('verification_pending');
      expect(res.body.data.listing.verificationHistory.length).toBe(1);
      expect(res.body.data.listing.verificationHistory[0].decision).toBe('submitted');
      expect(res.body.data.listing.verificationHistory[0].reviewedBy).toBe(hostUser.id);
    });
  });

  // ==========================================
  // 3. ADMINISTRATOR VERIFICATION WORKFLOW & AUDIT
  // ==========================================
  describe('3. Administrator Verification Workflow & RBAC', () => {
    it('GET /api/admin/verification-queue forbids non-admin users with 403', async () => {
      const resHost = await request(app)
        .get('/api/admin/verification-queue')
        .set('Cookie', [`staylocal_token=${hostToken}`]);
      expect(resHost.status).toBe(403);

      const resTourist = await request(app)
        .get('/api/admin/verification-queue')
        .set('Cookie', [`staylocal_token=${touristToken}`]);
      expect(resTourist.status).toBe(403);
    });

    it('GET /api/admin/verification-queue allows administrator and returns pending submissions', async () => {
      const pendingStay = {
        id: 'stay-pending-audit',
        name: 'Munsiari Pine Retreat',
        district: 'Pithoragarh',
        locality: 'Sarmoli',
        address: 'Pine Forest Trail',
        category: 'mountain_cottage',
        hostId: hostUser.id,
        verificationStatus: 'verification_pending',
        publicationStatus: 'published',
      };
      inMemoryStays.set(pendingStay.id, pendingStay);

      const res = await request(app)
        .get('/api/admin/verification-queue')
        .set('Cookie', [`staylocal_token=${adminToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.queue.length).toBeGreaterThanOrEqual(1);
    });

    it('POST /api/admin/listings/:id/verify approves listing, sets verified status, and logs audit decision', async () => {
      const stay = {
        id: 'stay-to-approve',
        name: 'Mesar Kund Eco Camp',
        district: 'Pithoragarh',
        locality: 'Sarmoli',
        address: 'Mesar Trail',
        category: 'eco_lodge',
        hostId: hostUser.id,
        verificationStatus: 'verification_pending',
        publicationStatus: 'published',
        verificationHistory: [],
      };
      inMemoryStays.set(stay.id, stay);

      const res = await request(app)
        .post(`/api/admin/listings/${stay.id}/verify`)
        .set('Cookie', [`staylocal_token=${adminToken}`])
        .send({
          action: 'approve',
          reason: 'Verified: On-site water safety certified and Panchayati residency validated.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.listing.verificationStatus).toBe('verified');
      expect(res.body.data.listing.publicationStatus).toBe('published');
      expect(res.body.data.listing.verificationHistory.length).toBe(1);
      expect(res.body.data.listing.verificationHistory[0].decision).toBe('approved');
      expect(res.body.data.listing.verificationHistory[0].reviewedBy).toBe(adminUser.id);
    });

    it('POST /api/admin/listings/:id/verify rejects listing and records feedback reason for the host', async () => {
      const stay = {
        id: 'stay-to-reject',
        name: 'Incomplete Safety Homestay',
        district: 'Nainital',
        locality: 'Pangot',
        address: 'Birding Valley',
        category: 'village_homestay',
        hostId: hostUser.id,
        verificationStatus: 'verification_pending',
        publicationStatus: 'published',
        verificationHistory: [],
      };
      inMemoryStays.set(stay.id, stay);

      const res = await request(app)
        .post(`/api/admin/listings/${stay.id}/verify`)
        .set('Cookie', [`staylocal_token=${adminToken}`])
        .send({
          action: 'reject',
          reason: 'Missing solar water heater and emergency mountain first-aid protocol.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.listing.verificationStatus).toBe('rejected_or_inactive');
      expect(res.body.data.listing.publicationStatus).toBe('draft');
      expect(res.body.data.listing.verificationHistory[0].decision).toBe('rejected');
      expect(res.body.data.listing.verificationNotes).toContain('Missing solar water heater');
    });

    it('POST /api/admin/listings/:id/suspend deactivates listing due to policy violation', async () => {
      const stay = {
        id: 'stay-to-suspend',
        name: 'Policy Violator Stay',
        district: 'Almora',
        locality: 'Binsar',
        address: 'Sanctuary Border',
        category: 'eco_lodge',
        hostId: hostUser.id,
        verificationStatus: 'verified',
        publicationStatus: 'published',
        verificationHistory: [],
      };
      inMemoryStays.set(stay.id, stay);

      const res = await request(app)
        .post(`/api/admin/listings/${stay.id}/suspend`)
        .set('Cookie', [`staylocal_token=${adminToken}`])
        .send({
          reason: 'Severe environmental infraction: Unauthorized wood cutting in sanctuary buffer zone.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.listing.verificationStatus).toBe('rejected_or_inactive');
      expect(res.body.data.listing.publicationStatus).toBe('archived');
      expect(res.body.data.listing.verificationHistory[0].decision).toBe('suspended');
    });
  });

  // ==========================================
  // 4. BOOKING ELIGIBILITY REVALIDATION & CONCURRENCY
  // ==========================================
  describe('4. Booking Eligibility Revalidation & Concurrency Lock', () => {
    it('POST /api/bookings strictly rejects booking attempts against unverified, rejected, suspended, or draft listings', async () => {
      const rejectedStay = {
        id: 'stay-rejected-book',
        name: 'Rejected Shed',
        district: 'Pithoragarh',
        locality: 'Munsiyari',
        address: 'Cliff',
        category: 'village_homestay',
        verificationStatus: 'rejected_or_inactive',
        publicationStatus: 'draft',
        pricePerNight: 1500,
        guestCapacity: { maxGuests: 2 },
      };
      inMemoryStays.set(rejectedStay.id, rejectedStay);

      const res = await request(app)
        .post('/api/bookings')
        .set('Cookie', [`staylocal_token=${touristToken}`])
        .send({
          stayId: rejectedStay.id,
          checkIn: '2026-12-01',
          checkOut: '2026-12-04',
          guestCount: 2,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('BAD_REQUEST');
      expect(res.body.error.message).toMatch(/only verified homestays can be booked/i);
    });

    it('PATCH /api/host/bookings/:id/confirm revalidates stay status and refuses confirmation if listing was suspended', async () => {
      const suspendedStay = {
        id: 'stay-suspended-midway',
        name: 'Suspended Ridge Stay',
        district: 'Pithoragarh',
        locality: 'Sarmoli',
        address: 'Ridge',
        category: 'village_homestay',
        hostId: hostUser.id,
        verificationStatus: 'rejected_or_inactive', // suspended
        publicationStatus: 'archived',
        guestCapacity: { maxGuests: 4 },
      };
      inMemoryStays.set(suspendedStay.id, suspendedStay);

      const pendingBooking = {
        id: 'bk_pending_on_suspended',
        bookingReference: 'SLB-SUSP01',
        stayId: suspendedStay.id,
        hostId: hostUser.id,
        touristId: touristUser.id,
        status: 'pending',
        checkIn: new Date(Date.UTC(2026, 11, 10)),
        checkOut: new Date(Date.UTC(2026, 11, 13)),
      };
      inMemoryBookings.set(pendingBooking.id, pendingBooking);

      const res = await request(app)
        .patch(`/api/host/bookings/${pendingBooking.id}/confirm`)
        .set('Cookie', [`staylocal_token=${hostToken}`]);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('BAD_REQUEST');
      expect(res.body.error.message).toMatch(/only verified listings can confirm reservations/i);
    });

    it('PATCH /api/host/bookings/:id/confirm prevents concurrent overlapping confirmations via atomic lock', async () => {
      const stay = {
        id: 'stay-concurrency-test',
        name: 'Chir Pine Homestay',
        district: 'Pithoragarh',
        locality: 'Sarmoli',
        address: 'Trail 2',
        category: 'village_homestay',
        hostId: hostUser.id,
        verificationStatus: 'verified',
        publicationStatus: 'published',
        guestCapacity: { maxGuests: 4 },
        confirmationLock: false,
      };
      inMemoryStays.set(stay.id, stay);

      // Two pending booking requests for overlapping dates
      const booking1 = {
        id: 'bk_concurrent_01',
        bookingReference: 'SLB-CONC01',
        stayId: stay.id,
        hostId: hostUser.id,
        touristId: touristUser.id,
        status: 'pending',
        checkIn: new Date(Date.UTC(2026, 11, 15)),
        checkOut: new Date(Date.UTC(2026, 11, 18)),
      };
      const booking2 = {
        id: 'bk_concurrent_02',
        bookingReference: 'SLB-CONC02',
        stayId: stay.id,
        hostId: hostUser.id,
        touristId: touristUser.id,
        status: 'pending',
        checkIn: new Date(Date.UTC(2026, 11, 16)),
        checkOut: new Date(Date.UTC(2026, 11, 19)),
      };
      inMemoryBookings.set(booking1.id, booking1);
      inMemoryBookings.set(booking2.id, booking2);

      // Confirm booking1 first
      const res1 = await request(app)
        .patch(`/api/host/bookings/${booking1.id}/confirm`)
        .set('Cookie', [`staylocal_token=${hostToken}`]);

      expect(res1.status).toBe(200);
      expect(res1.body.success).toBe(true);
      expect(res1.body.data.booking.status).toBe('confirmed');

      // Attempt to confirm overlapping booking2 -> MUST fail with 409 Conflict
      const res2 = await request(app)
        .patch(`/api/host/bookings/${booking2.id}/confirm`)
        .set('Cookie', [`staylocal_token=${hostToken}`]);

      expect(res2.status).toBe(409);
      expect(res2.body.error.code).toBe('CONFLICT');
      expect(res2.body.error.message).toMatch(/conflicting dates overlap/i);
    });
  });
});
