import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create machines
  const machines = await Promise.all([
    prisma.machine.create({
      data: {
        name: 'CNC Lathe #1',
        type: 'CNC',
        status: 'AVAILABLE',
      },
    }),
    prisma.machine.create({
      data: {
        name: 'CNC Mill #2',
        type: 'CNC',
        status: 'AVAILABLE',
      },
    }),
    prisma.machine.create({
      data: {
        name: 'Welding Station A',
        type: 'Welding',
        status: 'AVAILABLE',
      },
    }),
    prisma.machine.create({
      data: {
        name: 'Drill Press #3',
        type: 'Drilling',
        status: 'MAINTENANCE',
      },
    }),
  ]);

  console.log(`✅ Created ${machines.length} machines`);

  // Create operators
  const operators = await Promise.all([
    prisma.operator.create({
      data: {
        name: 'John Smith',
        skills: ['CNC', 'Welding'],
        availability: {
          mon: '08:00-16:00',
          tue: '08:00-16:00',
          wed: '08:00-16:00',
          thu: '08:00-16:00',
          fri: '08:00-16:00',
        },
      },
    }),
    prisma.operator.create({
      data: {
        name: 'Sarah Johnson',
        skills: ['CNC', 'Drilling', 'Assembly'],
        availability: {
          mon: '09:00-17:00',
          tue: '09:00-17:00',
          wed: '09:00-17:00',
          thu: '09:00-17:00',
          fri: '09:00-17:00',
        },
      },
    }),
    prisma.operator.create({
      data: {
        name: 'Mike Davis',
        skills: ['Welding', 'Assembly'],
        availability: {
          mon: '07:00-15:00',
          tue: '07:00-15:00',
          wed: '07:00-15:00',
          thu: '07:00-15:00',
          fri: '07:00-15:00',
        },
      },
    }),
  ]);

  console.log(`✅ Created ${operators.length} operators`);

  // Create projects
  const projects = await Promise.all([
    prisma.project.create({
      data: {
        name: 'Automotive Parts Manufacturing',
        description: 'Production of precision automotive components for Q1 delivery',
        status: 'ACTIVE',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-03-31'),
      },
    }),
    prisma.project.create({
      data: {
        name: 'Custom Furniture Project',
        description: 'Handcrafted furniture pieces for luxury hotel chain',
        status: 'ACTIVE',
        startDate: new Date('2025-01-15'),
        endDate: new Date('2025-04-15'),
      },
    }),
    prisma.project.create({
      data: {
        name: 'Prototype Development',
        description: 'R&D project for new product line prototypes',
        status: 'ACTIVE',
        startDate: new Date('2025-02-01'),
        endDate: new Date('2025-05-01'),
      },
    }),
  ]);

  console.log(`✅ Created ${projects.length} projects`);

  // Create tasks for each project
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const dayAfter = new Date(today);
  dayAfter.setDate(today.getDate() + 2);
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  const nextWeekPlus1 = new Date(today);
  nextWeekPlus1.setDate(today.getDate() + 8);
  const nextWeekPlus2 = new Date(today);
  nextWeekPlus2.setDate(today.getDate() + 9);

  // Automotive Parts Manufacturing tasks
  const automotiveTasks = await Promise.all([
    prisma.task.create({
      data: {
        title: 'Machine Engine Block Components',
        description: 'CNC machining of aluminum engine block parts',
        durationMin: 240, // 4 hours
        status: 'SCHEDULED',
        projectId: projects[0].id,
        machineId: machines[0].id, // CNC Lathe #1
        operatorId: operators[0].id, // John Smith
        scheduledAt: new Date(today.setHours(9, 0, 0, 0)),
      },
    }),
    prisma.task.create({
      data: {
        title: 'Mill Transmission Housing',
        description: 'Precision milling of transmission housing components',
        durationMin: 180, // 3 hours
        status: 'SCHEDULED',
        projectId: projects[0].id,
        machineId: machines[1].id, // CNC Mill #2
        operatorId: operators[1].id, // Sarah Johnson
        scheduledAt: new Date(today.setHours(13, 30, 0, 0)),
      },
    }),
    prisma.task.create({
      data: {
        title: 'Weld Exhaust Manifold',
        description: 'TIG welding of stainless steel exhaust manifold',
        durationMin: 120, // 2 hours
        status: 'PENDING',
        projectId: projects[0].id,
      },
    }),
    // Additional automotive tasks
    prisma.task.create({
      data: {
        title: 'Machine Cylinder Head',
        description: 'Precision machining of aluminum cylinder head',
        durationMin: 300, // 5 hours
        status: 'SCHEDULED',
        projectId: projects[0].id,
        machineId: machines[1].id, // CNC Mill #2
        operatorId: operators[1].id, // Sarah Johnson
        scheduledAt: new Date(nextWeek.setHours(8, 0, 0, 0)),
      },
    }),
    prisma.task.create({
      data: {
        title: 'Drill Oil Passages',
        description: 'Drilling precision oil passages in engine block',
        durationMin: 90,
        status: 'PENDING',
        projectId: projects[0].id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Assemble Intake Manifold',
        description: 'Assembly of intake manifold components',
        durationMin: 150,
        status: 'SCHEDULED',
        projectId: projects[0].id,
        operatorId: operators[2].id, // Mike Davis
        scheduledAt: new Date(nextWeekPlus1.setHours(10, 0, 0, 0)),
      },
    }),
    prisma.task.create({
      data: {
        title: 'Quality Check Engine Parts',
        description: 'Comprehensive quality inspection of machined parts',
        durationMin: 120,
        status: 'PENDING',
        projectId: projects[0].id,
      },
    }),
  ]);

  // Custom Furniture Project tasks
  const furnitureTasks = await Promise.all([
    prisma.task.create({
      data: {
        title: 'Cut Table Legs',
        description: 'Precision cutting of hardwood table legs',
        durationMin: 90,
        status: 'SCHEDULED',
        projectId: projects[1].id,
        machineId: machines[0].id, // CNC Lathe #1
        operatorId: operators[1].id, // Sarah Johnson
        scheduledAt: new Date(tomorrow.setHours(10, 0, 0, 0)),
      },
    }),
    prisma.task.create({
      data: {
        title: 'Weld Chair Frames',
        description: 'Welding of steel chair frame structures',
        durationMin: 150,
        status: 'SCHEDULED',
        projectId: projects[1].id,
        machineId: machines[2].id, // Welding Station A
        operatorId: operators[2].id, // Mike Davis
        scheduledAt: new Date(tomorrow.setHours(14, 0, 0, 0)),
      },
    }),
    prisma.task.create({
      data: {
        title: 'Drill Mounting Holes',
        description: 'Drilling precise mounting holes for hardware',
        durationMin: 60,
        status: 'PENDING',
        projectId: projects[1].id,
      },
    }),
    // Additional furniture tasks
    prisma.task.create({
      data: {
        title: 'Sand Table Surfaces',
        description: 'Fine sanding of hardwood table surfaces',
        durationMin: 180,
        status: 'SCHEDULED',
        projectId: projects[1].id,
        operatorId: operators[0].id, // John Smith
        scheduledAt: new Date(dayAfter.setHours(9, 0, 0, 0)),
      },
    }),
    prisma.task.create({
      data: {
        title: 'Apply Wood Finish',
        description: 'Application of protective wood finish coating',
        durationMin: 120,
        status: 'PENDING',
        projectId: projects[1].id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Assemble Chair Components',
        description: 'Final assembly of chair frame and seat components',
        durationMin: 90,
        status: 'SCHEDULED',
        projectId: projects[1].id,
        operatorId: operators[2].id, // Mike Davis
        scheduledAt: new Date(nextWeekPlus2.setHours(13, 0, 0, 0)),
      },
    }),
  ]);

  // Prototype Development tasks
  const prototypeTasks = await Promise.all([
    prisma.task.create({
      data: {
        title: 'Machine Prototype Base',
        description: 'Initial machining of prototype base component',
        durationMin: 200,
        status: 'SCHEDULED',
        projectId: projects[2].id,
        machineId: machines[1].id, // CNC Mill #2
        operatorId: operators[0].id, // John Smith
        scheduledAt: new Date(dayAfter.setHours(8, 0, 0, 0)),
      },
    }),
    prisma.task.create({
      data: {
        title: 'Assemble Test Unit',
        description: 'Assembly of first prototype test unit',
        durationMin: 180,
        status: 'PENDING',
        projectId: projects[2].id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Quality Testing',
        description: 'Comprehensive quality testing of prototype',
        durationMin: 120,
        status: 'PENDING',
        projectId: projects[2].id,
      },
    }),
    // Additional prototype tasks
    prisma.task.create({
      data: {
        title: 'Mill Prototype Housing',
        description: 'Precision milling of prototype housing components',
        durationMin: 240,
        status: 'SCHEDULED',
        projectId: projects[2].id,
        machineId: machines[1].id, // CNC Mill #2
        operatorId: operators[0].id, // John Smith
        scheduledAt: new Date(nextWeek.setHours(14, 0, 0, 0)),
      },
    }),
    prisma.task.create({
      data: {
        title: 'Weld Prototype Frame',
        description: 'Welding of prototype structural frame',
        durationMin: 180,
        status: 'SCHEDULED',
        projectId: projects[2].id,
        machineId: machines[2].id, // Welding Station A
        operatorId: operators[2].id, // Mike Davis
        scheduledAt: new Date(nextWeekPlus1.setHours(14, 30, 0, 0)),
      },
    }),
    prisma.task.create({
      data: {
        title: 'Machine Precision Gears',
        description: 'CNC machining of precision gear components',
        durationMin: 360, // 6 hours
        status: 'PENDING',
        projectId: projects[2].id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Calibrate Test Equipment',
        description: 'Calibration of testing equipment for prototype validation',
        durationMin: 90,
        status: 'PENDING',
        projectId: projects[2].id,
      },
    }),
  ]);

  const totalTasks = automotiveTasks.length + furnitureTasks.length + prototypeTasks.length;
  console.log(`✅ Created ${totalTasks} tasks across all projects`);

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`- ${machines.length} machines`);
  console.log(`- ${operators.length} operators`);
  console.log(`- ${projects.length} projects`);
  console.log(`- ${totalTasks} tasks`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
