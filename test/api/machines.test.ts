/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as machinesRoute from '@/app/api/machines/route';
import { prismaMock } from '../setup';

describe('Machines routes', () => {
  beforeEach(() => {
    if (!prismaMock.machine) {
      prismaMock.machine = { findMany: vi.fn() as any, create: vi.fn() as any };
    }
    if (prismaMock.machine.findMany) prismaMock.machine.findMany.mockReset?.();
    if (prismaMock.machine.create) prismaMock.machine.create.mockReset?.();
  });

  it('GET returns machines', async () => {
    const fake = [{ id: 'm1', name: 'M1' }];
    prismaMock.machine!.findMany!.mockResolvedValue(fake);
    const res = await machinesRoute.GET();
    expect(res).toHaveProperty('body');
    const body = res.body as unknown as any[];
    expect(body[0]).toHaveProperty('id', 'm1');
  });

  it('POST creates machine', async () => {
    const fake = { id: 'm2', name: 'New' };
    prismaMock.machine!.create!.mockResolvedValue(fake);
    const req = new Request('http://localhost', { method: 'POST', body: JSON.stringify({ name: 'New' }) });
    const res = await machinesRoute.POST(req as any);
    expect(res).toHaveProperty('body');
    expect(res.body as any).toHaveProperty('id', 'm2');
  });
});
