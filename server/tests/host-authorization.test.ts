import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { AuthService } from '../src/services/auth.service';
import { StayModel } from '../src/models/stay.model';
import { BookingModel } from '../src/models/booking.model';
import { signToken } from '../src/utils/token';
import { AuthUser } from '../src/types';
import * as dbConfig from '../src/config/db';

describe('Host Authorization Verification & Document Security for Preloaded Homestays', () => {
  const assignedHostUser: AuthUser = {
    id: 'usr_host_assigned_501',
    fullName: 'Lalit Singh Bisht',
    email: 'lalit@sarmoli.org',
    role: 'host',
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const otherHostUser: AuthUser = {
    id: 'usr_host_other_502',
    fullName: 'Ramesh Chandra',
    email: 'ramesh@darkot.org',
    role: 'host',
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const adminUser: AuthUser = {
    id: 'usr_admin_503',
    fullName: 'State Tourism Board Admin',
    email: 'admin@staylocal.org',
    role: 'admin',
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const touristUser: AuthUser = {
    id: 'usr_tourist_504',
    fullName: 'Aarav Mehta',
    email: 'aarav@tourist.org',
    role: 'tourist',
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const assignedHostToken = signToken({ id: assignedHostUser.id, email: assignedHostUser.email, role: assignedHostUser.role });
  const otherHostToken = signToken({ id: otherHostUser.id, email: otherHostUser.email, role: otherHostUser.role });
  const adminToken = signToken({ id: adminUser.id, email: adminUser.email, role: adminUser.role });
  const touristToken = signToken({ id: touristUser.id, email: touristUser.email, role: touristUser.role });

  let inMemoryStays: Map<string, any>;

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

  const samplePreloadedStay = {
    id: 'stay_sarmoli_heritage_01',
    name: 'Sarmoli Traditional Himalayan Homestay',
    description: 'Authentic 120-year-old stone and deodar wood house overlooking Panchachuli peaks.',
    district: 'Pithoragarh',
    locality: 'Sarmoli Village, Munsiari',
    address: 'Near Nanda Devi Temple trail, Sarmoli, Munsiari, Uttarakhand 262554',
    category: 'heritage_farmstay',
    pricePerNight: 2400,
    guestCapacity: { maxGuests: 6, roomCount: 3 },
    amenities: ['Home-cooked Kumaoni Meals', 'Mountain View', 'Hot Water', 'Guided Village Walks'],
    images: ['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80'],
    isPreloaded: true,
    assignmentStatus: 'assigned',
    assignedHostId: assignedHostUser.id,
    assignedHostName: assignedHostUser.fullName,
    assignedHostEmail: assignedHostUser.email,
    assignedAt: new Date(),
    hostId: assignedHostUser.id,
    verificationStatus: 'unverified_lead',
    publicationStatus: 'draft',
    verificationHistory: [],
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(dbConfig, 'isDatabaseConnected').mockReturnValue(true);
    vi.spyOn(BookingModel, 'countDocuments').mockResolvedValue(0 as any);

    // Mock AuthService.getCurrentUser for authentication middleware
    vi.spyOn(AuthService, 'getCurrentUser').mockImplementation(async (userId: string) => {
      if (userId === assignedHostUser.id) return assignedHostUser;
      if (userId === otherHostUser.id) return otherHostUser;
      if (userId === adminUser.id) return adminUser;
      if (userId === touristUser.id) return touristUser;
      throw new Error('User not found');
    });

    inMemoryStays = new Map<string, any>();
    inMemoryStays.set(samplePreloadedStay.id, { ...samplePreloadedStay });

    // Mock StayModel find methods
    vi.spyOn(StayModel, 'findOne').mockImplementation(((query: any) => {
      const stayId = query.id?.toLowerCase?.() || query.id;
      const stay = inMemoryStays.get(stayId);
      return Promise.resolve(stay ? createMockStayDoc(stay) : null);
    }) as any);

    vi.spyOn(StayModel, 'find').mockImplementation(((query: any) => {
      let results = Array.from(inMemoryStays.values());
      if (query?.hostId) {
        results = results.filter((s) => s.hostId === query.hostId);
      }
      if (query?.verificationStatus) {
        if (typeof query.verificationStatus === 'object' && query.verificationStatus.$in) {
          results = results.filter((s) => query.verificationStatus.$in.includes(s.verificationStatus));
        } else {
          results = results.filter((s) => s.verificationStatus === query.verificationStatus);
        }
      }
      return {
        sort: () => Promise.resolve(results.map(createMockStayDoc)),
      } as any;
    }) as any);
  });

  describe('1. Preloaded Homestay Information Visibility', () => {
    it('allows assigned host to retrieve their assigned listing with all preloaded details intact', async () => {
      const res = await request(app)
        .get(`/api/host/listings/${samplePreloadedStay.id}`)
        .set('Cookie', [`staylocal_token=${assignedHostToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.listing.name).toBe('Sarmoli Traditional Himalayan Homestay');
      expect(res.body.data.listing.district).toBe('Pithoragarh');
      expect(res.body.data.listing.category).toBe('heritage_farmstay');
      expect(res.body.data.listing.pricePerNight).toBe(2400);
      expect(res.body.data.listing.guestCapacity.maxGuests).toBe(6);
      expect(res.body.data.listing.amenities).toContain('Home-cooked Kumaoni Meals');
      expect(res.body.data.listing.isPreloaded).toBe(true);
    });

    it('rejects another host from viewing the assigned homestay', async () => {
      const res = await request(app)
        .get(`/api/host/listings/${samplePreloadedStay.id}`)
        .set('Cookie', [`staylocal_token=${otherHostToken}`]);

      expect(res.status).toBe(403);
    });
  });

  describe('2. Host Authorization Submission Workflow', () => {
    it('rejects verification submission without declaration confirmation', async () => {
      const res = await request(app)
        .post(`/api/host/listings/${samplePreloadedStay.id}/submit-verification`)
        .set('Cookie', [`staylocal_token=${assignedHostToken}`])
        .send({
          relationship: 'owner',
          declarationConfirmed: false,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/declaration/i);
    });

    it('rejects "other" relationship without explanation', async () => {
      const res = await request(app)
        .post(`/api/host/listings/${samplePreloadedStay.id}/submit-verification`)
        .set('Cookie', [`staylocal_token=${assignedHostToken}`])
        .send({
          relationship: 'other',
          declarationConfirmed: true,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/explanation/i);
    });

    it('submits authorization with documents, transitions status to verification_pending, and strips filePath', async () => {
      // Create a small mock base64 PDF string
      const mockPdfDataUrl = 'data:application/pdf;base64,JVBERi0xLjUKJUZha2UgUERGIGNvbnRlbnQgZm9yIHRlc3Rpbmc=';

      const res = await request(app)
        .post(`/api/host/listings/${samplePreloadedStay.id}/submit-verification`)
        .set('Cookie', [`staylocal_token=${assignedHostToken}`])
        .send({
          relationship: 'authorized_manager',
          relationshipExplanation: 'Authorized by village pradhan and family owners.',
          notes: 'Submitting power of attorney and electricity bill for address verification.',
          declarationConfirmed: true,
          documents: [
            {
              fileName: 'authorization_letter.pdf',
              fileType: 'application/pdf',
              fileSize: 1024,
              documentType: 'owner_authorization',
              dataUrl: mockPdfDataUrl,
            },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.listing.verificationStatus).toBe('verification_pending');
      expect(res.body.data.listing.publicationStatus).toBe('draft');
      expect(res.body.data.listing.hostAuthorization).toBeDefined();
      expect(res.body.data.listing.hostAuthorization.relationship).toBe('authorized_manager');
      expect(res.body.data.listing.hostAuthorization.declarationConfirmed).toBe(true);

      // Verify documents were sanitized: no local filePath exposed in public/API response
      const docs = res.body.data.listing.hostAuthorization.documents;
      expect(docs).toHaveLength(1);
      expect(docs[0].fileName).toBe('authorization_letter.pdf');
      expect(docs[0].documentType).toBe('owner_authorization');
      expect(docs[0].downloadUrl).toBeDefined();
      expect(docs[0].filePath).toBeUndefined();
    });
  });

  describe('3. Verification Document Access Control & Protection', () => {
    let documentId: string;

    beforeEach(async () => {
      const mockPdfDataUrl = 'data:application/pdf;base64,JVBERi0xLjUKJUZha2UgUERGIGNvbnRlbnQgZm9yIHRlc3Rpbmc=';
      const submitRes = await request(app)
        .post(`/api/host/listings/${samplePreloadedStay.id}/submit-verification`)
        .set('Cookie', [`staylocal_token=${assignedHostToken}`])
        .send({
          relationship: 'owner',
          declarationConfirmed: true,
          documents: [
            {
              fileName: 'revenue_deed.pdf',
              fileType: 'application/pdf',
              fileSize: 2048,
              documentType: 'ownership_document',
              dataUrl: mockPdfDataUrl,
            },
          ],
        });
      documentId = submitRes.body.data.listing.hostAuthorization.documents[0].id;
    });

    it('allows assigned host to download their own verification document', async () => {
      const res = await request(app)
        .get(`/api/host/verification-documents/${samplePreloadedStay.id}/${documentId}`)
        .set('Cookie', [`staylocal_token=${assignedHostToken}`]);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/pdf/);
      expect(res.headers['content-disposition']).toMatch(/inline/);
    });

    it('allows administrator to download the verification document', async () => {
      const res = await request(app)
        .get(`/api/admin/verification-documents/${samplePreloadedStay.id}/${documentId}`)
        .set('Cookie', [`staylocal_token=${adminToken}`]);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/pdf/);
    });

    it('denies another host from downloading the private document (403 Forbidden)', async () => {
      const res = await request(app)
        .get(`/api/host/verification-documents/${samplePreloadedStay.id}/${documentId}`)
        .set('Cookie', [`staylocal_token=${otherHostToken}`]);

      expect(res.status).toBe(403);
    });

    it('denies tourists from accessing verification documents (403 Forbidden)', async () => {
      const res = await request(app)
        .get(`/api/host/verification-documents/${samplePreloadedStay.id}/${documentId}`)
        .set('Cookie', [`staylocal_token=${touristToken}`]);

      expect(res.status).toBe(403);
    });

    it('denies unauthenticated requests (401 Unauthorized)', async () => {
      const res = await request(app)
        .get(`/api/host/verification-documents/${samplePreloadedStay.id}/${documentId}`);

      expect(res.status).toBe(401);
    });
  });

  describe('4. Admin Request Information & Approval Workflow', () => {
    beforeEach(async () => {
      const mockPdfDataUrl = 'data:application/pdf;base64,JVBERi0xLjUKJUZha2UgUERGIGNvbnRlbnQgZm9yIHRlc3Rpbmc=';
      await request(app)
        .post(`/api/host/listings/${samplePreloadedStay.id}/submit-verification`)
        .set('Cookie', [`staylocal_token=${assignedHostToken}`])
        .send({
          relationship: 'family_member',
          relationshipExplanation: 'Son of property owner.',
          declarationConfirmed: true,
          documents: [
            {
              fileName: 'family_tree_cert.pdf',
              fileType: 'application/pdf',
              fileSize: 1024,
              documentType: 'other_evidence',
              dataUrl: mockPdfDataUrl,
            },
          ],
        });
    });

    it('allows admin to request additional information with a mandatory reason', async () => {
      const res = await request(app)
        .post(`/api/admin/listings/${samplePreloadedStay.id}/verify`)
        .set('Cookie', [`staylocal_token=${adminToken}`])
        .send({
          action: 'request_info',
          reason: 'Please upload owner authorization letter signed by your mother.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.listing.verificationStatus).toBe('verification_pending');
      expect(res.body.data.listing.nextVerificationStep).toMatch(/owner authorization letter/i);
    });

    it('allows host to supplement existing documents without losing previously uploaded documents', async () => {
      // First admin requests info
      await request(app)
        .post(`/api/admin/listings/${samplePreloadedStay.id}/verify`)
        .set('Cookie', [`staylocal_token=${adminToken}`])
        .send({
          action: 'request_info',
          reason: 'Please upload owner authorization letter signed by your mother.',
        });

      // Host uploads supplementary document
      const mockPngDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
      const supplementRes = await request(app)
        .post(`/api/host/listings/${samplePreloadedStay.id}/submit-verification`)
        .set('Cookie', [`staylocal_token=${assignedHostToken}`])
        .send({
          relationship: 'family_member',
          declarationConfirmed: true,
          notes: 'Attached signed owner authorization letter as requested.',
          documents: [
            {
              fileName: 'owner_authorization_letter.png',
              fileType: 'image/png',
              fileSize: 512,
              documentType: 'owner_authorization',
              dataUrl: mockPngDataUrl,
            },
          ],
        });

      expect(supplementRes.status).toBe(200);
      const docs = supplementRes.body.data.listing.hostAuthorization.documents;
      // Both the original family tree document and the newly uploaded authorization letter must be present
      expect(docs).toHaveLength(2);
      expect(docs.map((d: any) => d.documentType)).toContain('other_evidence');
      expect(docs.map((d: any) => d.documentType)).toContain('owner_authorization');
    });

    it('allows admin to approve authorization, setting status to verified and published', async () => {
      const res = await request(app)
        .post(`/api/admin/listings/${samplePreloadedStay.id}/verify`)
        .set('Cookie', [`staylocal_token=${adminToken}`])
        .send({
          action: 'approve',
          reason: 'Host authorization confirmed with genuine family deed and consent.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.listing.verificationStatus).toBe('verified');
      expect(res.body.data.listing.publicationStatus).toBe('published');
    });
  });
});
