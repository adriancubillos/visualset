import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as tasksRoute from '@/app/api/tasks/route';
import { prismaMock } from '../setup';
import taskService from '@/services/taskService';
import { logger } from '@/utils/logger';
import { ApiError } from '@/lib/errors';

// Helper to create a minimal NextRequest-like mock
function makeNextRequest(url: string): Request {
  return new Request(url);
}

type ResponseMock = { body: unknown; opts?: { status?: number } };

describe('/api/tasks route', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    prismaMock.task.findMany.mockReset();
    prismaMock.task.create.mockReset();
    prismaMock.$transaction.mockReset();
    // Reset $transaction to default behavior
    prismaMock.$transaction.mockImplementation(async (callback: (tx: typeof prismaMock) => Promise<unknown>) => {
      return callback(prismaMock);
    });
  });

  describe('GET /api/tasks', () => {
    it('returns mapped tasks without filters', async () => {
      const fakeTasks = [
        {
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
        },
      ];
      vi.spyOn(taskService, 'listTasks').mockResolvedValue(
        fakeTasks as unknown as Awaited<ReturnType<typeof taskService.listTasks>>,
      );

      const req = makeNextRequest('http://localhost/api/tasks');
      const res = (await tasksRoute.GET(req)) as ResponseMock;
      expect(res).toHaveProperty('body');
      const body = res.body as Array<{ id: string; project: { id: string } }>;
      expect(Array.isArray(body)).toBe(true);
      expect(body[0]).toHaveProperty('project');
      expect(body[0].project.id).toBe('p1');
      expect(taskService.listTasks).toHaveBeenCalled();
    });

    it('returns mapped tasks with start filter', async () => {
      const fakeTasks = [
        {
          id: 't2',
          title: 'Task 2',
          description: null,
          status: 'IN_PROGRESS',
          quantity: 1,
          completed_quantity: 0,
          item: null,
          machine: null,
          operator: null,
          timeSlots: [],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];
      vi.spyOn(taskService, 'listTasks').mockResolvedValue(
        fakeTasks as unknown as Awaited<ReturnType<typeof taskService.listTasks>>,
      );

      const req = makeNextRequest('http://localhost/api/tasks?start=2024-01-01T00:00:00Z');
      const res = (await tasksRoute.GET(req)) as ResponseMock;
      expect(res).toHaveProperty('body');
      const body = res.body as Array<{ id: string }>;
      expect(body[0].id).toBe('t2');
      expect(taskService.listTasks).toHaveBeenCalledWith(expect.anything(), '2024-01-01T00:00:00Z', null);
    });

    it('returns mapped tasks with end filter', async () => {
      const fakeTasks = [
        {
          id: 't3',
          title: 'Task 3',
          description: null,
          status: 'COMPLETED',
          quantity: 1,
          completed_quantity: 1,
          item: null,
          machine: null,
          operator: null,
          timeSlots: [],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];
      vi.spyOn(taskService, 'listTasks').mockResolvedValue(
        fakeTasks as unknown as Awaited<ReturnType<typeof taskService.listTasks>>,
      );

      const req = makeNextRequest('http://localhost/api/tasks?end=2024-12-31T23:59:59Z');
      const res = (await tasksRoute.GET(req)) as ResponseMock;
      expect(res).toHaveProperty('body');
      const body = res.body as Array<{ id: string }>;
      expect(body[0].id).toBe('t3');
      expect(taskService.listTasks).toHaveBeenCalledWith(expect.anything(), null, '2024-12-31T23:59:59Z');
    });

    it('returns mapped tasks with both start and end filters', async () => {
      const fakeTasks = [
        {
          id: 't4',
          title: 'Task 4',
          description: null,
          status: 'PENDING',
          quantity: 1,
          completed_quantity: 0,
          item: null,
          machine: null,
          operator: null,
          timeSlots: [],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];
      vi.spyOn(taskService, 'listTasks').mockResolvedValue(
        fakeTasks as unknown as Awaited<ReturnType<typeof taskService.listTasks>>,
      );

      const req = makeNextRequest('http://localhost/api/tasks?start=2024-01-01T00:00:00Z&end=2024-12-31T23:59:59Z');
      const res = (await tasksRoute.GET(req)) as ResponseMock;
      expect(res).toHaveProperty('body');
      expect(taskService.listTasks).toHaveBeenCalledWith(
        expect.anything(),
        '2024-01-01T00:00:00Z',
        '2024-12-31T23:59:59Z',
      );
    });

    it('returns 500 on service error', async () => {
      vi.spyOn(taskService, 'listTasks').mockRejectedValue(new Error('Database error'));
      const spy = vi.spyOn(logger, 'apiError');

      const req = makeNextRequest('http://localhost/api/tasks');
      const res = (await tasksRoute.GET(req)) as ResponseMock;
      expect(res.opts?.status).toBe(500);
      expect(res.body).toHaveProperty('error');
      const body = res.body as { error: { code: string } };
      expect(body.error.code).toBe('INTERNAL_ERROR');
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('POST /api/tasks', () => {
    it('creates a task successfully', async () => {
      const fakeTask = {
        id: 't5',
        title: 'New Task',
        description: 'New description',
        status: 'PENDING',
        quantity: 1,
        completed_quantity: 0,
        item: null,
        machine: null,
        operator: null,
        timeSlots: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };
      vi.spyOn(taskService, 'createTask').mockResolvedValue(
        fakeTask as unknown as Awaited<ReturnType<typeof taskService.createTask>>,
      );

      const req = makeNextRequest('http://localhost/api/tasks');
      Object.defineProperty(req, 'json', {
        value: async () => ({ title: 'New Task', description: 'New description' }),
      });

      const res = (await tasksRoute.POST(req)) as ResponseMock;
      expect(res).toHaveProperty('body');
      const body = res.body as { id: string; title: string };
      expect(body.id).toBe('t5');
      expect(body.title).toBe('New Task');
      expect(taskService.createTask).toHaveBeenCalledWith(expect.anything(), {
        title: 'New Task',
        description: 'New description',
      });
    });

    it('returns 400 on missing title', async () => {
      vi.spyOn(taskService, 'createTask').mockRejectedValue(
        new ApiError({ code: 'MISSING_TITLE', message: 'title is required', status: 400 }),
      );
      const spy = vi.spyOn(logger, 'apiError');

      const req = makeNextRequest('http://localhost/api/tasks');
      Object.defineProperty(req, 'json', {
        value: async () => ({}),
      });

      const res = (await tasksRoute.POST(req)) as ResponseMock;
      expect(res.opts?.status).toBe(400);
      expect(res.body).toHaveProperty('error');
      const body = res.body as { error: { code: string } };
      expect(body.error.code).toBe('MISSING_TITLE');
      expect(spy).toHaveBeenCalled();
    });

    it('returns 500 on unexpected error', async () => {
      vi.spyOn(taskService, 'createTask').mockRejectedValue(new Error('Unexpected error'));
      const spy = vi.spyOn(logger, 'apiError');

      const req = makeNextRequest('http://localhost/api/tasks');
      Object.defineProperty(req, 'json', {
        value: async () => ({ title: 'Test' }),
      });

      const res = (await tasksRoute.POST(req)) as ResponseMock;
      expect(res.opts?.status).toBe(500);
      expect(res.body).toHaveProperty('error');
      const body = res.body as { error: { code: string } };
      expect(body.error.code).toBe('INTERNAL_ERROR');
      expect(spy).toHaveBeenCalled();
    });
  });
});
