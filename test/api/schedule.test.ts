import { describe, it, expect, beforeEach } from 'vitest';
import * as scheduleRoute from '@/app/api/schedule/route';
import { prismaMock } from '../setup';
import type { TaskWithRelationsDTO, TaskResponseDTO } from '@/types/api';

type ResponseMock<T = unknown> = { body: T; opts?: { status?: number } };

describe('Schedule routes', () => {
  beforeEach(() => {
    prismaMock.task.findMany.mockReset();
    prismaMock.task.findUnique.mockReset();
    prismaMock.task.update.mockReset();
    prismaMock.taskTimeSlot.findMany.mockReset();
    prismaMock.item.findFirst.mockReset();
    prismaMock.item.create.mockReset();
  });

  it('GET returns scheduled tasks (no params)', async () => {
    const fakeTasks: TaskWithRelationsDTO[] = [
      {
        id: 't1',
        title: 'Task 1',
        description: null,
        status: 'PENDING',
        quantity: 0,
        completed_quantity: 0,
        item: {
          id: 'i1',
          projectId: 'p1',
          name: 'Item 1',
          description: null,
          status: 'ACTIVE',
          quantity: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        itemId: 'i1',
        machine: null,
        operator: null,
        timeSlots: [
          {
            id: 'ts1',
            taskId: 't1',
            startDateTime: new Date().toISOString(),
            endDateTime: null,
            durationMin: 60,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    prismaMock.task.findMany.mockResolvedValue(fakeTasks);

    const req = new Request('http://localhost');
    const res = (await scheduleRoute.GET(req)) as unknown as ResponseMock<TaskResponseDTO[]>;
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('id', 't1');
    // map should include project as null because item.project isn't populated in this mock
  });

  it('POST schedules a task (happy path no conflicts)', async () => {
    const taskId = 't-schedule-1';
    const scheduledAt = new Date('2025-09-20T10:00:00.000Z');
    const durationMin = 30;

    // existing task
    const existingTask: Partial<TaskWithRelationsDTO> = {
      id: taskId,
      title: 'To schedule',
      status: 'PENDING',
      quantity: 0,
      completed_quantity: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    prismaMock.task.findUnique.mockResolvedValue(existingTask);
    // no conflicts (taskTimeSlot model is queried by conflict detection)
    prismaMock.taskTimeSlot.findMany.mockResolvedValue([]);
    // item lookup/create
    prismaMock.item.findFirst.mockResolvedValue(null);
    prismaMock.item.create.mockResolvedValue({
      id: 'new-item',
      projectId: 'p1',
      name: 'Default Item',
      description: null,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const updatedTask: TaskWithRelationsDTO = {
      id: taskId,
      title: 'To schedule',
      description: null,
      status: 'SCHEDULED',
      quantity: 0,
      completed_quantity: 0,
      item: {
        id: 'new-item',
        projectId: 'p1',
        name: 'Default Item',
        description: null,
        status: 'ACTIVE',
        quantity: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      itemId: 'new-item',
      machine: {
        id: 'm1',
        name: 'Mach',
        type: 'X',
        status: 'AVAILABLE',
        location: 'L1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      operator: null,
      timeSlots: [
        {
          id: 'ts-upd-1',
          taskId,
          startDateTime: scheduledAt.toISOString(),
          endDateTime: null,
          durationMin,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    prismaMock.task.update.mockResolvedValue(updatedTask);

    const body = { taskId, projectId: 'p1', machineId: 'm1', scheduledAt: scheduledAt.toISOString(), durationMin };
    const req = new Request('http://localhost', { method: 'POST', body: JSON.stringify(body) });
    const res = (await scheduleRoute.POST(req)) as unknown as ResponseMock<TaskResponseDTO>;
    expect(res.body).toHaveProperty('id', taskId);
    expect(res.body).toHaveProperty('status', 'SCHEDULED');
  });

  it('POST returns machine conflict when overlap occurs', async () => {
    const taskId = 't-conflict-machine';
    const scheduledAt = new Date('2025-09-20T10:00:00.000Z');
    const durationMin = 60;

    prismaMock.task.findUnique.mockResolvedValue({
      id: taskId,
      title: 'conflict-task',
      status: 'PENDING',
      quantity: 0,
      completed_quantity: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // existing task that overlaps: scheduled at 10:15 for 30min -> otherEnd 10:45 which overlaps our start 10:00-11:00
    const conflictStart = new Date(scheduledAt.getTime() + 15 * 60 * 1000);
    // conflict detection queries taskTimeSlot and returns slots with task included
    prismaMock.taskTimeSlot.findMany.mockResolvedValue([
      {
        id: 'ts-c1',
        startDateTime: conflictStart.toISOString(),
        endDateTime: null,
        durationMin: 30,
        task: {
          id: 'c1',
          title: 'other',
          timeSlots: undefined,
          machine: {
            id: 'm1',
            name: 'Mach',
          },
        },
      },
    ]);

    const body = { taskId, machineId: 'm1', scheduledAt: scheduledAt.toISOString(), durationMin };
    const req = new Request('http://localhost', { method: 'POST', body: JSON.stringify(body) });
    const res = (await scheduleRoute.POST(req)) as unknown as ResponseMock<unknown>;
    expect(res.opts).toBeDefined();
    expect(res.opts?.status).toBe(409);
    // unified ApiError mapping: error.code and error.details.conflict
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resBody = res.body as any;
    expect(resBody).toHaveProperty('error');
    expect(resBody.error).toHaveProperty('code', 'SCHEDULING_CONFLICT');
    expect(resBody.error).toHaveProperty('details');
    expect(resBody.error.details).toHaveProperty('conflict');
  });

  it('POST returns 400 when required params missing', async () => {
    const req = new Request('http://localhost', { method: 'POST', body: JSON.stringify({ taskId: 'x' }) });
    const res = (await scheduleRoute.POST(req)) as unknown as ResponseMock<unknown>;
    expect(res.opts).toBeDefined();
    expect(res.opts?.status).toBe(400);
  });
});
