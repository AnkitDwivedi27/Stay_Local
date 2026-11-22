import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { env } from '../config/env';
import { disconnectDB } from '../config/db';

export interface ResetOptions {
  execute?: boolean;
  uri?: string;
}

export interface StayAssignmentFields {
  id: string;
  name: string;
  locality: string;
  district: string;
  hostId?: string;
  assignedHostId?: string;
  assignedHostName?: string;
  assignedHostEmail?: string;
  assignmentStatus?: string;
  assignedAt?: Date;
  assignedBy?: string;
  assignedByName?: string;
  verificationStatus?: string;
  verificationNotes?: string;
  assignmentHistory?: unknown[];
}

export interface DryRunStayReport {
  id: string;
  name: string;
  currentStatus: string;
  category: 'assigned' | 'stale_unassigned' | 'clean_unassigned';
  fieldsToUnset: string[];
  fieldsToSet: Record<string, string>;
  preservedFields: string[];
}

export interface ResetSummary {
  timestamp: string;
  mode: 'DRY_RUN' | 'EXECUTE';
  databaseName: string;
  backupPath?: string;
  metrics: {
    totalHomestays: number;
    assignedHomestays: number;
    staleUnassignedHomestays: number;
    cleanUnassignedHomestays: number;
    homestaysToModify: number;
  };
  stayReports: DryRunStayReport[];
  postVerification?: {
    totalHomestaysRemaining: number;
    activeHostAssignmentsRemaining: number;
    allUnassigned: boolean;
    adminAccountIntact: boolean;
    hostAccountsIntact: boolean;
    userCount: number;
  };
}

export async function runResetHostAssignments(options: ResetOptions = {}): Promise<ResetSummary> {
  const isExecute = Boolean(options.execute);
  const mode = isExecute ? 'EXECUTE' : 'DRY_RUN';

  const uri = options.uri?.trim() || env.MONGODB_URI?.trim();

  if (!uri) {
    throw new Error('MONGODB_URI is not configured.');
  }

  if (mongoose.connection.readyState !== 1) {
    console.info('[Database] Connecting to MongoDB Atlas...');
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      autoIndex: false,
    });
    console.info('[Database] Successfully connected to MongoDB Atlas.');
  }

  const client = mongoose.connection.getClient();
  const dbName = mongoose.connection.name;

  if (dbName !== 'staylocal') {
    throw new Error(
      `CRITICAL SAFETY ABORT: Connected database is '${dbName}', but reset must only target 'staylocal'.`
    );
  }

  const db = client.db('staylocal');

  // 1. Fetch all homestays
  const stays = await db.collection<StayAssignmentFields>('stays').find({}).sort({ id: 1 }).toArray();

  const summary: ResetSummary = {
    timestamp: new Date().toISOString(),
    mode,
    databaseName: dbName,
    metrics: {
      totalHomestays: stays.length,
      assignedHomestays: 0,
      staleUnassignedHomestays: 0,
      cleanUnassignedHomestays: 0,
      homestaysToModify: 0,
    },
    stayReports: [],
  };

  for (const s of stays) {
    const hasHostId = Boolean(s.hostId);
    const hasAssignedHostId = Boolean(s.assignedHostId);
    const hasAssignedHostEmail = Boolean(s.assignedHostEmail);
    const hasAssignedHostName = Boolean(s.assignedHostName);
    const hasAssignedAt = Boolean(s.assignedAt);
    const hasAssignedBy = Boolean(s.assignedBy);
    const hasAssignedByName = Boolean(s.assignedByName);

    const hasAnyHostField =
      hasHostId ||
      hasAssignedHostId ||
      hasAssignedHostEmail ||
      hasAssignedHostName ||
      hasAssignedAt ||
      hasAssignedBy ||
      hasAssignedByName;

    let category: 'assigned' | 'stale_unassigned' | 'clean_unassigned';

    if (s.assignmentStatus === 'assigned') {
      category = 'assigned';
      summary.metrics.assignedHomestays += 1;
      summary.metrics.homestaysToModify += 1;
    } else if (hasAnyHostField) {
      category = 'stale_unassigned';
      summary.metrics.staleUnassignedHomestays += 1;
      summary.metrics.homestaysToModify += 1;
    } else {
      category = 'clean_unassigned';
      summary.metrics.cleanUnassignedHomestays += 1;
    }

    const fieldsToUnset: string[] = [];
    if (hasHostId) fieldsToUnset.push('hostId');
    if (hasAssignedHostId) fieldsToUnset.push('assignedHostId');
    if (hasAssignedHostName) fieldsToUnset.push('assignedHostName');
    if (hasAssignedHostEmail) fieldsToUnset.push('assignedHostEmail');
    if (hasAssignedAt) fieldsToUnset.push('assignedAt');
    if (hasAssignedBy) fieldsToUnset.push('assignedBy');
    if (hasAssignedByName) fieldsToUnset.push('assignedByName');

    const fieldsToSet: Record<string, string> = {};
    if (s.assignmentStatus !== 'unassigned') {
      fieldsToSet.assignmentStatus = 'unassigned';
    }

    summary.stayReports.push({
      id: s.id,
      name: s.name,
      currentStatus: s.assignmentStatus || '(none)',
      category,
      fieldsToUnset,
      fieldsToSet,
      preservedFields: [
        'assignmentHistory',
        'verificationStatus',
        'verificationNotes',
        'verificationHistory',
        'pricePerNight',
        'totalBeds',
        'cleaningBufferMinutes',
        'checkInTimePolicy',
        'checkOutTimePolicy',
        'childOccupancyPolicy',
        'rooms',
        'guestCapacity',
        'amenities',
        'images',
        'address',
        'coordinates',
        'category',
      ],
    });
  }

  // 2. IF EXECUTE MODE
  if (isExecute) {
    console.log('[Safeguard 1] Creating pre-reset backup of all homestays...');
    const backupDir = path.resolve(__dirname, '../../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `backup_stays_pre_reset_${timestampStr}.json`);

    fs.writeFileSync(backupFile, JSON.stringify(stays, null, 2), 'utf-8');
    summary.backupPath = backupFile;
    console.log(`[Safeguard 1] Backup successfully saved to:\n  ${backupFile}`);

    console.log('[Safeguard 2] Executing atomic host assignment reset on staylocal.stays...');
    const updateResult = await db.collection('stays').updateMany(
      {},
      {
        $set: {
          assignmentStatus: 'unassigned',
        },
        $unset: {
          hostId: '',
          assignedHostId: '',
          assignedHostName: '',
          assignedHostEmail: '',
          assignedAt: '',
          assignedBy: '',
          assignedByName: '',
        },
      }
    );
    console.log(`[Execute] Matched: ${updateResult.matchedCount}, Modified: ${updateResult.modifiedCount}`);

    // 3. Post-execution verification
    console.log('[Safeguard 3] Verifying database state post-reset...');
    const postStays = await db.collection<StayAssignmentFields>('stays').find({}).toArray();
    const postUsers = await db.collection('users').find({}).toArray();

    const activeAssignments = postStays.filter(
      (s) => s.hostId || s.assignedHostId || s.assignmentStatus === 'assigned'
    ).length;
    const allUnassigned = postStays.every((s) => s.assignmentStatus === 'unassigned' && !s.hostId);

    const adminUser = postUsers.find((u) => u.email === 'ankitd9988@gmail.com' && u.role === 'admin');
    const hostUsers = postUsers.filter((u) => u.role === 'host');

    summary.postVerification = {
      totalHomestaysRemaining: postStays.length,
      activeHostAssignmentsRemaining: activeAssignments,
      allUnassigned,
      adminAccountIntact: Boolean(adminUser),
      hostAccountsIntact: hostUsers.length > 0,
      userCount: postUsers.length,
    };

    if (!allUnassigned || activeAssignments > 0) {
      throw new Error('CRITICAL POST-CHECK FAILURE: Active host assignments still detected!');
    }
    if (postStays.length !== stays.length) {
      throw new Error(`CRITICAL POST-CHECK FAILURE: Homestay count changed! Expected ${stays.length}, found ${postStays.length}`);
    }
    if (!adminUser) {
      throw new Error('CRITICAL POST-CHECK FAILURE: Admin account missing or modified!');
    }
  }

  return summary;
}

