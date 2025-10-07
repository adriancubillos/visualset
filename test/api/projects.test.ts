import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as projectsRoute from '@/app/api/projects/route';
import * as projectsIdRoute from '@/app/api/projects/[id]/route';
import projectService from '@/services/projectService';
import { logger } from '@/utils/logger';

describe('Projects routes', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('GET /api/projects returns projects on success', async () => {
    const fake = [{ id: 'p1', name: 'P1', items: [] }];
    const svc = vi
      .spyOn(projectService, 'listProjects')
      .mockResolvedValue(fake as unknown as Awaited<ReturnType<typeof projectService.listProjects>>);

    const res = (await projectsRoute.GET()) as Awaited<ReturnType<typeof projectsRoute.GET>>;
    expect(res).toHaveProperty('body');
    expect(res.body).toEqual(fake);
    expect(svc).toHaveBeenCalled();
  });

  it('POST /api/projects creates project on success', async () => {
    const fake = { id: 'p2', name: 'New' };
    const svc = vi
      .spyOn(projectService, 'createProject')
      .mockResolvedValue(fake as unknown as Awaited<ReturnType<typeof projectService.createProject>>);
    const req = new Request('http://localhost', { method: 'POST', body: JSON.stringify({ name: 'New' }) });

    const res = (await projectsRoute.POST(req)) as Awaited<ReturnType<typeof projectsRoute.POST>>;
    expect(res).toHaveProperty('body');
    expect(res.body).toEqual(fake);
    expect(svc).toHaveBeenCalled();
  });

  it('POST /api/projects maps service errors to structured response', async () => {
    const apiErr = new Error('boom');
    vi.spyOn(projectService, 'createProject').mockRejectedValue(apiErr);
    const spyApiError = vi.spyOn(logger, 'apiError');

    const req = new Request('http://localhost', { method: 'POST', body: JSON.stringify({ name: 'New' }) });
    const res = (await projectsRoute.POST(req)) as Awaited<ReturnType<typeof projectsRoute.POST>>;

    expect(res).toHaveProperty('body');
    expect(res.body).toHaveProperty('error');
    expect(spyApiError).toHaveBeenCalled();
  });

  it('GET /api/projects maps service errors to structured response', async () => {
    const apiErr = new Error('boom');
    vi.spyOn(projectService, 'listProjects').mockRejectedValue(apiErr);
    const spyApiError = vi.spyOn(logger, 'apiError');

    const res = (await projectsRoute.GET()) as Awaited<ReturnType<typeof projectsRoute.GET>>;

    expect(res).toHaveProperty('body');
    expect(res.body).toHaveProperty('error');
    expect(spyApiError).toHaveBeenCalled();
  });

  it('POST /api/projects handles malformed JSON request body gracefully', async () => {
    const req = new Request('http://localhost', {
      method: 'POST',
      body: 'invalid json',
    });

    const res = (await projectsRoute.POST(req)) as Awaited<ReturnType<typeof projectsRoute.POST>>;

    expect(res).toHaveProperty('body');
    expect(res.body).toHaveProperty('error');
  });
});

