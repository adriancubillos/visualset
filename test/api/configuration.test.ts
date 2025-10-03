import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as route from '@/app/api/configuration/route';
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
});
