import { PrismaClient } from '@prisma/client';
import { addDays, setHours, setMinutes } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // --- Clear existing data ---
  await prisma.task.deleteMany();
  await prisma.item.deleteMany();
  await prisma.project.deleteMany();
  await prisma.operator.deleteMany();
  await prisma.machine.deleteMany();

  // --- Machines ---
  const machines = await Promise.all([
    prisma.machine.create({
      data: { name: 'Cortadora CNC-001', type: 'CNC', status: 'AVAILABLE', location: 'Workshop A - Bay 1' },
    }),
    prisma.machine.create({
      data: { name: 'Impresora 3D Prusa', type: '3D_Printer', status: 'AVAILABLE', location: 'Workshop B - Station 3' },
    }),
    prisma.machine.create({
      data: { name: 'Soldadora MIG-200', type: 'Welding', status: 'AVAILABLE', location: 'Workshop A - Bay 2' },
    }),
    prisma.machine.create({
      data: { name: 'Taladro Industrial', type: 'Drilling', status: 'AVAILABLE', location: 'Workshop A - Bay 3' },
    }),
    prisma.machine.create({
      data: { name: 'Fresadora CNC-002', type: 'CNC', status: 'MAINTENANCE', location: 'Workshop A - Bay 4' },
    }),
    prisma.machine.create({
      data: { name: 'Cortadora Laser', type: 'Laser', status: 'AVAILABLE', location: 'Workshop B - Station 1' },
    }),
  ]);

  // --- Operators ---
  const operators = await Promise.all([
    prisma.operator.create({
      data: {
        name: 'Paula Castillo',
        email: 'paula.castillo@workshop.com',
        skills: ['CNC_MILL', 'WELDING'],
        status: 'ACTIVE',
        shift: 'DAY',
        availability: { mon: '08-16', tue: '08-16', wed: '08-16', thu: '08-16', fri: '08-16' },
      },
    }),
    prisma.operator.create({
      data: {
        name: 'Jorge Gonzalez',
        email: 'jorge.gonzalez@workshop.com',
        skills: ['CNC_MILL', 'DRILL_PRESS', 'ASSEMBLY'],
        status: 'ACTIVE',
        shift: 'DAY',
        availability: { mon: '09-17', tue: '09-17', wed: '09-17', thu: '09-17', fri: '09-17' },
      },
    }),
    prisma.operator.create({
      data: {
        name: 'Mike Davis',
        email: 'mike.davis@workshop.com',
        skills: ['WELDING', 'ASSEMBLY'],
        status: 'ACTIVE',
        shift: 'EVENING',
        availability: { mon: '07-15', tue: '07-15', wed: '07-15', thu: '07-15', fri: '07-15' },
      },
    }),
    prisma.operator.create({
      data: {
        name: 'Ana Rodriguez',
        email: 'ana.rodriguez@workshop.com',
        skills: ['3D_PRINTING', 'QUALITY_CONTROL'],
        status: 'ACTIVE',
        shift: 'DAY',
        availability: { mon: '08-16', tue: '08-16', wed: '08-16', thu: '08-16', fri: '08-16' },
      },
    }),
    prisma.operator.create({
      data: {
        name: 'Carlos Mendez',
        email: 'carlos.mendez@workshop.com',
        skills: ['LASER_CUTTING', 'SHEET_METAL'],
        status: 'ACTIVE',
        shift: 'DAY',
        availability: { mon: '08-16', tue: '08-16', wed: '08-16', thu: '08-16', fri: '08-16' },
      },
    }),
  ]);

  console.log(`✅ Created ${machines.length} machines`);
  console.log(`✅ Created ${operators.length} operators`);

  // --- Projects ---
  const projects = await Promise.all([
    prisma.project.create({
      data: {
        name: 'CORAZON DOS AND DONTS',
        description: 'Precision automotive components manufacturing',
        status: 'ACTIVE',
        color: '#3B82F6',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-03-31'),
      },
    }),
    prisma.project.create({
      data: {
        name: 'BANCA EXAGONAL',
        description: 'Luxury hexagonal furniture production',
        status: 'ACTIVE',
        color: '#10B981',
        startDate: new Date('2025-01-15'),
        endDate: new Date('2025-04-15'),
      },
    }),
    prisma.project.create({
      data: {
        name: 'ALGODONES',
        description: 'Cotton processing equipment R&D',
        status: 'ACTIVE',
        color: '#F59E0B',
        startDate: new Date('2025-02-01'),
        endDate: new Date('2025-05-01'),
      },
    }),
    prisma.project.create({
      data: {
        name: 'TUNEL ARCOS',
        description: 'Architectural arch tunnel construction components',
        status: 'ON_HOLD',
        color: '#EF4444',
        startDate: new Date('2025-02-01'),
        endDate: new Date('2025-05-01'),
      },
    }),
    prisma.project.create({
      data: {
        name: 'PROTOTIPO MESA',
        description: 'Custom table prototype development',
        status: 'COMPLETED',
        color: '#8B5CF6',
        startDate: new Date('2024-12-01'),
        endDate: new Date('2024-12-31'),
      },
    }),
  ]);

  console.log(`✅ Created ${projects.length} projects`);

  // --- Items (5-7 items per project) ---
  const allItems = [];
  for (const project of projects) {
    const itemCount = 5 + Math.floor(Math.random() * 3); // 5-7 items
    for (let i = 1; i <= itemCount; i++) {
      const item = await prisma.item.create({
        data: {
          name: `${project.name.split(' ')[0]} Item ${i}`,
          description: `Item ${i} for ${project.name}`,
          status: 'ACTIVE',
          projectId: project.id,
        },
      });
      allItems.push(item);
    }
  }

  console.log(`✅ Created ${allItems.length} items across projects`);

  // --- Tasks (8-12 tasks per item) ---
  const scheduledTasks: any[] = [];
  const startOfDay = 8; // 8 AM
  const endOfDay = 17; // 5 PM

  // Track machine and operator schedules to prevent conflicts
  const machineSchedules = new Map<string, Array<{ start: Date; end: Date }>>();
  const operatorSchedules = new Map<string, Array<{ start: Date; end: Date }>>();

  // Initialize schedule maps
  machines.forEach((machine) => machineSchedules.set(machine.id, []));
  operators.forEach((operator) => operatorSchedules.set(operator.id, []));

  // Helper function to check if two time periods overlap
  const hasTimeConflict = (start1: Date, end1: Date, start2: Date, end2: Date): boolean => {
    return start1 < end2 && end1 > start2;
  };

  // Helper function to find available machine and operator for a time slot
  const findAvailableResources = (startTime: Date, endTime: Date) => {
    const availableMachine = machines.find((machine) => {
      const schedule = machineSchedules.get(machine.id) || [];
      return !schedule.some((booking) => hasTimeConflict(startTime, endTime, booking.start, booking.end));
    });

    const availableOperator = operators.find((operator) => {
      const schedule = operatorSchedules.get(operator.id) || [];
      return !schedule.some((booking) => hasTimeConflict(startTime, endTime, booking.start, booking.end));
    });

    return { machine: availableMachine, operator: availableOperator };
  };

  let currentDate = new Date();
  let taskCounter = 1;

  // Create tasks for each item
  for (const item of allItems) {
    const taskCount = 8 + Math.floor(Math.random() * 5); // 8-12 tasks per item

    for (let t = 1; t <= taskCount; t++) {
      const duration = 60 + Math.floor(Math.random() * 120); // 1–3 hours

      // Decide if this task should be scheduled (70% chance) or pending
      const shouldSchedule = Math.random() < 0.7;

      if (shouldSchedule) {
        // Try to schedule the task
        let scheduled = false;
        let dayOffset = 1;

        while (!scheduled && dayOffset <= 14) {
          // Try up to 2 weeks
          const date = addDays(currentDate, dayOffset);

          for (let hour = startOfDay; hour < endOfDay - 1; hour += 0.5) {
            const startTime = setHours(setMinutes(date, 0), Math.floor(hour));
            const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

            const { machine, operator } = findAvailableResources(startTime, endTime);

            if (machine && operator) {
              // Book the resources
              machineSchedules.get(machine.id)?.push({ start: startTime, end: endTime });
              operatorSchedules.get(operator.id)?.push({ start: startTime, end: endTime });

              scheduledTasks.push({
                title: `${item.name} - Task ${t}`,
                description: `Task ${t} for item: ${item.name}`,
                durationMin: duration,
                status: Math.random() > 0.3 ? 'IN_PROGRESS' : 'COMPLETED',
                itemId: item.id,
                machineId: machine.id,
                operatorId: operator.id,
                scheduledAt: startTime,
              });

              scheduled = true;
              break;
            }
          }
          dayOffset++;
        }

        // If couldn't schedule, make it pending
        if (!scheduled) {
          scheduledTasks.push({
            title: `${item.name} - Task ${t}`,
            description: `Task ${t} for item: ${item.name}`,
            durationMin: duration,
            status: 'PENDING',
            itemId: item.id,
            machineId: null,
            operatorId: null,
            scheduledAt: null,
          });
        }
      } else {
        // Create as pending task
        scheduledTasks.push({
          title: `${item.name} - Task ${t}`,
          description: `Task ${t} for item: ${item.name}`,
          durationMin: duration,
          status: 'PENDING',
          itemId: item.id,
          machineId: null,
          operatorId: null,
          scheduledAt: null,
        });
      }
      taskCounter++;
    }
  }

  await prisma.task.createMany({ data: scheduledTasks, skipDuplicates: true });

  const scheduled = scheduledTasks.filter((t) => t.scheduledAt !== null).length;
  const pending = scheduledTasks.filter((t) => t.status === 'PENDING').length;

  console.log(`✅ Created ${scheduledTasks.length} tasks (${scheduled} scheduled, ${pending} pending)`);
  console.log('🎉 Database seeding completed successfully!');

  // Summary
  console.log('\n📊 Summary:');
  console.log(`• ${projects.length} Projects`);
  console.log(`• ${allItems.length} Items (${Math.round(allItems.length / projects.length)} avg per project)`);
  console.log(`• ${scheduledTasks.length} Tasks (${Math.round(scheduledTasks.length / allItems.length)} avg per item)`);
  console.log(`• ${machines.length} Machines`);
  console.log(`• ${operators.length} Operators`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
