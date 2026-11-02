import { connectDB, disconnectDB, isDatabaseConfigured, isDatabaseConnected } from '../config/db';
import { DESTINATIONS_DATA } from '../data/destinations.data';
import { ACCOMMODATIONS_DATA } from '../data/accommodations.data';
import { EXPERIENCES_DATA } from '../data/experiences.data';
import { DestinationModel } from '../models/destination.model';
import { StayModel } from '../models/stay.model';
import { ExperienceModel } from '../models/experience.model';

export interface SeedResult {
  collection: string;
  totalInDataset: number;
  inserted: number;
  updated: number;
  skipped: number;
  rejected: number;
  errors: string[];
}

export interface SeedSummary {
  destinations: SeedResult;
  stays: SeedResult;
  experiences: SeedResult;
}

export interface SeedOptions {
  dryRun?: boolean;
  quiet?: boolean;
}

export async function runSeed(options: SeedOptions = {}): Promise<SeedSummary> {
  const isDryRun = Boolean(options.dryRun);

  if (!isDatabaseConfigured()) {
    throw new Error(
      'MONGODB_URI is not configured in .env. Cannot seed MongoDB Atlas without a valid connection string.'
    );
  }

  if (!isDatabaseConnected()) {
    await connectDB();
  }

  if (!isDatabaseConnected()) {
    throw new Error(
      'Could not establish connection to MongoDB Atlas. Please ensure IP access is whitelisted in Atlas Network Access.'
    );
  }

  const results: SeedSummary = {
    destinations: {
      collection: 'Destinations',
      totalInDataset: DESTINATIONS_DATA.length,
      inserted: 0,
      updated: 0,
      skipped: 0,
      rejected: 0,
      errors: [],
    },
    stays: {
      collection: 'Stays',
      totalInDataset: ACCOMMODATIONS_DATA.length,
      inserted: 0,
      updated: 0,
      skipped: 0,
      rejected: 0,
      errors: [],
    },
    experiences: {
      collection: 'Experiences',
      totalInDataset: EXPERIENCES_DATA.length,
      inserted: 0,
      updated: 0,
      skipped: 0,
      rejected: 0,
      errors: [],
    },
  };

  // 1. Seed Destinations
  for (const item of DESTINATIONS_DATA) {
    try {
      if (isDryRun) {
        const existing = await DestinationModel.findOne({ id: item.id.toLowerCase() }).lean();
        if (!existing) {
          results.destinations.inserted += 1;
        } else {
          results.destinations.skipped += 1;
        }
      } else {
        const res = await DestinationModel.updateOne(
          { id: item.id.toLowerCase() },
          { $set: item },
          { upsert: true, runValidators: true }
        );
        if (res.upsertedCount > 0) {
          results.destinations.inserted += 1;
        } else if (res.modifiedCount > 0) {
          results.destinations.updated += 1;
        } else {
          results.destinations.skipped += 1;
        }
      }
    } catch (err) {
      results.destinations.rejected += 1;
      results.destinations.errors.push(
        `Destination '${item.id}': ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  // 2. Seed Stays
  for (const item of ACCOMMODATIONS_DATA) {
    try {
      if (isDryRun) {
        const existing = await StayModel.findOne({ id: item.id.toLowerCase() }).lean();
        if (!existing) {
          results.stays.inserted += 1;
        } else {
          results.stays.skipped += 1;
        }
      } else {
        const res = await StayModel.updateOne(
          { id: item.id.toLowerCase() },
          { $set: item },
          { upsert: true, runValidators: true }
        );
        if (res.upsertedCount > 0) {
          results.stays.inserted += 1;
        } else if (res.modifiedCount > 0) {
          results.stays.updated += 1;
        } else {
          results.stays.skipped += 1;
        }
      }
    } catch (err) {
      results.stays.rejected += 1;
      results.stays.errors.push(
        `Stay '${item.id}': ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  // 3. Seed Experiences
  for (const item of EXPERIENCES_DATA) {
    try {
      if (isDryRun) {
        const existing = await ExperienceModel.findOne({ id: item.id.toLowerCase() }).lean();
        if (!existing) {
          results.experiences.inserted += 1;
        } else {
          results.experiences.skipped += 1;
        }
      } else {
        const res = await ExperienceModel.updateOne(
          { id: item.id.toLowerCase() },
          { $set: item },
          { upsert: true, runValidators: true }
        );
        if (res.upsertedCount > 0) {
          results.experiences.inserted += 1;
        } else if (res.modifiedCount > 0) {
          results.experiences.updated += 1;
        } else {
          results.experiences.skipped += 1;
        }
      }
    } catch (err) {
      results.experiences.rejected += 1;
      results.experiences.errors.push(
        `Experience '${item.id}': ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  if (!options.quiet) {
    console.log('\n===============================================================');
    console.log(
      isDryRun
        ? '🔍 StayLocal MongoDB Seed Preview (DRY RUN — No changes made)'
        : '🌱 StayLocal MongoDB Seed Execution Summary'
    );
    console.log('===============================================================');
    console.table(
      Object.values(results).map((r) => ({
        Collection: r.collection,
        Total: r.totalInDataset,
        Inserted: r.inserted,
        Updated: r.updated,
        Skipped: r.skipped,
        Rejected: r.rejected,
      }))
    );
    console.log('===============================================================\n');

    const allErrors = Object.values(results).flatMap((r) => r.errors);
    if (allErrors.length > 0) {
      console.error('⚠️  Seed warnings/errors:');
      allErrors.forEach((e) => console.error(` - ${e}`));
    }
  }

  return results;
}

// Standalone CLI execution
if (process.argv[1]?.includes('seed')) {
  const isDryRun = process.argv.includes('--dry-run') || process.argv.includes('-d');

  runSeed({ dryRun: isDryRun })
    .then(async () => {
      await disconnectDB();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('\n❌ Seed failed:', err.message);
      await disconnectDB();
      process.exit(1);
    });
}
