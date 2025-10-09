import type { PrismaClient, ItemStatus, ProjectStatus, Prisma } from '@prisma/client';
import { ApiError } from '@/lib/errors';
import { logger } from '@/utils/logger';
import { checkProjectCompletionReadiness } from '@/utils/projectValidation';

export type ItemCreateInput = {
  name: string;
  description?: string | null;
  status?: ItemStatus;
  quantity?: number;
  measure?: string | null;
  imageUrl?: string | null;
  // make projectId required for stricter relation-style creation
  projectId: string;
};

export type ItemUpdateInput = Partial<ItemCreateInput> & {
  projectId?: string | null;
};

export async function listItems(prisma: PrismaClient) {
  return prisma.item.findMany({
    include: {
      project: {
        select: { id: true, name: true },
      },
      _count: { select: { tasks: true } },
      tasks: {
        select: {
          id: true,
          title: true,
          status: true,
          quantity: true,
          completed_quantity: true,
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function createItem(prisma: PrismaClient, data: ItemCreateInput) {
  const createData: Prisma.ItemCreateInput = {
    name: data.name,
    description: data.description ?? null,
    status: (data.status ?? 'ACTIVE') as ItemStatus,
    quantity: data.quantity ?? 1,
    measure: data.measure ?? null,
    imageUrl: data.imageUrl ?? null,
    project: { connect: { id: data.projectId } },
  };

  return prisma.item.create({
    data: createData,
    include: {
      project: { select: { id: true, name: true } },
      _count: { select: { tasks: true } },
    },
  });
}

export async function getItem(prisma: PrismaClient, id: string) {
  const item = await prisma.item.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, name: true, description: true } },
      tasks: {
        include: {
          taskMachines: { include: { machine: { select: { id: true, name: true } } } },
          taskOperators: { include: { operator: { select: { id: true, name: true } } } },
          timeSlots: { orderBy: { startDateTime: 'asc' } },
        },
        orderBy: { updatedAt: 'desc' },
      },
    },
  });

  if (!item) {
    throw new ApiError({ code: 'ITEM_NOT_FOUND', message: 'Item not found', status: 404 });
  }

  return item;
}

// Helper function to check and auto-update project status based on item completion
async function checkAndUpdateProjectStatus(prisma: PrismaClient, projectId: string) {
  try {
    // Get project with all its items
    const projectWithItems = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        items: {
          select: { id: true, name: true, status: true },
        },
      },
    });

    if (!projectWithItems) {
      return; // Project not found, nothing to update
    }

    const completionStatus = checkProjectCompletionReadiness(projectWithItems.items);
    let newProjectStatus = projectWithItems.status;

    // Auto-update project status based on item completion
    if (
      completionStatus.canComplete &&
      completionStatus.completedItems === completionStatus.totalItems &&
      projectWithItems.status !== 'COMPLETED'
    ) {
      newProjectStatus = 'COMPLETED';
    } else if (
      completionStatus.completedItems > 0 &&
      completionStatus.completedItems < completionStatus.totalItems &&
      projectWithItems.status === 'COMPLETED'
    ) {
      newProjectStatus = 'ACTIVE'; // Revert from completed if some items become incomplete
    }

    // Update project status if it changed
    if (newProjectStatus !== projectWithItems.status) {
      await prisma.project.update({
        where: { id: projectId },
        data: { status: newProjectStatus as ProjectStatus }, // Cast to handle enum type
      });

      logger.info(`Auto-updated project "${projectWithItems.name}" status to ${newProjectStatus}`);
    }
  } catch (error) {
    console.error('Error auto-updating project status:', error);
    // Don't throw error to avoid breaking the main item update operation
  }
}

export async function updateItem(prisma: PrismaClient, id: string, data: ItemUpdateInput) {
  // If status is being changed to COMPLETED, validate tasks
  if (data.status === 'COMPLETED') {
    const itemWithTasks = await prisma.item.findUnique({
      where: { id },
      include: { tasks: { select: { id: true, title: true, status: true } } },
    });

    if (!itemWithTasks) {
      throw new ApiError({ code: 'ITEM_NOT_FOUND', message: 'Item not found', status: 404 });
    }

    const incomplete = itemWithTasks.tasks.filter((t) => t.status !== 'COMPLETED');
    if (incomplete.length > 0) {
      const titles = incomplete.map((t) => t.title).join(', ');
      throw new ApiError({
        code: 'ITEM_INCOMPLETE_TASKS',
        message: 'Cannot complete item with incomplete tasks',
        status: 400,
        details: {
          incompleteTasks: incomplete.map((t) => ({ id: t.id, title: t.title, status: t.status })),
          message: `The following tasks must be completed first: ${titles}`,
        },
      });
    }
  }

  const updatedItem = await prisma.item.update({
    where: { id },
    data: ((): Prisma.ItemUpdateInput => {
      const d: Record<string, unknown> = {
        description: data.description ?? null,
        quantity: data.quantity ?? 1,
        measure: data.measure ?? null,
        imageUrl: data.imageUrl ?? null,
      };

      if (data.name !== undefined) d.name = data.name;
      if (data.status !== undefined) d.status = data.status as ItemStatus;
      if (data.projectId !== undefined && data.projectId !== null) d.project = { connect: { id: data.projectId } };

      return d as Prisma.ItemUpdateInput;
    })(),
    include: {
      project: { select: { id: true, name: true } },
      _count: { select: { tasks: true } },
    },
  });

  // If item status changed, check if project status should be auto-updated
  if (data.status !== undefined && updatedItem.project) {
    await checkAndUpdateProjectStatus(prisma, updatedItem.project.id);
  }

  return updatedItem;
}

export async function deleteItem(prisma: PrismaClient, id: string) {
  const itemWithTasks = await prisma.item.findUnique({
    where: { id },
    include: { _count: { select: { tasks: true } } },
  });

  if (!itemWithTasks) {
    throw new ApiError({ code: 'ITEM_NOT_FOUND', message: 'Item not found', status: 404 });
  }

  if (itemWithTasks._count.tasks > 0) {
    throw new ApiError({ code: 'ITEM_HAS_TASKS', message: 'Cannot delete item with existing tasks', status: 400 });
  }

  await prisma.item.delete({ where: { id } });

  return { message: 'Item deleted successfully' };
}

const exported = {
  listItems,
  createItem,
  getItem,
  updateItem,
  deleteItem,
};

export default exported;
