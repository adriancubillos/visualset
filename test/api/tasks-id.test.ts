import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as taskIdRoute from '@/app/api/tasks/[id]/route';
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

// Create a minimal NextRequest-like mock from a standard Request for tests.
// This is a simplified mock that provides just enough NextRequest interface
// few small stubs to satisfy the NextRequest type without pulling in runtime.
function makeNextRequest(r: Request): import('next/server').NextRequest {
  const nextReq = Object.create(r);
  nextReq.cookies = {
    get: vi.fn(),
    getAll: vi.fn(() => []),
    has: vi.fn(() => false),
    set: vi.fn(),
    delete: vi.fn(),
    clear: vi.fn(),
  };
  nextReq.nextUrl = new URL(r.url);
  return nextReq as unknown as import('next/server').NextRequest;
}

const mockTaskService = vi.mocked(taskService);
const mockLogger = vi.mocked(logger);

describe('Tasks API [id] routes', () => {
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

  const createMockContext = (id: string) => ({
    params: Promise.resolve({ id }),
  });

  beforeEach(() => {
    vi.restoreAllMocks();
    mockLogger.apiError = vi.fn();
  });

  describe('GET /api/tasks/[id]', () => {
    it('returns task successfully', async () => {
      const mockTask = createMockTask({ id: 'task-123' });
      mockTaskService.getTask.mockResolvedValue(mockTask);

      const request = new Request('http://localhost/api/tasks/task-123');
      const context = createMockContext('task-123');
      const response = await taskIdRoute.GET(makeNextRequest(request), context);

      expect(response).toHaveProperty('body');
      // The API transforms TaskWithRelationsDTO to TaskResponseDTO via mapTaskToResponse
      const expectedResponse = {
        id: 'task-123',
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
      };
      expect(response.body).toEqual(expectedResponse);
      expect(mockTaskService.getTask).toHaveBeenCalledWith(expect.any(Object), 'task-123');
    });

    it('handles task not found', async () => {
      const error = new ApiError({
        code: 'TASK_NOT_FOUND',
        message: 'Task with id "missing-task" not found',
        status: 404,
      });
      mockTaskService.getTask.mockRejectedValue(error);

      const request = new Request('http://localhost/api/tasks/missing-task');
      const context = createMockContext('missing-task');
      const response = (await taskIdRoute.GET(makeNextRequest(request), context)) as unknown as {
        body: { error: unknown };
        opts?: { status?: number };
      };

      expect(response).toHaveProperty('body');
      expect(response.body).toHaveProperty('error');
      expect(response.opts?.status).toBe(404);
      expect(mockLogger.apiError).toHaveBeenCalledWith('Fetch task', '/api/tasks/missing-task', error);
    });

    it('handles generic errors', async () => {
      const error = new Error('Database connection failed');
      mockTaskService.getTask.mockRejectedValue(error);

      const request = new Request('http://localhost/api/tasks/task-123');
      const context = createMockContext('task-123');
      const response = (await taskIdRoute.GET(makeNextRequest(request), context)) as unknown as {
        body: { error: unknown };
        opts?: { status?: number };
      };

      expect(response).toHaveProperty('body');
      expect(response.body).toHaveProperty('error');
      expect(response.opts?.status).toBe(500);
      expect(mockLogger.apiError).toHaveBeenCalledWith('Fetch task', '/api/tasks/task-123', error);
    });
  });

  describe('PUT /api/tasks/[id]', () => {
    it('updates task successfully', async () => {
      const updateData = {
        title: 'Updated Task',
        description: 'Updated description',
        status: 'IN_PROGRESS',
      };

      const mockUpdatedTask = createMockTask({
        id: 'task-123',
        title: 'Updated Task',
        description: 'Updated description',
        status: 'IN_PROGRESS',
      });

      mockTaskService.updateTask.mockResolvedValue(mockUpdatedTask);

      const request = new Request('http://localhost/api/tasks/task-123', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
      const context = createMockContext('task-123');
      const response = await taskIdRoute.PUT(makeNextRequest(request), context);

      expect(response).toHaveProperty('body');
      // The API transforms TaskWithRelationsDTO to TaskResponseDTO via mapTaskToResponse
      const expectedResponse = {
        id: 'task-123',
        title: 'Updated Task',
        description: 'Updated description',
        status: 'IN_PROGRESS',
        quantity: 1,
        completed_quantity: 0,
        item: undefined,
        project: null,
        machines: [],
        operators: [],
        timeSlots: [],
        createdAt: '2025-10-08T10:00:00.000Z',
        updatedAt: '2025-10-08T10:00:00.000Z',
      };
      expect(response.body).toEqual(expectedResponse);
      expect(mockTaskService.updateTask).toHaveBeenCalledWith(expect.any(Object), 'task-123', updateData);
    });

    it('handles task not found for update', async () => {
      const error = new ApiError({
        code: 'TASK_NOT_FOUND',
        message: 'Task with id "missing-task" not found',
        status: 404,
      });
      mockTaskService.updateTask.mockRejectedValue(error);

      const request = new Request('http://localhost/api/tasks/missing-task', {
        method: 'PUT',
        body: JSON.stringify({ title: 'Updated Task' }),
      });
      const context = createMockContext('missing-task');
      const response = (await taskIdRoute.PUT(makeNextRequest(request), context)) as unknown as {
        body: { error: unknown };
        opts?: { status?: number };
      };

      expect(response).toHaveProperty('body');
      expect(response.body).toHaveProperty('error');
      expect(response.opts?.status).toBe(404);
      expect(mockLogger.apiError).toHaveBeenCalledWith('Update task', '/api/tasks/missing-task', error);
    });

    it('handles validation errors for update', async () => {
      const error = new ApiError({ code: 'INVALID_STATUS', message: 'Invalid status value', status: 400 });
      mockTaskService.updateTask.mockRejectedValue(error);

      const request = new Request('http://localhost/api/tasks/task-123', {
        method: 'PUT',
        body: JSON.stringify({ status: 'INVALID_STATUS' }),
      });
      const context = createMockContext('task-123');
      const response = (await taskIdRoute.PUT(makeNextRequest(request), context)) as unknown as {
        body: { error: unknown };
        opts?: { status?: number };
      };

      expect(response).toHaveProperty('body');
      expect(response.body).toHaveProperty('error');
      expect(response.opts?.status).toBe(400);
      expect(mockLogger.apiError).toHaveBeenCalledWith('Update task', '/api/tasks/task-123', error);
    });

    it('handles generic errors for update', async () => {
      const error = new Error('Database connection failed');
      mockTaskService.updateTask.mockRejectedValue(error);

      const request = new Request('http://localhost/api/tasks/task-123', {
        method: 'PUT',
        body: JSON.stringify({ title: 'Updated Task' }),
      });
      const context = createMockContext('task-123');
      const response = (await taskIdRoute.PUT(makeNextRequest(request), context)) as unknown as {
        body: { error: unknown };
        opts?: { status?: number };
      };

      expect(response).toHaveProperty('body');
      expect(response.body).toHaveProperty('error');
      expect(response.opts?.status).toBe(500);
      expect(mockLogger.apiError).toHaveBeenCalledWith('Update task', '/api/tasks/task-123', error);
    });
  });

  describe('PATCH /api/tasks/[id]', () => {
    it('patches task successfully', async () => {
      const patchData = {
        completed_quantity: 5,
      };

      const mockPatchedTask = createMockTask({
        id: 'task-123',
        completed_quantity: 5,
      });

      mockTaskService.patchTask.mockResolvedValue(mockPatchedTask);

      const request = new Request('http://localhost/api/tasks/task-123', {
        method: 'PATCH',
        body: JSON.stringify(patchData),
      });
      const context = createMockContext('task-123');
      const response = await taskIdRoute.PATCH(makeNextRequest(request), context);

      expect(response).toHaveProperty('body');
      // The API transforms TaskWithRelationsDTO to TaskResponseDTO via mapTaskToResponse
      const expectedResponse = {
        id: 'task-123',
        title: 'Test Task 1',
        description: 'Test description',
        status: 'PENDING',
        quantity: 1,
        completed_quantity: 5,
        item: undefined,
        project: null,
        machines: [],
        operators: [],
        timeSlots: [],
        createdAt: '2025-10-08T10:00:00.000Z',
        updatedAt: '2025-10-08T10:00:00.000Z',
      };
      expect(response.body).toEqual(expectedResponse);
      expect(mockTaskService.patchTask).toHaveBeenCalledWith(expect.any(Object), 'task-123', patchData);
    });

    it('patches task status', async () => {
      const patchData = {
        status: 'COMPLETED',
      };

      const mockPatchedTask = createMockTask({
        id: 'task-123',
        status: 'COMPLETED',
      });

      mockTaskService.patchTask.mockResolvedValue(mockPatchedTask);

      const request = new Request('http://localhost/api/tasks/task-123', {
        method: 'PATCH',
        body: JSON.stringify(patchData),
      });
      const context = createMockContext('task-123');
      const response = await taskIdRoute.PATCH(makeNextRequest(request), context);

      expect(response).toHaveProperty('body');
      // The API transforms TaskWithRelationsDTO to TaskResponseDTO via mapTaskToResponse
      const expectedResponse = {
        id: 'task-123',
        title: 'Test Task 1',
        description: 'Test description',
        status: 'COMPLETED',
        quantity: 1,
        completed_quantity: 0,
        item: undefined,
        project: null,
        machines: [],
        operators: [],
        timeSlots: [],
        createdAt: '2025-10-08T10:00:00.000Z',
        updatedAt: '2025-10-08T10:00:00.000Z',
      };
      expect(response.body).toEqual(expectedResponse);
      expect(mockTaskService.patchTask).toHaveBeenCalledWith(expect.any(Object), 'task-123', patchData);
    });

    it('handles task not found for patch', async () => {
      const error = new ApiError({
        code: 'TASK_NOT_FOUND',
        message: 'Task with id "missing-task" not found',
        status: 404,
      });
      mockTaskService.patchTask.mockRejectedValue(error);

      const request = new Request('http://localhost/api/tasks/missing-task', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'COMPLETED' }),
      });
      const context = createMockContext('missing-task');
      const response = (await taskIdRoute.PATCH(makeNextRequest(request), context)) as unknown as {
        body: { error: unknown };
        opts?: { status?: number };
      };

      expect(response).toHaveProperty('body');
      expect(response.body).toHaveProperty('error');
      expect(response.opts?.status).toBe(404);
      expect(mockLogger.apiError).toHaveBeenCalledWith('Patch task', '/api/tasks/missing-task', error);
    });

    it('handles validation errors for patch', async () => {
      const error = new ApiError({
        code: 'INVALID_QUANTITY',
        message: 'Completed quantity cannot exceed total quantity',
        status: 400,
      });
      mockTaskService.patchTask.mockRejectedValue(error);

      const request = new Request('http://localhost/api/tasks/task-123', {
        method: 'PATCH',
        body: JSON.stringify({ completed_quantity: 100 }),
      });
      const context = createMockContext('task-123');
      const response = (await taskIdRoute.PATCH(makeNextRequest(request), context)) as unknown as {
        body: { error: unknown };
        opts?: { status?: number };
      };

      expect(response).toHaveProperty('body');
      expect(response.body).toHaveProperty('error');
      expect(response.opts?.status).toBe(400);
      expect(mockLogger.apiError).toHaveBeenCalledWith('Patch task', '/api/tasks/task-123', error);
    });

    it('handles generic errors for patch', async () => {
      const error = new Error('Database connection failed');
      mockTaskService.patchTask.mockRejectedValue(error);

      const request = new Request('http://localhost/api/tasks/task-123', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'COMPLETED' }),
      });
      const context = createMockContext('task-123');
      const response = (await taskIdRoute.PATCH(makeNextRequest(request), context)) as unknown as {
        body: { error: unknown };
        opts?: { status?: number };
      };

      expect(response).toHaveProperty('body');
      expect(response.body).toHaveProperty('error');
      expect(response.opts?.status).toBe(500);
      expect(mockLogger.apiError).toHaveBeenCalledWith('Patch task', '/api/tasks/task-123', error);
    });
  });

  describe('DELETE /api/tasks/[id]', () => {
    it('deletes task successfully', async () => {
      mockTaskService.deleteTask.mockResolvedValue(undefined);

      const request = new Request('http://localhost/api/tasks/task-123', {
        method: 'DELETE',
      });
      const context = createMockContext('task-123');
      const response = await taskIdRoute.DELETE(makeNextRequest(request), context);

      expect(response).toHaveProperty('body');
      expect(response.body).toEqual({ message: 'Task deleted successfully' });
      expect(mockTaskService.deleteTask).toHaveBeenCalledWith(expect.any(Object), 'task-123');
    });

    it('handles task not found for delete', async () => {
      const error = new ApiError({
        code: 'TASK_NOT_FOUND',
        message: 'Task with id "missing-task" not found',
        status: 404,
      });
      mockTaskService.deleteTask.mockRejectedValue(error);

      const request = new Request('http://localhost/api/tasks/missing-task', {
        method: 'DELETE',
      });
      const context = createMockContext('missing-task');
      const response = (await taskIdRoute.DELETE(makeNextRequest(request), context)) as unknown as {
        body: { error: unknown };
        opts?: { status?: number };
      };

      expect(response).toHaveProperty('body');
      expect(response.body).toHaveProperty('error');
      expect(response.opts?.status).toBe(404);
      expect(mockLogger.apiError).toHaveBeenCalledWith('Delete task', '/api/tasks/missing-task', error);
    });

    it('handles conflict errors for delete', async () => {
      const error = new ApiError({
        code: 'TASK_IN_PROGRESS',
        message: 'Cannot delete task that is currently in progress',
        status: 409,
      });
      mockTaskService.deleteTask.mockRejectedValue(error);

      const request = new Request('http://localhost/api/tasks/task-123', {
        method: 'DELETE',
      });
      const context = createMockContext('task-123');
      const response = (await taskIdRoute.DELETE(makeNextRequest(request), context)) as unknown as {
        body: { error: unknown };
        opts?: { status?: number };
      };

      expect(response).toHaveProperty('body');
      expect(response.body).toHaveProperty('error');
      expect(response.opts?.status).toBe(409);
      expect(mockLogger.apiError).toHaveBeenCalledWith('Delete task', '/api/tasks/task-123', error);
    });

    it('handles generic errors for delete', async () => {
      const error = new Error('Database connection failed');
      mockTaskService.deleteTask.mockRejectedValue(error);

      const request = new Request('http://localhost/api/tasks/task-123', {
        method: 'DELETE',
      });
      const context = createMockContext('task-123');
      const response = (await taskIdRoute.DELETE(makeNextRequest(request), context)) as unknown as {
        body: { error: unknown };
        opts?: { status?: number };
      };

      expect(response).toHaveProperty('body');
      expect(response.body).toHaveProperty('error');
      expect(response.opts?.status).toBe(500);
      expect(mockLogger.apiError).toHaveBeenCalledWith('Delete task', '/api/tasks/task-123', error);
    });
  });
});
