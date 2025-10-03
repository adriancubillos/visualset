import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as route from '@/app/api/gantt/route';
import ganttService, { fetchProjectsWithScheduledTasks } from '@/services/ganttService';
import { logger } from '@/utils/logger';

describe('gantt route', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('GET returns transformed gantt data on success', async () => {
    const sample = [
      {
        id: 'p1',
        name: 'Project 1',
        status: 'ACTIVE',
        color: '#fff',
        items: [
          {
            id: 'i1',
            name: 'Item 1',
            status: 'OPEN',
            tasks: [
              {
                id: 't1',
                title: 'Task 1',
                status: 'PLANNED',
                durationMin: 60,
                operator: { id: 'o1', name: 'Op', color: '#000' },
                machine: { id: 'm1', name: 'M', type: 'LATHE' },
                timeSlots: [
                  {
                    startDateTime: new Date('2025-01-01T00:00:00Z'),
                    endDateTime: new Date('2025-01-01T01:00:00Z'),
                    durationMin: 60,
                  },
                ],
              },
            ],
          },
        ],
      },
    ];

    vi.spyOn(ganttService, 'fetchProjectsWithScheduledTasks').mockResolvedValue(
      sample as unknown as Awaited<ReturnType<typeof fetchProjectsWithScheduledTasks>>,
    );

    const res = (await route.GET()) as unknown as { body: unknown };
    expect(res).toHaveProperty('body');
    const body = res.body as Record<string, unknown>;
    expect(body).toHaveProperty('projects');
  });

  it('GET filters out projects/items without scheduled tasks', async () => {
    const sample = [
      {
        id: 'p1',
        name: 'P1',
        status: 'ACTIVE',
        color: '#fff',
        items: [{ id: 'i1', name: 'I1', status: 'OPEN', tasks: [] }],
      },
    ];

    vi.spyOn(ganttService, 'fetchProjectsWithScheduledTasks').mockResolvedValue(
      sample as unknown as Awaited<ReturnType<typeof fetchProjectsWithScheduledTasks>>,
    );

    const res = (await route.GET()) as unknown as { body: { projects: unknown[] } };
    expect(res.body.projects).toEqual([]);
  });

  it('GET maps errors to ApiError response', async () => {
    vi.spyOn(ganttService, 'fetchProjectsWithScheduledTasks').mockRejectedValue(new Error('boom'));
    const spy = vi.spyOn(logger, 'apiError');

    const res = (await route.GET()) as unknown as { body: { error: unknown }; opts?: { status?: number } };

    expect(res.opts?.status).toBe(500);
    expect((res.body.error as Record<string, unknown>).code).toBe('INTERNAL_ERROR');
    expect(spy).toHaveBeenCalled();
  });

  it('GET handles task with missing endDateTime and null operator/machine', async () => {
    const sample = [
      {
        id: 'p2',
        name: 'Project 2',
        status: 'ACTIVE',
        color: '#000',
        items: [
          {
            id: 'i2',
            name: 'Item 2',
            status: 'OPEN',
            tasks: [
              {
                id: 't2',
                title: 'Task 2',
                status: 'PLANNED',
                durationMin: 30,
                operator: null,
                machine: null,
                timeSlots: [
                  {
                    startDateTime: new Date('2025-01-02T00:00:00Z'),
                    endDateTime: null as unknown as Date,
                    durationMin: 30,
                  },
                ],
              },
            ],
          },
        ],
      },
    ];

    vi.spyOn(ganttService, 'fetchProjectsWithScheduledTasks').mockResolvedValue(
      sample as unknown as Awaited<ReturnType<typeof fetchProjectsWithScheduledTasks>>,
    );

    const res = (await route.GET()) as unknown as { body: { projects: Array<Record<string, unknown>> } };

    // ensure the transformed task has an endDate (calculated from duration) and null operator/machine
    const task = (
      ((res.body.projects[0].items as unknown[])[0] as Record<string, unknown>).tasks as unknown[]
    )[0] as Record<string, unknown>;

    expect(task.startDate).toBeDefined();
    expect(task.endDate).toBeDefined();
    expect(task.operator).toBeNull();
    expect(task.machine).toBeNull();
  });

  it('GET handles task with empty timeSlots (no start/end)', async () => {
    const sample = [
      {
        id: 'p3',
        name: 'Project 3',
        status: 'ACTIVE',
        color: '#abc',
        items: [
          {
            id: 'i3',
            name: 'Item 3',
            status: 'OPEN',
            tasks: [
              {
                id: 't3',
                title: 'Task 3',
                status: 'PLANNED',
                durationMin: 0,
                operator: null,
                machine: null,
                timeSlots: [],
              },
            ],
          },
        ],
      },
    ];

    vi.spyOn(ganttService, 'fetchProjectsWithScheduledTasks').mockResolvedValue(
      sample as unknown as Awaited<ReturnType<typeof fetchProjectsWithScheduledTasks>>,
    );

    const res = (await route.GET()) as unknown as { body: { projects: Array<Record<string, unknown>> } };

    const task = (
      ((res.body.projects[0].items as unknown[])[0] as Record<string, unknown>).tasks as unknown[]
    )[0] as Record<string, unknown>;

    expect(task.startDate).toBeNull();
    expect(task.endDate).toBeNull();
  });
});
