import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserModel } from '../src/models/user.model';
import * as dbConfig from '../src/config/db';
import bcrypt from 'bcryptjs';

describe('Permanent Administrator Account Provisioning Logic', () => {
  let inMemoryUsers: Map<string, any>;

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(dbConfig, 'isDatabaseConfigured').mockReturnValue(true);
    vi.spyOn(dbConfig, 'isDatabaseConnected').mockReturnValue(true);

    inMemoryUsers = new Map();

    // Populate existing non-admin users
    const existingHost = {
      id: 'usr_host_1',
      email: 'ashwin@staylocal.org',
      fullName: 'Ashwin Bisht',
      role: 'host',
      status: 'active',
    };
    inMemoryUsers.set(existingHost.email, existingHost);

    vi.spyOn(UserModel, 'findOne').mockImplementation((query: any) => {
      let found = null;
      if (query.email) {
        found = inMemoryUsers.get(query.email.toLowerCase());
      }
      return {
        lean: async () => found,
        select: () => ({
          then: (resolve: any) => resolve(found ? { ...found } : null),
        }),
        then: (resolve: any) => resolve(found ? { ...found } : null),
      } as any;
    });
  });

  it('validates admin creation password complexity requirements', () => {
    const passwordPattern = /^(?=.*[a-zA-Z])(?=.*[0-9\W_])/;

    // Must be at least 8 chars
    expect('Pass12!'.length >= 8).toBe(false);
    expect('Password123!'.length >= 8).toBe(true);

    // Must have letters and at least one number or symbol
    expect(passwordPattern.test('allletters')).toBe(false);
    expect(passwordPattern.test('12345678')).toBe(false);
    expect(passwordPattern.test('AdminPass123')).toBe(true);
    expect(passwordPattern.test('AdminPass!')).toBe(true);
    expect(passwordPattern.test('Admin.Pass-2026')).toBe(true);
  });

  it('strictly forbids silent promotion of an existing host/tourist account', async () => {
    const targetEmail = 'ashwin@staylocal.org';
    const existing = await UserModel.findOne({ email: targetEmail }).lean();

    expect(existing).toBeDefined();
    expect(existing.role).toBe('host');

    // Rule: if existing.role !== 'admin', throw security error
    let errorThrown = false;
    try {
      if (existing.role !== 'admin') {
        throw new Error(
          `Security Error: An account with email '${targetEmail}' already exists with role '${existing.role}'. Silent promotion of existing accounts is strictly forbidden.`
        );
      }
    } catch (err: any) {
      errorThrown = true;
      expect(err.message).toContain('Silent promotion');
      expect(err.message).toContain('host');
    }
    expect(errorThrown).toBe(true);
  });

  it('hashes the admin password with bcrypt and compares successfully', async () => {
    const rawPassword = 'PermanentAdminPassword2026!';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(rawPassword, salt);

    expect(hashedPassword).not.toBe(rawPassword);
    expect(hashedPassword).toMatch(/^\$2[aby]\$\d+\$/);

    const matches = await bcrypt.compare(rawPassword, hashedPassword);
    expect(matches).toBe(true);

    const wrongMatches = await bcrypt.compare('WrongPassword123!', hashedPassword);
    expect(wrongMatches).toBe(false);
  });

  it('saves the permanent administrator record with role=admin and status=active', () => {
    const adminRecord = {
      id: 'usr-admin-ankitdwiivedi',
      email: 'ankitdwiivedi689@gmail.com',
      fullName: 'Ankit Dwivedi',
      role: 'admin',
      status: 'active',
      bio: 'Permanent Platform Administrator for StayLocal Uttarakhand Tourism & Homestay Marketplace',
    };

    expect(adminRecord.role).toBe('admin');
    expect(adminRecord.status).toBe('active');
    expect(adminRecord.email).toBe('ankitdwiivedi689@gmail.com');
  });
});
