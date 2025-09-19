import { describe, it, expect, beforeEach } from 'vitest';
import * as tasksRoute from '@/app/api/tasks/route';
import { prismaMock } from '../setup';

describe('GET /api/tasks', () => {
  beforeEach(() => {
    prismaMock.task.findMany.mockReset();
  });

  it('returns mapped tasks', async () => {
    const fakeTasks = [
      {
        id: 't1',
        title: 'Task 1',
        item: { id: 'i1', project: { id: 'p1', name: 'Project 1' } },
        machine: null,
        operator: null,
      },
    ];
    prismaMock.task.findMany.mockResolvedValue(fakeTasks);

    const res = await tasksRoute.GET();
    expect(res).toHaveProperty('body');
    type TasksBody = Array<{ project: { id: string } }> | unknown;
    const body = res.body as TasksBody;
    expect(Array.isArray(body)).toBe(true);
    const arr = body as Array<{ project: { id: string } }>;
    expect(arr[0]).toHaveProperty('project');
    expect(arr[0].project.id).toBe('p1');
  });
});
