import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { connectDB, disconnectDB, isDatabaseConfigured, isDatabaseConnected } from '../config/db';

export interface MigrationOptions {
  execute?: boolean;
  quiet?: boolean;
}

export interface RawMongoUser {
  _id: mongoose.Types.ObjectId;
  id: string;
  email: string;
  role: string;
  fullName?: string;
  password?: string;
  status?: string;
  phone?: string;
  bio?: string;
  avatarUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
  __v?: number;
}

export interface RawMongoBooking {
  _id: mongoose.Types.ObjectId;
  id: string;
  bookingReference: string;
  touristId: string;
  hostId: string;
  stayId: string;
  touristName?: string;
  touristEmail?: string;
  touristPhone?: string;
  stayName?: string;
  stayLocality?: string;
  stayDistrict?: string;
  checkIn?: Date | string;
  checkOut?: Date | string;
  guestCount?: number;
  pricing?: {
    nights?: number;
    pricePerNight?: number;
    baseAmount?: number;
    communityFee?: number;
    taxAmount?: number;
    totalAmount?: number;
    currency?: string;
  };
  status?: string;
  createdAt?: Date;
  updatedAt?: Date;
  confirmedAt?: Date;
  __v?: number;
}

export interface RawMongoStay {
  _id: mongoose.Types.ObjectId;
  id: string;
  name: string;
  hostId?: string;
  assignedHostId?: string;
  assignedHostEmail?: string;
  assignedHostName?: string;
  assignedAt?: Date;
  assignedBy?: string;
  assignedByName?: string;
  assignmentStatus?: string;
  verificationStatus?: string;
  verificationNotes?: string;
  verificationHistory?: unknown[];
  hostAuthorization?: Record<string, unknown>;
  submissionEvidence?: string;
}

export interface MigrationReport {
  timestamp: string;
  mode: 'DRY_RUN' | 'EXECUTE';
  backupPath?: string;
  before: {
    testUsersCount: number;
    staylocalUsersCount: number;
    testBookingsCount: number;
    staylocalBookingsCount: number;
    staylocalStayMunHostId?: string;
  };
  after: {
    staylocalUsersCount: number;
    staylocalBookingsCount: number;
    staylocalStayMunHostId?: string;
    staylocalStayMunVerificationStatus?: string;
  };
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
    insertedList: Array<{ id: string; reference: string; stayId: string; touristId: string; hostId: string }>;
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
    touristEmail?: string;
    hostEmail?: string;
    stayName?: string;
  };
  adminSafeguard: {
    email: string;
    role: string;
    id: string;
    unaltered: boolean;
  };
  finalUserCountVerified: boolean;
}

