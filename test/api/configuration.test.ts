import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as route from '@/app/api/configuration/route';
import * as idRoute from '@/app/api/configuration/[id]/route';
import prisma from '@/lib/prisma';
import configurationService from '@/services/configurationService';
import { logger } from '@/utils/logger';

// Create a minimal NextRequest-like mock from a standard Request for tests.
// The route handlers only use `url` and `json()` so we provide those plus a
// few small stubs to satisfy the NextRequest type without pulling in runtime.
function makeNextRequest(r: Request): import('next/server').NextRequest {
  const req = r as Request;

  const nextReq = {
    url: req.url,
    method: (req as Request).method ?? 'GET',
    headers: req.headers as unknown as Headers,
    json: async () => req.json(),
  };

  return nextReq as unknown as import('next/server').NextRequest;
}

describe('configuration route', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('GET returns configurations successfully', async () => {
    const fake = [{ id: 'c1', category: 'AVAILABLE_SKILLS', value: 'skill', label: 'Skill' }];
    vi.spyOn(configurationService, 'listConfigurations').mockResolvedValue(
      fake as unknown as Awaited<ReturnType<typeof configurationService.listConfigurations>>,
    );
    const req = new Request('http://localhost/');
    const res = (await route.GET(makeNextRequest(req))) as unknown as { body: unknown };

    expect(res).toHaveProperty('body');
    expect(res.body).toEqual(fake);
  });

  it('GET maps errors to internal error response on failure', async () => {
    vi.spyOn(configurationService, 'listConfigurations').mockRejectedValue(new Error('boom'));
    const spy = vi.spyOn(logger, 'apiError');
    const req = new Request('http://localhost/');

    const res = (await route.GET(makeNextRequest(req))) as unknown as {
      body: { error: unknown };
      opts?: { status?: number };
    };

    expect(res.opts?.status).toBe(500);
    expect(res.body.error).toHaveProperty('code', 'INTERNAL_ERROR');
    expect(spy).toHaveBeenCalled();
  });

  it('GET filters by category when provided', async () => {
    const fake = [{ id: 'c2', category: 'MACHINE_TYPES', value: 'lathe', label: 'Lathe' }];
    vi.spyOn(configurationService, 'listConfigurations').mockResolvedValue(
      fake as unknown as Awaited<ReturnType<typeof configurationService.listConfigurations>>,
    );
    const req = new Request('http://localhost/?category=MACHINE_TYPES');
    const res = (await route.GET(makeNextRequest(req))) as unknown as { body: unknown };

    expect(res.body).toEqual(fake);
    expect(configurationService.listConfigurations).toHaveBeenCalledWith(expect.anything(), 'MACHINE_TYPES');
  });

  it('POST creates a configuration successfully', async () => {
    vi.spyOn(configurationService, 'createConfiguration').mockResolvedValue({
      id: 'c3',
      category: 'TASK_TITLES',
      value: 'title',
      label: 'Title',
    } as unknown as Awaited<ReturnType<typeof configurationService.createConfiguration>>);
    const req = new Request('http://localhost/', {
      method: 'POST',
      body: JSON.stringify({ category: 'TASK_TITLES', value: 'title', label: 'Title' }),
    });

    const res = (await route.POST(makeNextRequest(req))) as unknown as {
      body: unknown;
      opts?: { status?: number };
    };

    expect(res.opts?.status).toBe(201);
    expect(res.body).toHaveProperty('id');
  });

  it('POST returns 400 for missing fields', async () => {
    const spy = vi.spyOn(logger, 'apiError');
    const req = new Request('http://localhost/', { method: 'POST', body: JSON.stringify({}) });
    const res = (await route.POST(makeNextRequest(req))) as unknown as {
      body: { error: unknown };
      opts?: { status?: number };
    };

    expect(res.opts?.status).toBe(400);
    expect(res.body.error).toHaveProperty('code', 'MISSING_FIELDS');
    expect(spy).toHaveBeenCalled();
  });

  it('POST returns 400 for invalid category', async () => {
    const spy = vi.spyOn(logger, 'apiError');
    const req = new Request('http://localhost/', {
      method: 'POST',
      body: JSON.stringify({ category: 'BAD', value: 'v', label: 'L' }),
    });
    const res = (await route.POST(makeNextRequest(req))) as unknown as {
      body: { error: unknown };
      opts?: { status?: number };
    };

    expect(res.opts?.status).toBe(400);
    expect(res.body.error).toHaveProperty('code', 'INVALID_CATEGORY');
    expect(spy).toHaveBeenCalled();
  });

  it('POST maps Prisma unique constraint to conflict ApiError', async () => {
    // simulate prisma throwing an object with code 'P2002'
    vi.spyOn(configurationService, 'createConfiguration').mockRejectedValue({ code: 'P2002' } as Record<
      string,
      unknown
    >);
    const spy = vi.spyOn(logger, 'apiError');
    const req = new Request('http://localhost/', {
      method: 'POST',
      body: JSON.stringify({ category: 'TASK_TITLES', value: 'dup', label: 'Dup' }),
    });
    const res = (await route.POST(makeNextRequest(req))) as unknown as {
      body: { error: unknown };
      opts?: { status?: number };
    };

    expect(res.opts?.status).toBe(409);
    expect(res.body.error).toHaveProperty('code', 'CONFIGURATION_CONFLICT');
    expect(spy).toHaveBeenCalled();
  });

  it('POST maps generic errors to internal error', async () => {
    vi.spyOn(configurationService, 'createConfiguration').mockRejectedValue(new Error('boom'));
    const spy = vi.spyOn(logger, 'apiError');
    const req = new Request('http://localhost/', {
      method: 'POST',
      body: JSON.stringify({ category: 'TASK_TITLES', value: 'v', label: 'L' }),
    });
    const res = (await route.POST(makeNextRequest(req))) as unknown as {
      body: { error: unknown };
      opts?: { status?: number };
    };

    expect(res.opts?.status).toBe(500);
    expect(res.body.error).toHaveProperty('code', 'INTERNAL_ERROR');
    expect(spy).toHaveBeenCalled();
  });

  // --- Tests for id-based route: /api/configuration/[id] ---
  it('GET /api/configuration/[id] returns configuration on success', async () => {
    const fake = { id: 'c10', category: 'MACHINE_TYPES', value: 'lathe', label: 'Lathe' } as unknown as Awaited<
      ReturnType<typeof prisma.configuration.findUnique>
    >;
    vi.spyOn(prisma.configuration, 'findUnique').mockResolvedValue(fake);

    const req = new Request('http://localhost');
    const context = { params: Promise.resolve({ id: 'c10' }) } as { params: Promise<{ id: string }> };
    const res = await idRoute.GET(makeNextRequest(req), context);

    expect(res).toHaveProperty('body');
    expect(res.body).toEqual(fake);
    expect(prisma.configuration.findUnique).toHaveBeenCalledWith({ where: { id: 'c10' } });
  });

  it('GET /api/configuration/[id] returns 404 when missing', async () => {
    vi.spyOn(prisma.configuration, 'findUnique').mockResolvedValue(
      null as Awaited<ReturnType<typeof prisma.configuration.findUnique>>,
    );
    const req = new Request('http://localhost');
    const context = { params: Promise.resolve({ id: 'missing' }) } as { params: Promise<{ id: string }> };
    const res = (await idRoute.GET(makeNextRequest(req), context)) as unknown as {
      body: { error: unknown };
      opts?: { status?: number };
    };

    // route returns a 404 payload for missing
    expect(res.opts?.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });

  it('PUT /api/configuration/[id] updates configuration on success', async () => {
    const fake = { id: 'c11', category: 'TASK_TITLES', value: 't', label: 'T' } as unknown as Awaited<
      ReturnType<typeof configurationService.updateConfiguration>
    >;
    vi.spyOn(configurationService, 'updateConfiguration').mockResolvedValue(fake);

    const req = new Request('http://localhost', { method: 'PUT', body: JSON.stringify({ value: 't' }) });
    const context = { params: Promise.resolve({ id: 'c11' }) } as { params: Promise<{ id: string }> };
    const res = await idRoute.PUT(makeNextRequest(req), context);

    expect(res).toHaveProperty('body');
    expect(res.body).toEqual(fake);
    expect(configurationService.updateConfiguration).toHaveBeenCalledWith(expect.anything(), 'c11', {
      value: 't',
      label: undefined,
    });
  });

  it('PUT /api/configuration/[id] returns 400 for invalid category', async () => {
    const req = new Request('http://localhost', { method: 'PUT', body: JSON.stringify({ category: 'BAD' }) });
    const context = { params: Promise.resolve({ id: 'c12' }) } as { params: Promise<{ id: string }> };
    const res = (await idRoute.PUT(makeNextRequest(req), context)) as unknown as {
      body: { error: unknown };
      opts?: { status?: number };
    };

    expect(res.opts?.status).toBe(400);
    // route returns a simple error string for invalid category
    expect(res.body.error).toEqual('Invalid category');
  });

  it('PUT maps service errors appropriately', async () => {
    const { ApiError } = await import('@/lib/errors');

    // Mock service throwing CONFIGURATION_NOT_FOUND (which maps to 404)
    vi.spyOn(configurationService, 'updateConfiguration').mockRejectedValueOnce(
      new ApiError({ code: 'CONFIGURATION_NOT_FOUND', message: 'Configuration not found', status: 404 }),
    );
    const req1 = new Request('http://localhost', { method: 'PUT', body: JSON.stringify({ value: 'v' }) });
    const context1 = { params: Promise.resolve({ id: 'nope' }) } as { params: Promise<{ id: string }> };
    const res1 = (await idRoute.PUT(makeNextRequest(req1), context1)) as unknown as {
      body: { error: unknown };
      opts?: { status?: number };
    };
    expect(res1.opts?.status).toBe(404);

    // Mock service throwing a generic Prisma error (which would map to 500)
    vi.spyOn(configurationService, 'updateConfiguration').mockRejectedValueOnce({ code: 'P2002' } as Record<
      string,
      unknown
    >);
    const req2 = new Request('http://localhost', { method: 'PUT', body: JSON.stringify({ value: 'dup' }) });
    const context2 = { params: Promise.resolve({ id: 'dup' }) } as { params: Promise<{ id: string }> };
    const res2 = (await idRoute.PUT(makeNextRequest(req2), context2)) as unknown as {
      body: { error: unknown };
      opts?: { status?: number };
    };
    expect(res2.opts?.status).toBe(500); // Raw Prisma errors map to 500
  });

  it('PUT /api/configuration/[id] updates category and label when provided', async () => {
    const fake = { id: 'c20', category: 'TASK_TITLES', value: 'v', label: 'L' } as unknown as Awaited<
      ReturnType<typeof configurationService.updateConfiguration>
    >;
    vi.spyOn(configurationService, 'updateConfiguration').mockResolvedValue(fake);

    const req = new Request('http://localhost', {
      method: 'PUT',
      body: JSON.stringify({ category: 'TASK_TITLES', label: 'L' }),
    });
    const context = { params: Promise.resolve({ id: 'c20' }) } as { params: Promise<{ id: string }> };
    const res = await idRoute.PUT(makeNextRequest(req), context);

    expect(res).toHaveProperty('body');
    expect(res.body).toEqual(fake);
    expect(configurationService.updateConfiguration).toHaveBeenCalledWith(expect.anything(), 'c20', {
      value: undefined,
      label: 'L',
    });
  });

  it('PUT /api/configuration/[id] updates label only when provided', async () => {
    const fake = { id: 'c21', category: 'TASK_TITLES', value: 'v', label: 'Only' } as unknown as Awaited<
      ReturnType<typeof configurationService.updateConfiguration>
    >;
    vi.spyOn(configurationService, 'updateConfiguration').mockResolvedValue(fake);

    const req = new Request('http://localhost', { method: 'PUT', body: JSON.stringify({ label: 'Only' }) });
    const context = { params: Promise.resolve({ id: 'c21' }) } as { params: Promise<{ id: string }> };
    const res = await idRoute.PUT(makeNextRequest(req), context);

    expect(res).toHaveProperty('body');
    expect(res.body).toEqual(fake);
    expect(configurationService.updateConfiguration).toHaveBeenCalledWith(expect.anything(), 'c21', {
      value: undefined,
      label: 'Only',
    });
  });

  it('DELETE /api/configuration/[id] deletes configuration on success', async () => {
    const successResult = { message: 'Configuration deleted successfully' };
    vi.spyOn(configurationService, 'deleteConfiguration').mockResolvedValue(successResult);

    const req = new Request('http://localhost', { method: 'DELETE' });
    const context = { params: Promise.resolve({ id: 'c13' }) } as { params: Promise<{ id: string }> };
    const res = await idRoute.DELETE(makeNextRequest(req), context);

    expect(res).toHaveProperty('body');
    expect(res.body).toHaveProperty('message');
    expect(configurationService.deleteConfiguration).toHaveBeenCalledWith(expect.anything(), 'c13');
  });

  it('DELETE /api/configuration/[id] maps P2025 to 404', async () => {
    const { ApiError } = await import('@/lib/errors');
    vi.spyOn(configurationService, 'deleteConfiguration').mockRejectedValue(
      new ApiError({ code: 'CONFIGURATION_NOT_FOUND', message: 'Configuration not found', status: 404 }),
    );

    const req = new Request('http://localhost', { method: 'DELETE' });
    const context = { params: Promise.resolve({ id: 'missing' }) } as { params: Promise<{ id: string }> };
    const res = (await idRoute.DELETE(makeNextRequest(req), context)) as unknown as {
      body: { error: unknown };
      opts?: { status?: number };
    };

    expect(res.opts?.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });

  // Generic error branch tests to exercise the catch blocks and increase coverage
  it('GET /api/configuration/[id] returns 500 on unexpected error', async () => {
    vi.spyOn(prisma.configuration, 'findUnique').mockRejectedValue(new Error('boom'));
    const req = new Request('http://localhost');
    const context = { params: Promise.resolve({ id: 'err' }) } as { params: Promise<{ id: string }> };
    const res = (await idRoute.GET(makeNextRequest(req), context)) as unknown as {
      body: { error: unknown };
      opts?: { status?: number };
    };

    expect(res.opts?.status).toBe(500);
    expect(res.body.error).toBe('Failed to fetch configuration');
  });

  it('PUT /api/configuration/[id] returns 500 on unexpected error', async () => {
    vi.spyOn(configurationService, 'updateConfiguration').mockRejectedValue(new Error('boom'));
    const req = new Request('http://localhost', { method: 'PUT', body: JSON.stringify({ value: 'x' }) });
    const context = { params: Promise.resolve({ id: 'err' }) } as { params: Promise<{ id: string }> };
    const res = (await idRoute.PUT(makeNextRequest(req), context)) as unknown as {
      body: { error: unknown };
      opts?: { status?: number };
    };

    expect(res.opts?.status).toBe(500);
    expect(res.body.error).toHaveProperty('code', 'INTERNAL_ERROR');
  });

  it('DELETE /api/configuration/[id] returns 500 on unexpected error', async () => {
    vi.spyOn(configurationService, 'deleteConfiguration').mockRejectedValue(new Error('boom'));
    const req = new Request('http://localhost', { method: 'DELETE' });
    const context = { params: Promise.resolve({ id: 'err' }) } as { params: Promise<{ id: string }> };
    const res = (await idRoute.DELETE(makeNextRequest(req), context)) as unknown as {
      body: { error: unknown };
      opts?: { status?: number };
    };

    expect(res.opts?.status).toBe(500);
    expect(res.body.error).toHaveProperty('code', 'INTERNAL_ERROR');
  });
});