// CLI Execution
if (process.argv[1]?.includes('reset-host-assignments')) {
  const isExecute = process.argv.includes('--execute') || process.argv.includes('-e');
  const uriArg = process.argv.find((a) => a.startsWith('--uri='));
  const customUri = uriArg ? uriArg.substring(6).replace(/^['"]|['"]$/g, '') : undefined;

  runResetHostAssignments({ execute: isExecute, uri: customUri })
    .then(async (summary) => {
      console.log('\n===============================================================');
      console.log(
        summary.mode === 'DRY_RUN'
          ? '🔍 STAYLOCAL HOMESTAY HOST ASSIGNMENT RESET — DRY-RUN REPORT'
          : '🎉 STAYLOCAL HOMESTAY HOST ASSIGNMENT RESET — EXECUTION COMPLETE'
      );
      console.log('===============================================================');
      console.log(`Mode:                     ${summary.mode}`);
      console.log(`Target Database:          ${summary.databaseName}`);
      console.log(`Timestamp:                ${summary.timestamp}`);
      if (summary.backupPath) {
        console.log(`Backup File:              ${summary.backupPath}`);
      }
      console.log('\n--- HOMESTAY METRICS ---');
      console.log(`Total Homestays:          ${summary.metrics.totalHomestays}`);
      console.log(`Currently Assigned:       ${summary.metrics.assignedHomestays}`);
      console.log(`Stale Unassigned (Dirty): ${summary.metrics.staleUnassignedHomestays}`);
      console.log(`Clean Unassigned:         ${summary.metrics.cleanUnassignedHomestays}`);
      console.log(`Homestays to Modify:      ${summary.metrics.homestaysToModify}`);

      console.log('\n--- HOMESTAY-BY-HOMESTAY BREAKDOWN ---');
      summary.stayReports.forEach((r) => {
        console.log(`\n[${r.id}] ${r.name}`);
        console.log(`  Category:         ${r.category.toUpperCase()}`);
        console.log(`  Current Status:   ${r.currentStatus}`);
        console.log(`  Fields to Unset:  ${r.fieldsToUnset.length > 0 ? r.fieldsToUnset.join(', ') : '(none)'}`);
        console.log(`  Fields to Set:    ${Object.keys(r.fieldsToSet).length > 0 ? JSON.stringify(r.fieldsToSet) : '(none)'}`);
      });

      if (summary.postVerification) {
        console.log('\n--- POST-VERIFICATION RESULTS ---');
        console.log(`Homestays Intact:         ${summary.postVerification.totalHomestaysRemaining} / 6`);
        console.log(`Active Assignments Left:  ${summary.postVerification.activeHostAssignmentsRemaining} (Expected: 0)`);
        console.log(`All Stays Unassigned:     ${summary.postVerification.allUnassigned ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`Admin Account Intact:     ${summary.postVerification.adminAccountIntact ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`Host Accounts Intact:     ${summary.postVerification.hostAccountsIntact ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`Total User Count:         ${summary.postVerification.userCount} (Unchanged)`);
      }

      console.log('\n===============================================================\n');
      await disconnectDB();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('\n❌ RESET ABORTED / FAILED:', err.message);
      await disconnectDB();
      process.exit(1);
    });
}
