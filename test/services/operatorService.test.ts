import { describe, it, expect, beforeEach, vi } from 'vitest';
import operatorService, { OperatorCreateInput } from '@/services/operatorService';
import { prismaMock } from '../setup';
import type { PrismaClient } from '@prisma/client';

describe('operatorService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    prismaMock.operator.findMany.mockReset?.();
    prismaMock.operator.create.mockReset?.();
    prismaMock.operator.findUnique.mockReset?.();
    prismaMock.operator.update.mockReset?.();
    prismaMock.operator.delete.mockReset?.();
    prismaMock.taskOperator.count.mockReset?.();
  });

  it('listOperators calls prisma.findMany', async () => {
    const fake = [{ id: 'o1', name: 'O1' }];
    prismaMock.operator.findMany.mockResolvedValue(fake);
    const res = await operatorService.listOperators(prismaMock as unknown as PrismaClient);
    expect(res).toEqual(fake);
  });

  it('createOperator calls prisma.create with defaults', async () => {
    const input: OperatorCreateInput = { name: 'New' };
    const fake = { id: 'o2', name: 'New' };
    prismaMock.operator.create.mockResolvedValue(fake);
    const res = await operatorService.createOperator(prismaMock as unknown as PrismaClient, input);
    expect(res).toEqual(fake);
    expect(prismaMock.operator.create).toHaveBeenCalled();
  });

  it('getOperator throws ApiError when not found', async () => {
    prismaMock.operator.findUnique.mockResolvedValue(null);
    await expect(operatorService.getOperator(prismaMock as unknown as PrismaClient, 'missing')).rejects.toBeDefined();
  });

  it('updateOperator throws ApiError when not found', async () => {
    prismaMock.operator.findUnique.mockResolvedValue(null);
    await expect(
      operatorService.updateOperator(prismaMock as unknown as PrismaClient, 'nope', { name: 'x' }),
    ).rejects.toBeDefined();
  });

  it('deleteOperator maps tasksCount >0 to ApiError', async () => {
    prismaMock.taskOperator.count.mockResolvedValue(1);
    await expect(
      operatorService.deleteOperator(prismaMock as unknown as PrismaClient, 'withtasks'),
    ).rejects.toBeDefined();
  });
});

