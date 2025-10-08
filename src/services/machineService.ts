import type { PrismaClient, Prisma } from '@prisma/client';
import { ApiError } from '@/lib/errors';

export type MachineCreateInput = {
  name: string;
  type?: string | null;
  status?: string;
  location?: string | null;
  color?: string | null;
  pattern?: string | null;
};

export type MachineUpdateInput = Partial<MachineCreateInput>;

export async function listMachines(prisma: PrismaClient) {
  return prisma.machine.findMany();
}

export async function createMachine(prisma: PrismaClient, data: MachineCreateInput) {
  const createData: Prisma.MachineCreateInput = {
    name: data.name,
    type: data.type ?? undefined,
    status: (data.status ?? 'AVAILABLE') as Prisma.InputJsonValue | string,
    location: data.location ?? undefined,
    color: data.color ?? undefined,
    pattern: data.pattern ?? undefined,
  } as Prisma.MachineCreateInput;

  return prisma.machine.create({ data: createData });
}

export async function getMachine(prisma: PrismaClient, id: string) {
  const machine = await prisma.machine.findUnique({
    where: { id },
    include: {
      taskMachines: {
        include: {
          task: {
            include: {
              item: { include: { project: true } },
              taskOperators: { include: { operator: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!machine) throw new ApiError({ code: 'MACHINE_NOT_FOUND', message: 'Machine not found', status: 404 });

  return machine;
}

export async function updateMachine(prisma: PrismaClient, id: string, data: MachineUpdateInput) {
  // ensure exists
  const existing = await prisma.machine.findUnique({ where: { id } });
  if (!existing) throw new ApiError({ code: 'MACHINE_NOT_FOUND', message: 'Machine not found', status: 404 });

  const partial: Partial<Record<string, string | null | undefined>> = {};
  if (data.name !== undefined) partial.name = data.name;
  if (data.type !== undefined) partial.type = data.type ?? null;
  if (data.status !== undefined) partial.status = data.status ?? null;
  if (data.location !== undefined) partial.location = data.location ?? null;
  if (data.color !== undefined) partial.color = data.color ?? null;
  if (data.pattern !== undefined) partial.pattern = data.pattern ?? null;

  const updateData = partial as unknown as Prisma.MachineUpdateInput;

  return prisma.machine.update({ where: { id }, data: updateData });
}

export async function deleteMachine(prisma: PrismaClient, id: string) {
  const tasksCount = await prisma.taskMachine.count({ where: { machineId: id } });
  if (tasksCount > 0) {
    throw new ApiError({
      code: 'MACHINE_HAS_TASKS',
      message: 'Cannot delete machine with assigned tasks',
      status: 400,
    });
  }

  const existing = await prisma.machine.findUnique({ where: { id } });
  if (!existing) throw new ApiError({ code: 'MACHINE_NOT_FOUND', message: 'Machine not found', status: 404 });

  await prisma.machine.delete({ where: { id } });
  return { message: 'Machine deleted successfully' };
}

const exported = {
  listMachines,
  createMachine,
  getMachine,
  updateMachine,
  deleteMachine,
};

export default exported;
