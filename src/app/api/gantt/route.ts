import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import ganttService from '@/services/ganttService';
import { mapErrorToResponse } from '@/lib/errors';
import { logger } from '@/utils/logger';

// GET /api/gantt
export async function GET() {
  try {
    const projects = await ganttService.fetchProjectsWithScheduledTasks(prisma);

    // Transform the data for the Gantt chart
    const ganttData = {
      projects: projects.map((project: unknown) => {
        const p = project as Record<string, unknown>;
        return {
          id: p.id,
          name: p.name,
          status: p.status,
          color: p.color,
          items: (p.items as unknown[]).map((item: unknown) => {
            const i = item as Record<string, unknown>;
            return {
              id: i.id,
              name: i.name,
              status: i.status,
              tasks: (i.tasks as unknown[]).map((task: unknown) => {
                const t = task as Record<string, unknown>;
                // Get first time slot for start/end dates
                const timeSlots = t.timeSlots as unknown[];
                const firstSlot = timeSlots[0] as Record<string, unknown>;

                // Get operator and machine from junction tables
                const taskOperators = (t.taskOperators as unknown[]) || [];
                const taskMachines = (t.taskMachines as unknown[]) || [];
                const firstOperator = taskOperators[0]
                  ? ((taskOperators[0] as Record<string, unknown>).operator as Record<string, unknown>)
                  : null;
                const firstMachine = taskMachines[0]
                  ? ((taskMachines[0] as Record<string, unknown>).machine as Record<string, unknown>)
                  : null;

                return {
                  id: t.id,
                  title: t.title,
                  startDate: firstSlot ? firstSlot.startDateTime : null,
                  endDate: firstSlot
                    ? firstSlot.endDateTime ||
                      new Date(
                        (firstSlot.startDateTime as Date).getTime() + (firstSlot.durationMin as number) * 60 * 1000,
                      )
                    : null,
                  status: t.status,
                  durationMin: firstSlot ? firstSlot.durationMin : 0,
                  operator: firstOperator
                    ? {
                        id: firstOperator.id,
                        name: firstOperator.name,
                        color: firstOperator.color,
                      }
                    : null,
                  machine: firstMachine
                    ? {
                        id: firstMachine.id,
                        name: firstMachine.name,
                        type: firstMachine.type,
                      }
                    : null,
                };
              }),
            };
          }),
        };
      }),
    };

    // Filter out projects and items that have no scheduled tasks
    ganttData.projects = ganttData.projects
      .map((project) => {
        const p = project as Record<string, unknown>;
        return {
          ...project,
          items: (p.items as unknown[]).filter((item: unknown) => {
            const i = item as Record<string, unknown>;
            return (i.tasks as unknown[]).length > 0;
          }),
        };
      })
      .filter((project) => {
        const p = project as Record<string, unknown>;
        return (p.items as unknown[]).length > 0;
      }) as typeof ganttData.projects;

    return NextResponse.json(ganttData);
  } catch (error: unknown) {
    logger.apiError('gantt', '/api/gantt', error);
    const mapped = mapErrorToResponse(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}