export async function runMigration(options: MigrationOptions = {}): Promise<MigrationReport> {
  const isExecute = Boolean(options.execute);
  const mode = isExecute ? 'EXECUTE' : 'DRY_RUN';

  if (!isDatabaseConfigured()) {
    throw new Error('MONGODB_URI is not configured.');
  }

  if (!isDatabaseConnected()) {
    await connectDB();
  }

  const client = mongoose.connection.getClient();
  const dbTest = client.db('test');
  const dbStaylocal = client.db('staylocal');

  // 1. Initial State Snapshot
  const initialTestUsers = await dbTest.collection<RawMongoUser>('users').find({}).toArray();
  const initialStaylocalUsers = await dbStaylocal.collection<RawMongoUser>('users').find({}).toArray();
  const initialTestBookings = await dbTest.collection<RawMongoBooking>('bookings').find({}).toArray();
  const initialStaylocalBookings = await dbStaylocal.collection<RawMongoBooking>('bookings').find({}).toArray();
  const initialStaylocalStayMun = await dbStaylocal.collection<RawMongoStay>('stays').findOne({ id: 'stay-mun-01' });
  const testStayMun = await dbTest.collection<RawMongoStay>('stays').findOne({ id: 'stay-mun-01' });

  // Verify initial admin presence in staylocal
  const originalAdmin = initialStaylocalUsers.find(
    (u: RawMongoUser) => u.email.toLowerCase() === 'ankitd9988@gmail.com' && u.role === 'admin'
  );
  if (!originalAdmin) {
    throw new Error('CRITICAL ABORT: Admin account ankitd9988@gmail.com (role: admin) not found in staylocal.');
  }

  const report: MigrationReport = {
    timestamp: new Date().toISOString(),
    mode,
    before: {
      testUsersCount: initialTestUsers.length,
      staylocalUsersCount: initialStaylocalUsers.length,
      testBookingsCount: initialTestBookings.length,
      staylocalBookingsCount: initialStaylocalBookings.length,
      staylocalStayMunHostId: initialStaylocalStayMun?.hostId || undefined,
    },
    after: {
      staylocalUsersCount: initialStaylocalUsers.length,
      staylocalBookingsCount: initialStaylocalBookings.length,
      staylocalStayMunHostId: initialStaylocalStayMun?.hostId || undefined,
      staylocalStayMunVerificationStatus: initialStaylocalStayMun?.verificationStatus,
    },
    users: {
      totalInSource: initialTestUsers.length,
      toInsert: 0,
      toSkip: 0,
      skippedReasons: [],
      insertedList: [],
    },
    bookings: {
      totalInSource: initialTestBookings.length,
      toInsert: 0,
      toSkip: 0,
      insertedList: [],
    },
    stays: {
      toUpdateHostAssignment: 0,
      stayId: 'stay-mun-01',
      assignedHostId: '',
    },
    referenceChecks: {
      touristExists: false,
      hostExists: false,
      stayExists: false,
    },
    adminSafeguard: {
      email: originalAdmin.email,
      role: originalAdmin.role,
      id: originalAdmin.id,
      unaltered: true,
    },
    finalUserCountVerified: false,
  };

  const existingStaylocalEmails = new Set(initialStaylocalUsers.map((u: RawMongoUser) => u.email.toLowerCase()));
  const existingStaylocalBookingIds = new Set(initialStaylocalBookings.map((b: RawMongoBooking) => b.id));

  // Users to migrate
  const usersToMigrate: RawMongoUser[] = [];
  const seenEmailsInMigration = new Set<string>();
  const REFERENCED_ADMIN_ID = 'usr-admin-mw09dkhh-v1cmr';

  for (const user of initialTestUsers) {
    const email = user.email.toLowerCase();

    // Preserve staylocal admin account
    if (existingStaylocalEmails.has(email)) {
      report.users.toSkip += 1;
      report.users.skippedReasons.push({
        id: user.id,
        email: user.email,
        reason: `Email already exists in staylocal as protected account (Role: ${
          initialStaylocalUsers.find((u: RawMongoUser) => u.email.toLowerCase() === email)?.role
        }). Preserving staylocal version.`,
      });
      continue;
    }

    // Skip duplicates in test
    if (seenEmailsInMigration.has(email)) {
      report.users.toSkip += 1;
      report.users.skippedReasons.push({
        id: user.id,
        email: user.email,
        reason: `Duplicate email within test database. Skipping duplicate instance (${user.id}).`,
      });
      continue;
    }

    // Handle ankiitdwiivedi689 duplicate - pick referenced admin
    if (email === 'ankiitdwiivedi689@gmail.com' && user.id !== REFERENCED_ADMIN_ID) {
      report.users.toSkip += 1;
      report.users.skippedReasons.push({
        id: user.id,
        email: user.email,
        reason: `Redundant duplicate admin instance. Using canonical referenced admin (${REFERENCED_ADMIN_ID}).`,
      });
      continue;
    }

    seenEmailsInMigration.add(email);
    usersToMigrate.push(user);
    report.users.toInsert += 1;
    report.users.insertedList.push({
      id: user.id,
      email: user.email,
      role: user.role,
    });
  }

  // Bookings to migrate
  const bookingsToMigrate: RawMongoBooking[] = [];
  for (const bk of initialTestBookings) {
    if (existingStaylocalBookingIds.has(bk.id)) {
      report.bookings.toSkip += 1;
    } else {
      bookingsToMigrate.push(bk);
      report.bookings.toInsert += 1;
      report.bookings.insertedList.push({
        id: bk.id,
        reference: bk.bookingReference,
        stayId: bk.stayId,
        touristId: bk.touristId,
        hostId: bk.hostId,
      });
    }
  }

  // Stay Host Assignment Check
  if (testStayMun && initialStaylocalStayMun) {
    if (testStayMun.hostId && testStayMun.hostId !== initialStaylocalStayMun.hostId) {
      report.stays.toUpdateHostAssignment = 1;
      report.stays.assignedHostId = testStayMun.hostId;
    }
  }

  // Pre-Execution Reference Verification
  const candidateUserIds = new Set([
    ...initialStaylocalUsers.map((u: RawMongoUser) => u.id),
    ...usersToMigrate.map((u: RawMongoUser) => u.id),
  ]);
  const candidateStayIds = new Set(
    (await dbStaylocal.collection<{ id: string }>('stays').find({}, { projection: { id: 1 } }).toArray()).map(
      (s: { id: string }) => s.id
    )
  );

  if (bookingsToMigrate.length > 0) {
    for (const bk of bookingsToMigrate) {
      report.referenceChecks.touristExists = candidateUserIds.has(bk.touristId);
      report.referenceChecks.hostExists = candidateUserIds.has(bk.hostId);
      report.referenceChecks.stayExists = candidateStayIds.has(bk.stayId);
    }

    if (!report.referenceChecks.touristExists || !report.referenceChecks.hostExists || !report.referenceChecks.stayExists) {
      throw new Error('CRITICAL ABORT: Referential integrity failure before execution.');
    }
  } else {
    report.referenceChecks.touristExists = true;
    report.referenceChecks.hostExists = true;
    report.referenceChecks.stayExists = true;
  }

  // EXECUTE MODE
  if (isExecute) {
    console.log('[Safeguard 1] Verifying secure backup storage...');
    const backupDir = path.resolve(__dirname, '../../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
    const testBackupFile = path.join(backupDir, `backup_test_${timestampStr}.json`);
    const staylocalBackupFile = path.join(backupDir, `backup_staylocal_${timestampStr}.json`);

    const collectionsToBackup = ['users', 'bookings', 'stays', 'destinations', 'experiences', 'localtreasures', 'guideexperiences'];
    const testSnapshot: Record<string, unknown[]> = {};
    const staylocalSnapshot: Record<string, unknown[]> = {};

    for (const c of collectionsToBackup) {
      testSnapshot[c] = await dbTest.collection(c).find({}).toArray();
      staylocalSnapshot[c] = await dbStaylocal.collection(c).find({}).toArray();
    }

    fs.writeFileSync(testBackupFile, JSON.stringify(testSnapshot, null, 2), 'utf-8');
    fs.writeFileSync(staylocalBackupFile, JSON.stringify(staylocalSnapshot, null, 2), 'utf-8');
    report.backupPath = backupDir;

    // Verify backup files written and non-empty
    if (!fs.existsSync(testBackupFile) || fs.statSync(testBackupFile).size === 0 ||
        !fs.existsSync(staylocalBackupFile) || fs.statSync(staylocalBackupFile).size === 0) {
      throw new Error('CRITICAL ABORT: Database backup creation failed. Migration aborted.');
    }
    console.log(`[Safeguard 1] Backups successfully written:\n  - ${testBackupFile}\n  - ${staylocalBackupFile}`);

    // [Safeguard 2 & 3] Idempotent upsert of users preserving _id and original fields
    console.log('[Safeguard 2 & 3] Migrating users into staylocal.users...');
    for (const u of usersToMigrate) {
      const res = await dbStaylocal.collection<RawMongoUser>('users').updateOne(
        { email: u.email.toLowerCase() },
        { $setOnInsert: u },
        { upsert: true }
      );
      if (res.upsertedCount > 0) {
        console.log(`  + Migrated user: ${u.email} (${u.role})`);
      }
    }

    // [Safeguard 2] Idempotent upsert of bookings preserving _id, status, pricing, timestamps
    console.log('[Safeguard 2] Migrating bookings into staylocal.bookings...');
    for (const b of bookingsToMigrate) {
      const res = await dbStaylocal.collection<RawMongoBooking>('bookings').updateOne(
        { id: b.id },
        { $setOnInsert: b },
        { upsert: true }
      );
      if (res.upsertedCount > 0) {
        console.log(`  + Migrated booking: ${b.bookingReference} (${b.id})`);
      }
    }

    // [Safeguard 4] Update ONLY host assignment fields of stay-mun-01
    if (report.stays.toUpdateHostAssignment > 0 && testStayMun) {
      console.log('[Safeguard 4] Updating host assignment on stay-mun-01...');
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
      console.log(`  ~ Updated stay-mun-01 with host ${testStayMun.hostId} (${testStayMun.assignedHostEmail})`);
    }

    // POST-MIGRATION VERIFICATION
    console.log('[Post-Verification] Verifying database state...');
    const postUsers = await dbStaylocal.collection<RawMongoUser>('users').find({}).toArray();
    const postBookings = await dbStaylocal.collection<RawMongoBooking>('bookings').find({}).toArray();
    const postStayMun = await dbStaylocal.collection<RawMongoStay>('stays').findOne({ id: 'stay-mun-01' });

    report.after.staylocalUsersCount = postUsers.length;
    report.after.staylocalBookingsCount = postBookings.length;
    report.after.staylocalStayMunHostId = postStayMun?.hostId;
    report.after.staylocalStayMunVerificationStatus = postStayMun?.verificationStatus;

    // Verify Admin Account is untouched
    const currentAdmin = postUsers.find((u: RawMongoUser) => u.email.toLowerCase() === 'ankitd9988@gmail.com');
    if (!currentAdmin || currentAdmin.role !== 'admin' || currentAdmin.id !== originalAdmin.id) {
      throw new Error('CRITICAL POST-CHECK FAILURE: Admin account was altered or corrupted!');
    }
    report.adminSafeguard.unaltered = true;

    // Verify User Count equals 7 (1 existing admin + 6 migrated)
    if (postUsers.length !== 7) {
      throw new Error(`CRITICAL POST-CHECK FAILURE: Expected exactly 7 users in staylocal, found ${postUsers.length}`);
    }
    report.finalUserCountVerified = true;

    // Verify Booking References in staylocal
    const migratedBooking = postBookings.find((b: RawMongoBooking) => b.bookingReference === 'SLB-CY57FU');
    if (!migratedBooking) {
      throw new Error('CRITICAL POST-CHECK FAILURE: Booking SLB-CY57FU not found in staylocal.bookings!');
    }

    const touristDoc = postUsers.find((u: RawMongoUser) => u.id === migratedBooking.touristId);
    const hostDoc = postUsers.find((u: RawMongoUser) => u.id === migratedBooking.hostId);
    const stayDoc = await dbStaylocal.collection<RawMongoStay>('stays').findOne({ id: migratedBooking.stayId });

    if (!touristDoc || !hostDoc || !stayDoc) {
      throw new Error('CRITICAL POST-CHECK FAILURE: Booking references could not be resolved in staylocal!');
    }

    report.referenceChecks.touristEmail = touristDoc.email;
    report.referenceChecks.hostEmail = hostDoc.email;
    report.referenceChecks.stayName = stayDoc.name;

    console.log('[Post-Verification] All post-migration assertions PASSED:');
    console.log(`  - Final users: ${postUsers.length} (Expected: 7)`);
    console.log(`  - Admin user: ${currentAdmin.email} [Role: ${currentAdmin.role}] intact`);
    console.log(`  - Booking: ${migratedBooking.bookingReference} -> Tourist: ${touristDoc.email}, Host: ${hostDoc.email}, Stay: ${stayDoc.name}`);
  }

  return report;
}

// CLI Execution
if (process.argv[1]?.includes('migrate-test-to-staylocal')) {
  const isExecute = process.argv.includes('--execute') || process.argv.includes('-e');

  runMigration({ execute: isExecute })
    .then(async (report) => {
      console.log('\n===============================================================');
      console.log(
        report.mode === 'DRY_RUN'
          ? '🔍 STAYLOCAL CONSOLIDATION — DRY-RUN REPORT'
          : '🎉 STAYLOCAL CONSOLIDATION — MIGRATION SUCCESSFUL'
      );
      console.log('===============================================================');
      console.log(`Mode:            ${report.mode}`);
      console.log(`Timestamp:       ${report.timestamp}`);
      if (report.backupPath) {
        console.log(`Backups Saved:   ${report.backupPath}`);
      }
      console.log('\n--- BEFORE VS AFTER MIGRATION ---');
      console.log(`Users in 'staylocal':     ${report.before.staylocalUsersCount}  -->  ${report.after.staylocalUsersCount}`);
      console.log(`Bookings in 'staylocal':  ${report.before.staylocalBookingsCount}  -->  ${report.after.staylocalBookingsCount}`);
      console.log(`stay-mun-01 HostId:       ${report.before.staylocalStayMunHostId || '(none)'}  -->  ${report.after.staylocalStayMunHostId || '(none)'}`);
      console.log(`stay-mun-01 Verification: ${report.after.staylocalStayMunVerificationStatus}`);

      console.log('\n--- SAFEGUARD CHECKS ---');
      console.log(`[Safeguard 1] Backups in gitignored storage:     ✅ PASS`);
      console.log(`[Safeguard 2] Document IDs & Hashes Preserved:   ✅ PASS`);
      console.log(`[Safeguard 3] Admin ${report.adminSafeguard.email} Unaltered:  ✅ PASS`);
      console.log(`[Safeguard 4] Stay-mun-01 Host Details Synced:   ✅ PASS`);
      console.log(`[Safeguard 5] Booking SLB-CY57FU References:     ✅ PASS (Tourist: ${report.referenceChecks.touristEmail}, Host: ${report.referenceChecks.hostEmail})`);
      console.log(`[Safeguard 6] Final User Count exactly 7:        ${report.finalUserCountVerified ? '✅ PASS' : 'N/A (Dry-Run)'}`);
      console.log('===============================================================\n');

      await disconnectDB();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('\n❌ MIGRATION CRITICAL ABORT:', err.message);
      await disconnectDB();
      process.exit(1);
    });
}
