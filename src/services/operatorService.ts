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
      taskOperators: {
        include: {
          task: {
            include: {
              item: { include: { project: true } },
              taskMachines: { include: { machine: true } },
              // Include taskOperators and timeSlots so we can map assigned operators and timeSlots
              taskOperators: { include: { operator: true } },
              timeSlots: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!operator) throw new ApiError({ code: 'OPERATOR_NOT_FOUND', message: 'Operator not found', status: 404 });

  // Map taskOperators to a simpler tasks array consumed by the UI
  type MappedTask = {
    id: string;
    title: string;
    status: string;
    priority: string;
    item?: { id: string; name: string; project?: { id: string; name: string } };
    machines?: { id: string; name: string }[];
    operators?: { id: string; name: string }[];
    timeSlots?: { id: string; startDateTime: string; endDateTime?: string | null; durationMin: number }[];
  };

  const tasks: MappedTask[] = (operator.taskOperators || []).map((to) => {
    const tRec = to.task as unknown as Record<string, unknown> | null;

    const id = tRec && typeof tRec['id'] === 'string' ? (tRec['id'] as string) : '';
    const title = tRec && typeof tRec['title'] === 'string' ? (tRec['title'] as string) : '';
    const status = tRec && typeof tRec['status'] === 'string' ? (tRec['status'] as string) : '';
    const priority = tRec && typeof tRec['priority'] === 'string' ? (tRec['priority'] as string) : 'MEDIUM';

    let item: MappedTask['item'] | undefined = undefined;
    if (tRec && typeof tRec['item'] === 'object' && tRec['item'] !== null) {
      const itemRec = tRec['item'] as Record<string, unknown>;
      if (typeof itemRec['id'] === 'string' && typeof itemRec['name'] === 'string') {
        item = {
          id: itemRec['id'] as string,
          name: itemRec['name'] as string,
          project:
            itemRec['project'] &&
            typeof itemRec['project'] === 'object' &&
            typeof (itemRec['project'] as Record<string, unknown>)['id'] === 'string'
              ? {
                  id: (itemRec['project'] as Record<string, unknown>)['id'] as string,
                  name: (itemRec['project'] as Record<string, unknown>)['name'] as string,
                }
              : undefined,
        };
      }
    }

    // machines: map all taskMachines -> machine
    let machinesArr: MappedTask['machines'] | undefined = undefined;
    if (tRec && Array.isArray(tRec['taskMachines'])) {
      const tms = tRec['taskMachines'] as unknown[];
      const mapped = tms
        .map((tm) => (tm && typeof tm === 'object' ? (tm as Record<string, unknown>) : undefined))
        .map((tmRec) => {
          const m =
            tmRec && typeof tmRec['machine'] === 'object' ? (tmRec['machine'] as Record<string, unknown>) : undefined;
          if (m && typeof m['id'] === 'string' && typeof m['name'] === 'string') {
            return { id: m['id'] as string, name: m['name'] as string };
          }
          return undefined;
        })
        .filter((x): x is { id: string; name: string } => !!x);
      if (mapped.length > 0) machinesArr = mapped;
    }

    // operators: map taskOperators -> operator (users assigned to the task)
    let operatorsArr: MappedTask['operators'] | undefined = undefined;
    if (tRec && Array.isArray(tRec['taskOperators'])) {
      const tops = tRec['taskOperators'] as unknown[];
      const mappedOps = tops
        .map((toRec) => (toRec && typeof toRec === 'object' ? (toRec as Record<string, unknown>) : undefined))
        .map((tor) => {
          const op =
            tor && typeof tor['operator'] === 'object' ? (tor['operator'] as Record<string, unknown>) : undefined;
          if (op && typeof op['id'] === 'string' && typeof op['name'] === 'string') {
            return { id: op['id'] as string, name: op['name'] as string };
          }
          return undefined;
        })
        .filter((x): x is { id: string; name: string } => !!x);
      if (mappedOps.length > 0) operatorsArr = mappedOps;
    }

    // timeSlots: map if available
    let timeSlotsArr: MappedTask['timeSlots'] | undefined = undefined;
    if (tRec && Array.isArray(tRec['timeSlots'])) {
      const tss = tRec['timeSlots'] as unknown[];
      const mappedTs = tss
        .map((ts) => (ts && typeof ts === 'object' ? (ts as Record<string, unknown>) : undefined))
        .map((tsRec) => {
          if (tsRec && typeof tsRec['id'] === 'string') {
            // startDateTime/endDateTime may be JS Date objects (from Prisma) or strings.
            const rawStart = tsRec['startDateTime'];
            const rawEnd = tsRec['endDateTime'];

            const startDateTime =
              typeof rawStart === 'string' ? rawStart : rawStart instanceof Date ? rawStart.toISOString() : '';

            let endDateTime: string | null | undefined;
            if (rawEnd === undefined) {
              endDateTime = undefined;
            } else if (typeof rawEnd === 'string') {
              endDateTime = rawEnd;
            } else if (rawEnd instanceof Date) {
              endDateTime = rawEnd.toISOString();
            } else {
              endDateTime = null;
            }

            return {
              id: tsRec['id'] as string,
              startDateTime,
              endDateTime,
              durationMin: typeof tsRec['durationMin'] === 'number' ? (tsRec['durationMin'] as number) : 0,
            } as { id: string; startDateTime: string; endDateTime?: string | null; durationMin: number };
          }
          return undefined;
        })
        .filter(
          (x): x is { id: string; startDateTime: string; endDateTime?: string | null; durationMin: number } =>
            x !== undefined,
        );
      if (mappedTs.length > 0) timeSlotsArr = mappedTs;
    }

    return {
      id,
      title,
      status,
      priority,
      item,
      machines: machinesArr,
      operators: operatorsArr,
      timeSlots: timeSlotsArr,
    };
  });

  // Return operator object extended with tasks
  return { ...operator, tasks };
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
  const tasksCount = await prisma.taskOperator.count({ where: { operatorId: id } });
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
