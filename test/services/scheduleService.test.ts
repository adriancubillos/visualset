import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prismaMock } from '../setup';
import scheduleService from '@/services/scheduleService';
import { ApiError } from '@/lib/errors';
import type { TaskWithRelationsDTO, ScheduleTaskRequestDTO } from '@/types/api';

// Mock the conflict detection utility
vi.mock('@/utils/conflictDetection', () => ({
  checkSchedulingConflicts: vi.fn(),
  createConflictErrorResponse: vi.fn(),
}));

describe('scheduleService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    prismaMock.task.findMany.mockReset();
    prismaMock.task.findUnique.mockReset();
    prismaMock.task.update.mockReset();
    prismaMock.taskTimeSlot.findMany.mockReset();
    prismaMock.item.findFirst.mockReset();
    prismaMock.item.create.mockReset();
  });

  describe('listScheduledTasks', () => {
    it('fetches tasks without date filtering when no start/end provided', async () => {
      const mockTasks = [
        {
          id: 't1',
          title: 'Task 1',
          description: null,
          status: 'SCHEDULED',
          quantity: 5,
          completed_quantity: 2,
          item: { id: 'i1', name: 'Item 1', project: { id: 'p1', name: 'Project 1' } },
          machine: { id: 'm1', name: 'Machine 1' },
          operator: null,
          timeSlots: [{ id: 'ts1', startDateTime: new Date() }],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      prismaMock.task.findMany.mockResolvedValue(mockTasks);

      const result = await scheduleService.listScheduledTasks(
        prismaMock as unknown as Parameters<typeof scheduleService.listScheduledTasks>[0],
      );

      expect(prismaMock.task.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
          item: { include: { project: true } },
          taskMachines: { include: { machine: true } },
          taskOperators: { include: { operator: true } },
          timeSlots: { orderBy: { startDateTime: 'asc' } },
        },
        orderBy: { createdAt: 'asc' },
      });
      expect(result).toEqual(mockTasks);
    });

    it('fetches tasks with date filtering when start and end provided', async () => {
      const mockTasks: unknown[] = [];
      prismaMock.task.findMany.mockResolvedValue(mockTasks);

      const startDate = '2025-01-01T00:00:00Z';
      const endDate = '2025-01-31T23:59:59Z';

      await scheduleService.listScheduledTasks(
        prismaMock as unknown as Parameters<typeof scheduleService.listScheduledTasks>[0],
        startDate,
        endDate,
      );

      expect(prismaMock.task.findMany).toHaveBeenCalledWith({
        where: {
          timeSlots: {
            some: {
              startDateTime: {
                gte: new Date(startDate),
                lte: new Date(endDate),
              },
            },
          },
        },
        include: {
          item: { include: { project: true } },
          taskMachines: { include: { machine: true } },
          taskOperators: { include: { operator: true } },
          timeSlots: { orderBy: { startDateTime: 'asc' } },
        },
        orderBy: { createdAt: 'asc' },
      });
    });

    it('ignores date filtering when only start provided (no end)', async () => {
      const mockTasks: unknown[] = [];
      prismaMock.task.findMany.mockResolvedValue(mockTasks);

      await scheduleService.listScheduledTasks(
        prismaMock as unknown as Parameters<typeof scheduleService.listScheduledTasks>[0],
        '2025-01-01',
        null,
      );

      expect(prismaMock.task.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
          item: { include: { project: true } },
          taskMachines: { include: { machine: true } },
          taskOperators: { include: { operator: true } },
          timeSlots: { orderBy: { startDateTime: 'asc' } },
        },
        orderBy: { createdAt: 'asc' },
      });
    });
  });

  describe('getTask', () => {
    it('returns task when found', async () => {
      const mockTask = {
        id: 't1',
        title: 'Task 1',
        description: 'Task description',
        status: 'PENDING',
        machine: { id: 'm1', name: 'Machine 1' },
        operator: { id: 'o1', name: 'Operator 1' },
      };

      prismaMock.task.findUnique.mockResolvedValue(mockTask);

      const result = await scheduleService.getTask(
        prismaMock as unknown as Parameters<typeof scheduleService.getTask>[0],
        't1',
      );

      expect(prismaMock.task.findUnique).toHaveBeenCalledWith({
        where: { id: 't1' },
        include: { taskMachines: { include: { machine: true } }, taskOperators: { include: { operator: true } } },
      });
      expect(result).toEqual(mockTask);
    });

    it('throws ApiError when task not found', async () => {
      prismaMock.task.findUnique.mockResolvedValue(null);

      await expect(
        scheduleService.getTask(prismaMock as unknown as Parameters<typeof scheduleService.getTask>[0], 'nonexistent'),
      ).rejects.toThrow(ApiError);
      await expect(
        scheduleService.getTask(prismaMock as unknown as Parameters<typeof scheduleService.getTask>[0], 'nonexistent'),
      ).rejects.toThrow('Task not found');
    });
  });

  describe('scheduleTask', () => {
    const validRequest: ScheduleTaskRequestDTO = {
      taskId: 't1',
      itemId: 'i1',
      machineId: 'm1',
      operatorId: 'o1',
      scheduledAt: '2025-01-01T10:00:00Z',
      durationMin: 60,
    };

    it('throws ApiError when required fields are missing', async () => {
      const invalidRequests = [
        { ...validRequest, taskId: undefined },
        { ...validRequest, scheduledAt: undefined },
        { ...validRequest, durationMin: undefined },
        { scheduledAt: '2025-01-01T10:00:00Z', durationMin: 60 }, // missing taskId
      ];

      for (const invalidRequest of invalidRequests) {
        await expect(
          scheduleService.scheduleTask(
            prismaMock as unknown as Parameters<typeof scheduleService.scheduleTask>[0],
            invalidRequest as ScheduleTaskRequestDTO,
          ),
        ).rejects.toThrow(ApiError);
        await expect(
          scheduleService.scheduleTask(
            prismaMock as unknown as Parameters<typeof scheduleService.scheduleTask>[0],
            invalidRequest as ScheduleTaskRequestDTO,
          ),
        ).rejects.toThrow('taskId, scheduledAt and durationMin are required');
      }
    });

    it('throws ApiError when task not found', async () => {
      prismaMock.task.findUnique.mockResolvedValue(null);

      await expect(
        scheduleService.scheduleTask(
          prismaMock as unknown as Parameters<typeof scheduleService.scheduleTask>[0],
          validRequest,
        ),
      ).rejects.toThrow(ApiError);
      await expect(
        scheduleService.scheduleTask(
          prismaMock as unknown as Parameters<typeof scheduleService.scheduleTask>[0],
          validRequest,
        ),
      ).rejects.toThrow('Task not found');
    });

    it('throws ApiError when scheduling conflict exists', async () => {
      const mockTask = { id: 't1', title: 'Task 1', status: 'PENDING' };
      prismaMock.task.findUnique.mockResolvedValue(mockTask);

      const { checkSchedulingConflicts, createConflictErrorResponse } = await import('@/utils/conflictDetection');
      (checkSchedulingConflicts as ReturnType<typeof vi.fn>).mockResolvedValue({
        hasConflict: true,
        conflictingTasks: [{ id: 't2', title: 'Conflicting Task' }],
      });
      (createConflictErrorResponse as ReturnType<typeof vi.fn>).mockReturnValue({
        conflict: { message: 'Resource conflict detected' },
      });

      await expect(
        scheduleService.scheduleTask(
          prismaMock as unknown as Parameters<typeof scheduleService.scheduleTask>[0],
          validRequest,
        ),
      ).rejects.toThrow(ApiError);
      await expect(
        scheduleService.scheduleTask(
          prismaMock as unknown as Parameters<typeof scheduleService.scheduleTask>[0],
          validRequest,
        ),
      ).rejects.toThrow('Scheduling conflict');

      expect(checkSchedulingConflicts).toHaveBeenCalledWith({
        scheduledAt: validRequest.scheduledAt,
        durationMin: validRequest.durationMin,
        machineIds: [validRequest.machineId],
        operatorIds: [validRequest.operatorId],
        excludeTaskId: validRequest.taskId,
      });
    });

    it('successfully schedules task without machine or operator (no conflict check)', async () => {
      const requestWithoutResources = {
        taskId: 't1',
        scheduledAt: '2025-01-01T10:00:00Z',
        durationMin: 60,
      };

      const mockTask = { id: 't1', title: 'Task 1', status: 'PENDING' };
      const mockUpdatedTask: TaskWithRelationsDTO = {
        id: 't1',
        title: 'Task 1',
        description: null,
        status: 'SCHEDULED',
        quantity: 5,
        completed_quantity: 0,
        item: undefined,
        itemId: null,
        machines: [],
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

      prismaMock.task.findUnique.mockResolvedValue(mockTask);

      // Mock transaction operations
      prismaMock.task.update.mockResolvedValue(mockUpdatedTask);
      prismaMock.taskMachine.deleteMany.mockResolvedValue({ count: 0 });
      prismaMock.taskOperator.deleteMany.mockResolvedValue({ count: 0 });
      prismaMock.taskTimeSlot.deleteMany.mockResolvedValue({ count: 0 });
      prismaMock.taskTimeSlot.create.mockResolvedValue({
        id: 'ts1',
        taskId: 't1',
        startDateTime: new Date('2025-01-01T10:00:00Z'),
        endDateTime: new Date('2025-01-01T11:00:00Z'),
        durationMin: 60,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      prismaMock.task.findUnique.mockResolvedValueOnce(mockTask).mockResolvedValueOnce(mockUpdatedTask);

      const { checkSchedulingConflicts } = await import('@/utils/conflictDetection');
      (checkSchedulingConflicts as ReturnType<typeof vi.fn>).mockClear();

      const result = await scheduleService.scheduleTask(
        prismaMock as unknown as Parameters<typeof scheduleService.scheduleTask>[0],
        requestWithoutResources,
      );

      // Should not check for conflicts when no machine or operator
      expect(checkSchedulingConflicts).not.toHaveBeenCalled();

      expect(prismaMock.task.update).toHaveBeenCalledWith({
        where: { id: 't1' },
        data: {
          itemId: null,
          status: 'SCHEDULED',
        },
      });

      expect(prismaMock.taskTimeSlot.create).toHaveBeenCalledWith({
        data: {
          taskId: 't1',
          startDateTime: new Date('2025-01-01T10:00:00Z'),
          endDateTime: new Date('2025-01-01T11:00:00Z'),
          durationMin: 60,
        },
      });

      expect(result).toEqual(mockUpdatedTask);
    });

    it('successfully schedules task with machine and operator (no conflicts)', async () => {
      const mockTask = { id: 't1', title: 'Task 1', status: 'PENDING' };
      const mockUpdatedTask: TaskWithRelationsDTO = {
        id: 't1',
        title: 'Task 1',
        description: null,
        status: 'SCHEDULED',
        quantity: 5,
        completed_quantity: 0,
        item: {
          id: 'i1',
          projectId: 'p1',
          name: 'Item 1',
          description: null,
          status: 'ACTIVE',
          quantity: 10,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        itemId: 'i1',
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
        operators: [
          {
            id: 'o1',
            name: 'Operator 1',
            email: 'operator1@example.com',
            status: 'AVAILABLE',
            shift: 'DAY',
            skills: [],
            availability: {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
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

      prismaMock.task.findUnique.mockResolvedValue(mockTask);

      // Mock transaction operations
      prismaMock.task.update.mockResolvedValue(mockUpdatedTask);
      prismaMock.taskMachine.deleteMany.mockResolvedValue({ count: 0 });
      prismaMock.taskOperator.deleteMany.mockResolvedValue({ count: 0 });
      prismaMock.taskMachine.create.mockResolvedValue({ taskId: 't1', machineId: 'm1' });
      prismaMock.taskOperator.create.mockResolvedValue({ taskId: 't1', operatorId: 'o1' });
      prismaMock.taskTimeSlot.deleteMany.mockResolvedValue({ count: 0 });
      prismaMock.taskTimeSlot.create.mockResolvedValue({
        id: 'ts1',
        taskId: 't1',
        startDateTime: new Date('2025-01-01T10:00:00Z'),
        endDateTime: new Date('2025-01-01T11:00:00Z'),
        durationMin: 60,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      prismaMock.task.findUnique.mockResolvedValueOnce(mockTask).mockResolvedValueOnce(mockUpdatedTask);

      const { checkSchedulingConflicts } = await import('@/utils/conflictDetection');
      (checkSchedulingConflicts as ReturnType<typeof vi.fn>).mockResolvedValue({
        hasConflict: false,
        conflictingTasks: [],
      });

      const result = await scheduleService.scheduleTask(
        prismaMock as unknown as Parameters<typeof scheduleService.scheduleTask>[0],
        validRequest,
      );

      expect(checkSchedulingConflicts).toHaveBeenCalledWith({
        scheduledAt: validRequest.scheduledAt,
        durationMin: validRequest.durationMin,
        machineIds: [validRequest.machineId],
        operatorIds: [validRequest.operatorId],
        excludeTaskId: validRequest.taskId,
      });

      expect(prismaMock.task.update).toHaveBeenCalledWith({
        where: { id: 't1' },
        data: {
          itemId: 'i1',
          status: 'SCHEDULED',
        },
      });

      expect(prismaMock.taskMachine.create).toHaveBeenCalledWith({
        data: { taskId: 't1', machineId: 'm1' },
      });

      expect(prismaMock.taskOperator.create).toHaveBeenCalledWith({
        data: { taskId: 't1', operatorId: 'o1' },
      });

      expect(prismaMock.taskTimeSlot.create).toHaveBeenCalledWith({
        data: {
          taskId: 't1',
          startDateTime: new Date('2025-01-01T10:00:00Z'),
          endDateTime: new Date('2025-01-01T11:00:00Z'),
          durationMin: 60,
        },
      });

      expect(result).toEqual(mockUpdatedTask);
    });
  });
});
