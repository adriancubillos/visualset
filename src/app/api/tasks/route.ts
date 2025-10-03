import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { mapTaskToResponse, TaskResponseDTO, TaskWithRelationsDTO } from '@/types/api';
import { checkSchedulingConflicts, createConflictErrorResponse } from '@/utils/conflictDetection';
import { logger } from '@/utils/logger';

interface TimeSlotInput {
  startDateTime: string;
  endDateTime?: string;
  durationMin?: number;
}

// GET /api/tasks
export async function GET() {
  const tasks = await prisma.task.findMany({
    include: {
      item: { include: { project: true } },
      machine: true,
      operator: true,
      timeSlots: {
        orderBy: {
          startDateTime: 'asc',
        },
      },
    },
  });

  const mapped: TaskResponseDTO[] = tasks.map((t) => mapTaskToResponse(t as unknown as TaskWithRelationsDTO));
  return NextResponse.json(mapped);
}

// POST /api/tasks
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Handle time slots
    const timeSlots = body.timeSlots || [];

    // Resolve itemId: prefer explicit itemId, otherwise accept projectId and find/create a default Item
    let itemId: string | null = body.itemId ?? null;
    if (!itemId && body.projectId) {
      let item = await prisma.item.findFirst({ where: { projectId: body.projectId } });
      if (!item) {
        item = await prisma.item.create({ data: { projectId: body.projectId, name: 'Default Item' } });
      }
      itemId = item.id;
    }

    // Validate time slots and check for conflicts
    // First, check for conflicts within the same task's time slots
    for (let i = 0; i < timeSlots.length; i++) {
      for (let j = i + 1; j < timeSlots.length; j++) {
        const slotA = timeSlots[i];
        const slotB = timeSlots[j];

        if (slotA.startDateTime && slotB.startDateTime) {
          const startA = new Date(slotA.startDateTime);
          const endA = new Date(startA.getTime() + (slotA.durationMin || 60) * 60 * 1000);
          const startB = new Date(slotB.startDateTime);
          const endB = new Date(startB.getTime() + (slotB.durationMin || 60) * 60 * 1000);

          // Check if time slots overlap
          if (startA < endB && endA > startB) {
            return NextResponse.json({ error: 'Time slots within the same task cannot overlap' }, { status: 400 });
          }
        }
      }
    }

    // Then check for conflicts with other tasks
    for (const slot of timeSlots) {
      if (slot.startDateTime && (body.machineId || body.operatorId)) {
        const conflictResult = await checkSchedulingConflicts({
          scheduledAt: slot.startDateTime,
          durationMin: slot.durationMin || 60, // Use slot duration or default to 60
          machineId: body.machineId,
          operatorId: body.operatorId,
        });

        if (conflictResult.hasConflict) {
          const errorResponse = createConflictErrorResponse(conflictResult);
          return NextResponse.json(errorResponse, { status: 409 });
        }
      }
    }

    // Use transaction to create task and time slots atomically
    const result = await prisma.$transaction(async (tx) => {
      // Create task
      const newTask = await tx.task.create({
        data: {
          title: body.title,
          description: body.description,
          status: body.status ?? 'PENDING',
          quantity: body.quantity || 1,
          completed_quantity: body.completed_quantity || 0,
          itemId: itemId,
          machineId: body.machineId ?? null,
          operatorId: body.operatorId ?? null,
        },
        include: {
          item: { include: { project: true } },
          machine: true,
          operator: true,
          timeSlots: {
            orderBy: {
              startDateTime: 'asc',
            },
          },
        },
      });

      // Create time slots if provided
      if (timeSlots.length > 0) {
        const slotsToCreate = timeSlots.map((slot: TimeSlotInput) => {
          const slotDuration = slot.durationMin || 60; // Default to 60 minutes if not specified
          return {
            taskId: newTask.id,
            startDateTime: new Date(slot.startDateTime),
            endDateTime: slot.endDateTime
              ? new Date(slot.endDateTime)
              : new Date(new Date(slot.startDateTime).getTime() + slotDuration * 60000),
            durationMin: slotDuration,
          };
        });

        await tx.taskTimeSlot.createMany({
          data: slotsToCreate,
        });

        // Fetch updated task with new time slots
        return await tx.task.findUnique({
          where: { id: newTask.id },
          include: {
            item: { include: { project: true } },
            machine: true,
            operator: true,
            timeSlots: {
              orderBy: {
                startDateTime: 'asc',
              },
            },
          },
        });
      }

      return newTask;
    });

    const mapped = mapTaskToResponse(result as unknown as TaskWithRelationsDTO);
    return NextResponse.json(mapped);
  } catch (error) {
    logger.error('Error creating task,', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
