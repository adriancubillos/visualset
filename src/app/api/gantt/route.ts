import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/gantt
export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      where: {
        status: {
          in: ['ACTIVE', 'COMPLETED'], // Only show active and completed projects
        },
      },
      include: {
        items: {
          include: {
            tasks: {
              where: {
                timeSlots: {
                  some: {}, // Only include tasks that have time slots
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

    // Transform the data for the Gantt chart
    const ganttData = {
      projects: projects.map((project) => ({
        id: project.id,
        name: project.name,
        status: project.status,
        color: project.color,
        items: project.items.map((item) => ({
          id: item.id,
          name: item.name,
          status: item.status,
          tasks: item.tasks.map((task) => {
            // Get primary time slot or first time slot for start/end dates
            const primarySlot = task.timeSlots.find((slot) => slot.isPrimary) || task.timeSlots[0];

            return {
              id: task.id,
              title: task.title,
              startDate: primarySlot ? primarySlot.startDateTime : null,
              endDate: primarySlot
                ? primarySlot.endDateTime ||
                  new Date(primarySlot.startDateTime.getTime() + primarySlot.durationMin * 60 * 1000)
                : null,
              status: task.status,
              durationMin: primarySlot ? primarySlot.durationMin : 0,
              operator: task.operator
                ? {
                    id: task.operator.id,
                    name: task.operator.name,
                    color: task.operator.color,
                  }
                : null,
              machine: task.machine
                ? {
                    id: task.machine.id,
                    name: task.machine.name,
                    type: task.machine.type,
                  }
                : null,
            };
          }),
        })),
      })),
    };

    // Filter out projects and items that have no scheduled tasks
    ganttData.projects = ganttData.projects
      .map((project) => ({
        ...project,
        items: project.items.filter((item) => item.tasks.length > 0),
      }))
      .filter((project) => project.items.length > 0);

    return NextResponse.json(ganttData);
  } catch (error) {
    console.error('Error fetching Gantt data:', error);
    return NextResponse.json({ error: 'Failed to fetch Gantt data' }, { status: 500 });
  }
}
