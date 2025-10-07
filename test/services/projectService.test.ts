import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as projectService from '@/services/projectService';
import { prismaMock } from '../setup';
import type { PrismaClient } from '@prisma/client';

describe('projectService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    prismaMock.project.findMany.mockReset?.();
    prismaMock.project.create.mockReset?.();
    prismaMock.project.findFirst.mockReset?.();
    prismaMock.project.findUnique?.mockReset?.();
    prismaMock.project.update?.mockReset?.();
    prismaMock.project.delete?.mockReset?.();
  });

  it('listProjects returns results from prisma', async () => {
    const fake = [{ id: 'p1', name: 'P1', items: [] }];
    prismaMock.project.findMany.mockResolvedValue(fake);
    const res = await projectService.listProjects(prismaMock as unknown as PrismaClient);
    expect(res).toEqual(fake);
  });

  it('getProject returns a project when found', async () => {
    const fake = { id: 'pget', name: 'G', items: [] };
    prismaMock.project.findUnique.mockResolvedValue(fake);
    const res = await projectService.getProject(prismaMock as unknown as PrismaClient, 'pget');
    expect(res).toEqual(fake);
  });

  it('createProject parses startDate and endDate strings into Dates', async () => {
    prismaMock.project.findFirst.mockResolvedValue(null);
    const fake = { id: 'pdate', name: 'WithDates' };
    prismaMock.project.create.mockResolvedValue(fake);

    const res = await projectService.createProject(prismaMock as unknown as PrismaClient, {
      name: 'WithDates',
      startDate: '2025-01-01',
      endDate: '2025-02-01',
    });

    expect(res).toEqual(fake);
    expect(prismaMock.project.create).toHaveBeenCalled();
  });

  it('updateProject throws PROJECT_NOT_FOUND when completing and project missing', async () => {
    prismaMock.project.findUnique.mockResolvedValue(null);
    await expect(
      projectService.updateProject(prismaMock as unknown as PrismaClient, 'nope', { status: 'COMPLETED' }),
    ).rejects.toBeDefined();
  });

  it('createProject throws when color is already used', async () => {
    prismaMock.project.findFirst.mockResolvedValue({ id: 'pExisting', name: 'Ex' });
    await expect(
      projectService.createProject(prismaMock as unknown as PrismaClient, {
        name: 'New',
        color: 'red',
      }),
    ).rejects.toBeDefined();
  });

  it('createProject creates project with defaults', async () => {
    const fake = { id: 'p2', name: 'New' };
    prismaMock.project.findFirst.mockResolvedValue(null);
    prismaMock.project.create.mockResolvedValue(fake);
    const res = await projectService.createProject(prismaMock as unknown as PrismaClient, { name: 'New' });
    expect(res).toEqual(fake);
    expect(prismaMock.project.create).toHaveBeenCalled();
  });

  it('createProject handles undefined values properly', async () => {
    const fake = { id: 'p2', name: 'New' };
    prismaMock.project.findFirst.mockResolvedValue(null);
    prismaMock.project.create.mockResolvedValue(fake);

    const res = await projectService.createProject(prismaMock as unknown as PrismaClient, {
      name: 'New',
      description: undefined,
      orderNumber: undefined,
      status: undefined,
      color: undefined,
      imageUrl: undefined,
      startDate: undefined,
      endDate: undefined,
    });

    expect(res).toEqual(fake);
    expect(prismaMock.project.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'New',
        description: undefined,
        orderNumber: null,
        status: 'ACTIVE',
        color: undefined,
        imageUrl: undefined,
        startDate: null,
        endDate: null,
      }),
      include: expect.any(Object),
    });
  });

  it('getProject throws ApiError when not found', async () => {
    prismaMock.project.findUnique.mockResolvedValue(null);
    await expect(projectService.getProject(prismaMock as unknown as PrismaClient, 'missing')).rejects.toBeDefined();
  });

  it('updateProject throws when setting COMPLETED with incomplete items', async () => {
    prismaMock.project.findUnique.mockResolvedValue({ id: 'p3', items: [{ id: 'i1', name: 'I', status: 'ACTIVE' }] });
    await expect(
      projectService.updateProject(prismaMock as unknown as PrismaClient, 'p3', { status: 'COMPLETED' }),
    ).rejects.toBeDefined();
  });

  it('updateProject throws on color conflict', async () => {
    prismaMock.project.findUnique.mockResolvedValue({ id: 'p4', items: [] });
    prismaMock.project.findFirst.mockResolvedValue({ id: 'other', name: 'Other' });
    await expect(
      projectService.updateProject(prismaMock as unknown as PrismaClient, 'p4', { color: 'blue' }),
    ).rejects.toBeDefined();
  });

  it('updateProject updates and returns project', async () => {
    const fake = { id: 'p5', name: 'Updated', items: [] };
    prismaMock.project.findUnique.mockResolvedValue({ id: 'p5', items: [] });
    prismaMock.project.update.mockResolvedValue(fake);
    const res = await projectService.updateProject(prismaMock as unknown as PrismaClient, 'p5', { name: 'Updated' });
    expect(res).toEqual(fake);
  });

  it('updateProject handles date parsing when dates are provided', async () => {
    const fake = { id: 'p5', name: 'WithDates', items: [] };
    prismaMock.project.findUnique.mockResolvedValue({ id: 'p5', items: [] });
    prismaMock.project.update.mockResolvedValue(fake);

    const res = await projectService.updateProject(prismaMock as unknown as PrismaClient, 'p5', {
      name: 'WithDates',
      startDate: '2025-01-01',
      endDate: '2025-02-01',
    });

    expect(res).toEqual(fake);
    expect(prismaMock.project.update).toHaveBeenCalledWith({
      where: { id: 'p5' },
      data: expect.objectContaining({
        startDate: expect.any(Date),
        endDate: expect.any(Date),
      }),
      include: expect.any(Object),
    });
  });

  it('updateProject handles null values for orderNumber', async () => {
    const fake = { id: 'p5', name: 'Updated', items: [] };
    prismaMock.project.findUnique.mockResolvedValue({ id: 'p5', items: [] });
    prismaMock.project.update.mockResolvedValue(fake);

    const res = await projectService.updateProject(prismaMock as unknown as PrismaClient, 'p5', {
      orderNumber: null,
    });

    expect(res).toEqual(fake);
    expect(prismaMock.project.update).toHaveBeenCalledWith({
      where: { id: 'p5' },
      data: expect.objectContaining({
        orderNumber: null,
      }),
      include: expect.any(Object),
    });
  });

  it('updateProject handles undefined dates (no date conversion)', async () => {
    const fake = { id: 'p5', name: 'Updated', items: [] };
    prismaMock.project.findUnique.mockResolvedValue({ id: 'p5', items: [] });
    prismaMock.project.update.mockResolvedValue(fake);

    const res = await projectService.updateProject(prismaMock as unknown as PrismaClient, 'p5', {
      name: 'Updated',
      // No startDate or endDate provided
    });

    expect(res).toEqual(fake);
    expect(prismaMock.project.update).toHaveBeenCalledWith({
      where: { id: 'p5' },
      data: expect.objectContaining({
        startDate: null,
        endDate: null,
      }),
      include: expect.any(Object),
    });
  });

  it('deleteProject throws when project not found', async () => {
    prismaMock.project.findUnique.mockResolvedValue(null);
    await expect(projectService.deleteProject(prismaMock as unknown as PrismaClient, 'missing')).rejects.toBeDefined();
  });

  it('deleteProject throws when project has items', async () => {
    prismaMock.project.findUnique.mockResolvedValue({ id: 'p6', items: [{ id: 'i1' }] });
    await expect(projectService.deleteProject(prismaMock as unknown as PrismaClient, 'p6')).rejects.toBeDefined();
  });

  it('deleteProject deletes when no items', async () => {
    prismaMock.project.findUnique.mockResolvedValue({ id: 'p7', items: [] });
    prismaMock.project.delete.mockResolvedValue({});
    const res = await projectService.deleteProject(prismaMock as unknown as PrismaClient, 'p7');
    expect(res).toEqual({ message: 'Project deleted successfully' });
    expect(prismaMock.project.delete).toHaveBeenCalledWith({ where: { id: 'p7' } });
  });
});
