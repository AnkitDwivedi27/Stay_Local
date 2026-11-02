import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { calculateBookingPrice } from '../src/services/booking.service';
import { createBookingSchema } from '../src/validators/booking.validator';
import { AuthService } from '../src/services/auth.service';
import { StayModel } from '../src/models/stay.model';
import { BookingModel } from '../src/models/booking.model';
import { signToken } from '../src/utils/token';
import { BookingRecord, AuthUser } from '../src/types';

describe('StayLocal Booking Management, Availability & RBAC Tests', () => {
  // Test Users
  const touristUser: AuthUser = {
    id: 'usr_tourist_101',
    fullName: 'Aarav Sharma',
    email: 'aarav@bookingtest.staylocal.in',
    role: 'tourist',
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const otherTouristUser: AuthUser = {
    id: 'usr_tourist_102',
    fullName: 'Priya Mehra',
    email: 'priya@bookingtest.staylocal.in',
    role: 'tourist',
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const hostUser: AuthUser = {
    id: 'usr_host_201',
    fullName: 'Kundan Singh Rawat',
    email: 'kundan@bookingtest.staylocal.in',
    role: 'host',
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const otherHostUser: AuthUser = {
    id: 'usr_host_202',
    fullName: 'Harish Joshi',
    email: 'harish@bookingtest.staylocal.in',
    role: 'host',
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const touristToken = signToken({ id: touristUser.id, email: touristUser.email, role: touristUser.role });
  const otherTouristToken = signToken({ id: otherTouristUser.id, email: otherTouristUser.email, role: otherTouristUser.role });
  const hostToken = signToken({ id: hostUser.id, email: hostUser.email, role: hostUser.role });
  const otherHostToken = signToken({ id: otherHostUser.id, email: otherHostUser.email, role: otherHostUser.role });

  // Test Stays
  const verifiedStay = {
    id: 'stay-test-verified-01',
    name: 'Panchachuli Foothills Cottage',
    description: 'Charming stone cottage with orchard views in Sarmoli.',
    district: 'Pithoragarh',
    locality: 'Sarmoli',
    address: 'Upper Sarmoli, Munsiyari, Uttarakhand',
    category: 'village_homestay',
    verificationStatus: 'verified',
    publicationStatus: 'published',
    pricePerNight: 2000,
    hostId: hostUser.id,
    guestCapacity: {
      maxGuests: 4,
      roomCount: 2,
    },
  };

  const unverifiedStay = {
    id: 'stay-test-unverified-01',
    name: 'Unverified Forest Shed Lead',
    description: 'Unverified directory listing.',
    district: 'Nainital',
    locality: 'Mukteshwar',
    address: 'Unknown Ridge',
    category: 'eco_lodge',
    verificationStatus: 'unverified_lead',
    publicationStatus: 'published',
    pricePerNight: 1500,
    guestCapacity: {
      maxGuests: 2,
    },
  };

  // In-Memory Booking Store for isolated test execution
  let inMemoryBookings: Map<string, any>;

  beforeEach(() => {
    vi.restoreAllMocks();
    inMemoryBookings = new Map();

    // Mock AuthService.getCurrentUser to resolve test users
    vi.spyOn(AuthService, 'getCurrentUser').mockImplementation(async (userId: string) => {
      if (userId === touristUser.id) return touristUser;
      if (userId === otherTouristUser.id) return otherTouristUser;
      if (userId === hostUser.id) return hostUser;
      if (userId === otherHostUser.id) return otherHostUser;
      throw new Error('User not found');
    });

    // Mock StayModel.findOne
    vi.spyOn(StayModel, 'findOne').mockImplementation((query: any) => {
      const id = query?.id?.toLowerCase ? query.id.toLowerCase() : query?.id;
      let stay = null;
      if (id === verifiedStay.id) stay = verifiedStay;
      if (id === unverifiedStay.id) stay = unverifiedStay;

      return {
        exec: async () => stay,
        then: (resolve: any) => Promise.resolve(stay).then(resolve),
      } as any;
    });

    // Mock StayModel.find
    vi.spyOn(StayModel, 'find').mockImplementation((query: any) => {
      let stays = [verifiedStay, unverifiedStay];
      if (query?.hostId) {
        stays = stays.filter((s) => s.hostId === query.hostId);
      }
      return {
        exec: async () => stays,
        then: (resolve: any) => Promise.resolve(stays).then(resolve),
      } as any;
    });

    // Mock StayModel.findOneAndUpdate and updateOne for atomic concurrency lock
    vi.spyOn(StayModel, 'findOneAndUpdate').mockImplementation(async (query: any) => {
      const id = query?.id?.toLowerCase ? query.id.toLowerCase() : query?.id;
      let stay = null;
      if (id === verifiedStay.id) stay = verifiedStay;
      if (id === unverifiedStay.id) stay = unverifiedStay;
      return stay as any;
    });

    vi.spyOn(StayModel, 'updateOne').mockImplementation(async () => {
      return { acknowledged: true } as any;
    });

    // Mock BookingModel constructor / save
    vi.spyOn(BookingModel.prototype, 'save').mockImplementation(async function (this: any) {
      const record = {
        ...this.toObject ? this.toObject() : this,
        toJSON() {
          const res = { ...this };
          delete res._id;
          delete res.__v;
          if (res.checkIn instanceof Date) {
            res.checkIn = res.checkIn.toISOString().split('T')[0];
          }
          if (res.checkOut instanceof Date) {
            res.checkOut = res.checkOut.toISOString().split('T')[0];
          }
          return res;
        },
      };
      inMemoryBookings.set(record.id, record);
      return record;
    });

    // Mock BookingModel.findOne
    vi.spyOn(BookingModel, 'findOne').mockImplementation((query: any) => {
      let found: any = null;

      for (const b of inMemoryBookings.values()) {
        if (query.id && query.id.$ne && b.id === query.id.$ne) continue;
        if (query.id && !query.id.$ne && b.id !== query.id) continue;
        if (query.bookingReference && b.bookingReference !== query.bookingReference) continue;
        if (query.stayId && b.stayId !== query.stayId) continue;
        if (query.status && b.status !== query.status) continue;

        // Date overlap check: existing.checkIn < new.checkOut && existing.checkOut > new.checkIn
        if (query.checkIn && query.checkIn.$lt && query.checkOut && query.checkOut.$gt) {
          const reqCheckOut = query.checkIn.$lt instanceof Date ? query.checkIn.$lt : new Date(query.checkIn.$lt);
          const reqCheckIn = query.checkOut.$gt instanceof Date ? query.checkOut.$gt : new Date(query.checkOut.$gt);
          const bCheckIn = b.checkIn instanceof Date ? b.checkIn : new Date(b.checkIn);
          const bCheckOut = b.checkOut instanceof Date ? b.checkOut : new Date(b.checkOut);

          const overlaps = bCheckIn.getTime() < reqCheckOut.getTime() && bCheckOut.getTime() > reqCheckIn.getTime();
          if (!overlaps) continue;
        }

        found = b;
        break;
      }

      return {
        exec: async () => found,
        then: (resolve: any) => Promise.resolve(found).then(resolve),
      } as any;
    });

    // Mock BookingModel.find
    vi.spyOn(BookingModel, 'find').mockImplementation((query: any) => {
      let list = Array.from(inMemoryBookings.values());
      if (query?.touristId) {
        list = list.filter((b) => b.touristId === query.touristId);
      }
      if (query?.$or) {
        list = list.filter((b) => {
          return query.$or.some((clause: any) => {
            if (clause.hostId && b.hostId === clause.hostId) return true;
            if (clause.stayId && clause.stayId.$in && clause.stayId.$in.includes(b.stayId)) return true;
            return false;
          });
        });
      }

      const sortMock = {
        sort: () => list.map((item) => ({
          ...item,
          toJSON() {
            const res = { ...item };
            delete res._id;
            delete res.__v;
            if (res.checkIn instanceof Date) {
              res.checkIn = res.checkIn.toISOString().split('T')[0];
            }
            if (res.checkOut instanceof Date) {
              res.checkOut = res.checkOut.toISOString().split('T')[0];
            }
            return res;
          },
        })),
      };

      return sortMock as any;
    });

    // Mock BookingModel.findOneAndUpdate
    vi.spyOn(BookingModel, 'findOneAndUpdate').mockImplementation((query: any, update: any) => {
      const b = inMemoryBookings.get(query.id);
      if (!b) return Promise.resolve(null) as any;
      if (query.status && b.status !== query.status) return Promise.resolve(null) as any;

      if (update.$set) {
        Object.assign(b, update.$set);
      }
      return Promise.resolve({
        ...b,
        toJSON() {
          const res = { ...b };
          delete res._id;
          delete res.__v;
          if (res.checkIn instanceof Date) {
            res.checkIn = res.checkIn.toISOString().split('T')[0];
          }
          if (res.checkOut instanceof Date) {
            res.checkOut = res.checkOut.toISOString().split('T')[0];
          }
          return res;
        },
      }) as any;
    });
  });

  describe('1. Pure Function: Server-Side Price Calculation', () => {
    it('calculates accurate base, 5% community fee, 5% tax, and total amount in INR', () => {
      const checkIn = new Date(Date.UTC(2026, 10, 10)); // Nov 10
      const checkOut = new Date(Date.UTC(2026, 10, 13)); // Nov 13 (3 nights)
      const pricePerNight = 2000;

      const breakdown = calculateBookingPrice(pricePerNight, checkIn, checkOut);

      expect(breakdown.nights).toBe(3);
      expect(breakdown.pricePerNight).toBe(2000);
      expect(breakdown.baseAmount).toBe(6000); // 2000 * 3
      expect(breakdown.communityFee).toBe(300); // 5% of 6000
      expect(breakdown.taxAmount).toBe(300); // 5% of 6000
      expect(breakdown.totalAmount).toBe(6600); // 6000 + 300 + 300
      expect(breakdown.currency).toBe('INR');
    });

    it('throws error when check-out date is not at least 1 night after check-in', () => {
      const checkIn = new Date(Date.UTC(2026, 10, 10));
      const checkOut = new Date(Date.UTC(2026, 10, 10)); // 0 nights

      expect(() => calculateBookingPrice(1800, checkIn, checkOut)).toThrow(
        /at least 1 night after check-in/i
      );
    });
  });

  describe('2. Zod Booking Validator Schema', () => {
    it('validates correct booking payload', () => {
      const payload = {
        stayId: 'stay-test-verified-01',
        checkIn: '2026-11-20',
        checkOut: '2026-11-23',
        guestCount: 2,
        specialRequests: 'Need organic Kumaoni meals',
      };

      const result = createBookingSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('rejects payload when check-out date is before check-in date', () => {
      const payload = {
        stayId: 'stay-test-verified-01',
        checkIn: '2026-11-25',
        checkOut: '2026-11-20',
        guestCount: 2,
      };

      const result = createBookingSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toMatch(/strictly after/i);
      }
    });

    it('rejects guest count greater than maximum allowed limit', () => {
      const payload = {
        stayId: 'stay-test-verified-01',
        checkIn: '2026-11-20',
        checkOut: '2026-11-23',
        guestCount: 25, // > 20
      };

      const result = createBookingSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toMatch(/cannot exceed 20/i);
      }
    });
  });

  describe('3. Booking Creation API Endpoints', () => {
    it('POST /api/bookings creates a pending booking with SLB- reference and server-calculated price', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Cookie', [`staylocal_token=${touristToken}`])
        .send({
          stayId: verifiedStay.id,
          checkIn: '2026-11-10',
          checkOut: '2026-11-13',
          guestCount: 2,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      const booking: BookingRecord = res.body.data.booking;
      expect(booking.bookingReference).toMatch(/^SLB-[A-Z0-9]{6}$/);
      expect(booking.status).toBe('pending');
      expect(booking.touristId).toBe(touristUser.id);
      expect(booking.stayId).toBe(verifiedStay.id);
      expect(booking.pricing.nights).toBe(3);
      expect(booking.pricing.totalAmount).toBe(6600);
    });

    it('POST /api/bookings returns 401 when unauthenticated', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .send({
          stayId: verifiedStay.id,
          checkIn: '2026-11-10',
          checkOut: '2026-11-13',
          guestCount: 2,
        });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('POST /api/bookings returns 403 when host role attempts to book via tourist endpoint', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Cookie', [`staylocal_token=${hostToken}`])
        .send({
          stayId: verifiedStay.id,
          checkIn: '2026-11-10',
          checkOut: '2026-11-13',
          guestCount: 2,
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('POST /api/bookings rejects booking on an unverified listing with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Cookie', [`staylocal_token=${touristToken}`])
        .send({
          stayId: unverifiedStay.id,
          checkIn: '2026-11-10',
          checkOut: '2026-11-13',
          guestCount: 1,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/unverified_lead.*cannot accept direct booking/i);
    });

    it('POST /api/bookings rejects guest count exceeding stay capacity with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Cookie', [`staylocal_token=${touristToken}`])
        .send({
          stayId: verifiedStay.id,
          checkIn: '2026-11-10',
          checkOut: '2026-11-13',
          guestCount: 8, // max capacity is 4
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/exceeds maximum capacity of 4/i);
    });
  });

  describe('4. Double Booking Prevention & Concurrency Overlap Check', () => {
    it('blocks new booking request if dates overlap with a confirmed reservation (409 Conflict)', async () => {
      // 1. Manually add an existing confirmed reservation
      const existingConfirmed = {
        id: 'bk_confirmed_001',
        bookingReference: 'SLB-CONF01',
        touristId: otherTouristUser.id,
        stayId: verifiedStay.id,
        status: 'confirmed',
        checkIn: new Date(Date.UTC(2026, 10, 15)), // Nov 15
        checkOut: new Date(Date.UTC(2026, 10, 18)), // Nov 18
        guestCount: 2,
        pricing: {
          nights: 3,
          pricePerNight: 2000,
          baseAmount: 6000,
          communityFee: 300,
          taxAmount: 300,
          totalAmount: 6600,
          currency: 'INR',
        },
      };
      inMemoryBookings.set(existingConfirmed.id, existingConfirmed);

      // 2. Tourist attempts overlapping dates: Nov 16 to Nov 19
      const res = await request(app)
        .post('/api/bookings')
        .set('Cookie', [`staylocal_token=${touristToken}`])
        .send({
          stayId: verifiedStay.id,
          checkIn: '2026-11-16',
          checkOut: '2026-11-19',
          guestCount: 2,
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
      expect(res.body.error.message).toMatch(/overlap with an existing confirmed reservation/i);
    });

    it('allows contiguous adjacent bookings where checkout date equals next checkin date', async () => {
      const existingConfirmed = {
        id: 'bk_confirmed_002',
        bookingReference: 'SLB-CONF02',
        touristId: otherTouristUser.id,
        stayId: verifiedStay.id,
        status: 'confirmed',
        checkIn: new Date(Date.UTC(2026, 10, 15)),
        checkOut: new Date(Date.UTC(2026, 10, 18)),
        guestCount: 2,
        pricing: {
          nights: 3,
          pricePerNight: 2000,
          baseAmount: 6000,
          communityFee: 300,
          taxAmount: 300,
          totalAmount: 6600,
          currency: 'INR',
        },
      };
      inMemoryBookings.set(existingConfirmed.id, existingConfirmed);

      // New booking starts Nov 18 (same day as checkout)
      const res = await request(app)
        .post('/api/bookings')
        .set('Cookie', [`staylocal_token=${touristToken}`])
        .send({
          stayId: verifiedStay.id,
          checkIn: '2026-11-18',
          checkOut: '2026-11-21',
          guestCount: 2,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });

  describe('5. Participant Ownership & ID-Based Isolation', () => {
    it('GET /api/bookings/my returns only bookings created by the authenticated tourist', async () => {
      const myBooking = {
        id: 'bk_my_001',
        bookingReference: 'SLB-MY001',
        touristId: touristUser.id,
        stayId: verifiedStay.id,
        status: 'pending',
      };
      const othersBooking = {
        id: 'bk_other_002',
        bookingReference: 'SLB-OTH002',
        touristId: otherTouristUser.id,
        stayId: verifiedStay.id,
        status: 'pending',
      };
      inMemoryBookings.set(myBooking.id, myBooking);
      inMemoryBookings.set(othersBooking.id, othersBooking);

      const res = await request(app)
        .get('/api/bookings/my')
        .set('Cookie', [`staylocal_token=${touristToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.bookings.length).toBe(1);
      expect(res.body.data.bookings[0].id).toBe('bk_my_001');
    });

    it('GET /api/bookings/:id rejects unauthorized third party with 403 Forbidden', async () => {
      const booking = {
        id: 'bk_secret_001',
        bookingReference: 'SLB-SEC001',
        touristId: touristUser.id,
        hostId: hostUser.id,
        stayId: verifiedStay.id,
        status: 'pending',
        toJSON() { return this; },
      };
      inMemoryBookings.set(booking.id, booking);

      // otherTourist attempts to access
      const res = await request(app)
        .get(`/api/bookings/${booking.id}`)
        .set('Cookie', [`staylocal_token=${otherTouristToken}`]);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('6. Host Booking Management & Status Transitions', () => {
    it('PATCH /api/host/bookings/:id/confirm transitions pending booking to confirmed', async () => {
      const pendingBooking = {
        id: 'bk_pending_001',
        bookingReference: 'SLB-PEND01',
        touristId: touristUser.id,
        hostId: hostUser.id,
        stayId: verifiedStay.id,
        status: 'pending',
        checkIn: new Date(Date.UTC(2026, 11, 1)),
        checkOut: new Date(Date.UTC(2026, 11, 4)),
        toJSON() { return this; },
      };
      inMemoryBookings.set(pendingBooking.id, pendingBooking);

      const res = await request(app)
        .patch(`/api/host/bookings/${pendingBooking.id}/confirm`)
        .set('Cookie', [`staylocal_token=${hostToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.booking.status).toBe('confirmed');
      expect(res.body.data.booking.confirmedAt).toBeDefined();
    });

    it('PATCH /api/host/bookings/:id/confirm blocks confirmation if overlapping reservation was already confirmed', async () => {
      const confirmedBooking = {
        id: 'bk_conf_overlap',
        bookingReference: 'SLB-CONF99',
        stayId: verifiedStay.id,
        status: 'confirmed',
        checkIn: new Date(Date.UTC(2026, 11, 2)),
        checkOut: new Date(Date.UTC(2026, 11, 5)),
        toJSON() { return this; },
      };
      inMemoryBookings.set(confirmedBooking.id, confirmedBooking);

      const pendingBooking = {
        id: 'bk_pending_overlap',
        bookingReference: 'SLB-PEND99',
        hostId: hostUser.id,
        stayId: verifiedStay.id,
        status: 'pending',
        checkIn: new Date(Date.UTC(2026, 11, 1)),
        checkOut: new Date(Date.UTC(2026, 11, 4)),
        toJSON() { return this; },
      };
      inMemoryBookings.set(pendingBooking.id, pendingBooking);

      const res = await request(app)
        .patch(`/api/host/bookings/${pendingBooking.id}/confirm`)
        .set('Cookie', [`staylocal_token=${hostToken}`]);

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
      expect(res.body.error.message).toMatch(/conflicting dates overlap/i);
    });

    it('PATCH /api/host/bookings/:id/confirm forbids a host who does not own the stay with 403 Forbidden', async () => {
      const pendingBooking = {
        id: 'bk_unauth_host_01',
        bookingReference: 'SLB-UNAUTH01',
        touristId: touristUser.id,
        hostId: hostUser.id,
        stayId: verifiedStay.id,
        status: 'pending',
        checkIn: new Date(Date.UTC(2026, 11, 1)),
        checkOut: new Date(Date.UTC(2026, 11, 4)),
        toJSON() { return this; },
      };
      inMemoryBookings.set(pendingBooking.id, pendingBooking);

      const res = await request(app)
        .patch(`/api/host/bookings/${pendingBooking.id}/confirm`)
        .set('Cookie', [`staylocal_token=${otherHostToken}`]);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('PATCH /api/host/bookings/:id/reject declines a pending booking request', async () => {
      const pendingBooking = {
        id: 'bk_pending_reject',
        bookingReference: 'SLB-REJ001',
        touristId: touristUser.id,
        hostId: hostUser.id,
        stayId: verifiedStay.id,
        status: 'pending',
        checkIn: new Date(Date.UTC(2026, 11, 10)),
        checkOut: new Date(Date.UTC(2026, 11, 13)),
        save: async function () { return this; },
        toJSON() { return this; },
      };
      inMemoryBookings.set(pendingBooking.id, pendingBooking);

      const res = await request(app)
        .patch(`/api/host/bookings/${pendingBooking.id}/reject`)
        .set('Cookie', [`staylocal_token=${hostToken}`])
        .send({ reason: 'Family attending community festival' });

      expect(res.status).toBe(200);
      expect(res.body.data.booking.status).toBe('rejected');
      expect(res.body.data.booking.cancellationReason).toBe('Family attending community festival');
    });

    it('PATCH /api/bookings/:id/cancel allows tourist to cancel their pending booking', async () => {
      const pendingBooking = {
        id: 'bk_cancel_test',
        bookingReference: 'SLB-CAN001',
        touristId: touristUser.id,
        hostId: hostUser.id,
        stayId: verifiedStay.id,
        status: 'pending',
        checkIn: new Date(Date.UTC(2026, 11, 10)),
        checkOut: new Date(Date.UTC(2026, 11, 13)),
        save: async function () { return this; },
        toJSON() { return this; },
      };
      inMemoryBookings.set(pendingBooking.id, pendingBooking);

      const res = await request(app)
        .patch(`/api/bookings/${pendingBooking.id}/cancel`)
        .set('Cookie', [`staylocal_token=${touristToken}`])
        .send({ reason: 'Flight delayed' });

      expect(res.status).toBe(200);
      expect(res.body.data.booking.status).toBe('cancelled');
    });

    it('PATCH /api/host/bookings/:id/confirm refuses to confirm an already cancelled booking', async () => {
      const cancelledBooking = {
        id: 'bk_cancelled_001',
        bookingReference: 'SLB-CAN002',
        hostId: hostUser.id,
        stayId: verifiedStay.id,
        status: 'cancelled',
        checkIn: new Date(Date.UTC(2026, 11, 10)),
        checkOut: new Date(Date.UTC(2026, 11, 13)),
        toJSON() { return this; },
      };
      inMemoryBookings.set(cancelledBooking.id, cancelledBooking);

      const res = await request(app)
        .patch(`/api/host/bookings/${cancelledBooking.id}/confirm`)
        .set('Cookie', [`staylocal_token=${hostToken}`]);

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/cannot confirm a booking that has been cancelled/i);
    });
  });
});
