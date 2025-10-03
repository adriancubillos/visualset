import type { PrismaClient } from '@prisma/client';

export async function fetchProjectsWithScheduledTasks(prisma: PrismaClient) {
  return prisma.project.findMany({
    where: {
      status: {
        in: ['ACTIVE', 'COMPLETED'],
      },
    },
    include: {
      items: {
        include: {
          tasks: {
            where: {
              timeSlots: {
                some: {},
              },
            },
            include: {
              operator: {
                select: {
                  id: true,
                  name: true,
                  color: true,
                },
              },
              machine: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                },
              },
              timeSlots: {
                orderBy: {
                  startDateTime: 'asc',
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });
}

const exported = { fetchProjectsWithScheduledTasks };
export default exported;
