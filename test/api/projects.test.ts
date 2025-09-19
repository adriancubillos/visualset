/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach } from 'vitest';
import * as projectsRoute from '@/app/api/projects/route';
import { prismaMock } from '../setup';

describe('Projects routes', () => {
  beforeEach(() => {
    prismaMock.project = prismaMock.project ?? {};
    prismaMock.project.findMany?.mockReset?.();
    prismaMock.project.create?.mockReset?.();
  });

  it('GET returns projects', async () => {
    const fakeProjects = [{ id: 'p1', name: 'P1', items: [] }];
    prismaMock.project!.findMany!.mockResolvedValue(fakeProjects);
    const res = await projectsRoute.GET();
    expect(res).toHaveProperty('body');
    const body = res.body as unknown as any[];
    expect(Array.isArray(body)).toBe(true);
    expect(body[0]).toHaveProperty('id', 'p1');
  });

  it('POST creates a project', async () => {
    const fakeProject = { id: 'p2', name: 'New' };
    prismaMock.project!.create!.mockResolvedValue(fakeProject);
    const req = new Request('http://localhost', { method: 'POST', body: JSON.stringify({ name: 'New' }) });
    const res = await projectsRoute.POST(req as any);
    expect(res).toHaveProperty('body');
    expect(res.body as any).toHaveProperty('id', 'p2');
  });
});
