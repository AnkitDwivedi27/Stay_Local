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

export interface UserRecordSummary {
  _id: mongoose.Types.ObjectId;
  id: string;
  email: string;
  role: string;
  fullName?: string;
}

export interface DryRunStayReport {
  id: string;
  name: string;
  currentStatus: string;
  category: 'assigned' | 'stale_unassigned' | 'clean_unassigned';
  targetedForUpdate: boolean;
  fieldsToUnset: string[];
  fieldsToSet: Record<string, string>;
  preservedFields: string[];
  assignmentHistoryCount: number;
}

export interface ResetSummary {
  timestamp: string;
  mode: 'DRY_RUN' | 'EXECUTE';
  databaseName: string;
  backupPath?: string;
  targetSelector: Record<string, unknown>;
  metrics: {
    totalHomestays: number;
    assignedHomestays: number;
    staleUnassignedHomestays: number;
    cleanUnassignedHomestays: number;
    homestaysMatchedByTargetedSelector: number;
  };
  stayReports: DryRunStayReport[];
  postVerification?: {
    totalHomestaysBefore: number;
    totalHomestaysAfter: number;
    activeHostAssignmentsRemaining: number;
    allUnassigned: boolean;
    allSevenFieldsRemoved: boolean;
    assignmentHistoryUnaltered: boolean;
    adminAccountIntact: boolean;
    hostAccountsIntact: boolean;
    userCountBefore: number;
    userCountAfter: number;
  };
}

export const TARGET_ACTIVE_FIELDS = [
  'hostId',
  'assignedHostId',
  'assignedHostName',
  'assignedHostEmail',
  'assignedAt',
  'assignedBy',
  'assignedByName',
] as const;

