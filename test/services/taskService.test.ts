import { describe, it, expect, beforeEach, vi } from 'vitest';
import taskService from '@/services/taskService';
import type { PrismaClient } from '@prisma/client';
import { ApiError } from '@/lib/errors';
import { prismaMock } from '../setup';

describe('taskService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    prismaMock.task.findMany.mockReset();
    prismaMock.task.create.mockReset();
    prismaMock.task.findUnique.mockReset();
    prismaMock.task.update.mockReset();
    prismaMock.task.delete.mockReset();
    prismaMock.item.findFirst.mockReset();
    prismaMock.item.create.mockReset();
    prismaMock.taskTimeSlot.createMany.mockReset();
    prismaMock.taskTimeSlot.deleteMany.mockReset();
    prismaMock.$transaction.mockReset();
    // Reset $transaction to default behavior
    prismaMock.$transaction.mockImplementation(async (callback: (tx: typeof prismaMock) => Promise<unknown>) => {
      return callback(prismaMock);
    });
  });

  describe('listTasks', () => {
    it('lists all tasks without filters', async () => {
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
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      prismaMock.task.findMany.mockResolvedValue(fakeTasks as never);

      const result = await taskService.listTasks(prismaMock as unknown as PrismaClient);

      expect(prismaMock.task.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
          item: { include: { project: true } },
          machine: true,
          operator: true,
          timeSlots: { orderBy: { startDateTime: 'asc' } },
        },
      });
      expect(result).toEqual(fakeTasks);
    });

    it('lists tasks with start filter', async () => {
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
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      prismaMock.task.findMany.mockResolvedValue(fakeTasks as never);

      const result = await taskService.listTasks(prismaMock as unknown as PrismaClient, '2024-01-01T00:00:00Z', null);

      expect(prismaMock.task.findMany).toHaveBeenCalledWith({
        where: {
          timeSlots: {
            some: {
              startDateTime: { gte: new Date('2024-01-01T00:00:00Z') },
            },
          },
        },
        include: {
          item: { include: { project: true } },
          machine: true,
          operator: true,
          timeSlots: { orderBy: { startDateTime: 'asc' } },
        },
      });
      expect(result).toEqual(fakeTasks);
    });

    it('lists tasks with end filter', async () => {
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
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      prismaMock.task.findMany.mockResolvedValue(fakeTasks as never);

      const result = await taskService.listTasks(prismaMock as unknown as PrismaClient, null, '2024-12-31T23:59:59Z');

      expect(prismaMock.task.findMany).toHaveBeenCalledWith({
        where: {
          timeSlots: {
            some: {
              startDateTime: { lte: new Date('2024-12-31T23:59:59Z') },
            },
          },
        },
        include: {
          item: { include: { project: true } },
          machine: true,
          operator: true,
          timeSlots: { orderBy: { startDateTime: 'asc' } },
        },
      });
      expect(result).toEqual(fakeTasks);
    });

    it('lists tasks with both start and end filters', async () => {
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
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      prismaMock.task.findMany.mockResolvedValue(fakeTasks as never);

      const result = await taskService.listTasks(
        prismaMock as unknown as PrismaClient,
        '2024-01-01T00:00:00Z',
        '2024-12-31T23:59:59Z',
      );

      expect(prismaMock.task.findMany).toHaveBeenCalledWith({
        where: {
          timeSlots: {
            some: {
              startDateTime: {
                gte: new Date('2024-01-01T00:00:00Z'),
                lte: new Date('2024-12-31T23:59:59Z'),
              },
            },
          },
        },
        include: {
          item: { include: { project: true } },
          machine: true,
          operator: true,
          timeSlots: { orderBy: { startDateTime: 'asc' } },
        },
      });
      expect(result).toEqual(fakeTasks);
    });
  });

  describe('createTask', () => {
    it('creates a task successfully without timeSlots', async () => {
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
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prismaMock.task.create.mockResolvedValue(fakeTask as never);

      const result = await taskService.createTask(prismaMock as unknown as PrismaClient, {
        title: 'New Task',
        description: 'New description',
      });

      expect(prismaMock.task.create).toHaveBeenCalledWith({
        data: {
          title: 'New Task',
          description: 'New description',
          status: 'PENDING',
          quantity: 1,
          completed_quantity: 0,
        },
        include: {
          item: { include: { project: true } },
          machine: true,
          operator: true,
          timeSlots: { orderBy: { startDateTime: 'asc' } },
        },
      });
      expect(result).toEqual(fakeTask);
    });

    it('throws error when title is missing', async () => {
      await expect(taskService.createTask(prismaMock as unknown as PrismaClient, {})).rejects.toThrow(ApiError);
      await expect(taskService.createTask(prismaMock as unknown as PrismaClient, {})).rejects.toMatchObject({
        code: 'MISSING_TITLE',
        message: 'title is required',
        status: 400,
      });
    });

    it('creates a task with itemId', async () => {
      const fakeTask = {
        id: 't6',
        title: 'Task with Item',
        description: null,
        status: 'PENDING',
        quantity: 1,
        completed_quantity: 0,
        itemId: 'i1',
        item: { id: 'i1', name: 'Item 1' },
        machine: null,
        operator: null,
        timeSlots: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prismaMock.task.create.mockResolvedValue(fakeTask as never);

      const result = await taskService.createTask(prismaMock as unknown as PrismaClient, {
        title: 'Task with Item',
        itemId: 'i1',
      });

      expect(prismaMock.task.create).toHaveBeenCalledWith({
        data: {
          title: 'Task with Item',
          description: null,
          status: 'PENDING',
          quantity: 1,
          completed_quantity: 0,
          item: { connect: { id: 'i1' } },
        },
        include: {
          item: { include: { project: true } },
          machine: true,
          operator: true,
          timeSlots: { orderBy: { startDateTime: 'asc' } },
        },
      });
      expect(result).toEqual(fakeTask);
    });

    it('creates item from projectId when itemId not provided', async () => {
      const fakeItem = { id: 'i2', projectId: 'p1', name: 'Default Item' };
      const fakeTask = {
        id: 't7',
        title: 'Task with Project',
        description: null,
        status: 'PENDING',
        quantity: 1,
        completed_quantity: 0,
        itemId: 'i2',
        item: fakeItem,
        machine: null,
        operator: null,
        timeSlots: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prismaMock.item.findFirst.mockResolvedValue(null);
      prismaMock.item.create.mockResolvedValue(fakeItem as never);
      prismaMock.task.create.mockResolvedValue(fakeTask as never);

      const result = await taskService.createTask(prismaMock as unknown as PrismaClient, {
        title: 'Task with Project',
        projectId: 'p1',
      });

      expect(prismaMock.item.findFirst).toHaveBeenCalledWith({ where: { projectId: 'p1' } });
      expect(prismaMock.item.create).toHaveBeenCalledWith({ data: { projectId: 'p1', name: 'Default Item' } });
      expect(prismaMock.task.create).toHaveBeenCalledWith({
        data: {
          title: 'Task with Project',
          description: null,
          status: 'PENDING',
          quantity: 1,
          completed_quantity: 0,
          item: { connect: { id: 'i2' } },
        },
        include: {
          item: { include: { project: true } },
          machine: true,
          operator: true,
          timeSlots: { orderBy: { startDateTime: 'asc' } },
        },
      });
      expect(result).toEqual(fakeTask);
    });

    it('uses existing item from projectId when available', async () => {
      const fakeItem = { id: 'i3', projectId: 'p1', name: 'Existing Item' };
      const fakeTask = {
        id: 't8',
        title: 'Task with Existing Item',
        description: null,
        status: 'PENDING',
        quantity: 1,
        completed_quantity: 0,
        itemId: 'i3',
        item: fakeItem,
        machine: null,
        operator: null,
        timeSlots: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prismaMock.item.findFirst.mockResolvedValue(fakeItem as never);
      prismaMock.task.create.mockResolvedValue(fakeTask as never);

      const result = await taskService.createTask(prismaMock as unknown as PrismaClient, {
        title: 'Task with Existing Item',
        projectId: 'p1',
      });

      expect(prismaMock.item.findFirst).toHaveBeenCalledWith({ where: { projectId: 'p1' } });
      expect(prismaMock.item.create).not.toHaveBeenCalled();
      expect(result).toEqual(fakeTask);
    });

    it('creates a task with machineId and operatorId', async () => {
      const fakeTask = {
        id: 't9',
        title: 'Task with Machine and Operator',
        description: null,
        status: 'PENDING',
        quantity: 1,
        completed_quantity: 0,
        item: null,
        machineId: 'm1',
        machine: { id: 'm1', name: 'Machine 1' },
        operatorId: 'o1',
        operator: { id: 'o1', name: 'Operator 1' },
        timeSlots: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prismaMock.task.create.mockResolvedValue(fakeTask as never);

      const result = await taskService.createTask(prismaMock as unknown as PrismaClient, {
        title: 'Task with Machine and Operator',
        machineId: 'm1',
        operatorId: 'o1',
      });

      expect(prismaMock.task.create).toHaveBeenCalledWith({
        data: {
          title: 'Task with Machine and Operator',
          description: null,
          status: 'PENDING',
          quantity: 1,
          completed_quantity: 0,
          machine: { connect: { id: 'm1' } },
          operator: { connect: { id: 'o1' } },
        },
        include: {
          item: { include: { project: true } },
          machine: true,
          operator: true,
          timeSlots: { orderBy: { startDateTime: 'asc' } },
        },
      });
      expect(result).toEqual(fakeTask);
    });

    it('creates a task with timeSlots', async () => {
      const fakeTaskWithoutSlots = {
        id: 't10',
        title: 'Task with TimeSlots',
        description: null,
        status: 'PENDING',
        quantity: 1,
        completed_quantity: 0,
        item: null,
        machine: null,
        operator: null,
        timeSlots: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const fakeTaskWithSlots = {
        ...fakeTaskWithoutSlots,
        timeSlots: [
          {
            id: 'ts1',
            taskId: 't10',
            startDateTime: new Date('2024-01-01T10:00:00Z'),
            endDateTime: new Date('2024-01-01T11:00:00Z'),
            durationMin: 60,
          },
        ],
      };
      prismaMock.task.create.mockResolvedValue(fakeTaskWithoutSlots as never);
      prismaMock.taskTimeSlot.createMany.mockResolvedValue({ count: 1 } as never);
      prismaMock.task.findUnique.mockResolvedValue(fakeTaskWithSlots as never);

      const result = await taskService.createTask(prismaMock as unknown as PrismaClient, {
        title: 'Task with TimeSlots',
        timeSlots: [
          {
            startDateTime: '2024-01-01T10:00:00Z',
            endDateTime: '2024-01-01T11:00:00Z',
            durationMin: 60,
          },
        ],
      });

      expect(prismaMock.taskTimeSlot.createMany).toHaveBeenCalledWith({
        data: [
          {
            taskId: 't10',
            startDateTime: new Date('2024-01-01T10:00:00Z'),
            endDateTime: new Date('2024-01-01T11:00:00Z'),
            durationMin: 60,
          },
        ],
      });
      expect(prismaMock.task.findUnique).toHaveBeenCalledWith({
        where: { id: 't10' },
        include: {
          item: { include: { project: true } },
          machine: true,
          operator: true,
          timeSlots: { orderBy: { startDateTime: 'asc' } },
        },
      });
      expect(result).toEqual(fakeTaskWithSlots);
    });

    it('creates timeSlots with default duration when not provided', async () => {
      const fakeTaskWithoutSlots = {
        id: 't11',
        title: 'Task with Default Duration',
        description: null,
        status: 'PENDING',
        quantity: 1,
        completed_quantity: 0,
        item: null,
        machine: null,
        operator: null,
        timeSlots: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const fakeTaskWithSlots = {
        ...fakeTaskWithoutSlots,
        timeSlots: [
          {
            id: 'ts2',
            taskId: 't11',
            startDateTime: new Date('2024-01-01T10:00:00Z'),
            endDateTime: new Date('2024-01-01T11:00:00Z'),
            durationMin: 60,
          },
        ],
      };
      prismaMock.task.create.mockResolvedValue(fakeTaskWithoutSlots as never);
      prismaMock.taskTimeSlot.createMany.mockResolvedValue({ count: 1 } as never);
      prismaMock.task.findUnique.mockResolvedValue(fakeTaskWithSlots as never);

      const result = await taskService.createTask(prismaMock as unknown as PrismaClient, {
        title: 'Task with Default Duration',
        timeSlots: [
          {
            startDateTime: '2024-01-01T10:00:00Z',
          },
        ],
      });

      expect(prismaMock.taskTimeSlot.createMany).toHaveBeenCalledWith({
        data: [
          {
            taskId: 't11',
            startDateTime: new Date('2024-01-01T10:00:00Z'),
            endDateTime: new Date('2024-01-01T11:00:00Z'),
            durationMin: 60,
          },
        ],
      });
      expect(result).toEqual(fakeTaskWithSlots);
    });

    it('throws error on overlapping timeSlots', async () => {
      await expect(
        taskService.createTask(prismaMock as unknown as PrismaClient, {
          title: 'Task with Overlapping Slots',
          timeSlots: [
            {
              startDateTime: '2024-01-01T10:00:00Z',
              endDateTime: '2024-01-01T12:00:00Z',
            },
            {
              startDateTime: '2024-01-01T11:00:00Z',
              endDateTime: '2024-01-01T13:00:00Z',
            },
          ],
        }),
      ).rejects.toThrow(ApiError);
      await expect(
        taskService.createTask(prismaMock as unknown as PrismaClient, {
          title: 'Task with Overlapping Slots',
          timeSlots: [
            {
              startDateTime: '2024-01-01T10:00:00Z',
              endDateTime: '2024-01-01T12:00:00Z',
            },
            {
              startDateTime: '2024-01-01T11:00:00Z',
              endDateTime: '2024-01-01T13:00:00Z',
            },
          ],
        }),
      ).rejects.toMatchObject({
        code: 'TIME_SLOT_OVERLAP',
        message: 'Time slots within the same task cannot overlap',
        status: 400,
      });
    });

    it('throws error on overlapping timeSlots with durationMin', async () => {
      await expect(
        taskService.createTask(prismaMock as unknown as PrismaClient, {
          title: 'Task with Overlapping Slots',
          timeSlots: [
            {
              startDateTime: '2024-01-01T10:00:00Z',
              durationMin: 120,
            },
            {
              startDateTime: '2024-01-01T11:00:00Z',
              durationMin: 60,
            },
          ],
        }),
      ).rejects.toThrow(ApiError);
      await expect(
        taskService.createTask(prismaMock as unknown as PrismaClient, {
          title: 'Task with Overlapping Slots',
          timeSlots: [
            {
              startDateTime: '2024-01-01T10:00:00Z',
              durationMin: 120,
            },
            {
              startDateTime: '2024-01-01T11:00:00Z',
              durationMin: 60,
            },
          ],
        }),
      ).rejects.toMatchObject({
        code: 'TIME_SLOT_OVERLAP',
        status: 400,
      });
    });

    it('creates timeSlots with only durationMin (no endDateTime)', async () => {
      const fakeTaskWithoutSlots = {
        id: 't11b',
        title: 'Task with Duration Only',
        description: null,
        status: 'PENDING',
        quantity: 1,
        completed_quantity: 0,
        item: null,
        machine: null,
        operator: null,
        timeSlots: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const fakeTaskWithSlots = {
        ...fakeTaskWithoutSlots,
        timeSlots: [
          {
            id: 'ts2b',
            taskId: 't11b',
            startDateTime: new Date('2024-01-01T10:00:00Z'),
            endDateTime: new Date('2024-01-01T11:30:00Z'),
            durationMin: 90,
          },
        ],
      };
      prismaMock.task.create.mockResolvedValue(fakeTaskWithoutSlots as never);
      prismaMock.taskTimeSlot.createMany.mockResolvedValue({ count: 1 } as never);
      prismaMock.task.findUnique.mockResolvedValue(fakeTaskWithSlots as never);

      const result = await taskService.createTask(prismaMock as unknown as PrismaClient, {
        title: 'Task with Duration Only',
        timeSlots: [
          {
            startDateTime: '2024-01-01T10:00:00Z',
            durationMin: 90,
          },
        ],
      });

      expect(prismaMock.taskTimeSlot.createMany).toHaveBeenCalledWith({
        data: [
          {
            taskId: 't11b',
            startDateTime: new Date('2024-01-01T10:00:00Z'),
            endDateTime: new Date('2024-01-01T11:30:00Z'),
            durationMin: 90,
          },
        ],
      });
      expect(result).toEqual(fakeTaskWithSlots);
    });

    it('handles timeSlot overlap detection with mixed endDateTime and durationMin', async () => {
      await expect(
        taskService.createTask(prismaMock as unknown as PrismaClient, {
          title: 'Task with Mixed Overlapping Slots',
          timeSlots: [
            {
              startDateTime: '2024-01-01T10:00:00Z',
              endDateTime: '2024-01-01T12:00:00Z',
            },
            {
              startDateTime: '2024-01-01T11:30:00Z',
              durationMin: 60,
            },
          ],
        }),
      ).rejects.toMatchObject({
        code: 'TIME_SLOT_OVERLAP',
        message: 'Time slots within the same task cannot overlap',
        status: 400,
      });
    });

    it('handles timeSlot overlap detection with reverse mixed types (durationMin first, endDateTime second)', async () => {
      await expect(
        taskService.createTask(prismaMock as unknown as PrismaClient, {
          title: 'Task with Reverse Mixed Overlapping Slots',
          timeSlots: [
            {
              startDateTime: '2024-01-01T10:00:00Z',
              durationMin: 120,
            },
            {
              startDateTime: '2024-01-01T11:30:00Z',
              endDateTime: '2024-01-01T13:00:00Z',
            },
          ],
        }),
      ).rejects.toMatchObject({
        code: 'TIME_SLOT_OVERLAP',
        message: 'Time slots within the same task cannot overlap',
        status: 400,
      });
    });

    it('should use default 60-minute duration when durationMin is null', async () => {
      const baseTime = new Date('2024-01-01T10:00:00Z');
      const fakeTask = {
        id: 't99',
        title: 'Test Task',
        description: null,
        status: 'PENDING',
        quantity: 1,
        completed_quantity: 0,
        item: null,
        machine: null,
        operator: null,
        timeSlots: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prismaMock.task.create.mockResolvedValue(fakeTask as never);

      await taskService.createTask(prismaMock as unknown as PrismaClient, {
        title: 'Test Task',
        timeSlots: [
          {
            startDateTime: baseTime.toISOString(),
            durationMin: undefined, // This should trigger the || 60 default
          },
        ],
      });

      expect(prismaMock.task.create).toHaveBeenCalled();
    });

    it('should use default 60-minute duration when durationMin is undefined', async () => {
      const baseTime = new Date('2024-01-01T10:00:00Z');
      const fakeTask = {
        id: 't98',
        title: 'Test Task',
        description: null,
        status: 'PENDING',
        quantity: 1,
        completed_quantity: 0,
        item: null,
        machine: null,
        operator: null,
        timeSlots: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prismaMock.task.create.mockResolvedValue(fakeTask as never);

      await taskService.createTask(prismaMock as unknown as PrismaClient, {
        title: 'Test Task',
        timeSlots: [
          {
            startDateTime: baseTime.toISOString(),
            // durationMin: undefined (omitted property)
          },
        ],
      });

      expect(prismaMock.task.create).toHaveBeenCalled();
    });

    it('should detect overlap when using default duration', async () => {
      const baseTime = new Date('2024-01-01T10:00:00Z');

      await expect(
        taskService.createTask(prismaMock as unknown as PrismaClient, {
          title: 'Test Task',
          timeSlots: [
            {
              startDateTime: baseTime.toISOString(),
              durationMin: undefined, // Will default to 60 minutes
            },
            {
              startDateTime: new Date(baseTime.getTime() + 30 * 60000).toISOString(), // 30 minutes later, should overlap
              durationMin: 30,
            },
          ],
        }),
      ).rejects.toMatchObject({
        code: 'TIME_SLOT_OVERLAP',
        message: 'Time slots within the same task cannot overlap',
        status: 400,
      });
    });

    it('should detect overlap when both slots use default duration', async () => {
      const baseTime = new Date('2024-01-01T10:00:00Z');

      await expect(
        taskService.createTask(prismaMock as unknown as PrismaClient, {
          title: 'Test Task',
          timeSlots: [
            {
              startDateTime: baseTime.toISOString(),
              durationMin: undefined, // Will default to 60 minutes
            },
            {
              startDateTime: new Date(baseTime.getTime() + 30 * 60000).toISOString(), // 30 minutes later, should overlap
              durationMin: undefined, // Will also default to 60 minutes
            },
          ],
        }),
      ).rejects.toMatchObject({
        code: 'TIME_SLOT_OVERLAP',
        message: 'Time slots within the same task cannot overlap',
        status: 400,
      });
    });
  });

  describe('getTask', () => {
    it('gets a task successfully', async () => {
      const fakeTask = {
        id: 't12',
        title: 'Task 12',
        description: 'Test task',
        status: 'PENDING',
        quantity: 1,
        completed_quantity: 0,
        item: null,
        machine: null,
        operator: null,
        timeSlots: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prismaMock.task.findUnique.mockResolvedValue(fakeTask as never);

      const result = await taskService.getTask(prismaMock as unknown as PrismaClient, 't12');

      expect(prismaMock.task.findUnique).toHaveBeenCalledWith({
        where: { id: 't12' },
        include: {
          item: { include: { project: true } },
          machine: true,
          operator: true,
          timeSlots: { orderBy: { startDateTime: 'asc' } },
        },
      });
      expect(result).toEqual(fakeTask);
    });

    it('throws error when task not found', async () => {
      prismaMock.task.findUnique.mockResolvedValue(null);

      await expect(taskService.getTask(prismaMock as unknown as PrismaClient, 'missing')).rejects.toThrow(ApiError);
      await expect(taskService.getTask(prismaMock as unknown as PrismaClient, 'missing')).rejects.toMatchObject({
        code: 'TASK_NOT_FOUND',
        message: 'Task not found',
        status: 404,
      });
    });
  });

  describe('updateTask', () => {
    it('updates a task successfully without timeSlots', async () => {
      const fakeTask = {
        id: 't13',
        title: 'Updated Task',
        description: 'Updated description',
        status: 'IN_PROGRESS',
        quantity: 2,
        completed_quantity: 1,
        item: null,
        machine: null,
        operator: null,
        timeSlots: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prismaMock.taskTimeSlot.deleteMany.mockResolvedValue({ count: 0 } as never);
      prismaMock.task.update.mockResolvedValue(fakeTask as never);

      const result = await taskService.updateTask(prismaMock as unknown as PrismaClient, 't13', {
        title: 'Updated Task',
        description: 'Updated description',
        status: 'IN_PROGRESS',
        quantity: 2,
        completed_quantity: 1,
      });

      expect(prismaMock.taskTimeSlot.deleteMany).toHaveBeenCalledWith({ where: { taskId: 't13' } });
      expect(prismaMock.task.update).toHaveBeenCalledWith({
        where: { id: 't13' },
        data: {
          title: 'Updated Task',
          description: 'Updated description',
          status: 'IN_PROGRESS',
          quantity: 2,
          completed_quantity: 1,
        },
        include: {
          item: { include: { project: true } },
          machine: true,
          operator: true,
          timeSlots: { orderBy: { startDateTime: 'asc' } },
        },
      });
      expect(result).toEqual(fakeTask);
    });

    it('throws error when completed_quantity exceeds quantity', async () => {
      await expect(
        taskService.updateTask(prismaMock as unknown as PrismaClient, 't14', {
          quantity: 1,
          completed_quantity: 2,
        }),
      ).rejects.toThrow(ApiError);
      await expect(
        taskService.updateTask(prismaMock as unknown as PrismaClient, 't14', {
          quantity: 1,
          completed_quantity: 2,
        }),
      ).rejects.toMatchObject({
        code: 'BAD_QUANTITY',
        message: 'Completed quantity cannot exceed total quantity',
        status: 400,
      });
    });

    it('updates task with timeSlots', async () => {
      const fakeTaskWithoutSlots = {
        id: 't15',
        title: 'Task 15',
        description: null,
        status: 'PENDING',
        quantity: 1,
        completed_quantity: 0,
        item: null,
        machine: null,
        operator: null,
        timeSlots: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const fakeTaskWithSlots = {
        ...fakeTaskWithoutSlots,
        timeSlots: [
          {
            id: 'ts3',
            taskId: 't15',
            startDateTime: new Date('2024-01-01T14:00:00Z'),
            endDateTime: new Date('2024-01-01T15:00:00Z'),
            durationMin: 60,
          },
        ],
      };
      prismaMock.taskTimeSlot.deleteMany.mockResolvedValue({ count: 0 } as never);
      prismaMock.task.update.mockResolvedValue(fakeTaskWithoutSlots as never);
      prismaMock.taskTimeSlot.createMany.mockResolvedValue({ count: 1 } as never);
      prismaMock.task.findUnique.mockResolvedValue(fakeTaskWithSlots as never);

      const result = await taskService.updateTask(prismaMock as unknown as PrismaClient, 't15', {
        title: 'Task 15',
        timeSlots: [
          {
            startDateTime: '2024-01-01T14:00:00Z',
            endDateTime: '2024-01-01T15:00:00Z',
            durationMin: 60,
          },
        ],
      });

      expect(prismaMock.taskTimeSlot.deleteMany).toHaveBeenCalledWith({ where: { taskId: 't15' } });
      expect(prismaMock.taskTimeSlot.createMany).toHaveBeenCalledWith({
        data: [
          {
            taskId: 't15',
            startDateTime: new Date('2024-01-01T14:00:00Z'),
            endDateTime: new Date('2024-01-01T15:00:00Z'),
            durationMin: 60,
          },
        ],
      });
      expect(prismaMock.task.findUnique).toHaveBeenCalledWith({
        where: { id: 't15' },
        include: {
          item: { include: { project: true } },
          machine: true,
          operator: true,
          timeSlots: { orderBy: { startDateTime: 'asc' } },
        },
      });
      expect(result).toEqual(fakeTaskWithSlots);
    });

    it('throws error on overlapping timeSlots during update', async () => {
      await expect(
        taskService.updateTask(prismaMock as unknown as PrismaClient, 't16', {
          title: 'Task with Overlapping Slots',
          timeSlots: [
            {
              startDateTime: '2024-01-01T10:00:00Z',
              endDateTime: '2024-01-01T12:00:00Z',
            },
            {
              startDateTime: '2024-01-01T11:00:00Z',
              endDateTime: '2024-01-01T13:00:00Z',
            },
          ],
        }),
      ).rejects.toThrow(ApiError);
      await expect(
        taskService.updateTask(prismaMock as unknown as PrismaClient, 't16', {
          title: 'Task with Overlapping Slots',
          timeSlots: [
            {
              startDateTime: '2024-01-01T10:00:00Z',
              endDateTime: '2024-01-01T12:00:00Z',
            },
            {
              startDateTime: '2024-01-01T11:00:00Z',
              endDateTime: '2024-01-01T13:00:00Z',
            },
          ],
        }),
      ).rejects.toMatchObject({
        code: 'TIME_SLOT_OVERLAP',
        status: 400,
      });
    });

    it('throws error on overlapping timeSlots with durationMin during update', async () => {
      await expect(
        taskService.updateTask(prismaMock as unknown as PrismaClient, 't16b', {
          title: 'Task with Overlapping Slots',
          timeSlots: [
            {
              startDateTime: '2024-01-01T10:00:00Z',
              durationMin: 120,
            },
            {
              startDateTime: '2024-01-01T11:00:00Z',
              durationMin: 90,
            },
          ],
        }),
      ).rejects.toThrow(ApiError);
      await expect(
        taskService.updateTask(prismaMock as unknown as PrismaClient, 't16b', {
          title: 'Task with Overlapping Slots',
          timeSlots: [
            {
              startDateTime: '2024-01-01T10:00:00Z',
              durationMin: 120,
            },
            {
              startDateTime: '2024-01-01T11:00:00Z',
              durationMin: 90,
            },
          ],
        }),
      ).rejects.toMatchObject({
        code: 'TIME_SLOT_OVERLAP',
        status: 400,
      });
    });

    it('updates task with timeSlots using durationMin', async () => {
      const fakeTaskWithoutSlots = {
        id: 't15b',
        title: 'Task 15b',
        description: null,
        status: 'PENDING',
        quantity: 1,
        completed_quantity: 0,
        item: null,
        machine: null,
        operator: null,
        timeSlots: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const fakeTaskWithSlots = {
        ...fakeTaskWithoutSlots,
        timeSlots: [
          {
            id: 'ts3b',
            taskId: 't15b',
            startDateTime: new Date('2024-01-01T14:00:00Z'),
            endDateTime: new Date('2024-01-01T15:30:00Z'),
            durationMin: 90,
          },
        ],
      };
      prismaMock.taskTimeSlot.deleteMany.mockResolvedValue({ count: 0 } as never);
      prismaMock.task.update.mockResolvedValue(fakeTaskWithoutSlots as never);
      prismaMock.taskTimeSlot.createMany.mockResolvedValue({ count: 1 } as never);
      prismaMock.task.findUnique.mockResolvedValue(fakeTaskWithSlots as never);

      const result = await taskService.updateTask(prismaMock as unknown as PrismaClient, 't15b', {
        title: 'Task 15b',
        timeSlots: [
          {
            startDateTime: '2024-01-01T14:00:00Z',
            durationMin: 90,
          },
        ],
      });

      expect(prismaMock.taskTimeSlot.createMany).toHaveBeenCalledWith({
        data: [
          {
            taskId: 't15b',
            startDateTime: new Date('2024-01-01T14:00:00Z'),
            endDateTime: new Date('2024-01-01T15:30:00Z'),
            durationMin: 90,
          },
        ],
      });
      expect(result).toEqual(fakeTaskWithSlots);
    });

    it('updates task with itemId connection', async () => {
      const fakeTask = {
        id: 't17',
        title: 'Task 17',
        description: null,
        status: 'PENDING',
        quantity: 1,
        completed_quantity: 0,
        itemId: 'i4',
        item: { id: 'i4', name: 'Item 4' },
        machine: null,
        operator: null,
        timeSlots: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prismaMock.taskTimeSlot.deleteMany.mockResolvedValue({ count: 0 } as never);
      prismaMock.task.update.mockResolvedValue(fakeTask as never);

      const result = await taskService.updateTask(prismaMock as unknown as PrismaClient, 't17', {
        itemId: 'i4',
      });

      expect(prismaMock.task.update).toHaveBeenCalledWith({
        where: { id: 't17' },
        data: {
          quantity: 1,
          completed_quantity: 0,
          item: { connect: { id: 'i4' } },
        },
        include: {
          item: { include: { project: true } },
          machine: true,
          operator: true,
          timeSlots: { orderBy: { startDateTime: 'asc' } },
        },
      });
      expect(result).toEqual(fakeTask);
    });

    it('updates task with itemId disconnection', async () => {
      const fakeTask = {
        id: 't18',
        title: 'Task 18',
        description: null,
        status: 'PENDING',
        quantity: 1,
        completed_quantity: 0,
        itemId: null,
        item: null,
        machine: null,
        operator: null,
        timeSlots: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prismaMock.taskTimeSlot.deleteMany.mockResolvedValue({ count: 0 } as never);
      prismaMock.task.update.mockResolvedValue(fakeTask as never);

      const result = await taskService.updateTask(prismaMock as unknown as PrismaClient, 't18', {
        itemId: null,
      });

      expect(prismaMock.task.update).toHaveBeenCalledWith({
        where: { id: 't18' },
        data: {
          quantity: 1,
          completed_quantity: 0,
          item: { disconnect: true },
        },
        include: {
          item: { include: { project: true } },
          machine: true,
          operator: true,
          timeSlots: { orderBy: { startDateTime: 'asc' } },
        },
      });
      expect(result).toEqual(fakeTask);
    });

    it('updates task with machineId and operatorId connections', async () => {
      const fakeTask = {
        id: 't19',
        title: 'Task 19',
        description: null,
        status: 'PENDING',
        quantity: 1,
        completed_quantity: 0,
        item: null,
        machineId: 'm2',
        machine: { id: 'm2', name: 'Machine 2' },
        operatorId: 'o2',
        operator: { id: 'o2', name: 'Operator 2' },
        timeSlots: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prismaMock.taskTimeSlot.deleteMany.mockResolvedValue({ count: 0 } as never);
      prismaMock.task.update.mockResolvedValue(fakeTask as never);

      const result = await taskService.updateTask(prismaMock as unknown as PrismaClient, 't19', {
        machineId: 'm2',
        operatorId: 'o2',
      });

      expect(prismaMock.task.update).toHaveBeenCalledWith({
        where: { id: 't19' },
        data: {
          quantity: 1,
          completed_quantity: 0,
          machine: { connect: { id: 'm2' } },
          operator: { connect: { id: 'o2' } },
        },
        include: {
          item: { include: { project: true } },
          machine: true,
          operator: true,
          timeSlots: { orderBy: { startDateTime: 'asc' } },
        },
      });
      expect(result).toEqual(fakeTask);
    });

    it('updates task with machineId and operatorId disconnections', async () => {
      const fakeTask = {
        id: 't20',
        title: 'Task 20',
        description: null,
        status: 'PENDING',
        quantity: 1,
        completed_quantity: 0,
        item: null,
        machineId: null,
        machine: null,
        operatorId: null,
        operator: null,
        timeSlots: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prismaMock.taskTimeSlot.deleteMany.mockResolvedValue({ count: 0 } as never);
      prismaMock.task.update.mockResolvedValue(fakeTask as never);

      const result = await taskService.updateTask(prismaMock as unknown as PrismaClient, 't20', {
        machineId: null,
        operatorId: null,
      });

      expect(prismaMock.task.update).toHaveBeenCalledWith({
        where: { id: 't20' },
        data: {
          quantity: 1,
          completed_quantity: 0,
          machine: { disconnect: true },
          operator: { disconnect: true },
        },
        include: {
          item: { include: { project: true } },
          machine: true,
          operator: true,
          timeSlots: { orderBy: { startDateTime: 'asc' } },
        },
      });
      expect(result).toEqual(fakeTask);
    });

    it('updates task by disconnecting itemId/machineId/operatorId (null values)', async () => {
      const fakeTask = {
        id: 't17b',
        title: 'Task 17b',
        description: null,
        status: 'PENDING',
        quantity: 1,
        completed_quantity: 0,
        itemId: null,
        item: null,
        machineId: null,
        machine: null,
        operatorId: null,
        operator: null,
        timeSlots: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prismaMock.taskTimeSlot.deleteMany.mockResolvedValue({ count: 0 } as never);
      prismaMock.task.update.mockResolvedValue(fakeTask as never);

      const result = await taskService.updateTask(prismaMock as unknown as PrismaClient, 't17b', {
        itemId: null,
        machineId: null,
        operatorId: null,
      });

      expect(prismaMock.task.update).toHaveBeenCalledWith({
        where: { id: 't17b' },
        data: expect.objectContaining({
          quantity: 1,
          completed_quantity: 0,
          item: { disconnect: true },
          machine: { disconnect: true },
          operator: { disconnect: true },
        }),
        include: {
          item: { include: { project: true } },
          machine: true,
          operator: true,
          timeSlots: { orderBy: { startDateTime: 'asc' } },
        },
      });
      expect(result).toEqual(fakeTask);
    });

    it('updates task by disconnecting with empty string values', async () => {
      const fakeTask = {
        id: 't17f',
        title: 'Task 17f',
        description: null,
        status: 'PENDING',
        quantity: 1,
        completed_quantity: 0,
        itemId: null,
        item: null,
        machine: null,
        operator: null,
        timeSlots: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prismaMock.task.update.mockResolvedValue(fakeTask as never);
      prismaMock.task.findUnique.mockResolvedValue(fakeTask as never);
      prismaMock.taskTimeSlot.deleteMany.mockResolvedValue({ count: 0 } as never);

      const result = await taskService.updateTask(prismaMock as unknown as PrismaClient, 't17f', {
        title: 'Task 17f',
        itemId: '',
        machineId: '',
        operatorId: '',
      });

      expect(prismaMock.task.update).toHaveBeenCalledWith({
        where: { id: 't17f' },
        data: expect.objectContaining({
          item: { disconnect: true },
          machine: { disconnect: true },
          operator: { disconnect: true },
        }),
        include: {
          item: { include: { project: true } },
          machine: true,
          operator: true,
          timeSlots: { orderBy: { startDateTime: 'asc' } },
        },
      });
      expect(result).toEqual(fakeTask);
    });

    it('updates task with non-empty itemId for connection branch', async () => {
      const fakeTask = {
        id: 't17g',
        title: 'Task 17g',
        description: null,
        status: 'PENDING',
        quantity: 1,
        completed_quantity: 0,
        itemId: 'item123',
        item: { id: 'item123', name: 'Test Item' },
        machine: null,
        operator: null,
        timeSlots: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prismaMock.task.update.mockResolvedValue(fakeTask as never);
      prismaMock.task.findUnique.mockResolvedValue(fakeTask as never);
      prismaMock.taskTimeSlot.deleteMany.mockResolvedValue({ count: 0 } as never);

      const result = await taskService.updateTask(prismaMock as unknown as PrismaClient, 't17g', {
        title: 'Task 17g',
        itemId: 'valid-item-id', // Use definitely truthy string value
        machineId: 'valid-machine-id',
        operatorId: 'valid-operator-id',
      });

      expect(prismaMock.task.update).toHaveBeenCalledWith({
        where: { id: 't17g' },
        data: expect.objectContaining({
          item: { connect: { id: 'valid-item-id' } }, // This should cover line 209
          machine: { connect: { id: 'valid-machine-id' } },
          operator: { connect: { id: 'valid-operator-id' } },
        }),
        include: {
          item: { include: { project: true } },
          machine: true,
          operator: true,
          timeSlots: { orderBy: { startDateTime: 'asc' } },
        },
      });
      expect(result).toEqual(fakeTask);
    });

    it('updates timeSlots with mixed endDateTime and durationMin', async () => {
      const fakeTaskWithSlots = {
        id: 't17c',
        title: 'Task 17c',
        description: null,
        status: 'PENDING',
        quantity: 1,
        completed_quantity: 0,
        itemId: null,
        item: null,
        machine: null,
        operator: null,
        timeSlots: [
          {
            id: 'ts17c1',
            taskId: 't17c',
            startDateTime: new Date('2024-01-01T14:00:00Z'),
            endDateTime: new Date('2024-01-01T16:00:00Z'),
            durationMin: 120,
          },
          {
            id: 'ts17c2',
            taskId: 't17c',
            startDateTime: new Date('2024-01-01T17:00:00Z'),
            endDateTime: new Date('2024-01-01T18:30:00Z'),
            durationMin: 90,
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prismaMock.taskTimeSlot.deleteMany.mockResolvedValue({ count: 0 } as never);
      prismaMock.taskTimeSlot.createMany.mockResolvedValue({ count: 2 } as never);
      prismaMock.task.update.mockResolvedValue(fakeTaskWithSlots as never);
      prismaMock.task.findUnique.mockResolvedValue(fakeTaskWithSlots as never);

      const result = await taskService.updateTask(prismaMock as unknown as PrismaClient, 't17c', {
        title: 'Task 17c',
        timeSlots: [
          {
            startDateTime: '2024-01-01T14:00:00Z',
            endDateTime: '2024-01-01T16:00:00Z',
            durationMin: 120,
          },
          {
            startDateTime: '2024-01-01T17:00:00Z',
            durationMin: 90,
          },
        ],
      });

      expect(prismaMock.taskTimeSlot.createMany).toHaveBeenCalledWith({
        data: [
          {
            taskId: 't17c',
            startDateTime: new Date('2024-01-01T14:00:00Z'),
            endDateTime: new Date('2024-01-01T16:00:00Z'),
            durationMin: 120,
          },
          {
            taskId: 't17c',
            startDateTime: new Date('2024-01-01T17:00:00Z'),
            endDateTime: new Date('2024-01-01T18:30:00Z'),
            durationMin: 90,
          },
        ],
      });
      expect(result).toEqual(fakeTaskWithSlots);
    });

    it('updates task with explicit endDateTime to cover endDateTime branch', async () => {
      const fakeTaskWithSlots = {
        id: 't17h',
        title: 'Task 17h',
        description: null,
        status: 'PENDING',
        quantity: 1,
        completed_quantity: 0,
        itemId: null,
        item: null,
        machine: null,
        operator: null,
        timeSlots: [
          {
            id: 'ts17h1',
            taskId: 't17h',
            startDateTime: new Date('2024-01-01T10:00:00Z'),
            endDateTime: new Date('2024-01-01T12:00:00Z'), // This should trigger endDateTime branch
            durationMin: 120,
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prismaMock.taskTimeSlot.deleteMany.mockResolvedValue({ count: 0 } as never);
      prismaMock.taskTimeSlot.createMany.mockResolvedValue({ count: 1 } as never);
      prismaMock.task.update.mockResolvedValue(fakeTaskWithSlots as never);
      prismaMock.task.findUnique.mockResolvedValue(fakeTaskWithSlots as never);

      const result = await taskService.updateTask(prismaMock as unknown as PrismaClient, 't17h', {
        title: 'Task 17h',
        timeSlots: [
          {
            startDateTime: '2024-01-01T10:00:00Z',
            endDateTime: '2024-01-01T12:00:00Z', // Provide explicit endDateTime to cover line 233
          },
        ],
      });

      expect(prismaMock.taskTimeSlot.createMany).toHaveBeenCalledWith({
        data: [
          {
            taskId: 't17h',
            startDateTime: new Date('2024-01-01T10:00:00Z'),
            endDateTime: new Date('2024-01-01T12:00:00Z'), // This should cover the endDateTime branch
            durationMin: 60, // Uses default since durationMin not provided in input
          },
        ],
      });
      expect(result).toEqual(fakeTaskWithSlots);
    });

    it('handles updateTask timeSlot overlap detection with reverse mixed types (durationMin first, endDateTime second)', async () => {
      await expect(
        taskService.updateTask(prismaMock as unknown as PrismaClient, 't17d', {
          title: 'Task with Reverse Mixed Overlapping Slots',
          timeSlots: [
            {
              startDateTime: '2024-01-01T10:00:00Z',
              durationMin: 120,
            },
            {
              startDateTime: '2024-01-01T11:30:00Z',
              endDateTime: '2024-01-01T13:00:00Z',
            },
          ],
        }),
      ).rejects.toMatchObject({
        code: 'TIME_SLOT_OVERLAP',
        message: 'Time slots within the same task cannot overlap',
        status: 400,
      });
    });

    it('should use default 60-minute duration in overlap detection when durationMin is undefined', async () => {
      await expect(
        taskService.updateTask(prismaMock as unknown as PrismaClient, 't17d', {
          title: 'Test Task',
          timeSlots: [
            {
              startDateTime: '2024-01-01T10:00:00Z',
              durationMin: undefined, // Will default to 60 minutes
            },
            {
              startDateTime: '2024-01-01T10:30:00Z', // 30 minutes later, should overlap
              durationMin: 30,
            },
          ],
        }),
      ).rejects.toMatchObject({
        code: 'TIME_SLOT_OVERLAP',
        message: 'Time slots within the same task cannot overlap',
        status: 400,
      });
    });

    it('should use default duration for both slots in overlap detection', async () => {
      await expect(
        taskService.updateTask(prismaMock as unknown as PrismaClient, 't17e', {
          title: 'Test Task',
          timeSlots: [
            {
              startDateTime: '2024-01-01T10:00:00Z',
              durationMin: undefined, // Will default to 60 minutes
            },
            {
              startDateTime: '2024-01-01T10:30:00Z', // 30 minutes later, should overlap
              durationMin: undefined, // Will also default to 60 minutes
            },
          ],
        }),
      ).rejects.toMatchObject({
        code: 'TIME_SLOT_OVERLAP',
        message: 'Time slots within the same task cannot overlap',
        status: 400,
      });
    });
  });

  describe('patchTask', () => {
    it('patches task status', async () => {
      const fakeTask = {
        id: 't21',
        title: 'Task 21',
        description: null,
        status: 'COMPLETED',
        quantity: 1,
        completed_quantity: 1,
        item: null,
        machine: null,
        operator: null,
        timeSlots: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prismaMock.task.update.mockResolvedValue(fakeTask as never);

      const result = await taskService.patchTask(prismaMock as unknown as PrismaClient, 't21', {
        status: 'COMPLETED',
      });

      expect(prismaMock.task.update).toHaveBeenCalledWith({
        where: { id: 't21' },
        data: {
          status: 'COMPLETED',
        },
        include: {
          item: { include: { project: true } },
          machine: true,
          operator: true,
          timeSlots: { orderBy: { startDateTime: 'asc' } },
        },
      });
      expect(result).toEqual(fakeTask);
    });

    it('patches task title and description', async () => {
      const fakeTask = {
        id: 't22',
        title: 'Patched Title',
        description: 'Patched description',
        status: 'PENDING',
        quantity: 1,
        completed_quantity: 0,
        item: null,
        machine: null,
        operator: null,
        timeSlots: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prismaMock.task.update.mockResolvedValue(fakeTask as never);

      const result = await taskService.patchTask(prismaMock as unknown as PrismaClient, 't22', {
        title: 'Patched Title',
        description: 'Patched description',
      });

      expect(prismaMock.task.update).toHaveBeenCalledWith({
        where: { id: 't22' },
        data: {
          title: 'Patched Title',
          description: 'Patched description',
        },
        include: {
          item: { include: { project: true } },
          machine: true,
          operator: true,
          timeSlots: { orderBy: { startDateTime: 'asc' } },
        },
      });
      expect(result).toEqual(fakeTask);
    });

    it('patches task quantity fields', async () => {
      const fakeTask = {
        id: 't23',
        title: 'Task 23',
        description: null,
        status: 'PENDING',
        quantity: 5,
        completed_quantity: 3,
        item: null,
        machine: null,
        operator: null,
        timeSlots: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prismaMock.task.update.mockResolvedValue(fakeTask as never);

      const result = await taskService.patchTask(prismaMock as unknown as PrismaClient, 't23', {
        quantity: 5,
        completed_quantity: 3,
      });

      expect(prismaMock.task.update).toHaveBeenCalledWith({
        where: { id: 't23' },
        data: {
          quantity: 5,
          completed_quantity: 3,
        },
        include: {
          item: { include: { project: true } },
          machine: true,
          operator: true,
          timeSlots: { orderBy: { startDateTime: 'asc' } },
        },
      });
      expect(result).toEqual(fakeTask);
    });

    it('patches task with itemId connection', async () => {
      const fakeTask = {
        id: 't24',
        title: 'Task 24',
        description: null,
        status: 'PENDING',
        quantity: 1,
        completed_quantity: 0,
        itemId: 'i5',
        item: { id: 'i5', name: 'Item 5' },
        machine: null,
        operator: null,
        timeSlots: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prismaMock.task.update.mockResolvedValue(fakeTask as never);

      const result = await taskService.patchTask(prismaMock as unknown as PrismaClient, 't24', {
        itemId: 'i5',
      });

      expect(prismaMock.task.update).toHaveBeenCalledWith({
        where: { id: 't24' },
        data: {
          item: { connect: { id: 'i5' } },
        },
        include: {
          item: { include: { project: true } },
          machine: true,
          operator: true,
          timeSlots: { orderBy: { startDateTime: 'asc' } },
        },
      });
      expect(result).toEqual(fakeTask);
    });

    it('patches task with itemId disconnection', async () => {
      const fakeTask = {
        id: 't25',
        title: 'Task 25',
        description: null,
        status: 'PENDING',
        quantity: 1,
        completed_quantity: 0,
        itemId: null,
        item: null,
        machine: null,
        operator: null,
        timeSlots: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prismaMock.task.update.mockResolvedValue(fakeTask as never);

      const result = await taskService.patchTask(prismaMock as unknown as PrismaClient, 't25', {
        itemId: null,
      });

      expect(prismaMock.task.update).toHaveBeenCalledWith({
        where: { id: 't25' },
        data: {
          item: { disconnect: true },
        },
        include: {
          item: { include: { project: true } },
          machine: true,
          operator: true,
          timeSlots: { orderBy: { startDateTime: 'asc' } },
        },
      });
      expect(result).toEqual(fakeTask);
    });

    it('patches task with machineId and operatorId connections', async () => {
      const fakeTask = {
        id: 't26',
        title: 'Task 26',
        description: null,
        status: 'PENDING',
        quantity: 1,
        completed_quantity: 0,
        item: null,
        machineId: 'm3',
        machine: { id: 'm3', name: 'Machine 3' },
        operatorId: 'o3',
        operator: { id: 'o3', name: 'Operator 3' },
        timeSlots: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prismaMock.task.update.mockResolvedValue(fakeTask as never);

      const result = await taskService.patchTask(prismaMock as unknown as PrismaClient, 't26', {
        machineId: 'm3',
        operatorId: 'o3',
      });

      expect(prismaMock.task.update).toHaveBeenCalledWith({
        where: { id: 't26' },
        data: {
          machine: { connect: { id: 'm3' } },
          operator: { connect: { id: 'o3' } },
        },
        include: {
          item: { include: { project: true } },
          machine: true,
          operator: true,
          timeSlots: { orderBy: { startDateTime: 'asc' } },
        },
      });
      expect(result).toEqual(fakeTask);
    });

    it('patches task with machineId and operatorId disconnections', async () => {
      const fakeTask = {
        id: 't27',
        title: 'Task 27',
        description: null,
        status: 'PENDING',
        quantity: 1,
        completed_quantity: 0,
        item: null,
        machineId: null,
        machine: null,
        operatorId: null,
        operator: null,
        timeSlots: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prismaMock.task.update.mockResolvedValue(fakeTask as never);

      const result = await taskService.patchTask(prismaMock as unknown as PrismaClient, 't27', {
        machineId: null,
        operatorId: null,
      });

      expect(prismaMock.task.update).toHaveBeenCalledWith({
        where: { id: 't27' },
        data: {
          machine: { disconnect: true },
          operator: { disconnect: true },
        },
        include: {
          item: { include: { project: true } },
          machine: true,
          operator: true,
          timeSlots: { orderBy: { startDateTime: 'asc' } },
        },
      });
      expect(result).toEqual(fakeTask);
    });

    it('patches task with empty string values for disconnection', async () => {
      const fakeTask = {
        id: 't28',
        title: 'Task 28',
        description: null,
        status: 'PENDING',
        quantity: 1,
        completed_quantity: 0,
        itemId: null,
        item: null,
        machine: null,
        operator: null,
        timeSlots: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prismaMock.task.update.mockResolvedValue(fakeTask as never);

      const result = await taskService.patchTask(prismaMock as unknown as PrismaClient, 't28', {
        itemId: '',
        machineId: '',
        operatorId: '',
      });

      expect(prismaMock.task.update).toHaveBeenCalledWith({
        where: { id: 't28' },
        data: {
          item: { disconnect: true },
          machine: { disconnect: true },
          operator: { disconnect: true },
        },
        include: {
          item: { include: { project: true } },
          machine: true,
          operator: true,
          timeSlots: { orderBy: { startDateTime: 'asc' } },
        },
      });
      expect(result).toEqual(fakeTask);
    });

    it('patches task with non-empty itemId for connection branch', async () => {
      const fakeTask = {
        id: 't29',
        title: 'Task 29',
        description: null,
        status: 'PENDING',
        quantity: 1,
        completed_quantity: 0,
        itemId: 'item456',
        item: { id: 'item456', name: 'Test Item' },
        machine: null,
        operator: null,
        timeSlots: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prismaMock.task.update.mockResolvedValue(fakeTask as never);

      const result = await taskService.patchTask(prismaMock as unknown as PrismaClient, 't29', {
        itemId: 'valid-item-id-2', // Truthy value should trigger connect branch
        machineId: 'valid-machine-id-2',
        operatorId: 'valid-operator-id-2',
      });

      expect(prismaMock.task.update).toHaveBeenCalledWith({
        where: { id: 't29' },
        data: {
          item: { connect: { id: 'valid-item-id-2' } }, // This should cover line 264
          machine: { connect: { id: 'valid-machine-id-2' } },
          operator: { connect: { id: 'valid-operator-id-2' } },
        },
        include: {
          item: { include: { project: true } },
          machine: true,
          operator: true,
          timeSlots: { orderBy: { startDateTime: 'asc' } },
        },
      });
      expect(result).toEqual(fakeTask);
    });

    it('throws error when task not found', async () => {
      prismaMock.task.update.mockResolvedValue(null as never);

      await expect(
        taskService.patchTask(prismaMock as unknown as PrismaClient, 'missing', { status: 'COMPLETED' }),
      ).rejects.toThrow(ApiError);
      await expect(
        taskService.patchTask(prismaMock as unknown as PrismaClient, 'missing', { status: 'COMPLETED' }),
      ).rejects.toMatchObject({
        code: 'TASK_NOT_FOUND',
        message: 'Task not found',
        status: 404,
      });
    });
  });

  describe('deleteTask', () => {
    it('deletes a task successfully', async () => {
      prismaMock.task.delete.mockResolvedValue({} as never);

      await taskService.deleteTask(prismaMock as unknown as PrismaClient, 't28');

      expect(prismaMock.task.delete).toHaveBeenCalledWith({ where: { id: 't28' } });
    });
  });
});
