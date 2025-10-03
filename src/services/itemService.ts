import type { PrismaClient, ItemStatus, Prisma } from '@prisma/client';
import { ApiError } from '@/lib/errors';

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
          machine: { select: { id: true, name: true } },
          operator: { select: { id: true, name: true } },
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

  return prisma.item.update({
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
