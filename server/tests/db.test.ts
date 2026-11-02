import { describe, it, expect, vi, afterEach } from 'vitest';
import * as dbConfig from '../src/config/db';
import { env } from '../src/config/env';
import { DestinationsService } from '../src/services/destinations.service';
import { StaysService } from '../src/services/stays.service';
import { ExperiencesService } from '../src/services/experiences.service';
import { DatabaseError } from '../src/utils/errors';

describe('Database Architecture & Error Differentiation', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('URI Sanitization', () => {
    it('should redact credentials from MongoDB Atlas connection URIs', () => {
      const rawUri =
        'mongodb+srv://admin_user:SuperSecretPassword123@cluster0.mongodb.net/staylocal?retryWrites=true';
      const sanitized = dbConfig.sanitizeMongoUri(rawUri);

      expect(sanitized).not.toContain('SuperSecretPassword123');
      expect(sanitized).not.toContain('admin_user');
      expect(sanitized).toContain('//***:***@cluster0.mongodb.net/staylocal');
    });

    it('should return empty string for undefined URI', () => {
      expect(dbConfig.sanitizeMongoUri(undefined)).toBe('');
    });
  });

  describe('Database Status Reporting', () => {
    it('should report not_configured when MONGODB_URI is empty', () => {
      const orig = env.MONGODB_URI;
      (env as { MONGODB_URI?: string }).MONGODB_URI = '';
      expect(dbConfig.getDatabaseStatus()).toBe('not_configured');
      (env as { MONGODB_URI?: string }).MONGODB_URI = orig;
    });

    it('should report disconnected when configured but readyState is 0', () => {
      const orig = env.MONGODB_URI;
      (env as { MONGODB_URI?: string }).MONGODB_URI = 'mongodb+srv://mock-cluster.net';
      expect(dbConfig.getDatabaseStatus()).toBe('disconnected');
      (env as { MONGODB_URI?: string }).MONGODB_URI = orig;
    });
  });

  describe('Service Behavior in Offline Unconfigured Mode', () => {
    it('should serve grounded research destinations when database is unconfigured', async () => {
      vi.spyOn(dbConfig, 'isDatabaseConfigured').mockReturnValue(false);

      const destinations = await DestinationsService.getAll();
      expect(Array.isArray(destinations)).toBe(true);
      expect(destinations.length).toBeGreaterThanOrEqual(4);

      const munsiyari = await DestinationsService.getById('munsiyari');
      expect(munsiyari.id).toBe('munsiyari');
      expect(munsiyari.district).toBe('Pithoragarh');
    });

    it('should serve grounded research stays when database is unconfigured', async () => {
      vi.spyOn(dbConfig, 'isDatabaseConfigured').mockReturnValue(false);

      const stays = await StaysService.getAll();
      expect(Array.isArray(stays)).toBe(true);
      expect(stays.length).toBeGreaterThanOrEqual(4);

      const stay = await StaysService.getById('stay-mun-01');
      expect(stay.id).toBe('stay-mun-01');
      expect(stay.name).toBe('Anasuya Devi Homestay');
    });

    it('should serve grounded research experiences when database is unconfigured', async () => {
      vi.spyOn(dbConfig, 'isDatabaseConfigured').mockReturnValue(false);

      const experiences = await ExperiencesService.getAll();
      expect(Array.isArray(experiences)).toBe(true);
      expect(experiences.length).toBeGreaterThanOrEqual(4);

      const exp = await ExperiencesService.getById('exp-darkot-pashmina');
      expect(exp.id).toBe('exp-darkot-pashmina');
    });
  });

  describe('Connection Failure Differentiation (Never silently mask database down)', () => {
    it('should throw DatabaseError (503) instead of serving stale data when DB is configured but unreachable', async () => {
      vi.spyOn(dbConfig, 'isDatabaseConfigured').mockReturnValue(true);
      vi.spyOn(dbConfig, 'isDatabaseConnected').mockReturnValue(false);

      // Expect service calls to throw DatabaseError
      await expect(DestinationsService.getAll()).rejects.toThrow(DatabaseError);
      await expect(StaysService.getAll()).rejects.toThrow(DatabaseError);
      await expect(ExperiencesService.getAll()).rejects.toThrow(DatabaseError);
    });
  });
});
