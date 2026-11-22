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

export interface UserRecordFull {
  _id: mongoose.Types.ObjectId;
  id: string;
  email: string;
  password?: string;
  role: string;
  status: string;
  fullName: string;
  phone?: string;
  bio?: string;
  avatarUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
  __v?: number;
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
    allSevenFieldsAbsent: boolean;
    assignmentHistoryUnaltered: boolean;
    backupIntegrityVerified: boolean;
    targetIdSafetyVerified: boolean;
    matchedCountExact: boolean;
    modifiedCountExact: boolean;
    userDocumentsIdentical: boolean;
    adminPasswordHashIntact: boolean;
    adminRoleIntact: boolean;
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

export const APPROVED_CLEANUP_IDS = ['stay-bhm-01', 'stay-mun-01', 'stay-mun-02'] as const;

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

  // Safety Requirement: Guard verifies connected database is strictly "staylocal"
  const dbName = mongoose.connection.name;
  if (!dbName || dbName !== 'staylocal') {
    throw new Error(
      `CRITICAL SAFETY ABORT: Connected database is '${dbName}', but reset must strictly target 'staylocal'. Execution blocked.`
    );
  }

  const client = mongoose.connection.getClient();
  const db = client.db('staylocal');

  // Pre-fetch state: Full raw homestays and complete user snapshots
  const preStays = await db.collection<StayAssignmentFields>('stays').find({}).sort({ id: 1 }).toArray();
  const preUsers = await db.collection<UserRecordFull>('users').find({}).sort({ id: 1 }).toArray();

  // Safety Check: Verify exactly 6 homestays exist
  if (preStays.length !== 6) {
    throw new Error(
      `CRITICAL PRE-CHECK FAILURE: Expected exactly 6 homestays before execution, found ${preStays.length}. Execution blocked.`
    );
  }

  // Correction 1: Targeted selector conditions use strictly { $exists: true }
  const targetedSelector: Record<string, unknown> = {
    $or: [
      { assignmentStatus: { $ne: 'unassigned' } },
      { hostId: { $exists: true } },
      { assignedHostId: { $exists: true } },
      { assignedHostName: { $exists: true } },
      { assignedHostEmail: { $exists: true } },
      { assignedAt: { $exists: true } },
      { assignedBy: { $exists: true } },
      { assignedByName: { $exists: true } },
    ],
  };

  const matchedHomestays = await db.collection<StayAssignmentFields>('stays').find(targetedSelector).toArray();
  const matchedIds = new Set(matchedHomestays.map((s) => s.id));
  const matchedIdList = matchedHomestays.map((s) => s.id).sort();

  // Safety Assertion: Verify matched cleanup homestays strictly match approved list
  if (matchedHomestays.length !== 3) {
    throw new Error(
      `CRITICAL TARGET-ID SAFETY ABORT: Expected exactly 3 homestays matching targeted cleanup selector, found ${matchedHomestays.length}.`
    );
  }

  const idsMatchApprovedList =
    matchedIdList.length === APPROVED_CLEANUP_IDS.length &&
    matchedIdList.every((id, idx) => id === APPROVED_CLEANUP_IDS[idx]);

  if (!idsMatchApprovedList) {
    throw new Error(
      `CRITICAL TARGET-ID SAFETY ABORT: Matched homestay IDs [${matchedIdList.join(
        ', '
      )}] differ from approved cleanup list [${APPROVED_CLEANUP_IDS.join(', ')}]!`
    );
  }

  const executionUpdateSelector: Record<string, unknown> = {
    $and: [{ id: { $in: [...APPROVED_CLEANUP_IDS] } }, targetedSelector],
  };

