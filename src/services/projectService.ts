import type { PrismaClient, Prisma } from '@prisma/client';
import { ApiError } from '@/lib/errors';

export type ProjectCreateInput = {
  name: string;
  description?: string | null;
  orderNumber?: number | null;
  status?: string;
  color?: string | null;
  imageUrl?: string | null;
  startDate?: string | null;
  endDate?: string | null;
};

export type ProjectUpdateInput = Partial<ProjectCreateInput>;

export async function listProjects(prisma: PrismaClient) {
  return prisma.project.findMany({
    include: {
      items: {
        include: {
          tasks: {
            include: {
              machine: true,
              operator: true,
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createProject(prisma: PrismaClient, data: ProjectCreateInput) {
  // Check color uniqueness
  if (data.color) {
    const existingProject = await prisma.project.findFirst({ where: { color: data.color } });
    if (existingProject) {
      throw new ApiError({
        code: 'PROJECT_COLOR_CONFLICT',
        message: 'Color is already in use by another project',
        status: 400,
      });
    }
  }

  const createData: Prisma.ProjectCreateInput = {
    name: data.name,
    description: data.description ?? undefined,
    orderNumber: data.orderNumber ?? null,
    status: (data.status ?? 'ACTIVE') as Prisma.InputJsonValue | string,
    color: data.color ?? undefined,
    imageUrl: data.imageUrl ?? undefined,
    startDate: data.startDate ? new Date(data.startDate) : null,
    endDate: data.endDate ? new Date(data.endDate) : null,
  } as Prisma.ProjectCreateInput;

  return prisma.project.create({
    data: createData,
    include: {
      items: { include: { tasks: { include: { machine: true, operator: true }, orderBy: { createdAt: 'desc' } } } },
    },
  });
}

export async function getProject(prisma: PrismaClient, id: string) {
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      items: { include: { tasks: { include: { machine: true, operator: true }, orderBy: { createdAt: 'desc' } } } },
    },
  });

  if (!project) throw new ApiError({ code: 'PROJECT_NOT_FOUND', message: 'Project not found', status: 404 });

  return project;
}

export async function updateProject(prisma: PrismaClient, id: string, data: ProjectUpdateInput) {
  // If trying to set status to COMPLETED, validate that all items are completed
  if (data.status === 'COMPLETED') {
    const projectWithItems = await prisma.project.findUnique({
      where: { id },
      include: { items: { select: { id: true, name: true, status: true } } },
    });

    if (!projectWithItems) throw new ApiError({ code: 'PROJECT_NOT_FOUND', message: 'Project not found', status: 404 });

    const incompleteItems = projectWithItems.items.filter((item) => item.status !== 'COMPLETED');
    if (incompleteItems.length > 0) {
      throw new ApiError({
        code: 'PROJECT_INCOMPLETE_ITEMS',
        message: 'Cannot complete project with incomplete items',
        status: 400,
        details: incompleteItems.map((it) => ({ id: it.id, name: it.name, status: it.status })),
      });
    }
  }

  // Check color uniqueness when updating
  if (data.color) {
    const existingProject = await prisma.project.findFirst({ where: { color: data.color, NOT: { id } } });
    if (existingProject) {
      throw new ApiError({
        code: 'PROJECT_COLOR_CONFLICT',
        message: 'This color is already used by another project',
        status: 400,
      });
    }
  }

  const updateData: Prisma.ProjectUpdateInput = {
    name: data.name ?? undefined,
    description: data.description ?? undefined,
    orderNumber: data.orderNumber ?? null,
    status: data.status ?? undefined,
    color: data.color ?? undefined,
    imageUrl: data.imageUrl ?? undefined,
    startDate: data.startDate ? new Date(data.startDate) : null,
    endDate: data.endDate ? new Date(data.endDate) : null,
  } as Prisma.ProjectUpdateInput;

  return prisma.project.update({
    where: { id },
    data: updateData,
    include: {
      items: { include: { tasks: { include: { machine: true, operator: true }, orderBy: { createdAt: 'desc' } } } },
    },
  });
}

export async function deleteProject(prisma: PrismaClient, id: string) {
  const project = await prisma.project.findUnique({ where: { id }, include: { items: true } });
  if (!project) throw new ApiError({ code: 'PROJECT_NOT_FOUND', message: 'Project not found', status: 404 });

  if (project.items && project.items.length > 0) {
    throw new ApiError({
      code: 'PROJECT_HAS_ITEMS',
      message: 'Cannot delete project with items. Please delete all items first.',
      status: 400,
    });
  }

  await prisma.project.delete({ where: { id } });
  return { message: 'Project deleted successfully' };
}

const exported = { listProjects, createProject, getProject, updateProject, deleteProject };
export default exported;
