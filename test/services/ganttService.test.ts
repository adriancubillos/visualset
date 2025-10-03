import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fetchProjectsWithScheduledTasks } from '@/services/ganttService';
import { prismaMock } from '../setup';
import type { PrismaClient } from '@prisma/client';

describe('ganttService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    prismaMock.project.findMany.mockReset();
  });

  it('calls prisma.project.findMany with expected query and returns results', async () => {
    const fake = [
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
                operator: null,
                machine: null,
                timeSlots: [],
              },
            ],
          },
        ],
      },
    ] as unknown as Awaited<ReturnType<typeof fetchProjectsWithScheduledTasks>>;

    prismaMock.project.findMany.mockResolvedValue(fake as unknown as Promise<typeof fake>);

    const res = await fetchProjectsWithScheduledTasks(prismaMock as unknown as PrismaClient);

    expect(prismaMock.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: expect.objectContaining({ in: ['ACTIVE', 'COMPLETED'] }) }),
      }),
    );

    expect(res).toEqual(fake);
  });
});
