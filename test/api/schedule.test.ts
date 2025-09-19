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
    prismaMock.item.findFirst.mockReset();
    prismaMock.item.create.mockReset();
  });

  it('GET returns scheduled tasks (no params)', async () => {
    const fakeTasks: TaskWithRelationsDTO[] = [
      {
        id: 't1',
        title: 'Task 1',
        description: null,
        durationMin: 60,
        status: 'PENDING',
        item: {
          id: 'i1',
          projectId: 'p1',
          name: 'Item 1',
          description: null,
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        itemId: 'i1',
        machine: null,
        operator: null,
        scheduledAt: new Date().toISOString(),
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
      durationMin: 60,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    prismaMock.task.findUnique.mockResolvedValue(existingTask);
    // no conflicts
    prismaMock.task.findMany.mockResolvedValue([]);
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
      durationMin,
      status: 'SCHEDULED',
      item: {
        id: 'new-item',
        projectId: 'p1',
        name: 'Default Item',
        description: null,
        status: 'ACTIVE',
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
      scheduledAt: scheduledAt.toISOString(),
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
      durationMin: 30,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // existing task that overlaps: scheduled at 10:15 for 30min -> otherEnd 10:45 which overlaps our start 10:00-11:00
    const conflictStart = new Date(scheduledAt.getTime() + 15 * 60 * 1000);
    const machineConflict = {
      id: 'c1',
      title: 'other',
      scheduledAt: conflictStart,
      durationMin: 30,
      machine: {
        id: 'm1',
        name: 'Mach',
        type: 'X',
        status: 'AVAILABLE',
        location: 'L1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    } as const;
    prismaMock.task.findMany.mockResolvedValue([machineConflict]);

    const body = { taskId, machineId: 'm1', scheduledAt: scheduledAt.toISOString(), durationMin };
    const req = new Request('http://localhost', { method: 'POST', body: JSON.stringify(body) });
    const res = (await scheduleRoute.POST(req)) as unknown as ResponseMock<unknown>;
    expect(res.opts).toBeDefined();
    expect(res.opts?.status).toBe(400);
    // body should include conflict info
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resBody = res.body as any;
    expect(resBody).toHaveProperty('conflict');
  });

  it('POST returns 400 when required params missing', async () => {
    const req = new Request('http://localhost', { method: 'POST', body: JSON.stringify({ taskId: 'x' }) });
    const res = (await scheduleRoute.POST(req)) as unknown as ResponseMock<unknown>;
    expect(res.opts).toBeDefined();
    expect(res.opts?.status).toBe(400);
  });
});
