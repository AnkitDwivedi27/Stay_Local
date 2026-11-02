import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { app } from '../src/app';
import { UserModel } from '../src/models/user.model';
import { connectDB, disconnectDB } from '../src/config/db';
import * as dbConfig from '../src/config/db';

describe('StayLocal Secure Authentication & Role-Based Authorization', () => {
  let isLiveDb = false;
  const inMemoryUsers = new Map<string, any>();

  function createMockUserDoc(data: any) {
    const doc = {
      ...data,
      toJSON: () => {
        const copy = { ...doc };
        delete copy.password;
        delete copy._id;
        delete copy.__v;
        return copy;
      },
      comparePassword: async (candidate: string) => {
        if (!doc.password) return false;
        return bcrypt.compare(candidate, doc.password);
      },
      save: async () => {
        if (doc.password && !doc.password.startsWith('$2')) {
          const salt = await bcrypt.genSalt(10);
          doc.password = await bcrypt.hash(doc.password, salt);
        }
        inMemoryUsers.set(doc.email.toLowerCase(), doc);
        return doc;
      },
    };
    return doc;
  }

  beforeAll(async () => {
    // Check if live MongoDB Atlas can be reached quickly (1.5s timeout)
    try {
      await Promise.race([
        connectDB(0),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Atlas timeout')), 1500)),
      ]);
      if (mongoose.connection.readyState === 1) {
        isLiveDb = true;
      }
    } catch {
      isLiveDb = false;
    }

    if (!isLiveDb) {
      // Setup isolated high-speed in-memory store if Atlas is unreachable or IP is unwhitelisted
      vi.spyOn(dbConfig, 'isDatabaseConnected').mockReturnValue(true);

      vi.spyOn(UserModel, 'findOne').mockImplementation((filter: any) => {
        const query: any = {
          select: vi.fn().mockImplementation(() => query),
          lean: vi.fn().mockImplementation(async () => {
            if (filter.email) {
              const u = inMemoryUsers.get(String(filter.email).toLowerCase());
              return u ? { ...u } : null;
            }
            if (filter.id) {
              for (const u of inMemoryUsers.values()) {
                if (u.id === filter.id && (!filter.status || u.status === filter.status)) {
                  return { ...u };
                }
              }
            }
            return null;
          }),
        };

        query.then = (resolve: any, reject: any) => {
          (async () => {
            if (filter.email) {
              const u = inMemoryUsers.get(String(filter.email).toLowerCase());
              return u ? createMockUserDoc({ ...u }) : null;
            }
            if (filter.id) {
              for (const u of inMemoryUsers.values()) {
                if (u.id === filter.id && (!filter.status || u.status === filter.status)) {
                  return createMockUserDoc({ ...u });
                }
              }
            }
            return null;
          })().then(resolve, reject);
        };

        return query as any;
      });

      vi.spyOn(UserModel, 'deleteMany').mockImplementation(async (filter: any) => {
        if (!filter || !filter.email) {
          inMemoryUsers.clear();
        } else if (filter.email instanceof RegExp) {
          for (const [key] of inMemoryUsers.entries()) {
            if (filter.email.test(key)) {
              inMemoryUsers.delete(key);
            }
          }
        }
        return { acknowledged: true, deletedCount: 1 } as any;
      });

      vi.spyOn(UserModel.prototype, 'save').mockImplementation(async function (this: any) {
        if (this.password && !this.password.startsWith('$2')) {
          const salt = await bcrypt.genSalt(10);
          this.password = await bcrypt.hash(this.password, salt);
        }
        this.createdAt = this.createdAt || new Date();
        this.updatedAt = new Date();
        const stored = {
          id: this.id,
          email: this.email.toLowerCase(),
          password: this.password,
          fullName: this.fullName,
          role: this.role || 'tourist',
          status: this.status || 'active',
          phone: this.phone,
          bio: this.bio,
          avatarUrl: this.avatarUrl,
          createdAt: this.createdAt,
          updatedAt: this.updatedAt,
        };
        inMemoryUsers.set(stored.email, stored);
        return this;
      });
    }
  }, 10000);

  afterAll(async () => {
    if (isLiveDb) {
      try {
        await UserModel.deleteMany({ email: /@test-auth\.com$/ });
      } catch {
        // Ignore if disconnected
      }
      await disconnectDB();
    } else {
      inMemoryUsers.clear();
      vi.restoreAllMocks();
    }
  });

  beforeEach(async () => {
    try {
      await UserModel.deleteMany({ email: /@test-auth\.com$/ });
    } catch {
      // Ignore if disconnected
    }
  });

  describe('POST /api/auth/register', () => {
    it('should register a new tourist user successfully and set HttpOnly cookie', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'tourist@test-auth.com',
          password: 'Password123!',
          fullName: 'Test Tourist',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe('tourist@test-auth.com');
      expect(res.body.data.user.fullName).toBe('Test Tourist');
      expect(res.body.data.user.role).toBe('tourist'); // default role
      expect(res.body.data.user).not.toHaveProperty('password');

      // Verify HttpOnly cookie
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const cookieStr = Array.isArray(cookies) ? cookies.join(';') : String(cookies);
      expect(cookieStr).toContain('staylocal_token');
      expect(cookieStr.toLowerCase()).toContain('httponly');
    });

    it('should allow registering as a host or guide', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'host@test-auth.com',
          password: 'Password123!',
          fullName: 'Sarmoli Host',
          role: 'host',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.user.role).toBe('host');
    });

    it('should REJECT role escalation attempts to admin during registration', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'hacker@test-auth.com',
          password: 'Password123!',
          fullName: 'Hacker User',
          role: 'admin', // FORBIDDEN!
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(JSON.stringify(res.body.error)).toContain('Admin registration is forbidden');

      // Verify no user was created
      const user = await UserModel.findOne({ email: 'hacker@test-auth.com' });
      expect(user).toBeNull();
    });

    it('should reject duplicate email registration with 400 Bad Request', async () => {
      // First registration
      await request(app).post('/api/auth/register').send({
        email: 'duplicate@test-auth.com',
        password: 'Password123!',
        fullName: 'Original User',
      });

      // Duplicate attempt
      const res = await request(app).post('/api/auth/register').send({
        email: 'duplicate@test-auth.com',
        password: 'DifferentPassword123!',
        fullName: 'Imposter User',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('already exists');
    });

    it('should validate email format and password strength', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'not-an-email',
        password: 'short',
        fullName: '',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send({
        email: 'registered@test-auth.com',
        password: 'CorrectPassword123!',
        fullName: 'Registered Traveler',
      });
    });

    it('should login successfully with valid credentials and issue cookie', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'registered@test-auth.com',
        password: 'CorrectPassword123!',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('registered@test-auth.com');
      expect(res.body.data.user).not.toHaveProperty('password');

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const cookieStr = Array.isArray(cookies) ? cookies.join(';') : String(cookies);
      expect(cookieStr).toContain('staylocal_token');
    });

    it('should reject invalid password with generic message to prevent enumeration', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'registered@test-auth.com',
        password: 'WrongPassword999!',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Invalid email or password.');
    });

    it('should reject non-existent email with IDENTICAL generic error message', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'nonexistent@test-auth.com',
        password: 'AnyPassword123!',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Invalid email or password.');
    });
  });

  describe('Session Persistence, GET /api/auth/me & Logout', () => {
    let authCookie: string;

    beforeEach(async () => {
      const reg = await request(app).post('/api/auth/register').send({
        email: 'session@test-auth.com',
        password: 'SessionPass123!',
        fullName: 'Session User',
      });
      const cookieHeader = reg.headers['set-cookie'];
      authCookie = Array.isArray(cookieHeader) ? cookieHeader[0] : String(cookieHeader);
    });

    it('should return authenticated user when valid HttpOnly cookie is provided', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', [authCookie]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('session@test-auth.com');
      expect(res.body.data.user.fullName).toBe('Session User');
    });

    it('should return 401 when no session cookie or token is provided', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should clear authentication cookie on logout and deny subsequent access', async () => {
      const logoutRes = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', [authCookie]);

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.data.message).toContain('Logged out successfully');

      // Check cookie was cleared (Max-Age=0 or expires in past)
      const cookies = logoutRes.headers['set-cookie'];
      const cookieStr = Array.isArray(cookies) ? cookies.join(';') : String(cookies);
      expect(cookieStr).toMatch(/staylocal_token=;.*(Expires|Max-Age=0)/i);
    });
  });

  describe('Role-Based Authorization (RBAC)', () => {
    let touristCookie: string;
    let hostCookie: string;
    let adminCookie: string;

    beforeEach(async () => {
      // 1. Create Tourist
      const t = await request(app).post('/api/auth/register').send({
        email: 'tourist-rbac@test-auth.com',
        password: 'Password123!',
        fullName: 'Tourist User',
        role: 'tourist',
      });
      touristCookie = Array.isArray(t.headers['set-cookie'])
        ? t.headers['set-cookie'][0]
        : String(t.headers['set-cookie']);

      // 2. Create Host
      const h = await request(app).post('/api/auth/register').send({
        email: 'host-rbac@test-auth.com',
        password: 'Password123!',
        fullName: 'Host User',
        role: 'host',
      });
      hostCookie = Array.isArray(h.headers['set-cookie'])
        ? h.headers['set-cookie'][0]
        : String(h.headers['set-cookie']);

      // 3. Create Admin directly via model (as public registration blocks admin creation)
      const adminUser = new UserModel({
        id: `usr-admin-${Date.now()}`,
        email: 'admin-rbac@test-auth.com',
        password: 'AdminPassword123!',
        fullName: 'Super Admin',
        role: 'admin',
        status: 'active',
      });
      await adminUser.save();

      const a = await request(app).post('/api/auth/login').send({
        email: 'admin-rbac@test-auth.com',
        password: 'AdminPassword123!',
      });
      adminCookie = Array.isArray(a.headers['set-cookie'])
        ? a.headers['set-cookie'][0]
        : String(a.headers['set-cookie']);
    });

    it('should deny unauthenticated access to host-only endpoint', async () => {
      const res = await request(app).get('/api/auth/host-only');
      expect(res.status).toBe(401);
    });

    it('should forbid tourist from accessing host-only endpoint with 403', async () => {
      const res = await request(app)
        .get('/api/auth/host-only')
        .set('Cookie', [touristCookie]);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should allow host to access host-only endpoint with 200', async () => {
      const res = await request(app)
        .get('/api/auth/host-only')
        .set('Cookie', [hostCookie]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe('host');
    });

    it('should forbid host from accessing admin-only endpoint with 403', async () => {
      const res = await request(app)
        .get('/api/auth/admin-only')
        .set('Cookie', [hostCookie]);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should allow admin to access admin-only endpoint with 200', async () => {
      const res = await request(app)
        .get('/api/auth/admin-only')
        .set('Cookie', [adminCookie]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe('admin');
    });
  });

  describe('Password Security & Hash Integrity', () => {
    it('should never store plaintext password in MongoDB', async () => {
      await request(app).post('/api/auth/register').send({
        email: 'hashcheck@test-auth.com',
        password: 'SecretPlaintextPassword123!',
        fullName: 'Hash Check User',
      });

      const userInDb = await UserModel.findOne({ email: 'hashcheck@test-auth.com' }).select('+password');
      expect(userInDb).toBeDefined();
      expect(userInDb?.password).not.toBe('SecretPlaintextPassword123!');
      expect(userInDb?.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash format
    });
  });
});
