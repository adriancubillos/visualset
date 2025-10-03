import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { mapTaskToResponse, TaskWithRelationsDTO } from '@/types/api';
import { checkSchedulingConflicts, createConflictErrorResponse } from '@/utils/conflictDetection';
import { logger } from '@/utils/logger';

interface TimeSlotInput {
  id?: string;
  startDateTime: string;
  endDateTime?: string;
  durationMin?: number;
}

// GET /api/tasks/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        item: {
          include: {
            project: true,
          },
        },
        machine: true,
        operator: true,
        timeSlots: {
          orderBy: {
            startDateTime: 'asc',
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const mapped = mapTaskToResponse(task as unknown as TaskWithRelationsDTO);
    return NextResponse.json(mapped);
  } catch (error) {
    logger.error('Error fetching task,', error);
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 });
  }
}

// PUT /api/tasks/[id]
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    // Validate quantity fields
    const quantity = body.quantity || 1;
    const completedQuantity = body.completed_quantity || 0;

    if (completedQuantity > quantity) {
      return NextResponse.json({ error: 'Completed quantity cannot exceed total quantity' }, { status: 400 });
    }

    // Handle time slots
    const timeSlots = body.timeSlots || [];

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
          excludeTaskId: id,
          excludeTimeSlotId: slot.id, // Exclude the specific time slot being edited
        });

        if (conflictResult.hasConflict) {
          const errorResponse = createConflictErrorResponse(conflictResult);
          return NextResponse.json(errorResponse, { status: 409 });
        }
      }
    }

    // Use transaction to update task and time slots atomically
    const result = await prisma.$transaction(async (tx) => {
      // Delete existing time slots
      await tx.taskTimeSlot.deleteMany({
        where: { taskId: id },
      });

      // Update task
      const updatedTask = await tx.task.update({
        where: { id },
        data: {
          title: body.title,
          description: body.description,
          status: body.status,
          quantity: quantity,
          completed_quantity: completedQuantity,
          itemId: body.itemId || null,
          machineId: body.machineId || null,
          operatorId: body.operatorId || null,
        },
        include: {
          item: {
            include: {
              project: true,
            },
          },
          machine: true,
          operator: true,
          timeSlots: {
            orderBy: {
              startDateTime: 'asc',
            },
          },
        },
      });

      // Create new time slots
      if (timeSlots.length > 0) {
        const slotsToCreate = timeSlots.map((slot: TimeSlotInput) => {
          const slotDuration = slot.durationMin || 60; // Default to 60 minutes if not specified
          return {
            taskId: id,
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
          where: { id },
          include: {
            item: {
              include: {
                project: true,
              },
            },
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

      return updatedTask;
    });

    const mapped = mapTaskToResponse(result as unknown as TaskWithRelationsDTO);
    return NextResponse.json(mapped);
  } catch (error) {
    logger.error('Error updating task,', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

// PATCH /api/tasks/[id] - For partial updates like status changes
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const task = await prisma.task.update({
      where: { id },
      data: body,
      include: {
        item: {
          include: {
            project: true,
          },
        },
        machine: true,
        operator: true,
        timeSlots: {
          orderBy: {
            startDateTime: 'asc',
          },
        },
      },
    });
    const mapped = mapTaskToResponse(task as unknown as TaskWithRelationsDTO);
    return NextResponse.json(mapped);
  } catch (error) {
    logger.error('Error updating task,', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

// DELETE /api/tasks/[id]
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error) {
    logger.error('Error deleting task,', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
