import { describe, it, expect, vi } from 'vitest';
import { runSeed } from '../src/scripts/seed';
import { DestinationModel } from '../src/models/destination.model';
import { StayModel } from '../src/models/stay.model';
import { ExperienceModel } from '../src/models/experience.model';
import * as dbConfig from '../src/config/db';

describe('StayLocal Seed & Migration Workflow', () => {
  it('should reject seeding if MONGODB_URI is unconfigured', async () => {
    vi.spyOn(dbConfig, 'isDatabaseConfigured').mockReturnValue(false);

    await expect(runSeed({ quiet: true })).rejects.toThrow(
      /MONGODB_URI is not configured/
    );

    vi.restoreAllMocks();
  });

  it('should perform idempotent dry-run preview without mutating database', async () => {
    vi.spyOn(dbConfig, 'isDatabaseConfigured').mockReturnValue(true);
    vi.spyOn(dbConfig, 'isDatabaseConnected').mockReturnValue(true);

    // Mock findOne to simulate some existing and some new records
    vi.spyOn(DestinationModel, 'findOne').mockReturnValue({
      lean: vi.fn().mockResolvedValue({ id: 'munsiyari' }),
    } as unknown as ReturnType<typeof DestinationModel.findOne>);

    vi.spyOn(StayModel, 'findOne').mockReturnValue({
      lean: vi.fn().mockResolvedValue(null),
    } as unknown as ReturnType<typeof StayModel.findOne>);

    vi.spyOn(ExperienceModel, 'findOne').mockReturnValue({
      lean: vi.fn().mockResolvedValue({ id: 'exp-darkot-pashmina' }),
    } as unknown as ReturnType<typeof ExperienceModel.findOne>);

    const updateSpy = vi.spyOn(DestinationModel, 'updateOne');

    const results = await runSeed({ dryRun: true, quiet: true });

    expect(results).toHaveProperty('destinations');
    expect(results).toHaveProperty('stays');
    expect(results).toHaveProperty('experiences');

    // In dry-run, updateOne must never be called!
    expect(updateSpy).not.toHaveBeenCalled();

    // Verify stays would be inserted (mock returned null)
    expect(results.stays.inserted).toBeGreaterThan(0);
    // Verify destinations would be skipped (mock returned existing)
    expect(results.destinations.skipped).toBeGreaterThan(0);

    vi.restoreAllMocks();
  });

  it('should achieve idempotency in live seeding via upsert operations', async () => {
    vi.spyOn(dbConfig, 'isDatabaseConfigured').mockReturnValue(true);
    vi.spyOn(dbConfig, 'isDatabaseConnected').mockReturnValue(true);

    const updateResult = {
      acknowledged: true,
      matchedCount: 1,
      modifiedCount: 0,
      upsertedCount: 0,
      upsertedId: null,
    };

    const destUpdateSpy = vi.spyOn(DestinationModel, 'updateOne').mockResolvedValue(
      updateResult as unknown as Awaited<ReturnType<typeof DestinationModel.updateOne>>
    );

    vi.spyOn(StayModel, 'updateOne').mockResolvedValue(
      updateResult as unknown as Awaited<ReturnType<typeof StayModel.updateOne>>
    );

    vi.spyOn(ExperienceModel, 'updateOne').mockResolvedValue(
      updateResult as unknown as Awaited<ReturnType<typeof ExperienceModel.updateOne>>
    );

    const results = await runSeed({ dryRun: false, quiet: true });

    // When running repeatedly on identical data, all records are skipped (unchanged)
    expect(results.destinations.skipped).toBe(results.destinations.totalInDataset);
    expect(results.destinations.inserted).toBe(0);
    expect(results.destinations.rejected).toBe(0);

    // Verify upsert option was passed to updateOne
    expect(destUpdateSpy).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      expect.objectContaining({ upsert: true })
    );

    vi.restoreAllMocks();
  });
});