describe('projects/[id] route', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('GET /api/projects/[id] returns project on success', async () => {
    const fake = { id: 'p1', name: 'P1', items: [] };
    const svc = vi
      .spyOn(projectService, 'getProject')
      .mockResolvedValue(fake as unknown as Awaited<ReturnType<typeof projectService.getProject>>);
    const req = new Request('http://localhost');
    const context: { params: Promise<{ id: string }> } = { params: Promise.resolve({ id: 'p1' }) };

    const res = (await projectsIdRoute.GET(req, context)) as Awaited<ReturnType<typeof projectsIdRoute.GET>>;
    expect(res).toHaveProperty('body');
    expect(res.body).toEqual(fake);
    expect(svc).toHaveBeenCalledWith(expect.anything(), 'p1');
  });

  it('PUT /api/projects/[id] returns project on success', async () => {
    const fake = { id: 'p1', name: 'Updated', items: [] };
    const svc = vi
      .spyOn(projectService, 'updateProject')
      .mockResolvedValue(fake as unknown as Awaited<ReturnType<typeof projectService.updateProject>>);

    const req = new Request('http://localhost', { method: 'PUT', body: JSON.stringify({ name: 'Updated' }) });
    const context: { params: Promise<{ id: string }> } = { params: Promise.resolve({ id: 'p1' }) };
    const res = (await projectsIdRoute.PUT(req, context)) as Awaited<ReturnType<typeof projectsIdRoute.PUT>>;
    expect(res).toHaveProperty('body');
    expect(res.body).toEqual(fake);
    expect(svc).toHaveBeenCalledWith(expect.anything(), 'p1', expect.any(Object));
  });

  it('DELETE /api/projects/[id] returns success on delete', async () => {
    const fake = { message: 'Project deleted successfully' };
    const svc = vi
      .spyOn(projectService, 'deleteProject')
      .mockResolvedValue(fake as unknown as Awaited<ReturnType<typeof projectService.deleteProject>>);

    const req = new Request('http://localhost', { method: 'DELETE' });
    const context: { params: Promise<{ id: string }> } = { params: Promise.resolve({ id: 'p1' }) };
    const res = (await projectsIdRoute.DELETE(req, context)) as Awaited<ReturnType<typeof projectsIdRoute.DELETE>>;
    expect(res).toHaveProperty('body');
    expect(res.body).toEqual(fake);
    expect(svc).toHaveBeenCalledWith(expect.anything(), 'p1');
  });

  it('GET /api/projects/[id] maps service errors to structured response', async () => {
    const apiErr = new Error('boom');
    vi.spyOn(projectService, 'getProject').mockRejectedValue(apiErr);
    const spyApiError = vi.spyOn(logger, 'apiError');

    const req = new Request('http://localhost');
    const context: { params: Promise<{ id: string }> } = { params: Promise.resolve({ id: 'p1' }) };
    const res = (await projectsIdRoute.GET(req, context)) as Awaited<ReturnType<typeof projectsIdRoute.GET>>;

    expect(res).toHaveProperty('body');
    expect(res.body).toHaveProperty('error');
    expect(spyApiError).toHaveBeenCalled();
  });

  it('PUT /api/projects/[id] maps service errors to structured response', async () => {
    const apiErr = new Error('boom');
    vi.spyOn(projectService, 'updateProject').mockRejectedValue(apiErr);
    const spyApiError = vi.spyOn(logger, 'apiError');

    const req = new Request('http://localhost', { method: 'PUT', body: JSON.stringify({ name: 'Updated' }) });
    const context: { params: Promise<{ id: string }> } = { params: Promise.resolve({ id: 'p1' }) };
    const res = (await projectsIdRoute.PUT(req, context)) as Awaited<ReturnType<typeof projectsIdRoute.PUT>>;

    expect(res).toHaveProperty('body');
    expect(res.body).toHaveProperty('error');
    expect(spyApiError).toHaveBeenCalled();
  });

  it('DELETE /api/projects/[id] maps service errors to structured response', async () => {
    const apiErr = new Error('boom');
    vi.spyOn(projectService, 'deleteProject').mockRejectedValue(apiErr);
    const spyApiError = vi.spyOn(logger, 'apiError');

    const req = new Request('http://localhost', { method: 'DELETE' });
    const context: { params: Promise<{ id: string }> } = { params: Promise.resolve({ id: 'p1' }) };
    const res = (await projectsIdRoute.DELETE(req, context)) as Awaited<ReturnType<typeof projectsIdRoute.DELETE>>;

    expect(res).toHaveProperty('body');
    expect(res.body).toHaveProperty('error');
    expect(spyApiError).toHaveBeenCalled();
  });

  it('PUT /api/projects/[id] handles malformed JSON request body gracefully', async () => {
    const req = new Request('http://localhost', {
      method: 'PUT',
      body: 'invalid json',
    });
    const context: { params: Promise<{ id: string }> } = { params: Promise.resolve({ id: 'p1' }) };
    const res = (await projectsIdRoute.PUT(req, context)) as Awaited<ReturnType<typeof projectsIdRoute.PUT>>;

    expect(res).toHaveProperty('body');
    expect(res.body).toHaveProperty('error');
  });
});
