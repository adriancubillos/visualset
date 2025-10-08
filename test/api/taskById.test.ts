import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as taskByIdRoute from '@/app/api/tasks/[id]/route';
import { prismaMock } from '../setup';
import taskService from '@/services/taskService';
import { logger } from '@/utils/logger';
import type { NextRequest } from 'next/server';
import { ApiError } from '@/lib/errors';

// Minimal NextRequest-like shim for route handlers that only need params
class FakeRequestCookies {
  private store = new Map<string, string>();
  get(name: string) {
    return this.store.get(name) ?? null;
  }
  getAll() {
    return Array.from(this.store.values());
  }
  has(name: string) {
    return this.store.has(name);
  }
}

class FakeNextRequest extends Request {
  cookies = new FakeRequestCookies();
  nextUrl = new URL('http://localhost');
  page = undefined as unknown;
  ua = undefined as unknown;
}

type ResponseMock = { body: unknown; opts?: { status?: number } };

describe('/api/tasks/[id] route', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    prismaMock.task.findUnique.mockReset();
    prismaMock.task.update.mockReset();
    prismaMock.task.delete.mockReset();
    prismaMock.$transaction.mockReset();
    // Reset $transaction to default behavior
    prismaMock.$transaction.mockImplementation(async (callback: (tx: typeof prismaMock) => Promise<unknown>) => {
      return callback(prismaMock);
    });
  });

  describe('GET /api/tasks/[id]', () => {
    it('returns mapped task when found', async () => {
      const fakeTask = {
        id: 't1',
        title: 'Task 1',
        description: 'Test task',
        status: 'PENDING',
        quantity: 1,
        completed_quantity: 0,
        item: { id: 'i1', project: { id: 'p1', name: 'Project 1' } },
        machine: null,
        operator: null,
        timeSlots: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };
      vi.spyOn(taskService, 'getTask').mockResolvedValue(
        fakeTask as unknown as Awaited<ReturnType<typeof taskService.getTask>>,
      );

      const res = (await taskByIdRoute.GET(new FakeNextRequest('http://localhost') as unknown as NextRequest, {
        params: Promise.resolve({ id: 't1' }),
      })) as ResponseMock;
      expect(res).toHaveProperty('body');
      const body = res.body as { id: string; title: string };
      expect(body.id).toBe('t1');
      expect(body.title).toBe('Task 1');
      expect(taskService.getTask).toHaveBeenCalledWith(expect.anything(), 't1');
    });

    it('returns 404 when not found', async () => {
      vi.spyOn(taskService, 'getTask').mockRejectedValue(
        new ApiError({ code: 'TASK_NOT_FOUND', message: 'Task not found', status: 404 }),
      );
      const spy = vi.spyOn(logger, 'apiError');

      const res = (await taskByIdRoute.GET(new FakeNextRequest('http://localhost') as unknown as NextRequest, {
        params: Promise.resolve({ id: 'missing' }),
      })) as ResponseMock;
      expect(res.opts?.status).toBe(404);
      expect(res.body).toHaveProperty('error');
      const body = res.body as { error: { code: string } };
      expect(body.error.code).toBe('TASK_NOT_FOUND');
      expect(spy).toHaveBeenCalled();
    });

    it('returns 500 on unexpected error', async () => {
      vi.spyOn(taskService, 'getTask').mockRejectedValue(new Error('Database error'));
      const spy = vi.spyOn(logger, 'apiError');

      const res = (await taskByIdRoute.GET(new FakeNextRequest('http://localhost') as unknown as NextRequest, {
        params: Promise.resolve({ id: 'err' }),
      })) as ResponseMock;
      expect(res.opts?.status).toBe(500);
      expect(res.body).toHaveProperty('error');
      const body = res.body as { error: { code: string } };
      expect(body.error.code).toBe('INTERNAL_ERROR');
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('PUT /api/tasks/[id]', () => {
    it('updates a task successfully', async () => {
      const fakeTask = {
        id: 't2',
        title: 'Updated Task',
        description: 'Updated description',
        status: 'IN_PROGRESS',
        quantity: 2,
        completed_quantity: 1,
        item: null,
        machine: null,
        operator: null,
        timeSlots: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      };
      vi.spyOn(taskService, 'updateTask').mockResolvedValue(
        fakeTask as unknown as Awaited<ReturnType<typeof taskService.updateTask>>,
      );

      const req = new Request('http://localhost', {
        method: 'PUT',
        body: JSON.stringify({ title: 'Updated Task', description: 'Updated description', quantity: 2 }),
      });

      const res = (await taskByIdRoute.PUT(req, {
        params: Promise.resolve({ id: 't2' }),
      })) as ResponseMock;
      expect(res).toHaveProperty('body');
      const body = res.body as { id: string; title: string };
      expect(body.id).toBe('t2');
      expect(body.title).toBe('Updated Task');
      expect(taskService.updateTask).toHaveBeenCalledWith(expect.anything(), 't2', {
        title: 'Updated Task',
        description: 'Updated description',
        quantity: 2,
      });
    });

    it('returns 400 on validation error', async () => {
      vi.spyOn(taskService, 'updateTask').mockRejectedValue(
        new ApiError({
          code: 'BAD_QUANTITY',
          message: 'Completed quantity cannot exceed total quantity',
          status: 400,
        }),
      );
      const spy = vi.spyOn(logger, 'apiError');

      const req = new Request('http://localhost', {
        method: 'PUT',
        body: JSON.stringify({ quantity: 1, completed_quantity: 2 }),
      });

      const res = (await taskByIdRoute.PUT(req, {
        params: Promise.resolve({ id: 't2' }),
      })) as ResponseMock;
      expect(res.opts?.status).toBe(400);
      expect(res.body).toHaveProperty('error');
      const body = res.body as { error: { code: string } };
      expect(body.error.code).toBe('BAD_QUANTITY');
      expect(spy).toHaveBeenCalled();
    });

    it('returns 500 on unexpected error', async () => {
      vi.spyOn(taskService, 'updateTask').mockRejectedValue(new Error('Database error'));
      const spy = vi.spyOn(logger, 'apiError');

      const req = new Request('http://localhost', {
        method: 'PUT',
        body: JSON.stringify({ title: 'Test' }),
      });

      const res = (await taskByIdRoute.PUT(req, {
        params: Promise.resolve({ id: 't2' }),
      })) as ResponseMock;
      expect(res.opts?.status).toBe(500);
      expect(res.body).toHaveProperty('error');
      const body = res.body as { error: { code: string } };
      expect(body.error.code).toBe('INTERNAL_ERROR');
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('PATCH /api/tasks/[id]', () => {
    it('patches a task successfully', async () => {
      const fakeTask = {
        id: 't3',
        title: 'Task 3',
        description: 'Test task',
        status: 'COMPLETED',
        quantity: 1,
        completed_quantity: 1,
        item: null,
        machine: null,
        operator: null,
        timeSlots: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-03T00:00:00Z',
      };
      vi.spyOn(taskService, 'patchTask').mockResolvedValue(
        fakeTask as unknown as Awaited<ReturnType<typeof taskService.patchTask>>,
      );

      const req = new Request('http://localhost', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'COMPLETED' }),
      });

      const res = (await taskByIdRoute.PATCH(req, {
        params: Promise.resolve({ id: 't3' }),
      })) as ResponseMock;
      expect(res).toHaveProperty('body');
      const body = res.body as { id: string; status: string };
      expect(body.id).toBe('t3');
      expect(body.status).toBe('COMPLETED');
      expect(taskService.patchTask).toHaveBeenCalledWith(expect.anything(), 't3', { status: 'COMPLETED' });
    });

    it('returns 404 when task not found', async () => {
      vi.spyOn(taskService, 'patchTask').mockRejectedValue(
        new ApiError({ code: 'TASK_NOT_FOUND', message: 'Task not found', status: 404 }),
      );
      const spy = vi.spyOn(logger, 'apiError');

      const req = new Request('http://localhost', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'COMPLETED' }),
      });

      const res = (await taskByIdRoute.PATCH(req, {
        params: Promise.resolve({ id: 'missing' }),
      })) as ResponseMock;
      expect(res.opts?.status).toBe(404);
      expect(res.body).toHaveProperty('error');
      const body = res.body as { error: { code: string } };
      expect(body.error.code).toBe('TASK_NOT_FOUND');
      expect(spy).toHaveBeenCalled();
    });

    it('returns 500 on unexpected error', async () => {
      vi.spyOn(taskService, 'patchTask').mockRejectedValue(new Error('Database error'));
      const spy = vi.spyOn(logger, 'apiError');

      const req = new Request('http://localhost', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'COMPLETED' }),
      });

      const res = (await taskByIdRoute.PATCH(req, {
        params: Promise.resolve({ id: 't3' }),
      })) as ResponseMock;
      expect(res.opts?.status).toBe(500);
      expect(res.body).toHaveProperty('error');
      const body = res.body as { error: { code: string } };
      expect(body.error.code).toBe('INTERNAL_ERROR');
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/tasks/[id]', () => {
    it('deletes a task successfully', async () => {
      vi.spyOn(taskService, 'deleteTask').mockResolvedValue(undefined);

      const req = new Request('http://localhost', { method: 'DELETE' });

      const res = (await taskByIdRoute.DELETE(req, {
        params: Promise.resolve({ id: 't4' }),
      })) as ResponseMock;
      expect(res).toHaveProperty('body');
      const body = res.body as { message: string };
      expect(body.message).toBe('Task deleted successfully');
      expect(taskService.deleteTask).toHaveBeenCalledWith(expect.anything(), 't4');
    });

    it('returns 404 when task not found', async () => {
      vi.spyOn(taskService, 'deleteTask').mockRejectedValue(
        new ApiError({ code: 'TASK_NOT_FOUND', message: 'Task not found', status: 404 }),
      );
      const spy = vi.spyOn(logger, 'apiError');

      const req = new Request('http://localhost', { method: 'DELETE' });

      const res = (await taskByIdRoute.DELETE(req, {
        params: Promise.resolve({ id: 'missing' }),
      })) as ResponseMock;
      expect(res.opts?.status).toBe(404);
      expect(res.body).toHaveProperty('error');
      const body = res.body as { error: { code: string } };
      expect(body.error.code).toBe('TASK_NOT_FOUND');
      expect(spy).toHaveBeenCalled();
    });

    it('returns 500 on unexpected error', async () => {
      vi.spyOn(taskService, 'deleteTask').mockRejectedValue(new Error('Database error'));
      const spy = vi.spyOn(logger, 'apiError');

      const req = new Request('http://localhost', { method: 'DELETE' });

      const res = (await taskByIdRoute.DELETE(req, {
        params: Promise.resolve({ id: 't4' }),
      })) as ResponseMock;
      expect(res.opts?.status).toBe(500);
      expect(res.body).toHaveProperty('error');
      const body = res.body as { error: { code: string } };
      expect(body.error.code).toBe('INTERNAL_ERROR');
      expect(spy).toHaveBeenCalled();
    });
  });
});
