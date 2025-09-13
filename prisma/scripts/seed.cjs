import { PrismaClient } from '@prisma/client';
import { addDays, setHours, setMinutes } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ---------- Create Machines ----------
  const machines = await prisma.machine.createMany({
    data: [
      { name: 'CNC Lathe', type: 'CNC' },
      { name: 'Milling Machine', type: 'Milling' },
      { name: '3D Printer', type: 'Printer' },
      { name: 'Welding Station', type: 'Welding' },
      { name: 'Paint Booth', type: 'Painting' },
    ],
    skipDuplicates: true,
  });

  const allMachines = await prisma.machine.findMany();

  // ---------- Create Operators ----------
  const operatorsData = [
    { name: 'Alice', skills: ['CNC', 'Milling'], availability: { mon: '08-16', tue: '08-16' } },
    { name: 'Bob', skills: ['Welding', 'Painting'], availability: { mon: '09-17', wed: '09-17' } },
    { name: 'Charlie', skills: ['CNC', '3D Printing'], availability: { tue: '08-16', thu: '08-16' } },
  ];

  const operators = await Promise.all(
    operatorsData.map((op) =>
      prisma.operator.upsert({
        where: { name: op.name },
        update: {},
        create: op,
      }),
    ),
  );

  // ---------- Create 15 Tasks ----------
  const taskTitles = [
    'Task A',
    'Task B',
    'Task C',
    'Task D',
    'Task E',
    'Task F',
    'Task G',
    'Task H',
    'Task I',
    'Task J',
    'Task K',
    'Task L',
    'Task M',
    'Task N',
    'Task O',
  ];

  const tasks = taskTitles.map((title, index) => {
    const randomMachine = allMachines[Math.floor(Math.random() * allMachines.length)];
    const randomOperator = operators[Math.floor(Math.random() * operators.length)];
    const duration = [60, 90, 120, 180][Math.floor(Math.random() * 4)];

    // Schedule tasks randomly next week
    const dayOffset = Math.floor(Math.random() * 7); // 0-6 days from today
    const hour = 8 + Math.floor(Math.random() * 8); // between 8AM and 16PM
    const start = setMinutes(setHours(addDays(new Date(), dayOffset), hour), 0);

    return {
      title,
      description: `Auto-generated task ${title}`,
      durationMin: duration,
      status: 'SCHEDULED',
      machineId: randomMachine.id,
      operatorId: randomOperator.id,
      scheduledAt: start,
    };
  });

  await prisma.task.createMany({ data: tasks });

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
