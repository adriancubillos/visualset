/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as operatorsRoute from '@/app/api/operators/route';
import { prismaMock } from '../setup';

describe('Operators routes', () => {
  beforeEach(() => {
    if (!prismaMock.operator) {
      prismaMock.operator = { findMany: vi.fn() as any, create: vi.fn() as any };
    }
    if (prismaMock.operator.findMany) prismaMock.operator.findMany.mockReset?.();
    if (prismaMock.operator.create) prismaMock.operator.create.mockReset?.();
  });

  it('GET returns operators', async () => {
    const fake = [{ id: 'o1', name: 'O1' }];
    prismaMock.operator!.findMany!.mockResolvedValue(fake);
    const res = await operatorsRoute.GET();
    const body = res.body as unknown as any[];
    expect(body[0]).toHaveProperty('id', 'o1');
  });

  it('POST creates operator', async () => {
    const fake = { id: 'o2', name: 'New' };
    prismaMock.operator!.create!.mockResolvedValue(fake);
    const req = new Request('http://localhost', { method: 'POST', body: JSON.stringify({ name: 'New' }) });
    const res = await operatorsRoute.POST(req as any);
    expect(res.body as any).toHaveProperty('id', 'o2');
  });
});
