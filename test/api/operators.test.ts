import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as operatorsRoute from '@/app/api/operators/route';
import * as idRoute from '@/app/api/operators/[id]/route';
import operatorService from '@/services/operatorService';
import { ApiError } from '@/lib/errors';
import { prismaMock } from '../setup';

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

describe('Operators routes', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    if (prismaMock.operator?.findMany) prismaMock.operator.findMany.mockReset?.();
    if (prismaMock.operator?.create) prismaMock.operator.create.mockReset?.();
  });

  it('GET returns operators', async () => {
    const fake = [{ id: 'o1', name: 'O1' }];
    prismaMock.operator.findMany.mockResolvedValue(fake);
    const res = await operatorsRoute.GET();
    const body = res.body as unknown as Array<{ id: string; name: string }>;
    expect(body[0]).toHaveProperty('id', 'o1');
  });

  it('POST creates operator', async () => {
    const fake = { id: 'o2', name: 'New' };
    prismaMock.operator.create.mockResolvedValue(fake);
    const req = new Request('http://localhost', { method: 'POST', body: JSON.stringify({ name: 'New' }) });
    const res = await operatorsRoute.POST(req as unknown as Request);
    const body = res.body as unknown as { id: string };
    expect(body.id).toBe('o2');
  });
});

describe('Operators id route', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    prismaMock.operator.findUnique.mockReset?.();
    prismaMock.operator.update.mockReset?.();
    prismaMock.operator.delete.mockReset?.();
    prismaMock.taskOperator.count.mockReset?.();
  });

  it('GET returns operator when found', async () => {
    const fake = { id: 'o10', name: 'Op' };
    prismaMock.operator.findUnique.mockResolvedValue(fake);
    const req = new Request('http://localhost');
    const context = { params: Promise.resolve({ id: 'o10' }) } as { params: Promise<{ id: string }> };
    const res = await idRoute.GET(makeNextRequest(req), context);
    expect(res.body).toEqual(fake);
  });

  it('GET returns 404 when missing', async () => {
    prismaMock.operator.findUnique.mockResolvedValue(null);
    const req = new Request('http://localhost');
    const context = { params: Promise.resolve({ id: 'missing' }) } as { params: Promise<{ id: string }> };
    const res = (await idRoute.GET(makeNextRequest(req), context)) as unknown as {
      body: { error: unknown };
      opts?: { status?: number };
    };
    expect(res.opts?.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });

  it('PUT updates operator on success', async () => {
    const fake = { id: 'o11', name: 'Updated' };
    prismaMock.operator.findUnique.mockResolvedValue({ id: 'o11', name: 'x' });
    prismaMock.operator.update.mockResolvedValue(fake);
    const req = new Request('http://localhost', { method: 'PUT', body: JSON.stringify({ name: 'Updated' }) });
    const context = { params: Promise.resolve({ id: 'o11' }) } as { params: Promise<{ id: string }> };
    const res = await idRoute.PUT(makeNextRequest(req), context);
    expect(res.body).toEqual(fake);
    expect(prismaMock.operator.update).toHaveBeenCalled();
  });

  it('DELETE returns 400 when operator has tasks', async () => {
    prismaMock.taskOperator.count.mockResolvedValue(2);
    const req = new Request('http://localhost', { method: 'DELETE' });
    const context = { params: Promise.resolve({ id: 'o13' }) } as { params: Promise<{ id: string }> };
    const res = (await idRoute.DELETE(makeNextRequest(req), context)) as unknown as {
      body: { error: unknown };
      opts?: { status?: number };
    };
    expect(res.opts?.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('DELETE deletes operator on success', async () => {
    prismaMock.taskOperator.count.mockResolvedValue(0);
    prismaMock.operator.findUnique.mockResolvedValue({ id: 'o14', name: 'OK' });
    prismaMock.operator.delete.mockResolvedValue({ message: 'ok' });
    const req = new Request('http://localhost', { method: 'DELETE' });
    const context = { params: Promise.resolve({ id: 'o14' }) } as { params: Promise<{ id: string }> };
    const res = await idRoute.DELETE(makeNextRequest(req), context);
    expect(res.body).toHaveProperty('message');
  });
});

describe('Operators route error mapping', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('GET /api/operators maps ApiError from service', async () => {
    vi.spyOn(operatorService, 'listOperators').mockRejectedValue(
      new ApiError({ code: 'X', message: 'fail', status: 418 }),
    );
    const res = (await operatorsRoute.GET()) as unknown as {
      body: { error: { code: string } };
      opts?: { status?: number };
    };
    expect(res.opts?.status).toBe(418);
    expect(res.body.error.code).toBe('X');
  });

  it('POST /api/operators maps generic errors to internal error', async () => {
    vi.spyOn(operatorService, 'createOperator').mockRejectedValue(new Error('boom'));
    const req = new Request('http://localhost', { method: 'POST', body: JSON.stringify({ name: 'x' }) });
    const res = (await operatorsRoute.POST(req as unknown as Request)) as unknown as {
      body: { error: { code: string } };
      opts?: { status?: number };
    };
    expect(res.opts?.status).toBe(500);
    expect(res.body.error.code).toBe('INTERNAL_ERROR');
  });

  it('GET /api/operators/[id] maps ApiError', async () => {
    vi.spyOn(operatorService, 'getOperator').mockRejectedValue(
      new ApiError({ code: 'OP', message: 'no', status: 404 }),
    );
    const req = new Request('http://localhost');
    const context = { params: Promise.resolve({ id: 'missing' }) } as { params: Promise<{ id: string }> };
    const res = (await idRoute.GET(makeNextRequest(req), context)) as unknown as {
      body: { error: { code: string } };
      opts?: { status?: number };
    };
    expect(res.opts?.status).toBe(404);
    expect(res.body.error.code).toBe('OP');
  });

  it('PUT /api/operators/[id] maps generic error to internal', async () => {
    vi.spyOn(operatorService, 'updateOperator').mockRejectedValue(new Error('boom'));
    const req = new Request('http://localhost', { method: 'PUT', body: JSON.stringify({ name: 'X' }) });
    const context = { params: Promise.resolve({ id: 'id' }) } as { params: Promise<{ id: string }> };
    const res = (await idRoute.PUT(makeNextRequest(req), context)) as unknown as {
      body: { error: { code: string } };
      opts?: { status?: number };
    };
    expect(res.opts?.status).toBe(500);
    expect(res.body.error.code).toBe('INTERNAL_ERROR');
  });

  it('DELETE /api/operators/[id] maps ApiError from service (has tasks)', async () => {
    vi.spyOn(operatorService, 'deleteOperator').mockRejectedValue(
      new ApiError({ code: 'OP_TASKS', message: 'has tasks', status: 400 }),
    );
    const req = new Request('http://localhost', { method: 'DELETE' });
    const context = { params: Promise.resolve({ id: 'o13' }) } as { params: Promise<{ id: string }> };
    const res = (await idRoute.DELETE(makeNextRequest(req), context)) as unknown as {
      body: { error: { code: string } };
      opts?: { status?: number };
    };
    expect(res.opts?.status).toBe(400);
    expect(res.body.error.code).toBe('OP_TASKS');
  });
});