  const summary: ResetSummary = {
    timestamp: new Date().toISOString(),
    mode,
    databaseName: dbName,
    targetSelector: executionUpdateSelector,
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
    const rawDoc = s as Record<string, unknown>;
    const hasHostId = Object.prototype.hasOwnProperty.call(rawDoc, 'hostId');
    const hasAssignedHostId = Object.prototype.hasOwnProperty.call(rawDoc, 'assignedHostId');
    const hasAssignedHostEmail = Object.prototype.hasOwnProperty.call(rawDoc, 'assignedHostEmail');
    const hasAssignedHostName = Object.prototype.hasOwnProperty.call(rawDoc, 'assignedHostName');
    const hasAssignedAt = Object.prototype.hasOwnProperty.call(rawDoc, 'assignedAt');
    const hasAssignedBy = Object.prototype.hasOwnProperty.call(rawDoc, 'assignedBy');
    const hasAssignedByName = Object.prototype.hasOwnProperty.call(rawDoc, 'assignedByName');

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
    // Correction 2: Comprehensive backup integrity verification before database mutation
    console.log('[Safeguard 1] Verifying secure backup storage...');
    const backupDir = path.resolve(__dirname, '../../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `backup_stays_pre_reset_${timestampStr}.json`);

    fs.writeFileSync(backupFile, JSON.stringify(preStays, null, 2), 'utf-8');
    summary.backupPath = backupFile;

    // Read back and parse to verify backup integrity
    if (!fs.existsSync(backupFile) || fs.statSync(backupFile).size === 0) {
      throw new Error(
        'CRITICAL SAFETY ABORT: Pre-execution backup file write verification failed. File missing or 0 bytes.'
      );
    }

    const readBackContent = fs.readFileSync(backupFile, 'utf-8');
    let parsedBackup: unknown[];
    try {
      parsedBackup = JSON.parse(readBackContent);
    } catch (parseErr) {
      throw new Error(
        `CRITICAL SAFETY ABORT: Backup integrity check failed: JSON parse error: ${(parseErr as Error).message}`
      );
    }

    if (!Array.isArray(parsedBackup) || parsedBackup.length !== 6) {
      throw new Error(
        `CRITICAL SAFETY ABORT: Backup integrity check failed: expected 6 homestay documents, found ${parsedBackup?.length}.`
      );
    }

    const backupIds = new Set(parsedBackup.map((item) => (item as { id?: string }).id));
    const originalIds = preStays.map((s) => s.id);
    for (const origId of originalIds) {
      if (!backupIds.has(origId)) {
        throw new Error(
          `CRITICAL SAFETY ABORT: Backup integrity check failed: original homestay ID '${origId}' missing from backup!`
        );
      }
    }
    console.log(
      `[Safeguard 1] Pre-execution backup verified, read back, and validated with all 6 homestay IDs:\n  ${backupFile}`
    );

    // Safeguard 2: Exact Target-ID Safety Assertion immediately before updateMany()
    console.log('[Safeguard 2] Verifying exact target-ID safety assertion immediately before updateMany()...');
    const matchedStaysToClean = await db
      .collection<StayAssignmentFields>('stays')
      .find(targetedSelector)
      .toArray();
    const matchedStayIds = matchedStaysToClean.map((s) => s.id).sort();

    if (matchedStaysToClean.length !== 3) {
      throw new Error(
        `CRITICAL TARGET-ID SAFETY ABORT: Expected exactly 3 homestays for cleanup immediately before update, but found ${matchedStaysToClean.length}!`
      );
    }

    const preUpdateIdsMatch =
      matchedStayIds.length === APPROVED_CLEANUP_IDS.length &&
      matchedStayIds.every((id, idx) => id === APPROVED_CLEANUP_IDS[idx]);

    if (!preUpdateIdsMatch) {
      throw new Error(
        `CRITICAL TARGET-ID SAFETY ABORT: Matched homestay IDs [${matchedStayIds.join(
          ', '
        )}] differ from approved cleanup list [${APPROVED_CLEANUP_IDS.join(', ')}]!`
      );
    }
    console.log(
      `[Safeguard 2] Exact target-ID safety assertion PASSED: Matched exactly [${matchedStayIds.join(', ')}].`
    );

    // Safeguard 3: Targeted update explicitly restricted to approved cleanup IDs and targeted selector
    console.log('[Safeguard 3] Executing targeted host assignment reset on staylocal.stays...');
    const executionUpdateSelector: Record<string, unknown> = {
      $and: [
        { id: { $in: [...APPROVED_CLEANUP_IDS] } },
        targetedSelector,
      ],
    };

    const updateResult = await db.collection('stays').updateMany(
      executionUpdateSelector,
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
      `[Execute] Update selector matched: ${updateResult.matchedCount}, Modified: ${updateResult.modifiedCount}`
    );

    // Strict verifications on matchedCount and modifiedCount
    if (updateResult.matchedCount !== 3) {
      throw new Error(
        `CRITICAL EXECUTION FAILURE: Expected updateResult.matchedCount to be exactly 3, but received ${updateResult.matchedCount}!`
      );
    }

    if (updateResult.modifiedCount !== 3) {
      throw new Error(
        `CRITICAL EXECUTION FAILURE: Expected updateResult.modifiedCount to be exactly 3 for the reported database state, but received ${updateResult.modifiedCount}!`
      );
    }
    console.log(
      '[Safeguard 3] updateResult.matchedCount (3) and updateResult.modifiedCount (3) verified with 100% precision.'
    );

    // POST-EXECUTION RIGOROUS ASSERTIONS
    console.log('[Safeguard 4] Running post-execution verification assertions...');
    const postStays = await db.collection<StayAssignmentFields>('stays').find({}).sort({ id: 1 }).toArray();
    const postUsers = await db.collection<UserRecordFull>('users').find({}).sort({ id: 1 }).toArray();

    // Assertion 1: Exactly 6 homestays exist
    if (postStays.length !== 6) {
      throw new Error(
        `CRITICAL POST-CHECK FAILURE: Expected exactly 6 homestays after execution, found ${postStays.length}!`
      );
    }

    // Correction 1 Post-Assertion: Use hasOwnProperty.call to verify actual field absence
    for (const s of postStays) {
      if (s.assignmentStatus !== 'unassigned') {
        throw new Error(
          `CRITICAL POST-CHECK FAILURE: Homestay '${s.id}' has assignmentStatus '${s.assignmentStatus}', expected 'unassigned'!`
        );
      }

      const rawStay = s as unknown as Record<string, unknown>;
      for (const field of TARGET_ACTIVE_FIELDS) {
        if (Object.prototype.hasOwnProperty.call(rawStay, field)) {
          throw new Error(
            `CRITICAL POST-CHECK FAILURE: Homestay '${s.id}' still has property '${field}' on document: ${JSON.stringify(
              rawStay[field]
            )}!`
          );
        }
      }
    }

    // Assertion: assignmentHistory remains completely unchanged
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

    // Correction 3: Complete user snapshot comparison verification
    if (preUsers.length !== postUsers.length) {
      throw new Error(
        `CRITICAL POST-CHECK FAILURE: User count changed from ${preUsers.length} to ${postUsers.length}!`
      );
    }

    // Full JSON snapshot comparison across all user documents
    const preUsersJson = JSON.stringify(preUsers);
    const postUsersJson = JSON.stringify(postUsers);
    if (preUsersJson !== postUsersJson) {
      throw new Error(
        'CRITICAL POST-CHECK FAILURE: User collection was modified! Snapshot comparison mismatch.'
      );
    }

    // Explicit primary admin assertion
    const preAdmin = preUsers.find((u) => u.email === 'ankitd9988@gmail.com' && u.role === 'admin');
    const postAdmin = postUsers.find((u) => u.email === 'ankitd9988@gmail.com' && u.role === 'admin');
    if (!preAdmin || !postAdmin) {
      throw new Error('CRITICAL POST-CHECK FAILURE: Primary admin account missing!');
    }
    if (
      preAdmin.id !== postAdmin.id ||
      preAdmin.password !== postAdmin.password ||
      preAdmin.role !== postAdmin.role ||
      preAdmin.status !== postAdmin.status
    ) {
      throw new Error(
        'CRITICAL POST-CHECK FAILURE: Primary admin credentials, password hash, role, or ID were altered!'
      );
    }

    // Explicit host account assertions
    const preHosts = preUsers.filter((u) => u.role === 'host');
    const postHosts = postUsers.filter((u) => u.role === 'host');
    if (preHosts.length !== postHosts.length) {
      throw new Error('CRITICAL POST-CHECK FAILURE: Host account count changed!');
    }
    for (const preHost of preHosts) {
      const postHost = postHosts.find((ph) => ph.id === preHost.id);
      if (!postHost || postHost.password !== preHost.password || postHost.email !== preHost.email) {
        throw new Error(`CRITICAL POST-CHECK FAILURE: Host account '${preHost.email}' was modified!`);
      }
    }

    summary.postVerification = {
      totalHomestaysBefore: preStays.length,
      totalHomestaysAfter: postStays.length,
      activeHostAssignmentsRemaining: 0,
      allUnassigned: true,
      allSevenFieldsAbsent: true,
      assignmentHistoryUnaltered: true,
      backupIntegrityVerified: true,
      targetIdSafetyVerified: true,
      matchedCountExact: updateResult.matchedCount === 3,
      modifiedCountExact: updateResult.modifiedCount === 3,
      userDocumentsIdentical: true,
      adminPasswordHashIntact: true,
      adminRoleIntact: true,
      hostAccountsIntact: true,
      userCountBefore: preUsers.length,
      userCountAfter: postUsers.length,
    };

    console.log('[Safeguard 4] All post-execution assertions PASSED with 100% integrity.');
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

      console.log('\n--- TARGET-ID SAFETY VERIFICATION ---');
      console.log('Approved Cleanup IDs (3): stay-mun-01, stay-mun-02, stay-bhm-01');
      console.log('Matched Cleanup IDs (3):  stay-bhm-01, stay-mun-01, stay-mun-02');
      console.log('Target-ID Safety Guard:   ✅ PASSED (Exact match: count === 3, IDs strictly identical)');

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
          `Assertion 2 (Target IDs): Matched exactly approved 3 IDs [stay-bhm-01, stay-mun-01, stay-mun-02]: ${summary.postVerification.targetIdSafetyVerified ? '✅ PASS' : '❌ FAIL'}`
        );
        console.log(
          `Assertion 3 (Counts):     matchedCount === 3 && modifiedCount === 3: ${summary.postVerification.matchedCountExact && summary.postVerification.modifiedCountExact ? '✅ PASS' : '❌ FAIL'}`
        );
        console.log(
          `Assertion 4 (Absence):    All 7 active assignment fields absent via hasOwnProperty: ${summary.postVerification.allSevenFieldsAbsent ? '✅ PASS' : '❌ FAIL'}`
        );
        console.log(
          `Assertion 5 (Status):     Every homestay assignmentStatus = "unassigned": ${summary.postVerification.allUnassigned ? '✅ PASS' : '❌ FAIL'}`
        );
        console.log(
          `Assertion 6 (Audit):      assignmentHistory completely unaltered: ${summary.postVerification.assignmentHistoryUnaltered ? '✅ PASS' : '❌ FAIL'}`
        );
        console.log(
          `Assertion 7 (Backup):     Backup read back & validated: ${summary.postVerification.backupIntegrityVerified ? '✅ PASS' : '❌ FAIL'}`
        );
        console.log(
          `Assertion 8 (Users):      All user documents byte-identical: ${summary.postVerification.userDocumentsIdentical ? '✅ PASS' : '❌ FAIL'}`
        );
        console.log(
          `Assertion 9 (Admin):      Admin password hash & role intact: ${summary.postVerification.adminPasswordHashIntact ? '✅ PASS' : '❌ FAIL'}`
        );
        console.log(
          `Assertion 10 (Hosts):     Host accounts intact: ${summary.postVerification.hostAccountsIntact ? '✅ PASS' : '❌ FAIL'}`
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
