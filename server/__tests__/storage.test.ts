import { beforeEach, describe, expect, it, vi } from 'vitest';
import { archives, fileMutations, files, observerEvents } from '@shared/schema';

const mocks = vi.hoisted(() => {
  const where = vi.fn().mockResolvedValue(undefined);
  const from = vi.fn(() => ({ where }));
  const select = vi.fn(() => ({ from }));
  const deleteWhere = vi.fn().mockResolvedValue(undefined);
  const deleteFn = vi.fn(() => ({ where: deleteWhere }));
  const tx = { select, delete: deleteFn };
  const db = {
    transaction: vi.fn(async (callback: (txArg: typeof tx) => Promise<void>) => callback(tx)),
  };
  const auditLog = {
    log: vi.fn().mockResolvedValue({}),
  };

  return { auditLog, db, deleteFn, deleteWhere, from, select, tx, where };
});

vi.mock('../db', () => ({
  db: mocks.db,
}));

vi.mock('../audit-log', () => ({
  auditLog: mocks.auditLog,
}));

import { DatabaseStorage } from '../storage';

describe('DatabaseStorage.deleteArchive', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.where.mockResolvedValue([{ id: 'file-1' }, { id: 'file-2' }]);
    mocks.db.transaction.mockImplementation(async callback => callback(mocks.tx));
  });

  it('deletes dependent rows inside a transaction', async () => {
    const storage = new DatabaseStorage();

    await storage.deleteArchive('archive-1');

    expect(mocks.db.transaction).toHaveBeenCalledOnce();
    expect(mocks.deleteFn).toHaveBeenCalledWith(fileMutations);
    expect(mocks.deleteFn).toHaveBeenCalledWith(observerEvents);
    expect(mocks.deleteFn).toHaveBeenCalledWith(files);
    expect(mocks.deleteFn).toHaveBeenCalledWith(archives);
  });

  it('logs and rethrows transaction rollback failures', async () => {
    const storage = new DatabaseStorage();
    mocks.db.transaction.mockRejectedValueOnce(new Error('rollback'));

    await expect(storage.deleteArchive('archive-1')).rejects.toThrow('rollback');

    expect(mocks.auditLog.log).toHaveBeenCalledWith(
      'critical',
      'modification',
      'Archive deletion rolled back',
      expect.objectContaining({
        resource: 'archive',
        resourceId: 'archive-1',
      })
    );
  });
});
