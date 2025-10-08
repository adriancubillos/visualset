import { describe, it, expect, beforeEach, vi } from 'vitest';
import itemService from '@/services/itemService';
import { getItem } from '@/services/itemService';
import { prismaMock } from '../setup';
import type { PrismaClient } from '@prisma/client';

describe('itemService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    prismaMock.item.findMany.mockReset?.();
    prismaMock.item.create.mockReset?.();
    prismaMock.item.findUnique.mockReset?.();
    prismaMock.item.update.mockReset?.();
    prismaMock.item.delete.mockReset?.();
  });

  it('listItems calls prisma.findMany and returns items', async () => {
    const fake = [{ id: 'i1', name: 'Item 1' }];
    prismaMock.item.findMany.mockResolvedValue(fake);
    const res = await itemService.listItems(prismaMock as unknown as PrismaClient);
    expect(prismaMock.item.findMany).toHaveBeenCalled();
    expect(res).toEqual(fake);
  });

  it('createItem calls prisma.create and returns created item', async () => {
    const input = { name: 'New' } as Parameters<typeof itemService.createItem>[1];
    const fake = { id: 'i2', name: 'New' };
    prismaMock.item.create.mockResolvedValue(fake);
    const res = await itemService.createItem(prismaMock as unknown as PrismaClient, input);
    expect(prismaMock.item.create).toHaveBeenCalled();
    expect(res).toEqual(fake);
  });

  it('getItem returns item when found', async () => {
    const fakeItem = { id: 'i1', name: 'Item 1', project: { id: 'p1', name: 'Project 1' }, tasks: [] };
    prismaMock.item.findUnique.mockResolvedValue(fakeItem);
    const res = await itemService.getItem(prismaMock as unknown as PrismaClient, 'i1');
    expect(prismaMock.item.findUnique).toHaveBeenCalledWith({
      where: { id: 'i1' },
      include: expect.objectContaining({
        project: expect.any(Object),
        tasks: expect.any(Object),
      }),
    });
    expect(res).toEqual(fakeItem);
  });

  it('getItem throws ApiError when not found', async () => {
    prismaMock.item.findUnique.mockResolvedValue(null);
    await expect(itemService.getItem(prismaMock as unknown as PrismaClient, 'missing')).rejects.toThrow();
  });

  it('named getItem throws ITEM_NOT_FOUND when missing (named import)', async () => {
    prismaMock.item.findUnique.mockResolvedValue(null);
    await expect(getItem(prismaMock as unknown as PrismaClient, 'missing')).rejects.toMatchObject({
      code: 'ITEM_NOT_FOUND',
    });
  });

  it('updateItem throws when item not found', async () => {
    prismaMock.item.findUnique.mockResolvedValue(null);
    const data = { status: 'COMPLETED' } as Parameters<typeof itemService.updateItem>[2];
    await expect(itemService.updateItem(prismaMock as unknown as PrismaClient, 'nope', data)).rejects.toHaveProperty(
      'code',
    );
  });

  it('updateItem throws when completing but tasks incomplete', async () => {
    prismaMock.item.findUnique.mockResolvedValue({
      id: 'i1',
      tasks: [{ id: 't1', title: 'T1', status: 'IN_PROGRESS' }],
    });

    const data = { status: 'COMPLETED' } as Parameters<typeof itemService.updateItem>[2];
    await expect(itemService.updateItem(prismaMock as unknown as PrismaClient, 'i1', data)).rejects.toHaveProperty(
      'code',
    );
  });

  it('deleteItem throws when item has tasks', async () => {
    prismaMock.item.findUnique.mockResolvedValue({ id: 'i1', _count: { tasks: 2 } });
    await expect(itemService.deleteItem(prismaMock as unknown as PrismaClient, 'i1')).rejects.toHaveProperty('code');
  });

  it('deleteItem succeeds when no tasks', async () => {
    prismaMock.item.findUnique.mockResolvedValue({ id: 'i1', _count: { tasks: 0 } });
    prismaMock.item.delete.mockResolvedValue({ id: 'i1' });

    const res = await itemService.deleteItem(prismaMock as unknown as PrismaClient, 'i1');
    expect(res).toHaveProperty('message', 'Item deleted successfully');
  });

  it('updateItem succeeds when no incomplete tasks and updates', async () => {
    prismaMock.item.findUnique.mockResolvedValue({ id: 'i1', tasks: [] });
    prismaMock.item.update.mockResolvedValue({ id: 'i1', name: 'Updated' });

    const data = { name: 'Updated' } as Parameters<typeof itemService.updateItem>[2];
    const res = await itemService.updateItem(prismaMock as unknown as PrismaClient, 'i1', data);
    expect(res).toHaveProperty('id', 'i1');
  });

  it('createItem uses defaults and connects project', async () => {
    const input = { name: 'New', projectId: 'p1' } as Parameters<typeof itemService.createItem>[1];
    const fake = { id: 'i10', name: 'New' };
    prismaMock.item.create.mockResolvedValue(fake);

    const res = await itemService.createItem(prismaMock as unknown as PrismaClient, input);
    expect(prismaMock.item.create).toHaveBeenCalled();
    expect(res).toEqual(fake);
  });

  it('updateItem connects project when projectId provided', async () => {
    prismaMock.item.findUnique.mockResolvedValue({ id: 'i1', tasks: [] });
    prismaMock.item.update.mockResolvedValue({ id: 'i1', projectId: 'p2' });

    const data = { projectId: 'p2' } as Parameters<typeof itemService.updateItem>[2];
    const res = await itemService.updateItem(prismaMock as unknown as PrismaClient, 'i1', data);
    expect(prismaMock.item.update).toHaveBeenCalled();
    expect(res).toHaveProperty('id', 'i1');
  });

  it('updateItem leaves project when projectId is null', async () => {
    prismaMock.item.findUnique.mockResolvedValue({ id: 'i1', tasks: [] });
    prismaMock.item.update.mockResolvedValue({ id: 'i1' });

    const data = { projectId: null } as Parameters<typeof itemService.updateItem>[2];
    const res = await itemService.updateItem(prismaMock as unknown as PrismaClient, 'i1', data);
    expect(prismaMock.item.update).toHaveBeenCalled();
    expect(res).toHaveProperty('id', 'i1');
  });

  it('updateItem throws ITEM_NOT_FOUND when completing a missing item', async () => {
    prismaMock.item.findUnique.mockResolvedValue(null);
    const data = { status: 'COMPLETED' } as Parameters<typeof itemService.updateItem>[2];
    await expect(itemService.updateItem(prismaMock as unknown as PrismaClient, 'missing', data)).rejects.toMatchObject({
      code: 'ITEM_NOT_FOUND',
    });
  });

  it('deleteItem throws ITEM_NOT_FOUND when item does not exist', async () => {
    prismaMock.item.findUnique.mockResolvedValue(null);
    await expect(itemService.deleteItem(prismaMock as unknown as PrismaClient, 'missing')).rejects.toMatchObject({
      code: 'ITEM_NOT_FOUND',
    });
  });
});
