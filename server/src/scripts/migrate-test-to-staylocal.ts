import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { connectDB, disconnectDB, isDatabaseConfigured, isDatabaseConnected } from '../config/db';

export interface MigrationOptions {
  execute?: boolean;
  quiet?: boolean;
}

export interface DryRunAction {
  targetCollection: string;
  action: 'insert' | 'skip' | 'update';
  identifier: string;
  reason: string;
  documentDetails?: Record<string, unknown>;
}

export interface MigrationSummary {
  timestamp: string;
  mode: 'DRY_RUN' | 'EXECUTE';
  backupPath?: string;
  users: {
    totalInSource: number;
    toInsert: number;
    toSkip: number;
    skippedReasons: Array<{ id: string; email: string; reason: string }>;
    insertedList: Array<{ id: string; email: string; role: string }>;
  };
  bookings: {
    totalInSource: number;
    toInsert: number;
    toSkip: number;
    insertedList: Array<{ id: string; reference: string; stayId: string; touristId: string }>;
  };
  stays: {
    toUpdateHostAssignment: number;
    stayId: string;
    assignedHostId: string;
  };
  referenceChecks: {
    touristExists: boolean;
    hostExists: boolean;
    stayExists: boolean;
  };
  actions: DryRunAction[];
}

export async function runMigration(options: MigrationOptions = {}): Promise<MigrationSummary> {
  const isExecute = Boolean(options.execute);
  const mode = isExecute ? 'EXECUTE' : 'DRY_RUN';

  if (!isDatabaseConfigured()) {
    throw new Error('MONGODB_URI is not configured.');
  }

  if (!isDatabaseConnected()) {
    await connectDB();
  }

  const client = mongoose.connection.client;
  const dbTest = client.db('test');
  const dbStaylocal = client.db('staylocal');

  const summary: MigrationSummary = {
    timestamp: new Date().toISOString(),
    mode,
    users: {
      totalInSource: 0,
      toInsert: 0,
      toSkip: 0,
      skippedReasons: [],
      insertedList: [],
    },
    bookings: {
      totalInSource: 0,
      toInsert: 0,
      toSkip: 0,
      insertedList: [],
    },
    stays: {
      toUpdateHostAssignment: 0,
      stayId: '',
      assignedHostId: '',
    },
    referenceChecks: {
      touristExists: false,
      hostExists: false,
      stayExists: false,
    },
    actions: [],
  };

  // 1. Fetch current data
  const testUsers = await dbTest.collection('users').find({}).toArray();
  const staylocalUsers = await dbStaylocal.collection('users').find({}).toArray();
  const testBookings = await dbTest.collection('bookings').find({}).toArray();
  const staylocalBookings = await dbStaylocal.collection('bookings').find({}).toArray();
  const testStayMun = await dbTest.collection('stays').findOne({ id: 'stay-mun-01' });
  const staylocalStayMun = await dbStaylocal.collection('stays').findOne({ id: 'stay-mun-01' });

  summary.users.totalInSource = testUsers.length;
  summary.bookings.totalInSource = testBookings.length;

  const existingStaylocalEmails = new Set(staylocalUsers.map((u) => u.email.toLowerCase()));
  const existingStaylocalUserIds = new Set(staylocalUsers.map((u) => u.id));
  const existingStaylocalBookingIds = new Set(staylocalBookings.map((b) => b.id));

  // Users we will insert
  const usersToMigrate: any[] = [];
  const seenEmailsInMigration = new Set<string>();

  // Primary referenced admin in test.stays: usr-admin-mw09dkhh-v1cmr
  const REFERENCED_ADMIN_ID = 'usr-admin-mw09dkhh-v1cmr';

  for (const user of testUsers) {
    const email = user.email.toLowerCase();

    // Check if email already in staylocal (e.g. ankitd9988@gmail.com which is admin)
    if (existingStaylocalEmails.has(email)) {
      summary.users.toSkip += 1;
      summary.users.skippedReasons.push({
        id: user.id,
        email: user.email,
        reason: `Email already exists in staylocal as protected account (Role: ${
          staylocalUsers.find((u) => u.email.toLowerCase() === email)?.role
        }). Preserving staylocal version.`,
      });
      summary.actions.push({
        targetCollection: 'users',
        action: 'skip',
        identifier: `${user.email} (${user.id})`,
        reason: 'Preserving existing staylocal admin record',
      });
      continue;
    }

    // Check for duplicates within test (e.g. duplicate ankiitdwiivedi689@gmail.com)
    if (seenEmailsInMigration.has(email)) {
      summary.users.toSkip += 1;
      summary.users.skippedReasons.push({
        id: user.id,
        email: user.email,
        reason: `Duplicate email within test database. Skipping duplicate instance (${user.id}).`,
      });
      summary.actions.push({
        targetCollection: 'users',
        action: 'skip',
        identifier: `${user.email} (${user.id})`,
        reason: 'Duplicate email within test database',
      });
      continue;
    }

    // If it's ankiitdwiivedi689, prefer the one with the reference
    if (email === 'ankiitdwiivedi689@gmail.com' && user.id !== REFERENCED_ADMIN_ID) {
      summary.users.toSkip += 1;
      summary.users.skippedReasons.push({
        id: user.id,
        email: user.email,
        reason: `Redundant duplicate admin instance. Using canonical referenced admin (${REFERENCED_ADMIN_ID}).`,
      });
      summary.actions.push({
        targetCollection: 'users',
        action: 'skip',
        identifier: `${user.email} (${user.id})`,
        reason: 'Redundant duplicate admin instance',
      });
      continue;
    }

    // Eligible for migration
    seenEmailsInMigration.add(email);
    usersToMigrate.push(user);
    summary.users.toInsert += 1;
    summary.users.insertedList.push({
      id: user.id,
      email: user.email,
      role: user.role,
    });
    summary.actions.push({
      targetCollection: 'users',
      action: 'insert',
      identifier: `${user.email} (${user.id})`,
      reason: `Migrate user account [Role: ${user.role}] preserving _id, bcrypt password, and timestamps`,
      documentDetails: {
        _id: user._id.toString(),
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
      },
    });
  }

  // 2. Booking analysis
  const bookingsToMigrate: any[] = [];
  for (const bk of testBookings) {
    if (existingStaylocalBookingIds.has(bk.id)) {
      summary.bookings.toSkip += 1;
      summary.actions.push({
        targetCollection: 'bookings',
        action: 'skip',
        identifier: `${bk.bookingReference} (${bk.id})`,
        reason: 'Booking ID already exists in staylocal',
      });
    } else {
      bookingsToMigrate.push(bk);
      summary.bookings.toInsert += 1;
      summary.bookings.insertedList.push({
        id: bk.id,
        reference: bk.bookingReference,
        stayId: bk.stayId,
        touristId: bk.touristId,
      });
      summary.actions.push({
        targetCollection: 'bookings',
        action: 'insert',
        identifier: `${bk.bookingReference} (${bk.id})`,
        reason: 'Migrate confirmed booking preserving reference, pricing, status, and dates',
        documentDetails: {
          _id: bk._id.toString(),
          id: bk.id,
          bookingReference: bk.bookingReference,
          stayId: bk.stayId,
          touristId: bk.touristId,
          hostId: bk.hostId,
          checkIn: bk.checkIn,
          checkOut: bk.checkOut,
          status: bk.status,
          totalAmount: bk.pricing?.totalAmount,
        },
      });
    }
  }

  // 3. Stay Host Assignment Analysis
  if (testStayMun && staylocalStayMun) {
    if (testStayMun.hostId && testStayMun.hostId !== staylocalStayMun.hostId) {
      summary.stays.toUpdateHostAssignment = 1;
      summary.stays.stayId = 'stay-mun-01';
      summary.stays.assignedHostId = testStayMun.hostId;
      summary.actions.push({
        targetCollection: 'stays',
        action: 'update',
        identifier: 'stay-mun-01',
        reason: `Sync verified host assignment (${testStayMun.hostId} - ${testStayMun.assignedHostEmail}) and verificationStatus (${testStayMun.verificationStatus}) to match live property management`,
      });
    }
  }

  // 4. Reference integrity check
  const allTargetUserIds = new Set([
    ...staylocalUsers.map((u) => u.id),
    ...usersToMigrate.map((u) => u.id),
  ]);
  const allTargetStayIds = new Set([
    ...(await dbStaylocal.collection('stays').find({}, { projection: { id: 1 } }).toArray()).map((s) => s.id),
  ]);

  for (const bk of bookingsToMigrate) {
    summary.referenceChecks.touristExists = allTargetUserIds.has(bk.touristId);
    summary.referenceChecks.hostExists = allTargetUserIds.has(bk.hostId);
    summary.referenceChecks.stayExists = allTargetStayIds.has(bk.stayId);
  }

  // 5. IF EXECUTE MODE: Create backups first, then execute idempotently
  if (isExecute) {
    const backupDir = path.resolve(__dirname, '../../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
    const testBackupFile = path.join(backupDir, `backup_test_${timestampStr}.json`);
    const staylocalBackupFile = path.join(backupDir, `backup_staylocal_${timestampStr}.json`);

    // Complete snapshot of all collections
    const collectionsToBackup = ['users', 'bookings', 'stays', 'destinations', 'experiences', 'localtreasures', 'guideexperiences'];
    const testSnapshot: Record<string, any[]> = {};
    const staylocalSnapshot: Record<string, any[]> = {};

    for (const c of collectionsToBackup) {
      testSnapshot[c] = await dbTest.collection(c).find({}).toArray();
      staylocalSnapshot[c] = await dbStaylocal.collection(c).find({}).toArray();
    }

    fs.writeFileSync(testBackupFile, JSON.stringify(testSnapshot, null, 2), 'utf-8');
    fs.writeFileSync(staylocalBackupFile, JSON.stringify(staylocalSnapshot, null, 2), 'utf-8');
    summary.backupPath = backupDir;
    console.log(`[Backup] Complete database snapshots saved to:\n  - ${testBackupFile}\n  - ${staylocalBackupFile}`);

    // Insert users idempotently using updateOne with upsert
    for (const u of usersToMigrate) {
      await dbStaylocal.collection('users').updateOne(
        { email: u.email.toLowerCase() },
        { $setOnInsert: u },
        { upsert: true }
      );
    }
    console.log(`[Execute] Migrated ${usersToMigrate.length} users into staylocal.users`);

    // Insert bookings idempotently using updateOne with upsert
    for (const b of bookingsToMigrate) {
      await dbStaylocal.collection('bookings').updateOne(
        { id: b.id },
        { $setOnInsert: b },
        { upsert: true }
      );
    }
    console.log(`[Execute] Migrated ${bookingsToMigrate.length} bookings into staylocal.bookings`);

    // Update stay-mun-01 host assignment if needed
    if (summary.stays.toUpdateHostAssignment > 0 && testStayMun) {
      await dbStaylocal.collection('stays').updateOne(
        { id: 'stay-mun-01' },
        {
          $set: {
            hostId: testStayMun.hostId,
            assignedHostId: testStayMun.assignedHostId,
            assignedHostEmail: testStayMun.assignedHostEmail,
            assignedHostName: testStayMun.assignedHostName,
            assignedAt: testStayMun.assignedAt,
            assignedBy: testStayMun.assignedBy,
            assignedByName: testStayMun.assignedByName,
            assignmentStatus: testStayMun.assignmentStatus,
            verificationStatus: testStayMun.verificationStatus,
            verificationNotes: testStayMun.verificationNotes,
            verificationHistory: testStayMun.verificationHistory,
            hostAuthorization: testStayMun.hostAuthorization,
            submissionEvidence: testStayMun.submissionEvidence,
          },
        }
      );
      console.log(`[Execute] Synced host assignment on stay-mun-01 into staylocal.stays`);
    }
  }

  return summary;
}

// CLI Execution
if (process.argv[1]?.includes('migrate-test-to-staylocal')) {
  const isExecute = process.argv.includes('--execute') || process.argv.includes('-e');

  runMigration({ execute: isExecute })
    .then(async (summary) => {
      console.log('\n===============================================================');
      console.log(
        summary.mode === 'DRY_RUN'
          ? '🔍 STAYLOCAL DATABASE CONSOLIDATION — DRY-RUN REPORT'
          : '✅ STAYLOCAL DATABASE CONSOLIDATION — EXECUTION COMPLETE'
      );
      console.log('===============================================================');
      console.log(`Execution Mode:  ${summary.mode}`);
      console.log(`Timestamp:       ${summary.timestamp}`);
      if (summary.backupPath) {
        console.log(`Backup Location: ${summary.backupPath}`);
      }
      console.log('\n--- USERS SUMMARY ---');
      console.log(`Source ('test.users'):     ${summary.users.totalInSource}`);
      console.log(`To Insert into staylocal:  ${summary.users.toInsert}`);
      console.log(`To Skip:                   ${summary.users.toSkip}`);
      console.log('\nUsers to Insert:');
      summary.users.insertedList.forEach((u) => console.log(`  + [${u.role.toUpperCase()}] ${u.email} (id: ${u.id})`));
      console.log('\nUsers Skipped:');
      summary.users.skippedReasons.forEach((u) => console.log(`  - [SKIP] ${u.email} (${u.id}): ${u.reason}`));

      console.log('\n--- BOOKINGS SUMMARY ---');
      console.log(`Source ('test.bookings'):  ${summary.bookings.totalInSource}`);
      console.log(`To Insert into staylocal:  ${summary.bookings.toInsert}`);
      summary.bookings.insertedList.forEach((b) =>
        console.log(`  + [BOOKING] Ref: ${b.reference} | Stay: ${b.stayId} | TouristId: ${b.touristId}`)
      );

      console.log('\n--- STAY HOST ASSIGNMENT SYNC ---');
      if (summary.stays.toUpdateHostAssignment > 0) {
        console.log(`  ~ [SYNC] ${summary.stays.stayId} -> Assign Host: ${summary.stays.assignedHostId}`);
      } else {
        console.log('  No stay host assignment changes required.');
      }

      console.log('\n--- REFERENTIAL INTEGRITY VERIFICATION ---');
      console.log(`  Tourist Reference Valid in staylocal:  ${summary.referenceChecks.touristExists ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`  Host Reference Valid in staylocal:     ${summary.referenceChecks.hostExists ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`  Stay Reference Valid in staylocal:     ${summary.referenceChecks.stayExists ? '✅ PASS' : '❌ FAIL'}`);
      console.log('===============================================================\n');

      await disconnectDB();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('\n❌ Migration Failed:', err);
      await disconnectDB();
      process.exit(1);
    });
}
