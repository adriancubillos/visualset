import { describe, it, expect, beforeEach } from 'vitest';
import colorPatternUsageService from '@/services/colorPatternUsageService';
import { prismaMock } from '../setup';
import type { PrismaClient } from '@prisma/client';
import { ApiError } from '@/lib/errors';

describe('colorPatternUsageService', () => {
  beforeEach(() => {
    // reset mocks used by service
    if (prismaMock.operator?.findMany) prismaMock.operator.findMany.mockReset?.();
    if (prismaMock.machine?.findMany) prismaMock.machine.findMany.mockReset?.();
  });

  it('returns used combinations for operator', async () => {
    const fakeOps = [{ id: 'op1', name: 'Op1', color: '#fff', pattern: 'dots' }];
    prismaMock.operator!.findMany!.mockResolvedValue(fakeOps as unknown);

    const result = await colorPatternUsageService.fetchUsedCombinations(
      prismaMock as unknown as PrismaClient,
      'operator',
      {},
    );
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toMatchObject({ entityId: 'op1', entityType: 'operator', color: '#fff', pattern: 'dots' });
  });

  it('returns used combinations for machine', async () => {
    const fake = [{ id: 'm1', name: 'M1', color: '#000', pattern: 'stripes' }];
    prismaMock.machine!.findMany!.mockResolvedValue(fake as unknown);

    const result = await colorPatternUsageService.fetchUsedCombinations(
      prismaMock as unknown as PrismaClient,
      'machine',
      {},
    );
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toMatchObject({ entityId: 'm1', entityType: 'machine', color: '#000', pattern: 'stripes' });
  });

  it('respects excludeEntityId for operator fetcher', async () => {
    const fakeOps = [{ id: 'op2', name: 'Op2', color: '#abc', pattern: 'grid' }];
    prismaMock.operator!.findMany!.mockResolvedValue(fakeOps as unknown);

    const result = await colorPatternUsageService.fetchUsedCombinations(
      prismaMock as unknown as PrismaClient,
      'operator',
      { excludeEntityId: 'op1' },
    );

    expect(Array.isArray(result)).toBe(true);
    // Ensure the mock was called with the exclude id in the where clause
    expect(prismaMock.operator!.findMany!.mock.calls[0][0]).toEqual(
      expect.objectContaining({ where: expect.objectContaining({ id: { not: 'op1' } }) }),
    );
  });

  it('maps null name to entityName null for operator', async () => {
    const fakeOps = [{ id: 'op3', name: null, color: '#123', pattern: 'dots' }];
    prismaMock.operator!.findMany!.mockResolvedValue(fakeOps as unknown);

    const result = await colorPatternUsageService.fetchUsedCombinations(
      prismaMock as unknown as PrismaClient,
      'operator',
      {},
    );

    expect(result[0].entityName).toBeNull();
  });

  it('respects excludeEntityId for machine fetcher', async () => {
    const fake = [{ id: 'm2', name: null, color: '#999', pattern: 'stripes' }];
    prismaMock.machine!.findMany!.mockResolvedValue(fake as unknown);

    const result = await colorPatternUsageService.fetchUsedCombinations(
      prismaMock as unknown as PrismaClient,
      'machine',
      { excludeEntityId: 'm1' },
    );

    expect(prismaMock.machine!.findMany!.mock.calls[0][0]).toEqual(
      expect.objectContaining({ where: expect.objectContaining({ id: { not: 'm1' } }) }),
    );
    expect(result[0].entityName).toBeNull();
  });

  it('throws ApiError for unsupported entity types', async () => {
    await expect(() =>
      colorPatternUsageService.fetchUsedCombinations(prismaMock as unknown as PrismaClient, 'unknown', {}),
    ).rejects.toBeInstanceOf(ApiError);
  });
});
