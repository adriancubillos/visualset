import { describe, it, expect, beforeEach, vi } from 'vitest';
import machineService from '@/services/machineService';
import { prismaMock } from '../setup';
import type { PrismaClient } from '@prisma/client';

describe('machineService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    prismaMock.machine.findMany.mockReset?.();
    prismaMock.machine.create.mockReset?.();
    prismaMock.machine.findUnique.mockReset?.();
    prismaMock.machine.update.mockReset?.();
    prismaMock.machine.delete.mockReset?.();
    prismaMock.taskMachine.count.mockReset?.();
  });

  it('listMachines returns machines', async () => {
    const fake = [{ id: 'm1', name: 'M1' }];
    prismaMock.machine.findMany.mockResolvedValue(fake);
    const res = await machineService.listMachines(prismaMock as unknown as PrismaClient);
    expect(prismaMock.machine.findMany).toHaveBeenCalled();
    expect(res).toEqual(fake);
  });

  it('createMachine creates and returns', async () => {
    const input = { name: 'New' } as Parameters<typeof machineService.createMachine>[1];
    const fake = { id: 'm2', name: 'New' };
    prismaMock.machine.create.mockResolvedValue(fake);
    const res = await machineService.createMachine(prismaMock as unknown as PrismaClient, input);
    expect(prismaMock.machine.create).toHaveBeenCalled();
    expect(res).toEqual(fake);
  });

  it('createMachine uses default status when not provided', async () => {
    const input = { name: 'Def' } as Parameters<typeof machineService.createMachine>[1];
    const fake = { id: 'm3', name: 'Def', status: 'AVAILABLE' } as Awaited<
      ReturnType<typeof prismaMock.machine.create>
    >;
    prismaMock.machine.create.mockImplementation(async ({ data }) => {
      // ensure status defaulted
      expect(data as unknown as Record<string, unknown>).toHaveProperty('status');
      return fake;
    });
    const res = await machineService.createMachine(prismaMock as unknown as PrismaClient, input);
    expect(res).toEqual(fake);
  });

  it('getMachine throws when not found', async () => {
    prismaMock.machine.findUnique.mockResolvedValue(null);
    await expect(machineService.getMachine(prismaMock as unknown as PrismaClient, 'missing')).rejects.toMatchObject({
      code: 'MACHINE_NOT_FOUND',
    });
  });

  it('getMachine returns machine with nested includes', async () => {
    const fake = {
      id: 'm1',
      name: 'M1',
      tasks: [
        {
          id: 't1',
          createdAt: new Date(),
          operator: { id: 'o1', name: 'Op' },
          item: { id: 'i1', project: { id: 'p1', name: 'P' } },
        },
      ],
    } as unknown as Awaited<ReturnType<typeof prismaMock.machine.findUnique>>;

    prismaMock.machine.findUnique.mockResolvedValue(fake);
    const res = await machineService.getMachine(prismaMock as unknown as PrismaClient, 'm1');
    expect(res).toEqual(fake);
  });

  it('updateMachine throws when not found', async () => {
    prismaMock.machine.findUnique.mockResolvedValue(null);
    const data = { name: 'X' } as Parameters<typeof machineService.updateMachine>[2];
    await expect(
      machineService.updateMachine(prismaMock as unknown as PrismaClient, 'missing', data),
    ).rejects.toMatchObject({ code: 'MACHINE_NOT_FOUND' });
  });

  it('updateMachine updates when exists', async () => {
    prismaMock.machine.findUnique.mockResolvedValue({ id: 'm1' });
    prismaMock.machine.update.mockResolvedValue({ id: 'm1', name: 'Updated' });
    const data = { name: 'Updated' } as Parameters<typeof machineService.updateMachine>[2];
    const res = await machineService.updateMachine(prismaMock as unknown as PrismaClient, 'm1', data);
    expect(prismaMock.machine.update).toHaveBeenCalled();
    expect(res).toHaveProperty('id', 'm1');
  });

  it('updateMachine maps undefined vs null correctly', async () => {
    // existing present
    prismaMock.machine.findUnique.mockResolvedValue({ id: 'm2' });
    // assert update receives null for explicit nulls
    prismaMock.machine.update.mockImplementation(async ({ data }) => {
      expect(data as unknown as Record<string, unknown>).toHaveProperty('type', null);
      expect(data as unknown as Record<string, unknown>).toHaveProperty('status', null);
      return { id: 'm2', ...(data as object) } as unknown as Awaited<ReturnType<typeof prismaMock.machine.update>>;
    });

    const data = { type: null, status: null } as unknown as Parameters<typeof machineService.updateMachine>[2];
    const res = await machineService.updateMachine(prismaMock as unknown as PrismaClient, 'm2', data);
    expect(res).toHaveProperty('id', 'm2');
  });

  it('deleteMachine throws when has tasks', async () => {
    prismaMock.taskMachine.count.mockResolvedValue(2);
    await expect(machineService.deleteMachine(prismaMock as unknown as PrismaClient, 'm1')).rejects.toMatchObject({
      code: 'MACHINE_HAS_TASKS',
    });
  });

  it('deleteMachine deletes when no tasks and exists', async () => {
    prismaMock.taskMachine.count.mockResolvedValue(0);
    prismaMock.machine.findUnique.mockResolvedValue({ id: 'm1' });
    prismaMock.machine.delete.mockResolvedValue({ id: 'm1' });
    const res = await machineService.deleteMachine(prismaMock as unknown as PrismaClient, 'm1');
    expect(prismaMock.machine.delete).toHaveBeenCalled();
    expect(res).toHaveProperty('message');
  });

  it('deleteMachine throws when no tasks but machine missing', async () => {
    prismaMock.taskMachine.count.mockResolvedValue(0);
    prismaMock.machine.findUnique.mockResolvedValue(null);
    await expect(machineService.deleteMachine(prismaMock as unknown as PrismaClient, 'm4')).rejects.toMatchObject({
      code: 'MACHINE_NOT_FOUND',
    });
  });

  // Tests to cover lines 60-62 (location, color, pattern assignments)
  it('updateMachine handles location field assignment', async () => {
    prismaMock.machine.findUnique.mockResolvedValue({ id: 'm5' });
    prismaMock.machine.update.mockImplementation(async ({ data }) => {
      expect(data as unknown as Record<string, unknown>).toHaveProperty('location', 'Factory Floor');
      return { id: 'm5', location: 'Factory Floor' } as unknown as Awaited<
        ReturnType<typeof prismaMock.machine.update>
      >;
    });

    const data = { location: 'Factory Floor' } as Parameters<typeof machineService.updateMachine>[2];
    const res = await machineService.updateMachine(prismaMock as unknown as PrismaClient, 'm5', data);
    expect(res).toHaveProperty('location', 'Factory Floor');
  });

  it('updateMachine handles color field assignment', async () => {
    prismaMock.machine.findUnique.mockResolvedValue({ id: 'm6' });
    prismaMock.machine.update.mockImplementation(async ({ data }) => {
      expect(data as unknown as Record<string, unknown>).toHaveProperty('color', 'blue');
      return { id: 'm6', color: 'blue' } as unknown as Awaited<ReturnType<typeof prismaMock.machine.update>>;
    });

    const data = { color: 'blue' } as Parameters<typeof machineService.updateMachine>[2];
    const res = await machineService.updateMachine(prismaMock as unknown as PrismaClient, 'm6', data);
    expect(res).toHaveProperty('color', 'blue');
  });

  it('updateMachine handles pattern field assignment', async () => {
    prismaMock.machine.findUnique.mockResolvedValue({ id: 'm7' });
    prismaMock.machine.update.mockImplementation(async ({ data }) => {
      expect(data as unknown as Record<string, unknown>).toHaveProperty('pattern', 'striped');
      return { id: 'm7', pattern: 'striped' } as unknown as Awaited<ReturnType<typeof prismaMock.machine.update>>;
    });

    const data = { pattern: 'striped' } as Parameters<typeof machineService.updateMachine>[2];
    const res = await machineService.updateMachine(prismaMock as unknown as PrismaClient, 'm7', data);
    expect(res).toHaveProperty('pattern', 'striped');
  });

  it('updateMachine handles null values for location, color, and pattern', async () => {
    prismaMock.machine.findUnique.mockResolvedValue({ id: 'm8' });
    prismaMock.machine.update.mockImplementation(async ({ data }) => {
      const asRec = data as unknown as Record<string, unknown>;
      expect(asRec).toHaveProperty('location', null);
      expect(asRec).toHaveProperty('color', null);
      expect(asRec).toHaveProperty('pattern', null);
      return { id: 'm8', location: null, color: null, pattern: null } as unknown as Awaited<
        ReturnType<typeof prismaMock.machine.update>
      >;
    });

    const data = { location: null, color: null, pattern: null } as unknown as Parameters<
      typeof machineService.updateMachine
    >[2];
    const res = await machineService.updateMachine(prismaMock as unknown as PrismaClient, 'm8', data);
    expect(res).toHaveProperty('id', 'm8');
  });
});
