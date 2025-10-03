import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as itemsRoute from '@/app/api/items/route';
import * as itemIdRoute from '@/app/api/items/[id]/route';
import itemService from '@/services/itemService';
import { logger } from '@/utils/logger';

describe('items routes', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('GET /api/items returns items on success', async () => {
    const fake = [{ id: 'i1', name: 'Item 1' }];
    const svcSpy = vi
      .spyOn(itemService, 'listItems')
      .mockResolvedValue(fake as unknown as Awaited<ReturnType<typeof itemService.listItems>>);

    const res = await itemsRoute.GET();
    expect(res).toHaveProperty('body');
    expect(res.body).toEqual(fake);
    expect(svcSpy).toHaveBeenCalled();
  });

  it('POST /api/items creates item on success', async () => {
    const fake = { id: 'i3', name: 'Created' };
    const svcSpy = vi
      .spyOn(itemService, 'createItem')
      .mockResolvedValue(fake as unknown as Awaited<ReturnType<typeof itemService.createItem>>);

    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ name: 'Created', projectId: 'p1' }),
    });
    const res = await itemsRoute.POST(req as unknown as Request);

    expect(res).toHaveProperty('body');
    expect(res.body).toEqual(fake);
    expect(svcSpy).toHaveBeenCalled();
  });

  it('GET /api/items maps service errors to structured response', async () => {
    const apiErr = new Error('boom');
    vi.spyOn(itemService, 'listItems').mockRejectedValue(apiErr);
    const spyApiError = vi.spyOn(logger, 'apiError');

    const res = (await itemsRoute.GET()) as unknown as { body: { error: unknown }; opts?: { status?: number } };
    expect(res).toHaveProperty('body');
    expect(res.body).toHaveProperty('error');
    expect(spyApiError).toHaveBeenCalled();
  });

  it('POST /api/items maps ApiError to structured response', async () => {
    const apiErr = new Error('boom');
    vi.spyOn(itemService, 'createItem').mockRejectedValue(apiErr);
    const spyApiError = vi.spyOn(logger, 'apiError');

    const req = new Request('http://localhost', { method: 'POST', body: JSON.stringify({ name: 'New' }) });
    const res = (await itemsRoute.POST(req as unknown as Request)) as unknown as {
      body: { error: unknown };
      opts?: { status?: number };
    };

    expect(res).toHaveProperty('body');
    expect(res.body).toHaveProperty('error');
    expect(spyApiError).toHaveBeenCalled();
  });

  it('POST /api/items returns 400 when projectId is missing', async () => {
    const spyApiError = vi.spyOn(logger, 'apiError');
    const req = new Request('http://localhost', { method: 'POST', body: JSON.stringify({ name: 'New' }) });
    const res = (await itemsRoute.POST(req as unknown as Request)) as unknown as {
      body: { error: unknown };
      opts?: { status?: number };
    };

    expect(res).toHaveProperty('body');
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toMatchObject({ code: 'MISSING_PROJECT_ID' });
    expect(spyApiError).toHaveBeenCalled();
  });

  it('GET /api/items/[id] returns item on success', async () => {
    const fake = { id: 'i1', name: 'Item 1' };
    const svcSpy = vi
      .spyOn(itemService, 'getItem')
      .mockResolvedValue(fake as unknown as Awaited<ReturnType<typeof itemService.getItem>>);

    const req = new Request('http://localhost');
    const context: { params: Promise<{ id: string }> } = { params: Promise.resolve({ id: 'i1' }) };
    const res = await itemIdRoute.GET(req as unknown as Request, context);
    expect(res).toHaveProperty('body');
    expect(res.body).toEqual(fake);
    expect(svcSpy).toHaveBeenCalledWith(expect.anything(), 'i1');
  });

  it('PUT /api/items/[id] returns item on success', async () => {
    const fake = { id: 'i1', name: 'Updated' };
    const svcSpy = vi
      .spyOn(itemService, 'updateItem')
      .mockResolvedValue(fake as unknown as Awaited<ReturnType<typeof itemService.updateItem>>);

    const req = new Request('http://localhost', { method: 'PUT', body: JSON.stringify({ name: 'Updated' }) });
    const context: { params: Promise<{ id: string }> } = { params: Promise.resolve({ id: 'i1' }) };
    const res = await itemIdRoute.PUT(req as unknown as Request, context);
    expect(res).toHaveProperty('body');
    expect(res.body).toEqual(fake);
    expect(svcSpy).toHaveBeenCalledWith(expect.anything(), 'i1', expect.any(Object));
  });

  it('GET /api/items/[id] maps service errors to structured response', async () => {
    const apiErr = new Error('boom');
    vi.spyOn(itemService, 'getItem').mockRejectedValue(apiErr);
    const spyApiError = vi.spyOn(logger, 'apiError');

    const req = new Request('http://localhost');
    const context: { params: Promise<{ id: string }> } = { params: Promise.resolve({ id: 'i1' }) };
    const res = (await itemIdRoute.GET(req as unknown as Request, context)) as unknown as {
      body: { error: unknown };
      opts?: { status?: number };
    };

    expect(res).toHaveProperty('body');
    expect(res.body).toHaveProperty('error');
    expect(spyApiError).toHaveBeenCalled();
  });

  it('PUT /api/items/[id] maps ApiError and logs', async () => {
    const apiErr = new Error('boom');
    vi.spyOn(itemService, 'updateItem').mockRejectedValue(apiErr);
    const spyApiError = vi.spyOn(logger, 'apiError');

    const req = new Request('http://localhost', { method: 'PUT', body: JSON.stringify({ name: 'New' }) });
    const context: { params: Promise<{ id: string }> } = { params: Promise.resolve({ id: 'i1' }) };
    const res = (await itemIdRoute.PUT(req as unknown as Request, context)) as unknown as {
      body: { error: unknown };
      opts?: { status?: number };
    };

    expect(res).toHaveProperty('body');
    expect(res.body).toHaveProperty('error');
    expect(spyApiError).toHaveBeenCalled();
  });

  it('DELETE /api/items/[id] maps ApiError and logs', async () => {
    const apiErr = new Error('boom');
    vi.spyOn(itemService, 'deleteItem').mockRejectedValue(apiErr);
    const spyApiError = vi.spyOn(logger, 'apiError');

    const req = new Request('http://localhost', { method: 'DELETE' });
    const context: { params: Promise<{ id: string }> } = { params: Promise.resolve({ id: 'i1' }) };
    const res = (await itemIdRoute.DELETE(req as unknown as Request, context)) as unknown as {
      body: { error: unknown };
      opts?: { status?: number };
    };

    expect(res).toHaveProperty('body');
    expect(res.body).toHaveProperty('error');
    expect(spyApiError).toHaveBeenCalled();
  });

  it('PUT /api/items/[id] maps ApiError to structured response', async () => {
    vi.spyOn(itemService, 'updateItem').mockRejectedValue(new Error('boom'));
    const spyApiError = vi.spyOn(logger, 'apiError');

    const req = new Request('http://localhost', { method: 'PUT', body: JSON.stringify({ name: 'New' }) });
    const context: { params: Promise<{ id: string }> } = { params: Promise.resolve({ id: 'i1' }) };
    const res = (await itemIdRoute.PUT(req as unknown as Request, context)) as unknown as {
      body: { error: unknown };
      opts?: { status?: number };
    };

    expect(res).toHaveProperty('body');
    expect(res.body).toHaveProperty('error');
    expect(spyApiError).toHaveBeenCalled();
  });

  it('DELETE /api/items/[id] maps ApiError to structured response', async () => {
    vi.spyOn(itemService, 'deleteItem').mockRejectedValue(new Error('boom'));
    const spyApiError = vi.spyOn(logger, 'apiError');

    const req = new Request('http://localhost', { method: 'DELETE' });
    const context: { params: Promise<{ id: string }> } = { params: Promise.resolve({ id: 'i1' }) };
    const res = (await itemIdRoute.DELETE(req as unknown as Request, context)) as unknown as {
      body: { error: unknown };
      opts?: { status?: number };
    };

    expect(res).toHaveProperty('body');
    expect(res.body).toHaveProperty('error');
    expect(spyApiError).toHaveBeenCalled();
  });

  it('DELETE /api/items/[id] returns success on delete', async () => {
    const fake = { message: 'Item deleted successfully' };
    const svcSpy = vi
      .spyOn(itemService, 'deleteItem')
      .mockResolvedValue(fake as unknown as Awaited<ReturnType<typeof itemService.deleteItem>>);

    const req = new Request('http://localhost', { method: 'DELETE' });
    const context: { params: Promise<{ id: string }> } = { params: Promise.resolve({ id: 'i1' }) };
    const res = await itemIdRoute.DELETE(req as unknown as Request, context);
    expect(res).toHaveProperty('body');
    expect(res.body).toEqual(fake);
    expect(svcSpy).toHaveBeenCalledWith(expect.anything(), 'i1');
  });
});
