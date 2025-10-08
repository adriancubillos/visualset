import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as tasksRoute from '@/app/api/tasks/route';
import taskService from '@/services/taskService';
import { logger } from '@/utils/logger';
import { ApiError } from '@/lib/errors';
import type { TaskWithRelationsDTO } from '@/types/api';

// Mock dependencies
vi.mock('@/services/taskService');
vi.mock('@/utils/logger');
vi.mock('@/lib/prisma', () => ({
  default: {},
}));

const mockTaskService = vi.mocked(taskService);
const mockLogger = vi.mocked(logger);

describe('Tasks API routes', () => {
  const createMockTask = (overrides: Partial<TaskWithRelationsDTO> = {}): TaskWithRelationsDTO => ({
    id: 'task-1',
    title: 'Test Task 1',
    description: 'Test description',
    status: 'PENDING',
    quantity: 1,
    completed_quantity: 0,
    itemId: null,
    item: undefined,
    machines: [],
    operators: [],
    timeSlots: [],
    createdAt: '2025-10-08T10:00:00.000Z',
    updatedAt: '2025-10-08T10:00:00.000Z',
    ...overrides,
  });

  beforeEach(() => {
    vi.restoreAllMocks();
    mockLogger.apiError = vi.fn();
  });

  describe('GET /api/tasks', () => {
    it('returns tasks successfully without filters', async () => {
      const mockTasks: TaskWithRelationsDTO[] = [createMockTask()];

      mockTaskService.listTasks.mockResolvedValue(mockTasks);

      const request = new Request('http://localhost/api/tasks');
      const response = await tasksRoute.GET(request);

      expect(response).toHaveProperty('body');
      expect(response.body).toEqual([
        {
          id: 'task-1',
          title: 'Test Task 1',
          description: 'Test description',
          status: 'PENDING',
          quantity: 1,
          completed_quantity: 0,
          item: undefined,
          project: null,
          machines: [],
          operators: [],
          timeSlots: [],
          createdAt: '2025-10-08T10:00:00.000Z',
          updatedAt: '2025-10-08T10:00:00.000Z',
        },
      ]);
      expect(mockTaskService.listTasks).toHaveBeenCalledWith({}, null, null);
    });

    it('returns tasks successfully with start filter', async () => {
      const mockTasks: TaskWithRelationsDTO[] = [createMockTask()];

      mockTaskService.listTasks.mockResolvedValue(mockTasks);

      const request = new Request('http://localhost/api/tasks?start=2025-10-08T00:00:00Z');
      const response = await tasksRoute.GET(request);

      expect(response).toHaveProperty('body');
      expect(response.body).toEqual([
        {
          id: 'task-1',
          title: 'Test Task 1',
          description: 'Test description',
          status: 'PENDING',
          quantity: 1,
          completed_quantity: 0,
          item: undefined,
          project: null,
          machines: [],
          operators: [],
          timeSlots: [],
          createdAt: '2025-10-08T10:00:00.000Z',
          updatedAt: '2025-10-08T10:00:00.000Z',
        },
      ]);
      expect(mockTaskService.listTasks).toHaveBeenCalledWith({}, '2025-10-08T00:00:00Z', null);
    });

    it('returns tasks successfully with end filter', async () => {
      const mockTasks: TaskWithRelationsDTO[] = [createMockTask()];

      mockTaskService.listTasks.mockResolvedValue(mockTasks);

      const request = new Request('http://localhost/api/tasks?end=2025-10-08T23:59:59Z');
      const response = await tasksRoute.GET(request);

      expect(response).toHaveProperty('body');
      expect(response.body).toEqual([
        {
          id: 'task-1',
          title: 'Test Task 1',
          description: 'Test description',
          status: 'PENDING',
          quantity: 1,
          completed_quantity: 0,
          item: undefined,
          project: null,
          machines: [],
          operators: [],
          timeSlots: [],
          createdAt: '2025-10-08T10:00:00.000Z',
          updatedAt: '2025-10-08T10:00:00.000Z',
        },
      ]);
      expect(mockTaskService.listTasks).toHaveBeenCalledWith({}, null, '2025-10-08T23:59:59Z');
    });

    it('returns tasks successfully with both start and end filters', async () => {
      const mockTasks: TaskWithRelationsDTO[] = [createMockTask()];

      mockTaskService.listTasks.mockResolvedValue(mockTasks);

      const request = new Request('http://localhost/api/tasks?start=2025-10-08T00:00:00Z&end=2025-10-08T23:59:59Z');
      const response = await tasksRoute.GET(request);

      expect(response).toHaveProperty('body');
      expect(response.body).toEqual([
        {
          id: 'task-1',
          title: 'Test Task 1',
          description: 'Test description',
          status: 'PENDING',
          quantity: 1,
          completed_quantity: 0,
          item: undefined,
          project: null,
          machines: [],
          operators: [],
          timeSlots: [],
          createdAt: '2025-10-08T10:00:00.000Z',
          updatedAt: '2025-10-08T10:00:00.000Z',
        },
      ]);
      expect(mockTaskService.listTasks).toHaveBeenCalledWith({}, '2025-10-08T00:00:00Z', '2025-10-08T23:59:59Z');
    });

    it('handles errors and logs them', async () => {
      const error = new ApiError({ code: 'DATABASE_ERROR', message: 'Database connection failed', status: 500 });
      mockTaskService.listTasks.mockRejectedValue(error);

      const request = new Request('http://localhost/api/tasks');
      const response = (await tasksRoute.GET(request)) as unknown as {
        body: { error: unknown };
        opts?: { status?: number };
      };

      expect(response).toHaveProperty('body');
      expect(response.body).toHaveProperty('error');
      expect(response.opts?.status).toBe(500);
      expect(mockLogger.apiError).toHaveBeenCalledWith('Fetch tasks', '/api/tasks', error);
    });

    it('handles generic errors', async () => {
      const error = new Error('Something went wrong');
      mockTaskService.listTasks.mockRejectedValue(error);

      const request = new Request('http://localhost/api/tasks');
      const response = (await tasksRoute.GET(request)) as unknown as {
        body: { error: unknown };
        opts?: { status?: number };
      };

      expect(response).toHaveProperty('body');
      expect(response.body).toHaveProperty('error');
      expect(response.opts?.status).toBe(500);
      expect(mockLogger.apiError).toHaveBeenCalledWith('Fetch tasks', '/api/tasks', error);
    });
  });

  describe('POST /api/tasks', () => {
    it('creates task successfully', async () => {
      const taskInput = {
        title: 'New Task',
        description: 'New task description',
        quantity: 1,
        itemId: 'item-1',
      };

      const mockCreatedTask = createMockTask({
        id: 'task-new',
        title: 'New Task',
        description: 'New task description',
        status: 'PENDING',
        quantity: 1,
        itemId: 'item-1',
        item: {
          id: 'item-1',
          projectId: 'project-1',
          name: 'Test Item',
          status: 'ACTIVE',
          quantity: 10,
          createdAt: '2025-10-08T10:00:00.000Z',
          updatedAt: '2025-10-08T10:00:00.000Z',
        },
      });

      mockTaskService.createTask.mockResolvedValue(mockCreatedTask);

      const request = new Request('http://localhost/api/tasks', {
        method: 'POST',
        body: JSON.stringify(taskInput),
      });
      const response = await tasksRoute.POST(request);

      expect(response).toHaveProperty('body');
      // The API transforms TaskWithRelationsDTO to TaskResponseDTO via mapTaskToResponse
      const expectedResponse = {
        id: 'task-new',
        title: 'New Task',
        description: 'New task description',
        status: 'PENDING',
        quantity: 1,
        completed_quantity: 0,
        item: {
          id: 'item-1',
          projectId: 'project-1',
          name: 'Test Item',
          status: 'ACTIVE',
          quantity: 10,
          createdAt: '2025-10-08T10:00:00.000Z',
          updatedAt: '2025-10-08T10:00:00.000Z',
        },
        project: null,
        machines: [],
        operators: [],
        timeSlots: [],
        createdAt: '2025-10-08T10:00:00.000Z',
        updatedAt: '2025-10-08T10:00:00.000Z',
      };
      expect(response.body).toEqual(expectedResponse);
      expect(mockTaskService.createTask).toHaveBeenCalledWith(expect.any(Object), taskInput);
    });

    it('creates task with machines and operators', async () => {
      const taskInput = {
        title: 'Task with Resources',
        description: 'Task with machine and operator',
        machineIds: ['machine-1'],
        operatorIds: ['operator-1'],
        timeSlots: [
          {
            startDateTime: '2025-10-08T10:00:00Z',
            endDateTime: '2025-10-08T11:00:00Z',
          },
        ],
      };

      const mockCreatedTask = createMockTask({
        id: 'task-new',
        title: 'Task with Resources',
        description: 'Task with machine and operator',
        machines: [
          {
            id: 'machine-1',
            name: 'Machine 1',
            type: 'CNC',
            status: 'ACTIVE',
            location: 'Floor 1',
            createdAt: '2025-10-08T10:00:00.000Z',
            updatedAt: '2025-10-08T10:00:00.000Z',
          },
        ],
        operators: [
          {
            id: 'operator-1',
            name: 'Operator 1',
            email: 'operator1@example.com',
            skills: ['CNC'],
            status: 'ACTIVE',
            shift: 'DAY',
            availability: {},
            createdAt: '2025-10-08T10:00:00.000Z',
            updatedAt: '2025-10-08T10:00:00.000Z',
          },
        ],
        timeSlots: [
          {
            id: 'slot-1',
            taskId: 'task-new',
            startDateTime: '2025-10-08T10:00:00.000Z',
            endDateTime: '2025-10-08T11:00:00.000Z',
            durationMin: 60,
            createdAt: '2025-10-08T10:00:00.000Z',
            updatedAt: '2025-10-08T10:00:00.000Z',
          },
        ],
      });

      mockTaskService.createTask.mockResolvedValue(mockCreatedTask);

      const request = new Request('http://localhost/api/tasks', {
        method: 'POST',
        body: JSON.stringify(taskInput),
      });
      const response = await tasksRoute.POST(request);

      expect(response).toHaveProperty('body');
      // The API transforms TaskWithRelationsDTO to TaskResponseDTO via mapTaskToResponse
      const expectedResponse = {
        id: 'task-new',
        title: 'Task with Resources',
        description: 'Task with machine and operator',
        status: 'PENDING',
        quantity: 1,
        completed_quantity: 0,
        item: undefined,
        project: null,
        machines: [
          {
            id: 'machine-1',
            name: 'Machine 1',
            type: 'CNC',
            status: 'ACTIVE',
            location: 'Floor 1',
            createdAt: '2025-10-08T10:00:00.000Z',
            updatedAt: '2025-10-08T10:00:00.000Z',
          },
        ],
        operators: [
          {
            id: 'operator-1',
            name: 'Operator 1',
            email: 'operator1@example.com',
            skills: ['CNC'],
            status: 'ACTIVE',
            shift: 'DAY',
            availability: {},
            createdAt: '2025-10-08T10:00:00.000Z',
            updatedAt: '2025-10-08T10:00:00.000Z',
          },
        ],
        timeSlots: [
          {
            id: 'slot-1',
            taskId: 'task-new',
            startDateTime: '2025-10-08T10:00:00.000Z',
            endDateTime: '2025-10-08T11:00:00.000Z',
            durationMin: 60,
            createdAt: '2025-10-08T10:00:00.000Z',
            updatedAt: '2025-10-08T10:00:00.000Z',
          },
        ],
        createdAt: '2025-10-08T10:00:00.000Z',
        updatedAt: '2025-10-08T10:00:00.000Z',
      };
      expect(response.body).toEqual(expectedResponse);
      expect(mockTaskService.createTask).toHaveBeenCalledWith(expect.any(Object), taskInput);
    });

    it('handles validation errors', async () => {
      const error = new ApiError({ code: 'MISSING_TITLE', message: 'title is required', status: 400 });
      mockTaskService.createTask.mockRejectedValue(error);

      const request = new Request('http://localhost/api/tasks', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const response = (await tasksRoute.POST(request)) as unknown as {
        body: { error: unknown };
        opts?: { status?: number };
      };

      expect(response).toHaveProperty('body');
      expect(response.body).toHaveProperty('error');
      expect(response.opts?.status).toBe(400);
      expect(mockLogger.apiError).toHaveBeenCalledWith('Create task', '/api/tasks', error);
    });

    it('handles conflict errors', async () => {
      const error = new ApiError({
        code: 'MACHINE_CONFLICT',
        message: 'Machine "Machine 1" is already assigned to task "Other Task" from 10:00 AM to 11:00 AM',
        status: 409,
      });
      mockTaskService.createTask.mockRejectedValue(error);

      const taskInput = {
        title: 'Conflicting Task',
        machineIds: ['machine-1'],
        timeSlots: [
          {
            startDateTime: '2025-10-08T10:00:00Z',
            endDateTime: '2025-10-08T11:00:00Z',
          },
        ],
      };

      const request = new Request('http://localhost/api/tasks', {
        method: 'POST',
        body: JSON.stringify(taskInput),
      });
      const response = (await tasksRoute.POST(request)) as unknown as {
        body: { error: unknown };
        opts?: { status?: number };
      };

      expect(response).toHaveProperty('body');
      expect(response.body).toHaveProperty('error');
      expect(response.opts?.status).toBe(409);
      expect(mockLogger.apiError).toHaveBeenCalledWith('Create task', '/api/tasks', error);
    });

    it('handles generic errors', async () => {
      const error = new Error('Database connection failed');
      mockTaskService.createTask.mockRejectedValue(error);

      const request = new Request('http://localhost/api/tasks', {
        method: 'POST',
        body: JSON.stringify({ title: 'Test Task' }),
      });
      const response = (await tasksRoute.POST(request)) as unknown as {
        body: { error: unknown };
        opts?: { status?: number };
      };

      expect(response).toHaveProperty('body');
      expect(response.body).toHaveProperty('error');
      expect(response.opts?.status).toBe(500);
      expect(mockLogger.apiError).toHaveBeenCalledWith('Create task', '/api/tasks', error);
    });
  });
});
