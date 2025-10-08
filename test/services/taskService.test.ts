import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import taskService from '@/services/taskService';
import { ApiError } from '@/lib/errors';
import { prismaMock } from '../setup';
import type { PrismaClient } from '@prisma/client';

// Type for transaction callback
type TransactionCallback<T> = (tx: PrismaClient) => Promise<T>;

// Mock the conflict detection utility
vi.mock('@/utils/conflictDetection', () => ({
  checkSchedulingConflicts: vi.fn().mockResolvedValue({
    hasConflict: false,
    conflictData: null,
    conflictType: null,
  }),
}));

import { checkSchedulingConflicts } from '@/utils/conflictDetection';
const mockCheckSchedulingConflicts = checkSchedulingConflicts as Mock;

describe('TaskService', () => {
  // Cast prismaMock to PrismaClient to avoid type issues
  const db = prismaMock as unknown as PrismaClient;
  const createMockTaskData = (overrides = {}) => ({
    id: 'task-1',
    title: 'Test Task',
    description: 'Test description',
    status: 'PENDING',
    quantity: 1,
    completed_quantity: 0,
    itemId: null,
    item: null,
    taskMachines: [],
    taskOperators: [],
    timeSlots: [],
    createdAt: new Date('2025-10-08T10:00:00.000Z'),
    updatedAt: new Date('2025-10-08T10:00:00.000Z'),
    ...overrides,
  });

  const createMockTaskWithRelations = (overrides = {}) => ({
    id: 'task-1',
    title: 'Test Task',
    description: 'Test description',
    status: 'PENDING',
    quantity: 1,
    completed_quantity: 0,
    itemId: null,
    item: null,
    taskMachines: [],
    taskOperators: [],
    timeSlots: [],
    createdAt: new Date('2025-10-08T10:00:00.000Z'),
    updatedAt: new Date('2025-10-08T10:00:00.000Z'),
    ...overrides,
  });

  beforeEach(() => {
    vi.restoreAllMocks();
    mockCheckSchedulingConflicts.mockResolvedValue({
      hasConflict: false,
      conflictData: null,
      conflictType: null,
    });
  });

  describe('listTasks', () => {
    it('returns all tasks without filters', async () => {
      const mockTasks = [createMockTaskData()];
      prismaMock.task.findMany.mockResolvedValue(mockTasks);

      const result = await taskService.listTasks(db);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'task-1',
        title: 'Test Task',
        description: 'Test description',
        status: 'PENDING',
        quantity: 1,
        completed_quantity: 0,
        itemId: null,
        item: null,
        machines: [],
        operators: [],
        timeSlots: [],
        createdAt: '2025-10-08T10:00:00.000Z',
        updatedAt: '2025-10-08T10:00:00.000Z',
      });
      expect(prismaMock.task.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
          item: { include: { project: true } },
          taskMachines: { include: { machine: true } },
          taskOperators: { include: { operator: true } },
          timeSlots: { orderBy: { startDateTime: 'asc' } },
        },
      });
    });

    it('filters tasks by start date', async () => {
      const mockTasks = [createMockTaskData()];
      prismaMock.task.findMany.mockResolvedValue(mockTasks);

      await taskService.listTasks(db, '2025-10-08T00:00:00Z');

      expect(prismaMock.task.findMany).toHaveBeenCalledWith({
        where: {
          timeSlots: {
            some: {
              startDateTime: { gte: new Date('2025-10-08T00:00:00Z') },
            },
          },
        },
        include: {
          item: { include: { project: true } },
          taskMachines: { include: { machine: true } },
          taskOperators: { include: { operator: true } },
          timeSlots: { orderBy: { startDateTime: 'asc' } },
        },
      });
    });

    it('filters tasks by end date', async () => {
      const mockTasks = [createMockTaskData()];
      prismaMock.task.findMany.mockResolvedValue(mockTasks);

      await taskService.listTasks(db, null, '2025-10-08T23:59:59Z');

      expect(prismaMock.task.findMany).toHaveBeenCalledWith({
        where: {
          timeSlots: {
            some: {
              startDateTime: { lte: new Date('2025-10-08T23:59:59Z') },
            },
          },
        },
        include: {
          item: { include: { project: true } },
          taskMachines: { include: { machine: true } },
          taskOperators: { include: { operator: true } },
          timeSlots: { orderBy: { startDateTime: 'asc' } },
        },
      });
    });

    it('filters tasks by date range', async () => {
      const mockTasks = [createMockTaskData()];
      prismaMock.task.findMany.mockResolvedValue(mockTasks);

      await taskService.listTasks(db, '2025-10-08T00:00:00Z', '2025-10-08T23:59:59Z');

      expect(prismaMock.task.findMany).toHaveBeenCalledWith({
        where: {
          timeSlots: {
            some: {
              startDateTime: {
                gte: new Date('2025-10-08T00:00:00Z'),
                lte: new Date('2025-10-08T23:59:59Z'),
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
      });
    });

    it('transforms tasks with machines and operators correctly', async () => {
      const mockTasks = [
        createMockTaskData({
          taskMachines: [
            {
              machine: {
                id: 'machine-1',
                name: 'CNC Machine',
                type: 'CNC',
                status: 'ACTIVE',
                location: 'Floor 1',
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            },
          ],
          taskOperators: [
            {
              operator: {
                id: 'operator-1',
                name: 'John Doe',
                email: 'john@example.com',
                skills: ['CNC'],
                status: 'ACTIVE',
                shift: 'DAY',
                availability: {},
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            },
          ],
        }),
      ];
      prismaMock.task.findMany.mockResolvedValue(mockTasks);

      const result = await taskService.listTasks(db);

      expect(result[0].machines).toHaveLength(1);
      expect(result[0].machines?.[0]).toEqual({
        id: 'machine-1',
        name: 'CNC Machine',
        type: 'CNC',
        status: 'ACTIVE',
        location: 'Floor 1',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
      expect(result[0].operators).toHaveLength(1);
      expect(result[0].operators?.[0]).toEqual({
        id: 'operator-1',
        name: 'John Doe',
        email: 'john@example.com',
        skills: ['CNC'],
        status: 'ACTIVE',
        shift: 'DAY',
        availability: {},
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });
  });

  describe('createTask', () => {
    it('creates a basic task successfully', async () => {
      const taskInput = {
        title: 'New Task',
        description: 'New task description',
        status: 'PENDING',
        quantity: 1,
      };

      const mockCreatedTask = createMockTaskWithRelations({
        id: 'task-new',
        title: 'New Task',
        description: 'New task description',
      });

      prismaMock.$transaction.mockImplementation(async (callback: TransactionCallback<unknown>) => {
        return await callback(db);
      });
      prismaMock.task.create.mockResolvedValue(mockCreatedTask);
      prismaMock.task.findUnique.mockResolvedValue(mockCreatedTask);

      const result = await taskService.createTask(db, taskInput);

      expect(result).toBeDefined();
      expect(result?.title).toBe('New Task');
      expect(prismaMock.task.create).toHaveBeenCalledWith({
        data: {
          title: 'New Task',
          description: 'New task description',
          status: 'PENDING',
          quantity: 1,
          completed_quantity: 0,
        },
        include: {
          item: { include: { project: true } },
          taskMachines: { include: { machine: true } },
          taskOperators: { include: { operator: true } },
          timeSlots: { orderBy: { startDateTime: 'asc' } },
        },
      });
    });

    it('throws error when title is missing', async () => {
      const taskInput = {
        description: 'Task without title',
      };

      await expect(taskService.createTask(db, taskInput)).rejects.toThrow(ApiError);
      await expect(taskService.createTask(db, taskInput)).rejects.toThrow('title is required');
    });

    it('creates task with item reference', async () => {
      const taskInput = {
        title: 'Task with Item',
        itemId: 'item-1',
      };

      const mockCreatedTask = createMockTaskWithRelations({
        id: 'task-new',
        title: 'Task with Item',
        itemId: 'item-1',
      });

      prismaMock.$transaction.mockImplementation(async (callback: TransactionCallback<unknown>) => {
        return await callback(db);
      });
      prismaMock.task.create.mockResolvedValue(mockCreatedTask);
      prismaMock.task.findUnique.mockResolvedValue(mockCreatedTask);

      const result = await taskService.createTask(db, taskInput);

      expect(result?.itemId).toBe('item-1');
      expect(prismaMock.task.create).toHaveBeenCalledWith({
        data: {
          title: 'Task with Item',
          description: null,
          status: 'PENDING',
          quantity: 1,
          completed_quantity: 0,
          item: { connect: { id: 'item-1' } },
        },
        include: {
          item: { include: { project: true } },
          taskMachines: { include: { machine: true } },
          taskOperators: { include: { operator: true } },
          timeSlots: { orderBy: { startDateTime: 'asc' } },
        },
      });
    });

    it('creates item from project when itemId not provided', async () => {
      const taskInput = {
        title: 'Task with Project',
        projectId: 'project-1',
      };

      const mockCreatedTask = createMockTaskWithRelations({
        id: 'task-new',
        title: 'Task with Project',
        itemId: 'item-new',
      });

      prismaMock.$transaction.mockImplementation(async (callback: TransactionCallback<unknown>) => {
        return await callback(db);
      });
      prismaMock.item.findFirst.mockResolvedValue(null);
      prismaMock.item.create.mockResolvedValue({ id: 'item-new', projectId: 'project-1', name: 'Default Item' });
      prismaMock.task.create.mockResolvedValue(mockCreatedTask);
      prismaMock.task.findUnique.mockResolvedValue(mockCreatedTask);

      const result = await taskService.createTask(db, taskInput);

      expect(prismaMock.item.findFirst).toHaveBeenCalledWith({ where: { projectId: 'project-1' } });
      expect(prismaMock.item.create).toHaveBeenCalledWith({
        data: { projectId: 'project-1', name: 'Default Item' },
      });
      expect(result?.itemId).toBe('item-new');
    });

    it('creates task with machines and operators', async () => {
      const taskInput = {
        title: 'Task with Resources',
        machineIds: ['machine-1', 'machine-2'],
        operatorIds: ['operator-1'],
        timeSlots: [
          {
            startDateTime: '2025-10-08T10:00:00Z',
            endDateTime: '2025-10-08T12:00:00Z',
            durationMin: 120,
          },
        ],
      };

      const mockCreatedTask = createMockTaskWithRelations({
        id: 'task-new',
        title: 'Task with Resources',
      });

      prismaMock.$transaction.mockImplementation(async (callback: TransactionCallback<unknown>) => {
        return await callback(db);
      });
      prismaMock.task.create.mockResolvedValue(mockCreatedTask);
      prismaMock.taskMachine.createMany.mockResolvedValue({ count: 2 });
      prismaMock.taskOperator.createMany.mockResolvedValue({ count: 1 });
      prismaMock.taskTimeSlot.createMany.mockResolvedValue({ count: 1 });
      prismaMock.task.findUnique.mockResolvedValue(mockCreatedTask);

      await taskService.createTask(db, taskInput);

      expect(prismaMock.taskMachine.createMany).toHaveBeenCalledWith({
        data: [
          { taskId: 'task-new', machineId: 'machine-1' },
          { taskId: 'task-new', machineId: 'machine-2' },
        ],
      });
      expect(prismaMock.taskOperator.createMany).toHaveBeenCalledWith({
        data: [{ taskId: 'task-new', operatorId: 'operator-1' }],
      });
      expect(prismaMock.taskTimeSlot.createMany).toHaveBeenCalledWith({
        data: [
          {
            taskId: 'task-new',
            startDateTime: new Date('2025-10-08T10:00:00Z'),
            endDateTime: new Date('2025-10-08T12:00:00Z'),
            durationMin: 120,
          },
        ],
      });
    });

    it('handles legacy single machine and operator IDs', async () => {
      const taskInput = {
        title: 'Task with Legacy IDs',
        machineId: 'machine-1',
        operatorId: 'operator-1',
      };

      const mockCreatedTask = createMockTaskWithRelations({
        id: 'task-new',
        title: 'Task with Legacy IDs',
      });

      prismaMock.$transaction.mockImplementation(async (callback: TransactionCallback<unknown>) => {
        return await callback(db);
      });
      prismaMock.task.create.mockResolvedValue(mockCreatedTask);
      prismaMock.taskMachine.createMany.mockResolvedValue({ count: 1 });
      prismaMock.taskOperator.createMany.mockResolvedValue({ count: 1 });
      prismaMock.task.findUnique.mockResolvedValue(mockCreatedTask);

      await taskService.createTask(db, taskInput);

      expect(prismaMock.taskMachine.createMany).toHaveBeenCalledWith({
        data: [{ taskId: 'task-new', machineId: 'machine-1' }],
      });
      expect(prismaMock.taskOperator.createMany).toHaveBeenCalledWith({
        data: [{ taskId: 'task-new', operatorId: 'operator-1' }],
      });
    });

    it('throws error for overlapping time slots within same task', async () => {
      const taskInput = {
        title: 'Task with Overlapping Slots',
        timeSlots: [
          {
            startDateTime: '2025-10-08T10:00:00Z',
            endDateTime: '2025-10-08T12:00:00Z',
          },
          {
            startDateTime: '2025-10-08T11:00:00Z',
            endDateTime: '2025-10-08T13:00:00Z',
          },
        ],
      };

      await expect(taskService.createTask(db, taskInput)).rejects.toThrow(ApiError);
      await expect(taskService.createTask(db, taskInput)).rejects.toThrow(
        'Time slots within the same task cannot overlap',
      );
    });

    it('throws error for machine conflicts', async () => {
      // Reset mocks and set up specific conflict mock
      mockCheckSchedulingConflicts.mockReset();
      mockCheckSchedulingConflicts.mockResolvedValue({
        hasConflict: true,
        conflictType: 'machine',
        conflictData: {
          machine: { name: 'CNC Machine' },
          title: 'Other Task',
          timeSlot: {
            startDateTime: new Date('2025-10-08T10:00:00Z'),
            endDateTime: new Date('2025-10-08T12:00:00Z'),
          },
        },
      });

      const taskInput = {
        title: 'Conflicting Task',
        machineIds: ['machine-1'],
        timeSlots: [
          {
            startDateTime: '2025-10-08T10:00:00Z',
            endDateTime: '2025-10-08T12:00:00Z',
          },
        ],
      };

      await expect(taskService.createTask(db, taskInput)).rejects.toThrow(ApiError);
      await expect(taskService.createTask(db, taskInput)).rejects.toThrow(
        'Machine "CNC Machine" is already assigned to task "Other Task"',
      );
    });

    it('throws error for operator conflicts', async () => {
      // Reset mocks and set up specific conflict mock
      mockCheckSchedulingConflicts.mockReset();
      mockCheckSchedulingConflicts.mockResolvedValue({
        hasConflict: true,
        conflictType: 'operator',
        conflictData: {
          operator: { name: 'John Doe' },
          title: 'Other Task',
          timeSlot: {
            startDateTime: new Date('2025-10-08T10:00:00Z'),
            endDateTime: new Date('2025-10-08T12:00:00Z'),
          },
        },
      });

      const taskInput = {
        title: 'Conflicting Task',
        operatorIds: ['operator-1'],
        timeSlots: [
          {
            startDateTime: '2025-10-08T10:00:00Z',
            endDateTime: '2025-10-08T12:00:00Z',
          },
        ],
      };

      await expect(taskService.createTask(db, taskInput)).rejects.toThrow(ApiError);
      await expect(taskService.createTask(db, taskInput)).rejects.toThrow(
        'Operator "John Doe" is already assigned to task "Other Task"',
      );
    });
  });

  describe('getTask', () => {
    it('returns task successfully', async () => {
      const mockTask = createMockTaskWithRelations({ id: 'task-123' });
      prismaMock.task.findUnique.mockResolvedValue(mockTask);

      const result = await taskService.getTask(db, 'task-123');

      expect(result).toBeDefined();
      expect(result.id).toBe('task-123');
      expect(prismaMock.task.findUnique).toHaveBeenCalledWith({
        where: { id: 'task-123' },
        include: {
          item: { include: { project: true } },
          taskMachines: { include: { machine: true } },
          taskOperators: { include: { operator: true } },
          timeSlots: { orderBy: { startDateTime: 'asc' } },
        },
      });
    });

    it('throws error when task not found', async () => {
      prismaMock.task.findUnique.mockResolvedValue(null);

      await expect(taskService.getTask(db, 'missing-task')).rejects.toThrow(ApiError);
      await expect(taskService.getTask(db, 'missing-task')).rejects.toThrow('Task not found');
    });
  });

  describe('updateTask', () => {
    it('updates task successfully', async () => {
      const updateData = {
        title: 'Updated Task',
        description: 'Updated description',
        status: 'IN_PROGRESS',
        quantity: 5,
        completed_quantity: 2,
      };

      const mockUpdatedTask = createMockTaskWithRelations({
        id: 'task-123',
        title: 'Updated Task',
        description: 'Updated description',
        status: 'IN_PROGRESS',
        quantity: 5,
        completed_quantity: 2,
      });

      prismaMock.$transaction.mockImplementation(async (callback: TransactionCallback<unknown>) => {
        return await callback(db);
      });
      prismaMock.taskTimeSlot.deleteMany.mockResolvedValue({ count: 0 });
      prismaMock.taskMachine.deleteMany.mockResolvedValue({ count: 0 });
      prismaMock.taskOperator.deleteMany.mockResolvedValue({ count: 0 });
      prismaMock.task.update.mockResolvedValue(mockUpdatedTask);
      prismaMock.task.findUnique.mockResolvedValue(mockUpdatedTask);

      const result = await taskService.updateTask(db, 'task-123', updateData);

      expect(result?.title).toBe('Updated Task');
      expect(result?.quantity).toBe(5);
      expect(result?.completed_quantity).toBe(2);
      expect(prismaMock.task.update).toHaveBeenCalledWith({
        where: { id: 'task-123' },
        data: {
          title: 'Updated Task',
          description: 'Updated description',
          status: 'IN_PROGRESS',
          quantity: 5,
          completed_quantity: 2,
        },
      });
    });

    it('throws error when completed quantity exceeds total quantity', async () => {
      const updateData = {
        title: 'Updated Task',
        quantity: 5,
        completed_quantity: 10,
      };

      await expect(taskService.updateTask(db, 'task-123', updateData)).rejects.toThrow(ApiError);
      await expect(taskService.updateTask(db, 'task-123', updateData)).rejects.toThrow(
        'Completed quantity cannot exceed total quantity',
      );
    });

    it('updates task with new machines and operators', async () => {
      const updateData = {
        title: 'Updated Task',
        machineIds: ['machine-2', 'machine-3'],
        operatorIds: ['operator-2'],
        timeSlots: [
          {
            startDateTime: '2025-10-09T10:00:00Z',
            endDateTime: '2025-10-09T12:00:00Z',
          },
        ],
      };

      const mockUpdatedTask = createMockTaskWithRelations({
        id: 'task-123',
        title: 'Updated Task',
      });

      prismaMock.$transaction.mockImplementation(async (callback: TransactionCallback<unknown>) => {
        return await callback(db);
      });
      prismaMock.taskTimeSlot.deleteMany.mockResolvedValue({ count: 0 });
      prismaMock.taskMachine.deleteMany.mockResolvedValue({ count: 0 });
      prismaMock.taskOperator.deleteMany.mockResolvedValue({ count: 0 });
      prismaMock.task.update.mockResolvedValue(mockUpdatedTask);
      prismaMock.taskMachine.createMany.mockResolvedValue({ count: 2 });
      prismaMock.taskOperator.createMany.mockResolvedValue({ count: 1 });
      prismaMock.taskTimeSlot.createMany.mockResolvedValue({ count: 1 });
      prismaMock.task.findUnique.mockResolvedValue(mockUpdatedTask);

      await taskService.updateTask(db, 'task-123', updateData);

      expect(prismaMock.taskMachine.deleteMany).toHaveBeenCalledWith({ where: { taskId: 'task-123' } });
      expect(prismaMock.taskOperator.deleteMany).toHaveBeenCalledWith({ where: { taskId: 'task-123' } });
      expect(prismaMock.taskTimeSlot.deleteMany).toHaveBeenCalledWith({ where: { taskId: 'task-123' } });
      expect(prismaMock.taskMachine.createMany).toHaveBeenCalledWith({
        data: [
          { taskId: 'task-123', machineId: 'machine-2' },
          { taskId: 'task-123', machineId: 'machine-3' },
        ],
      });
      expect(prismaMock.taskOperator.createMany).toHaveBeenCalledWith({
        data: [{ taskId: 'task-123', operatorId: 'operator-2' }],
      });
    });

    it('throws error for overlapping time slots during update', async () => {
      const updateData = {
        title: 'Updated Task',
        timeSlots: [
          {
            startDateTime: '2025-10-08T10:00:00Z',
            endDateTime: '2025-10-08T12:00:00Z',
          },
          {
            startDateTime: '2025-10-08T11:00:00Z',
            endDateTime: '2025-10-08T13:00:00Z',
          },
        ],
      };

      await expect(taskService.updateTask(db, 'task-123', updateData)).rejects.toThrow(ApiError);
      await expect(taskService.updateTask(db, 'task-123', updateData)).rejects.toThrow(
        'Time slots within the same task cannot overlap',
      );
    });
  });

  describe('patchTask', () => {
    it('patches task status successfully', async () => {
      const patchData = {
        status: 'COMPLETED',
      };

      const mockExistingTask = createMockTaskWithRelations({
        id: 'task-123',
        status: 'IN_PROGRESS',
        timeSlots: [],
        taskMachines: [],
        taskOperators: [],
      });

      const mockPatchedTask = createMockTaskWithRelations({
        id: 'task-123',
        status: 'COMPLETED',
      });

      prismaMock.task.findUnique.mockResolvedValueOnce(mockExistingTask);
      prismaMock.$transaction.mockImplementation(async (callback: TransactionCallback<unknown>) => {
        return await callback(db);
      });
      prismaMock.task.update.mockResolvedValue(mockPatchedTask);
      prismaMock.task.findUnique.mockResolvedValueOnce(mockPatchedTask);

      const result = await taskService.patchTask(db, 'task-123', patchData);

      expect(result.status).toBe('COMPLETED');
      expect(prismaMock.task.update).toHaveBeenCalledWith({
        where: { id: 'task-123' },
        data: { status: 'COMPLETED' },
      });
    });

    it('patches completed quantity successfully', async () => {
      const patchData = {
        completed_quantity: 5,
      };

      const mockExistingTask = createMockTaskWithRelations({
        id: 'task-123',
        timeSlots: [],
        taskMachines: [],
        taskOperators: [],
      });

      const mockPatchedTask = createMockTaskWithRelations({
        id: 'task-123',
        completed_quantity: 5,
      });

      prismaMock.task.findUnique.mockResolvedValueOnce(mockExistingTask);
      prismaMock.$transaction.mockImplementation(async (callback: TransactionCallback<unknown>) => {
        return await callback(db);
      });
      prismaMock.task.update.mockResolvedValue(mockPatchedTask);
      prismaMock.task.findUnique.mockResolvedValueOnce(mockPatchedTask);

      const result = await taskService.patchTask(db, 'task-123', patchData);

      expect(result.completed_quantity).toBe(5);
      expect(prismaMock.task.update).toHaveBeenCalledWith({
        where: { id: 'task-123' },
        data: { completed_quantity: 5 },
      });
    });

    it('throws error when task not found', async () => {
      prismaMock.task.findUnique.mockResolvedValue(null);

      await expect(taskService.patchTask(db, 'missing-task', { status: 'COMPLETED' })).rejects.toThrow(ApiError);
      await expect(taskService.patchTask(db, 'missing-task', { status: 'COMPLETED' })).rejects.toThrow(
        'Task not found',
      );
    });

    it('checks for conflicts when updating operators with existing time slots', async () => {
      const patchData = {
        operatorIds: ['operator-new'],
      };

      const mockExistingTask = createMockTaskWithRelations({
        id: 'task-123',
        timeSlots: [
          {
            id: 'slot-1',
            startDateTime: new Date('2025-10-08T10:00:00Z'),
            endDateTime: new Date('2025-10-08T12:00:00Z'),
            durationMin: 120,
          },
        ],
        taskMachines: [],
        taskOperators: [],
      });

      const mockPatchedTask = createMockTaskWithRelations({
        id: 'task-123',
        taskOperators: [{ operatorId: 'operator-new' }],
      });

      prismaMock.task.findUnique.mockResolvedValueOnce(mockExistingTask);
      prismaMock.$transaction.mockImplementation(async (callback: TransactionCallback<unknown>) => {
        return await callback(db);
      });
      prismaMock.taskOperator.deleteMany.mockResolvedValue({ count: 0 });
      prismaMock.taskOperator.createMany.mockResolvedValue({ count: 1 });
      prismaMock.task.update.mockResolvedValue(mockPatchedTask);
      prismaMock.task.findUnique.mockResolvedValueOnce(mockPatchedTask);

      await taskService.patchTask(db, 'task-123', patchData);

      expect(mockCheckSchedulingConflicts).toHaveBeenCalledWith({
        scheduledAt: '2025-10-08T10:00:00.000Z',
        durationMin: 120,
        machineIds: [],
        operatorIds: ['operator-new'],
        excludeTaskId: 'task-123',
      });
    });

    it('updates machine and operator associations for patch', async () => {
      const patchData = {
        machineIds: ['machine-new'],
        operatorIds: ['operator-new'],
      };

      const mockExistingTask = createMockTaskWithRelations({
        id: 'task-123',
        timeSlots: [],
        taskMachines: [],
        taskOperators: [],
      });

      const mockPatchedTask = createMockTaskWithRelations({
        id: 'task-123',
      });

      prismaMock.task.findUnique.mockResolvedValueOnce(mockExistingTask);
      prismaMock.$transaction.mockImplementation(async (callback: TransactionCallback<unknown>) => {
        return await callback(db);
      });
      prismaMock.taskMachine.deleteMany.mockResolvedValue({ count: 0 });
      prismaMock.taskOperator.deleteMany.mockResolvedValue({ count: 0 });
      prismaMock.taskMachine.createMany.mockResolvedValue({ count: 1 });
      prismaMock.taskOperator.createMany.mockResolvedValue({ count: 1 });
      prismaMock.task.update.mockResolvedValue(mockPatchedTask);
      prismaMock.task.findUnique.mockResolvedValueOnce(mockPatchedTask);

      await taskService.patchTask(db, 'task-123', patchData);

      expect(prismaMock.taskMachine.deleteMany).toHaveBeenCalledWith({ where: { taskId: 'task-123' } });
      expect(prismaMock.taskOperator.deleteMany).toHaveBeenCalledWith({ where: { taskId: 'task-123' } });
      expect(prismaMock.taskMachine.createMany).toHaveBeenCalledWith({
        data: [{ taskId: 'task-123', machineId: 'machine-new' }],
      });
      expect(prismaMock.taskOperator.createMany).toHaveBeenCalledWith({
        data: [{ taskId: 'task-123', operatorId: 'operator-new' }],
      });
    });

    it('handles legacy single IDs in patch', async () => {
      const patchData = {
        machineId: 'machine-single',
        operatorId: 'operator-single',
      };

      const mockExistingTask = createMockTaskWithRelations({
        id: 'task-123',
        timeSlots: [],
        taskMachines: [],
        taskOperators: [],
      });

      const mockPatchedTask = createMockTaskWithRelations({
        id: 'task-123',
      });

      prismaMock.task.findUnique.mockResolvedValueOnce(mockExistingTask);
      prismaMock.$transaction.mockImplementation(async (callback: TransactionCallback<unknown>) => {
        return await callback(db);
      });
      prismaMock.taskMachine.deleteMany.mockResolvedValue({ count: 0 });
      prismaMock.taskOperator.deleteMany.mockResolvedValue({ count: 0 });
      prismaMock.taskMachine.createMany.mockResolvedValue({ count: 1 });
      prismaMock.taskOperator.createMany.mockResolvedValue({ count: 1 });
      prismaMock.task.update.mockResolvedValue(mockPatchedTask);
      prismaMock.task.findUnique.mockResolvedValueOnce(mockPatchedTask);

      await taskService.patchTask(db, 'task-123', patchData);

      expect(prismaMock.taskMachine.createMany).toHaveBeenCalledWith({
        data: [{ taskId: 'task-123', machineId: 'machine-single' }],
      });
      expect(prismaMock.taskOperator.createMany).toHaveBeenCalledWith({
        data: [{ taskId: 'task-123', operatorId: 'operator-single' }],
      });
    });
  });

  describe('deleteTask', () => {
    it('deletes task successfully', async () => {
      prismaMock.task.delete.mockResolvedValue(createMockTaskData({ id: 'task-123' }));

      await taskService.deleteTask(db, 'task-123');

      expect(prismaMock.task.delete).toHaveBeenCalledWith({
        where: { id: 'task-123' },
      });
    });

    it('lets Prisma handle task not found during delete', async () => {
      const prismaError = new Error('Record to delete does not exist');
      prismaMock.task.delete.mockRejectedValue(prismaError);

      await expect(taskService.deleteTask(db, 'missing-task')).rejects.toThrow('Record to delete does not exist');
    });
  });
});
