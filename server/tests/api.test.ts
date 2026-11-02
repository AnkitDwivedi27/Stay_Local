import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { env } from '../src/config/env';

describe('StayLocal Backend API Foundation', () => {
  const originalUri = env.MONGODB_URI;

  beforeAll(() => {
    // Run foundation API tests in offline research dataset mode
    (env as { MONGODB_URI?: string }).MONGODB_URI = '';
  });

  afterAll(() => {
    (env as { MONGODB_URI?: string }).MONGODB_URI = originalUri;
  });

  describe('GET /api/health', () => {
    it('should return 200 with service health info and database status', async () => {
      const res = await request(app).get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body).toHaveProperty('service', 'StayLocal API');
      expect(res.body).toHaveProperty('version');
      expect(res.body).toHaveProperty('environment');
      expect(res.body).toHaveProperty('database');
      expect(res.body.database).toHaveProperty('status');
      expect(res.body.database).toHaveProperty('configured');
    });

    it('should report readiness status on GET /api/health/ready', async () => {
      const res = await request(app).get('/api/health/ready');

      expect([200, 503]).toContain(res.status);
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('database');
    });
  });

  describe('GET /api/destinations', () => {
    it('should return list of researched Uttarakhand destinations', async () => {
      const res = await request(app).get('/api/destinations');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(4);

      const munsiyari = res.body.data.find((d: { id: string }) => d.id === 'munsiyari');
      expect(munsiyari).toBeDefined();
      expect(munsiyari.district).toBe('Pithoragarh');
      expect(munsiyari.altitudeMeters).toBe(2200);
    });

    it('should filter destinations by district query', async () => {
      const res = await request(app).get('/api/destinations?district=Nainital');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.every((d: { district: string }) => d.district === 'Nainital')).toBe(true);
    });

    it('should return destination details by valid ID', async () => {
      const res = await request(app).get('/api/destinations/munsiyari');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id', 'munsiyari');
      expect(res.body.data).toHaveProperty('name', 'Munsiyari');
      expect(res.body.data).toHaveProperty('district', 'Pithoragarh');
      expect(res.body.data).toHaveProperty('altitudeMeters', 2200);
      expect(Array.isArray(res.body.data.characterTags)).toBe(true);
      expect(res.body.data).toHaveProperty('heroImage');
    });

    it('should return 404 for non-existent destination ID', async () => {
      const res = await request(app).get('/api/destinations/non-existent-place');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('GET /api/stays', () => {
    it('should return accommodations with transparent verification status', async () => {
      const res = await request(app).get('/api/stays');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);

      // Verify records have required fields
      const stay = res.body.data[0];
      expect(stay).toHaveProperty('name');
      expect(stay).toHaveProperty('locality');
      expect(stay).toHaveProperty('district');
      expect(stay).toHaveProperty('category');
      expect(stay).toHaveProperty('verificationStatus');
      expect(stay).toHaveProperty('dataSource');
    });

    it('should filter stays by verification status', async () => {
      const res = await request(app).get('/api/stays?verificationStatus=verified');

      expect(res.status).toBe(200);
      expect(res.body.data.every((s: { verificationStatus: string }) => s.verificationStatus === 'verified')).toBe(true);
    });

    it('should handle empty query strings gracefully without validation failure', async () => {
      const res = await request(app).get('/api/stays?category=&district=&destination=&verificationStatus=&minGuests=');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should return stay details by valid ID', async () => {
      const res = await request(app).get('/api/stays/stay-mun-01');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id', 'stay-mun-01');
      expect(res.body.data).toHaveProperty('name', 'Anasuya Devi Homestay');
      expect(res.body.data).toHaveProperty('district', 'Pithoragarh');
      expect(res.body.data).toHaveProperty('verificationStatus');
    });

    it('should return 404 for non-existent stay ID', async () => {
      const res = await request(app).get('/api/stays/non-existent-stay-id');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('GET /api/experiences', () => {
    it('should return grounded regional experiences', async () => {
      const res = await request(app).get('/api/experiences');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(4);
    });

    it('should filter experiences by category', async () => {
      const res = await request(app).get('/api/experiences?category=craft_and_weaving');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.every((e: { category: string }) => e.category === 'craft_and_weaving')).toBe(true);
    });

    it('should return experience details by valid ID', async () => {
      const res = await request(app).get('/api/experiences/exp-darkot-pashmina');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id', 'exp-darkot-pashmina');
      expect(res.body.data).toHaveProperty('title');
      expect(res.body.data).toHaveProperty('destinationId', 'munsiyari');
      expect(res.body.data).toHaveProperty('evidenceSource');
    });

    it('should return 404 for non-existent experience ID', async () => {
      const res = await request(app).get('/api/experiences/non-existent-exp-id');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('Error & 404 Handling', () => {
    it('should return standardized 404 for unknown routes', async () => {
      const res = await request(app).get('/api/undefined-endpoint');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toHaveProperty('code', 'ROUTE_NOT_FOUND');
    });

    it('should return 400 with VALIDATION_ERROR on invalid query parameters', async () => {
      const res = await request(app).get('/api/stays?verificationStatus=invalid_status_enum');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 503 with DATABASE_UNAVAILABLE when database is configured but disconnected', async () => {
      (env as { MONGODB_URI?: string }).MONGODB_URI = 'mongodb+srv://mock-cluster.net';
      const res = await request(app).get('/api/destinations');

      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('DATABASE_UNAVAILABLE');
      expect(res.body.error.message).toContain('Database service is currently unavailable');

      (env as { MONGODB_URI?: string }).MONGODB_URI = '';
    });
  });
});
