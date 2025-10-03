import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as machinesRoute from '@/app/api/machines/route';
import machineService from '@/services/machineService';
import { logger } from '@/utils/logger';
import * as machineIdRoute from '@/app/api/machines/[id]/route';

describe('Machines routes', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('GET /api/machines returns machines on success', async () => {
    const fake = [{ id: 'm1', name: 'M1' }];
    const svcSpy = vi
      .spyOn(machineService, 'listMachines')
      .mockResolvedValue(fake as unknown as Awaited<ReturnType<typeof machineService.listMachines>>);

    const res = (await machinesRoute.GET()) as Awaited<ReturnType<typeof machinesRoute.GET>>;
    expect(res).toHaveProperty('body');
    expect(res.body).toEqual(fake);
    expect(svcSpy).toHaveBeenCalled();
  });

  it('POST /api/machines creates machine on success', async () => {
    const fake = { id: 'm2', name: 'New' };
    const svcSpy = vi
      .spyOn(machineService, 'createMachine')
      .mockResolvedValue(fake as unknown as Awaited<ReturnType<typeof machineService.createMachine>>);
    const req = new Request('http://localhost', { method: 'POST', body: JSON.stringify({ name: 'New' }) });

    const res = (await machinesRoute.POST(req)) as Awaited<ReturnType<typeof machinesRoute.POST>>;
    expect(res).toHaveProperty('body');
    expect(res.body).toEqual(fake);
    expect(svcSpy).toHaveBeenCalled();
  });

  it('GET /api/machines maps service errors to structured response', async () => {
    const apiErr = new Error('boom');
    vi.spyOn(machineService, 'listMachines').mockRejectedValue(apiErr);
    const spyApiError = vi.spyOn(logger, 'apiError');

    const res = (await machinesRoute.GET()) as Awaited<ReturnType<typeof machinesRoute.GET>>;
    expect(res).toHaveProperty('body');
    expect(res.body).toHaveProperty('error');
    expect(spyApiError).toHaveBeenCalled();
  });

  it('POST /api/machines maps ApiError to structured response', async () => {
    const apiErr = new Error('boom');
    vi.spyOn(machineService, 'createMachine').mockRejectedValue(apiErr);
    const spyApiError = vi.spyOn(logger, 'apiError');

    const req = new Request('http://localhost', { method: 'POST', body: JSON.stringify({ name: 'New' }) });
    const res = (await machinesRoute.POST(req)) as Awaited<ReturnType<typeof machinesRoute.POST>>;

    expect(res).toHaveProperty('body');
    expect(res.body).toHaveProperty('error');
    expect(spyApiError).toHaveBeenCalled();
  });
});

describe('machines/[id] route', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('GET /api/machines/[id] returns machine on success', async () => {
    const fake = { id: 'm1', name: 'M1' };
    const svcSpy = vi
      .spyOn(machineService, 'getMachine')
      .mockResolvedValue(fake as unknown as Awaited<ReturnType<typeof machineService.getMachine>>);
    const req = new Request('http://localhost');
    const context: { params: Promise<{ id: string }> } = { params: Promise.resolve({ id: 'm1' }) };

    const res = (await machineIdRoute.GET(req, context)) as Awaited<ReturnType<typeof machineIdRoute.GET>>;
    expect(res).toHaveProperty('body');
    expect(res.body).toEqual(fake);
    expect(svcSpy).toHaveBeenCalledWith(expect.anything(), 'm1');
  });

  it('PUT /api/machines/[id] returns machine on success', async () => {
    const fake = { id: 'm1', name: 'Updated' };
    const svcSpy = vi
      .spyOn(machineService, 'updateMachine')
      .mockResolvedValue(fake as unknown as Awaited<ReturnType<typeof machineService.updateMachine>>);

    const req = new Request('http://localhost', { method: 'PUT', body: JSON.stringify({ name: 'Updated' }) });
    const context: { params: Promise<{ id: string }> } = { params: Promise.resolve({ id: 'm1' }) };
    const res = (await machineIdRoute.PUT(req, context)) as Awaited<ReturnType<typeof machineIdRoute.PUT>>;
    expect(res).toHaveProperty('body');
    expect(res.body).toEqual(fake);
    expect(svcSpy).toHaveBeenCalledWith(expect.anything(), 'm1', expect.any(Object));
  });

  it('DELETE /api/machines/[id] returns success on delete', async () => {
    const fake = { message: 'Machine deleted successfully' };
    const svcSpy = vi
      .spyOn(machineService, 'deleteMachine')
      .mockResolvedValue(fake as unknown as Awaited<ReturnType<typeof machineService.deleteMachine>>);

    const req = new Request('http://localhost', { method: 'DELETE' });
    const context: { params: Promise<{ id: string }> } = { params: Promise.resolve({ id: 'm1' }) };
    const res = (await machineIdRoute.DELETE(req, context)) as Awaited<ReturnType<typeof machineIdRoute.DELETE>>;
    expect(res).toHaveProperty('body');
    expect(res.body).toEqual(fake);
    expect(svcSpy).toHaveBeenCalledWith(expect.anything(), 'm1');
  });

  it('GET /api/machines/[id] maps service errors to structured response', async () => {
    const apiErr = new Error('boom');
    vi.spyOn(machineService, 'getMachine').mockRejectedValue(apiErr);
    const spyApiError = vi.spyOn(logger, 'apiError');

    const req = new Request('http://localhost');
    const context: { params: Promise<{ id: string }> } = { params: Promise.resolve({ id: 'm1' }) };
    const res = (await machineIdRoute.GET(req, context)) as Awaited<ReturnType<typeof machineIdRoute.GET>>;

    expect(res).toHaveProperty('body');
    expect(res.body).toHaveProperty('error');
    expect(spyApiError).toHaveBeenCalled();
  });

  it('PUT /api/machines/[id] maps ApiError and logs', async () => {
    const apiErr = new Error('boom');
    vi.spyOn(machineService, 'updateMachine').mockRejectedValue(apiErr);
    const spyApiError = vi.spyOn(logger, 'apiError');

    const req = new Request('http://localhost', { method: 'PUT', body: JSON.stringify({ name: 'New' }) });
    const context: { params: Promise<{ id: string }> } = { params: Promise.resolve({ id: 'm1' }) };
    const res = (await machineIdRoute.PUT(req, context)) as Awaited<ReturnType<typeof machineIdRoute.PUT>>;

    expect(res).toHaveProperty('body');
    expect(res.body).toHaveProperty('error');
    expect(spyApiError).toHaveBeenCalled();
  });

  it('DELETE /api/machines/[id] maps ApiError and logs', async () => {
    const apiErr = new Error('boom');
    vi.spyOn(machineService, 'deleteMachine').mockRejectedValue(apiErr);
    const spyApiError = vi.spyOn(logger, 'apiError');

    const req = new Request('http://localhost', { method: 'DELETE' });
    const context: { params: Promise<{ id: string }> } = { params: Promise.resolve({ id: 'm1' }) };
    const res = (await machineIdRoute.DELETE(req, context)) as Awaited<ReturnType<typeof machineIdRoute.DELETE>>;

    expect(res).toHaveProperty('body');
    expect(res.body).toHaveProperty('error');
    expect(spyApiError).toHaveBeenCalled();
  });
});
