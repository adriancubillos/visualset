import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prismaMock } from '../setup';
import type { TaskWithRelationsDTO } from '@/types/api';

// Mock the scheduleService module
vi.mock('@/services/scheduleService', () => ({
  default: {
    listScheduledTasks: vi.fn(),
    getTask: vi.fn(),
    scheduleTask: vi.fn(),
  },
}));

// Mock the logger to avoid actual logging during tests
vi.mock('@/utils/logger', () => ({
  logger: {
    apiError: vi.fn(),
  },
}));

type ResponseMock<T = unknown> = { body: T; opts?: { status?: number } };

describe('Schedule route tests', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    prismaMock.task.findMany.mockReset();
    prismaMock.task.findUnique.mockReset();
    prismaMock.task.update.mockReset();
    prismaMock.taskTimeSlot.findMany.mockReset();
    prismaMock.item.findFirst.mockReset();
    prismaMock.item.create.mockReset();
  });

  describe('GET /api/schedule', () => {
    it('returns scheduled tasks successfully', async () => {
      const mockTasks = [
        {
          id: 't1',
          title: 'Task 1',
          description: null,
          status: 'SCHEDULED',
          quantity: 5,
          completed_quantity: 2,
          item: {
            id: 'i1',
            projectId: 'p1',
            name: 'Item 1',
            description: null,
            status: 'ACTIVE',
            quantity: 10,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            project: {
              id: 'p1',
              name: 'Project 1',
              description: null,
              color: '#ff0000',
              orderNumber: '001',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          },
          itemId: 'i1',
          machine: {
            id: 'm1',
            name: 'Machine 1',
            type: 'CNC',
            status: 'AVAILABLE',
            location: 'Shop Floor',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          operator: null,
          timeSlots: [
            {
              id: 'ts1',
              taskId: 't1',
              startDateTime: new Date().toISOString(),
              endDateTime: new Date().toISOString(),
              durationMin: 60,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const { default: scheduleService } = await import('@/services/scheduleService');
      (scheduleService.listScheduledTasks as ReturnType<typeof vi.fn>).mockResolvedValue(mockTasks);

      const { GET } = await import('@/app/api/schedule/route');
      const req = new Request('http://localhost/api/schedule');
      const res = (await GET(req)) as unknown as ResponseMock;

      expect(Array.isArray(res.body)).toBe(true);
      expect(scheduleService.listScheduledTasks).toHaveBeenCalledWith(expect.anything(), null, null);
    });

    it('passes start and end query parameters to service', async () => {
      const { default: scheduleService } = await import('@/services/scheduleService');
      (scheduleService.listScheduledTasks as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const { GET } = await import('@/app/api/schedule/route');
      const req = new Request('http://localhost/api/schedule?start=2025-01-01&end=2025-01-31');
      await GET(req);

      expect(scheduleService.listScheduledTasks).toHaveBeenCalledWith(expect.anything(), '2025-01-01', '2025-01-31');
    });

    it('handles service errors and returns mapped error response', async () => {
      const { default: scheduleService } = await import('@/services/scheduleService');
      const error = new Error('Database connection failed');
      (scheduleService.listScheduledTasks as ReturnType<typeof vi.fn>).mockRejectedValue(error);

      const { GET } = await import('@/app/api/schedule/route');
      const req = new Request('http://localhost/api/schedule');
      const res = (await GET(req)) as unknown as ResponseMock;

      expect(res.opts?.status).toBe(500);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('POST /api/schedule', () => {
    it('schedules a task successfully', async () => {
      const requestBody = {
        taskId: 't1',
        machineId: 'm1',
        scheduledAt: '2025-01-01T10:00:00Z',
        durationMin: 60,
      };

      const mockUpdatedTask: TaskWithRelationsDTO = {
        id: 't1',
        title: 'Updated Task',
        description: null,
        status: 'SCHEDULED',
        quantity: 5,
        completed_quantity: 0,
        item: undefined,
        itemId: null,
        machines: [
          {
            id: 'm1',
            name: 'Machine 1',
            type: 'CNC',
            status: 'AVAILABLE',
            location: 'Shop Floor',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        operators: [],
        timeSlots: [
          {
            id: 'ts1',
            taskId: 't1',
            startDateTime: '2025-01-01T10:00:00Z',
            endDateTime: '2025-01-01T11:00:00Z',
            durationMin: 60,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const { default: scheduleService } = await import('@/services/scheduleService');
      (scheduleService.scheduleTask as ReturnType<typeof vi.fn>).mockResolvedValue(mockUpdatedTask);

      const { POST } = await import('@/app/api/schedule/route');
      const req = new Request('http://localhost/api/schedule', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });
      const res = (await POST(req)) as unknown as ResponseMock;

      expect(scheduleService.scheduleTask).toHaveBeenCalledWith(expect.anything(), requestBody);
      expect(res.body).toHaveProperty('id', 't1');
      expect(res.body).toHaveProperty('status', 'SCHEDULED');
    });

    it('handles scheduling errors and returns mapped error response', async () => {
      const { default: scheduleService } = await import('@/services/scheduleService');
      const error = new Error('Scheduling conflict');
      (scheduleService.scheduleTask as ReturnType<typeof vi.fn>).mockRejectedValue(error);

      const { POST } = await import('@/app/api/schedule/route');
      const req = new Request('http://localhost/api/schedule', {
        method: 'POST',
        body: JSON.stringify({ taskId: 't1', scheduledAt: '2025-01-01T10:00:00Z', durationMin: 60 }),
      });
      const res = (await POST(req)) as unknown as ResponseMock;

      expect(res.opts?.status).toBe(500);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('GET /api/schedule/:id', () => {
    it('returns a single task successfully', async () => {
      const mockTask = {
        id: 't1',
        title: 'Task 1',
        description: 'Task description',
        status: 'SCHEDULED',
        machine: { id: 'm1', name: 'Machine 1' },
        operator: null,
      };

      const { default: scheduleService } = await import('@/services/scheduleService');
      (scheduleService.getTask as ReturnType<typeof vi.fn>).mockResolvedValue(mockTask);

      const { GET } = await import('@/app/api/schedule/[id]/route');
      const req = new Request('http://localhost/api/schedule/t1');
      const res = (await GET(req, { params: Promise.resolve({ id: 't1' }) })) as unknown as ResponseMock;

      expect(scheduleService.getTask).toHaveBeenCalledWith(expect.anything(), 't1');
      expect(res.body).toHaveProperty('id', 't1');
    });

    it('handles task not found error and returns mapped error response', async () => {
      const { default: scheduleService } = await import('@/services/scheduleService');
      const error = new Error('Task not found');
      (scheduleService.getTask as ReturnType<typeof vi.fn>).mockRejectedValue(error);

      const { GET } = await import('@/app/api/schedule/[id]/route');
      const req = new Request('http://localhost/api/schedule/nonexistent');
      const res = (await GET(req, { params: Promise.resolve({ id: 'nonexistent' }) })) as unknown as ResponseMock;

      expect(res.opts?.status).toBe(500);
      expect(res.body).toHaveProperty('error');
    });
  });
});