export async function runResetHostAssignments(options: ResetOptions = {}): Promise<ResetSummary> {
  const isExecute = Boolean(options.execute);
  const mode = isExecute ? 'EXECUTE' : 'DRY_RUN';

  const uri = options.uri?.trim() || env.MONGODB_URI?.trim();

  if (!uri) {
    throw new Error('MONGODB_URI is not configured.');
  }

  // Database Connection
  if (mongoose.connection.readyState !== 1) {
    console.info('[Database] Connecting to MongoDB Atlas...');
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      autoIndex: false,
    });
    console.info('[Database] Successfully connected to MongoDB Atlas.');
  }

  // Safety Requirement 7: Guard verifies connected database is strictly "staylocal"
  const dbName = mongoose.connection.name;
  if (!dbName || dbName !== 'staylocal') {
    throw new Error(
      `CRITICAL SAFETY ABORT: Connected database is '${dbName}', but reset must strictly target 'staylocal'. Execution blocked.`
    );
  }

  const client = mongoose.connection.getClient();
  const db = client.db('staylocal');

  // Pre-fetch state
  const preStays = await db.collection<StayAssignmentFields>('stays').find({}).sort({ id: 1 }).toArray();
  const preUsers = await db.collection<UserRecordSummary>('users').find({}).toArray();

  // Safety Requirement 6: Verify exactly 6 homestays exist
  if (preStays.length !== 6) {
    throw new Error(
      `CRITICAL PRE-CHECK FAILURE: Expected exactly 6 homestays before execution, found ${preStays.length}. Execution blocked.`
    );
  }

  // Safety Requirement 1: Targeted selector matching ONLY homestays requiring cleanup
  const targetedSelector: Record<string, unknown> = {
    $or: [
      { assignmentStatus: { $ne: 'unassigned' } },
      { hostId: { $exists: true, $ne: null } },
      { assignedHostId: { $exists: true, $ne: null } },
      { assignedHostName: { $exists: true, $ne: null } },
      { assignedHostEmail: { $exists: true, $ne: null } },
      { assignedAt: { $exists: true, $ne: null } },
      { assignedBy: { $exists: true, $ne: null } },
      { assignedByName: { $exists: true, $ne: null } },
    ],
  };

  const matchedHomestays = await db.collection<StayAssignmentFields>('stays').find(targetedSelector).toArray();
  const matchedIds = new Set(matchedHomestays.map((s) => s.id));

  const summary: ResetSummary = {
    timestamp: new Date().toISOString(),
    mode,
    databaseName: dbName,
    targetSelector: targetedSelector,
    metrics: {
      totalHomestays: preStays.length,
      assignedHomestays: 0,
      staleUnassignedHomestays: 0,
      cleanUnassignedHomestays: 0,
      homestaysMatchedByTargetedSelector: matchedHomestays.length,
    },
    stayReports: [],
  };

  for (const s of preStays) {
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
    } else if (hasAnyHostField) {
      category = 'stale_unassigned';
      summary.metrics.staleUnassignedHomestays += 1;
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
      targetedForUpdate: matchedIds.has(s.id),
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
      assignmentHistoryCount: Array.isArray(s.assignmentHistory) ? s.assignmentHistory.length : 0,
    });
  }

  // EXECUTION BLOCK (Runs ONLY when --execute is passed)
  if (isExecute) {
    // Safety Requirement 5: Pre-execution backup successfully written & verified before any DB modification
    console.log('[Safeguard 1] Verifying secure backup storage...');
    const backupDir = path.resolve(__dirname, '../../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `backup_stays_pre_reset_${timestampStr}.json`);

    fs.writeFileSync(backupFile, JSON.stringify(preStays, null, 2), 'utf-8');
    summary.backupPath = backupFile;

    // Verify backup file exists and has non-zero bytes on disk
    if (!fs.existsSync(backupFile) || fs.statSync(backupFile).size === 0) {
      throw new Error(
        'CRITICAL SAFETY ABORT: Pre-execution backup file write verification failed. Aborting before any database mutation.'
      );
    }
    console.log(`[Safeguard 1] Pre-execution backup verified and written to disk:\n  ${backupFile}`);

    // Safety Requirements 1, 2, 3 & 4: Targeted update removing only 7 active fields & setting unassigned
    console.log('[Safeguard 2] Executing targeted host assignment reset on staylocal.stays...');
    const updateResult = await db.collection('stays').updateMany(
      targetedSelector,
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
    console.log(
      `[Execute] Targeted selector matched: ${updateResult.matchedCount}, Modified: ${updateResult.modifiedCount}`
    );

    // POST-EXECUTION RIGOROUS ASSERTIONS (Safety Requirement 6)
    console.log('[Safeguard 3] Running post-execution verification assertions...');
    const postStays = await db.collection<StayAssignmentFields>('stays').find({}).sort({ id: 1 }).toArray();
    const postUsers = await db.collection<UserRecordSummary>('users').find({}).toArray();

    // Assertion 6a: Exactly 6 homestays exist
    if (postStays.length !== 6) {
      throw new Error(
        `CRITICAL POST-CHECK FAILURE: Expected exactly 6 homestays after execution, found ${postStays.length}!`
      );
    }

    // Assertion 6b & 6c: No homestay contains any of the 7 active assignment fields & all assignmentStatus === 'unassigned'
    for (const s of postStays) {
      if (s.assignmentStatus !== 'unassigned') {
        throw new Error(
          `CRITICAL POST-CHECK FAILURE: Homestay '${s.id}' has assignmentStatus '${s.assignmentStatus}', expected 'unassigned'!`
        );
      }

      for (const field of TARGET_ACTIVE_FIELDS) {
        const val = (s as unknown as Record<string, unknown>)[field];
        if (val !== undefined && val !== null) {
          throw new Error(
            `CRITICAL POST-CHECK FAILURE: Homestay '${s.id}' still contains active field '${field}': ${JSON.stringify(
              val
            )}!`
          );
        }
      }
    }

    // Assertion 6d: assignmentHistory remains completely unchanged
    for (const preStay of preStays) {
      const postStay = postStays.find((s) => s.id === preStay.id);
      if (!postStay) {
        throw new Error(`CRITICAL POST-CHECK FAILURE: Homestay '${preStay.id}' missing post-execution!`);
      }
      const preHistJson = JSON.stringify(preStay.assignmentHistory || []);
      const postHistJson = JSON.stringify(postStay.assignmentHistory || []);
      if (preHistJson !== postHistJson) {
        throw new Error(`CRITICAL POST-CHECK FAILURE: assignmentHistory for '${preStay.id}' was altered!`);
      }
    }

    // Assertion 6e: Primary admin and all host accounts remain unchanged
    const preAdmin = preUsers.find((u) => u.email === 'ankitd9988@gmail.com' && u.role === 'admin');
    const postAdmin = postUsers.find((u) => u.email === 'ankitd9988@gmail.com' && u.role === 'admin');
    if (!preAdmin || !postAdmin || preAdmin.id !== postAdmin.id) {
      throw new Error('CRITICAL POST-CHECK FAILURE: Primary admin account was modified or missing!');
    }

    const preHosts = preUsers.filter((u) => u.role === 'host');
    const postHosts = postUsers.filter((u) => u.role === 'host');
    if (
      preHosts.length !== postHosts.length ||
      !preHosts.every((ph) => postHosts.some((poh) => poh.id === ph.id && poh.email === ph.email))
    ) {
      throw new Error('CRITICAL POST-CHECK FAILURE: Host accounts were modified or missing!');
    }

    if (preUsers.length !== postUsers.length) {
      throw new Error(
        `CRITICAL POST-CHECK FAILURE: User count changed from ${preUsers.length} to ${postUsers.length}!`
      );
    }

    summary.postVerification = {
      totalHomestaysBefore: preStays.length,
      totalHomestaysAfter: postStays.length,
      activeHostAssignmentsRemaining: 0,
      allUnassigned: true,
      allSevenFieldsRemoved: true,
      assignmentHistoryUnaltered: true,
      adminAccountIntact: true,
      hostAccountsIntact: true,
      userCountBefore: preUsers.length,
      userCountAfter: postUsers.length,
    };

    console.log('[Safeguard 3] All 6 post-execution assertions PASSED with 100% integrity.');
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
      console.log(`Execution Mode:           ${summary.mode}`);
      console.log(`Target Database:          ${summary.databaseName}`);
      console.log(`Timestamp:                ${summary.timestamp}`);
      if (summary.backupPath) {
        console.log(`Backup File:              ${summary.backupPath}`);
      }
      console.log('\n--- TARGETED QUERY SELECTOR ---');
      console.log(JSON.stringify(summary.targetSelector, null, 2));

      console.log('\n--- HOMESTAY METRICS ---');
      console.log(`Total Homestays in DB:    ${summary.metrics.totalHomestays}`);
      console.log(`Currently Assigned:       ${summary.metrics.assignedHomestays}`);
      console.log(`Stale Unassigned:         ${summary.metrics.staleUnassignedHomestays}`);
      console.log(`Clean Unassigned:         ${summary.metrics.cleanUnassignedHomestays}`);
      console.log(
        `Targeted for Cleanup:     ${summary.metrics.homestaysMatchedByTargetedSelector} (Matches exactly assigned + stale)`
      );

      console.log('\n--- HOMESTAY-BY-HOMESTAY BREAKDOWN ---');
      summary.stayReports.forEach((r) => {
        console.log(`\n[${r.id}] ${r.name}`);
        console.log(`  Current Status:         ${r.currentStatus}`);
        console.log(`  Category:               ${r.category.toUpperCase()}`);
        console.log(
          `  Matched by Selector:    ${r.targetedForUpdate ? 'YES (Will be updated)' : 'NO (Preserved as-is)'}`
        );
        console.log(
          `  Fields to Unset (7):    ${r.fieldsToUnset.length > 0 ? r.fieldsToUnset.join(', ') : '(none)'}`
        );
        console.log(
          `  Fields to Set:          ${Object.keys(r.fieldsToSet).length > 0 ? JSON.stringify(r.fieldsToSet) : '(none)'}`
        );
        console.log(`  assignmentHistory:      ${r.assignmentHistoryCount} audit records preserved`);
      });

      if (summary.postVerification) {
        console.log('\n--- POST-VERIFICATION ASSERTIONS ---');
        console.log(
          `Assertion 1 (Count):      ${summary.postVerification.totalHomestaysBefore} -> ${summary.postVerification.totalHomestaysAfter} (Exactly 6 homestays: ✅ PASS)`
        );
        console.log(
          `Assertion 2 (Fields):     All 7 active assignment fields removed: ${summary.postVerification.allSevenFieldsRemoved ? '✅ PASS' : '❌ FAIL'}`
        );
        console.log(
          `Assertion 3 (Status):     Every homestay assignmentStatus = "unassigned": ${summary.postVerification.allUnassigned ? '✅ PASS' : '❌ FAIL'}`
        );
        console.log(
          `Assertion 4 (Audit):      assignmentHistory completely unaltered: ${summary.postVerification.assignmentHistoryUnaltered ? '✅ PASS' : '❌ FAIL'}`
        );
        console.log(
          `Assertion 5 (Admin):      Primary Admin (ankitd9988@gmail.com) intact: ${summary.postVerification.adminAccountIntact ? '✅ PASS' : '❌ FAIL'}`
        );
        console.log(
          `Assertion 6 (Hosts):      All host accounts intact: ${summary.postVerification.hostAccountsIntact ? '✅ PASS' : '❌ FAIL'}`
        );
        console.log(
          `Assertion 7 (Users):      Total user count unchanged (${summary.postVerification.userCountBefore} -> ${summary.postVerification.userCountAfter}: ✅ PASS)`
        );
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
