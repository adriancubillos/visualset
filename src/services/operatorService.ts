import type { PrismaClient, Prisma } from '@prisma/client';
import { ApiError } from '@/lib/errors';

export type OperatorCreateInput = {
  name: string;
  email?: string | null;
  skills?: string[];
  status?: string;
  shift?: string | null;
  color?: string | null;
  pattern?: string | null;
  availability?: Record<string, unknown> | null;
};

export type OperatorUpdateInput = Partial<OperatorCreateInput>;

export async function listOperators(prisma: PrismaClient) {
  return prisma.operator.findMany();
}

export async function createOperator(prisma: PrismaClient, data: OperatorCreateInput) {
  const createData: Prisma.OperatorCreateInput = {
    name: data.name,
    email: data.email ?? null,
    skills: data.skills ?? [],
    status: (data.status ?? 'ACTIVE') as Prisma.InputJsonValue | string,
    shift: data.shift ?? null,
    color: data.color ?? null,
    pattern: data.pattern ?? null,
    availability: data.availability ?? {},
  } as Prisma.OperatorCreateInput;

  return prisma.operator.create({ data: createData });
}

export async function getOperator(prisma: PrismaClient, id: string) {
  const operator = await prisma.operator.findUnique({
    where: { id },
    include: {
      tasks: {
        include: {
          item: { include: { project: true } },
          machine: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!operator) throw new ApiError({ code: 'OPERATOR_NOT_FOUND', message: 'Operator not found', status: 404 });

  return operator;
}

export async function updateOperator(prisma: PrismaClient, id: string, data: OperatorUpdateInput) {
  const existing = await prisma.operator.findUnique({ where: { id } });
  if (!existing) throw new ApiError({ code: 'OPERATOR_NOT_FOUND', message: 'Operator not found', status: 404 });

  const partial: Partial<Record<string, string | string[] | Record<string, unknown> | null | undefined>> = {};
  if (data.name !== undefined) partial.name = data.name;
  if (data.email !== undefined) partial.email = data.email ?? null;
  if (data.skills !== undefined) partial.skills = data.skills ?? [];
  if (data.status !== undefined) partial.status = data.status ?? null;
  if (data.shift !== undefined) partial.shift = data.shift ?? null;
  if (data.color !== undefined) partial.color = data.color ?? null;
  if (data.pattern !== undefined) partial.pattern = data.pattern ?? null;
  if (data.availability !== undefined) partial.availability = data.availability ?? null;

  const updateData = partial as unknown as Prisma.OperatorUpdateInput;

  return prisma.operator.update({ where: { id }, data: updateData });
}

export async function deleteOperator(prisma: PrismaClient, id: string) {
  const tasksCount = await prisma.task.count({ where: { operatorId: id } });
  if (tasksCount > 0) {
    throw new ApiError({
      code: 'OPERATOR_HAS_TASKS',
      message: 'Cannot delete operator with assigned tasks',
      status: 400,
    });
  }

  const existing = await prisma.operator.findUnique({ where: { id } });
  if (!existing) throw new ApiError({ code: 'OPERATOR_NOT_FOUND', message: 'Operator not found', status: 404 });

  await prisma.operator.delete({ where: { id } });
  return { message: 'Operator deleted successfully' };
}

const exported = {
  listOperators,
  createOperator,
  getOperator,
  updateOperator,
  deleteOperator,
};

export default exported;