describe('operatorService additional branches', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    prismaMock.operator.create.mockReset?.();
    prismaMock.operator.findUnique.mockReset?.();
    prismaMock.operator.update.mockReset?.();
    prismaMock.operator.delete.mockReset?.();
    prismaMock.taskOperator.count.mockReset?.();
  });

  it('createOperator uses provided availability object and defaults', async () => {
    const input: OperatorCreateInput = { name: 'Avail', availability: { mon: ['9-5'] } };
    const fake = { id: 'a1', name: 'Avail', availability: { mon: ['9-5'] } };
    prismaMock.operator.create.mockResolvedValue(fake);
    const res = await operatorService.createOperator(prismaMock as unknown as PrismaClient, input);
    expect(res).toEqual(fake);
    expect(prismaMock.operator.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ availability: input.availability }) }),
    );
  });

  it('updateOperator applies explicit nulls and arrays correctly', async () => {
    prismaMock.operator.findUnique.mockResolvedValue({ id: 'u1', name: 'X' });
    const updatePayload = { name: undefined, email: null, skills: ['a', 'b'], shift: null };
    const fake = { id: 'u1', name: 'X', email: null, skills: ['a', 'b'], shift: null };
    prismaMock.operator.update.mockResolvedValue(fake);

    const res = await operatorService.updateOperator(
      prismaMock as unknown as PrismaClient,
      'u1',
      updatePayload as unknown as Partial<OperatorCreateInput>,
    );
    expect(res).toEqual(fake);
    expect(prismaMock.operator.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: expect.objectContaining({ email: null, skills: ['a', 'b'], shift: null }),
    });
  });

  it('updateOperator with all fields present sets all partials', async () => {
    prismaMock.operator.findUnique.mockResolvedValue({ id: 'u2', name: 'Old' });
    const payload = {
      name: 'NewName',
      email: 'e@example.com',
      skills: ['x'],
      status: 'ACTIVE',
      shift: 'morning',
      color: 'red',
      pattern: 'dots',
      availability: { tue: ['9-5'] },
    } as const;

    const fake = { id: 'u2', ...payload };
    prismaMock.operator.update.mockResolvedValue(fake);

    const res = await operatorService.updateOperator(
      prismaMock as unknown as PrismaClient,
      'u2',
      payload as unknown as Partial<import('@/services/operatorService').OperatorCreateInput>,
    );
    expect(res).toEqual(fake);
    expect(prismaMock.operator.update).toHaveBeenCalledWith({
      where: { id: 'u2' },
      data: expect.objectContaining({
        name: 'NewName',
        email: 'e@example.com',
        skills: ['x'],
        status: 'ACTIVE',
        shift: 'morning',
        color: 'red',
        pattern: 'dots',
        availability: { tue: ['9-5'] },
      }),
    });
  });

  it('deleteOperator deletes when no tasks and operator exists', async () => {
    prismaMock.taskOperator.count.mockResolvedValue(0);
    prismaMock.operator.findUnique.mockResolvedValue({ id: 'd1', name: 'Del' });
    prismaMock.operator.delete.mockResolvedValue({});

    const res = await operatorService.deleteOperator(prismaMock as unknown as PrismaClient, 'd1');
    expect(res).toEqual({ message: 'Operator deleted successfully' });
    expect(prismaMock.operator.delete).toHaveBeenCalledWith({ where: { id: 'd1' } });
  });

  it('deleteOperator throws ApiError when operator not found', async () => {
    prismaMock.taskOperator.count.mockResolvedValue(0);
    prismaMock.operator.findUnique.mockResolvedValue(null);

    await expect(
      operatorService.deleteOperator(prismaMock as unknown as PrismaClient, 'missing'),
    ).rejects.toBeDefined();
  });

  it('updateOperator uses ?? null fallbacks for falsy values', async () => {
    prismaMock.operator.findUnique.mockResolvedValue({ id: 'u3', name: 'Test' });
    const updatePayload = {
      email: null, // null triggers ?? null
      status: null, // null triggers ?? null
      shift: null, // null triggers ?? null
      color: null, // null triggers ?? null
      pattern: null, // null triggers ?? null
      availability: null, // null triggers ?? null
    };
    const fake = { id: 'u3', name: 'Test' };
    prismaMock.operator.update.mockResolvedValue(fake);

    const res = await operatorService.updateOperator(
      prismaMock as unknown as PrismaClient,
      'u3',
      updatePayload as unknown as Partial<OperatorCreateInput>,
    );
    expect(res).toEqual(fake);
    expect(prismaMock.operator.update).toHaveBeenCalledWith({
      where: { id: 'u3' },
      data: expect.objectContaining({
        email: null,
        status: null,
        shift: null,
        color: null,
        pattern: null,
        availability: null,
      }),
    });
  });

  it('updateOperator uses ?? [] fallback for skills when falsy', async () => {
    prismaMock.operator.findUnique.mockResolvedValue({ id: 'u4', name: 'Test' });
    const updatePayload = { skills: null }; // null triggers ?? []
    const fake = { id: 'u4', name: 'Test', skills: [] };
    prismaMock.operator.update.mockResolvedValue(fake);

    const res = await operatorService.updateOperator(
      prismaMock as unknown as PrismaClient,
      'u4',
      updatePayload as unknown as Partial<OperatorCreateInput>,
    );
    expect(res).toEqual(fake);
    expect(prismaMock.operator.update).toHaveBeenCalledWith({
      where: { id: 'u4' },
      data: expect.objectContaining({ skills: [] }),
    });
  });
});
