import { PrismaClient } from '@prisma/client';
import { addDays, setHours, setMinutes } from 'date-fns';
import { seedConfigurationsIfEmpty } from './seed-configurations-auto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // --- First, ensure configurations are seeded ---
  console.log('📋 Ensuring configurations are available...');
  await seedConfigurationsIfEmpty();

  // --- Get available skills from configuration ---
  const availableSkills = await prisma.configuration.findMany({
    where: { category: 'AVAILABLE_SKILLS' },
    select: { value: true },
  });

  const skillValues = availableSkills.map((skill) => skill.value);
  console.log(`📋 Found ${skillValues.length} available skills:`, skillValues);

  // --- Get available shifts from configuration ---
  const availableShifts = await prisma.configuration.findMany({
    where: { category: 'OPERATOR_SHIFTS' },
    select: { value: true },
  });

  const shiftValues = availableShifts.map((shift) => shift.value);
  console.log(`📋 Found ${shiftValues.length} available shifts:`, shiftValues);

  // --- Get available machine types from configuration ---
  const availableMachineTypes = await prisma.configuration.findMany({
    where: { category: 'MACHINE_TYPES' },
    select: { value: true },
  });

  const machineTypeValues = availableMachineTypes.map((type) => type.value);
  console.log(`📋 Found ${machineTypeValues.length} available machine types:`, machineTypeValues);

  // --- Clear existing data ---
  await prisma.task.deleteMany();
  await prisma.item.deleteMany();
  await prisma.project.deleteMany();
  await prisma.operator.deleteMany();
  await prisma.machine.deleteMany();

  // Helper function to get random configured values
  const getRandomSkills = (count: number = 2) => {
    if (skillValues.length === 0) return [];
    const shuffled = [...skillValues].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, skillValues.length));
  };

  const getRandomMachineType = () => {
    if (machineTypeValues.length === 0) return 'DEFAULT_TYPE';
    return machineTypeValues[Math.floor(Math.random() * machineTypeValues.length)];
  };

  const getRandomShift = () => {
    if (shiftValues.length === 0) return 'DAY';
    return shiftValues[Math.floor(Math.random() * shiftValues.length)];
  };

  // --- Machines (10 machines with diverse types and locations) ---
  const machines = await Promise.all([
    prisma.machine.create({
      data: {
        name: 'Cortadora CNC-001',
        type: getRandomMachineType(),
        status: 'AVAILABLE',
        location: 'Workshop A - Bay 1',
      },
    }),
    prisma.machine.create({
      data: {
        name: 'Impresora 3D Prusa',
        type: getRandomMachineType(),
        status: 'AVAILABLE',
        location: 'Workshop B - Station 3',
      },
    }),
    prisma.machine.create({
      data: {
        name: 'Soldadora MIG-200',
        type: getRandomMachineType(),
        status: 'AVAILABLE',
        location: 'Workshop A - Bay 2',
      },
    }),
    prisma.machine.create({
      data: {
        name: 'Taladro Industrial',
        type: getRandomMachineType(),
        status: 'AVAILABLE',
        location: 'Workshop A - Bay 3',
      },
    }),
    prisma.machine.create({
      data: {
        name: 'Fresadora CNC-002',
        type: getRandomMachineType(),
        status: 'MAINTENANCE',
        location: 'Workshop A - Bay 4',
      },
    }),
    prisma.machine.create({
      data: {
        name: 'Cortadora Laser',
        type: getRandomMachineType(),
        status: 'AVAILABLE',
        location: 'Workshop B - Station 1',
      },
    }),
    prisma.machine.create({
      data: {
        name: 'Torno CNC-003',
        type: getRandomMachineType(),
        status: 'AVAILABLE',
        location: 'Workshop A - Bay 5',
      },
    }),
    prisma.machine.create({
      data: {
        name: 'Prensa Hidraulica',
        type: getRandomMachineType(),
        status: 'AVAILABLE',
        location: 'Workshop C - Area 1',
      },
    }),
    prisma.machine.create({
      data: {
        name: 'Centro Mecanizado MC-400',
        type: getRandomMachineType(),
        status: 'IN_USE',
        location: 'Workshop A - Bay 6',
      },
    }),
    prisma.machine.create({
      data: {
        name: 'Estacion de Ensamble',
        type: getRandomMachineType(),
        status: 'AVAILABLE',
        location: 'Workshop C - Area 2',
      },
    }),
  ]);

  // --- Operators (30 operators with diverse skills) ---
  const operatorData = [
    {
      name: 'Paula Castillo',
      email: 'paula.castillo@workshop.com',
      skills: getRandomSkills(2),
      shift: getRandomShift(),
      availability: { mon: '08-16', tue: '08-16', wed: '08-16', thu: '08-16', fri: '08-16' },
    },
    {
      name: 'Jorge Gonzalez',
      email: 'jorge.gonzalez@workshop.com',
      skills: getRandomSkills(3),
      shift: getRandomShift(),
      availability: { mon: '09-17', tue: '09-17', wed: '09-17', thu: '09-17', fri: '09-17' },
    },
    {
      name: 'Mike Davis',
      email: 'mike.davis@workshop.com',
      skills: getRandomSkills(2),
      shift: getRandomShift(),
      availability: { mon: '07-15', tue: '07-15', wed: '07-15', thu: '07-15', fri: '07-15' },
    },
    {
      name: 'Ana Rodriguez',
      email: 'ana.rodriguez@workshop.com',
      skills: getRandomSkills(2),
      shift: getRandomShift(),
      availability: { mon: '08-16', tue: '08-16', wed: '08-16', thu: '08-16', fri: '08-16' },
    },
    {
      name: 'Carlos Mendez',
      email: 'carlos.mendez@workshop.com',
      skills: getRandomSkills(2),
      shift: getRandomShift(),
      availability: { mon: '08-16', tue: '08-16', wed: '08-16', thu: '08-16', fri: '08-16' },
    },
    {
      name: 'Alice Johnson',
      email: 'alice.johnson@workshop.com',
      skills: getRandomSkills(2),
      shift: getRandomShift(),
      availability: { mon: '08-16', tue: '08-16', wed: '08-16', thu: '08-16', fri: '08-16' },
    },
    {
      name: 'Bob Smith',
      email: 'bob.smith@workshop.com',
      skills: getRandomSkills(2),
      shift: getRandomShift(),
      availability: { mon: '08-16', tue: '08-16', wed: '08-16', thu: '08-16', fri: '08-16' },
    },
    {
      name: 'Carol Davis',
      email: 'carol.davis@workshop.com',
      skills: getRandomSkills(2),
      shift: getRandomShift(),
      availability: { mon: '16-00', tue: '16-00', wed: '16-00', thu: '16-00', fri: '16-00' },
    },
    {
      name: 'David Wilson',
      email: 'david.wilson@workshop.com',
      skills: getRandomSkills(2),
      shift: getRandomShift(),
      availability: { mon: '08-16', tue: '08-16', wed: '08-16', thu: '08-16', fri: '08-16' },
    },
    {
      name: 'Eva Martinez',
      email: 'eva.martinez@workshop.com',
      skills: getRandomSkills(2),
      shift: getRandomShift(),
      availability: { mon: '08-16', tue: '08-16', wed: '08-16', thu: '08-16', fri: '08-16' },
    },
    {
      name: 'Frank Brown',
      email: 'frank.brown@workshop.com',
      skills: getRandomSkills(2),
      shift: getRandomShift(),
      availability: { mon: '22-06', tue: '22-06', wed: '22-06', thu: '22-06', fri: '22-06' },
    },
    {
      name: 'Grace Lee',
      email: 'grace.lee@workshop.com',
      skills: getRandomSkills(2),
      shift: getRandomShift(),
      availability: { mon: '08-16', tue: '08-16', wed: '08-16', thu: '08-16', fri: '08-16' },
    },
    {
      name: 'Henry Chen',
      email: 'henry.chen@workshop.com',
      skills: getRandomSkills(2),
      shift: getRandomShift(),
      availability: { mon: '16-00', tue: '16-00', wed: '16-00', thu: '16-00', fri: '16-00' },
    },
    {
      name: 'Isabel Garcia',
      email: 'isabel.garcia@workshop.com',
      skills: getRandomSkills(2),
      shift: getRandomShift(),
      availability: { mon: '08-16', tue: '08-16', wed: '08-16', thu: '08-16', fri: '08-16' },
    },
    {
      name: 'Jack Thompson',
      email: 'jack.thompson@workshop.com',
      skills: getRandomSkills(2),
      shift: getRandomShift(),
      availability: { mon: '08-16', tue: '08-16', wed: '08-16', thu: '08-16', fri: '08-16' },
    },
    {
      name: 'Karen White',
      email: 'karen.white@workshop.com',
      skills: getRandomSkills(2),
      shift: getRandomShift(),
      availability: { mon: '08-16', tue: '08-16', wed: '08-16', thu: '08-16', fri: '08-16' },
    },
    {
      name: 'Luis Rodriguez',
      email: 'luis.rodriguez@workshop.com',
      skills: getRandomSkills(2),
      shift: getRandomShift(),
      availability: { mon: '22-06', tue: '22-06', wed: '22-06', thu: '22-06', fri: '22-06' },
    },
    {
      name: 'Maria Gonzalez',
      email: 'maria.gonzalez@workshop.com',
      skills: getRandomSkills(2),
      shift: getRandomShift(),
      availability: { mon: '16-00', tue: '16-00', wed: '16-00', thu: '16-00', fri: '16-00' },
    },
    {
      name: 'Nathan Kim',
      email: 'nathan.kim@workshop.com',
      skills: getRandomSkills(2),
      shift: getRandomShift(),
      availability: { mon: '08-16', tue: '08-16', wed: '08-16', thu: '08-16', fri: '08-16' },
    },
    {
      name: 'Olivia Turner',
      email: 'olivia.turner@workshop.com',
      skills: getRandomSkills(2),
      shift: getRandomShift(),
      availability: { mon: '08-16', tue: '08-16', wed: '08-16', thu: '08-16', fri: '08-16' },
    },
    {
      name: 'Peter Adams',
      email: 'peter.adams@workshop.com',
      skills: getRandomSkills(2),
      shift: getRandomShift(),
      availability: { mon: '16-00', tue: '16-00', wed: '16-00', thu: '16-00', fri: '16-00' },
    },
    {
      name: 'Quinn Foster',
      email: 'quinn.foster@workshop.com',
      skills: getRandomSkills(2),
      shift: getRandomShift(),
      availability: { mon: '08-16', tue: '08-16', wed: '08-16', thu: '08-16', fri: '08-16' },
    },
    {
      name: 'Rachel Cooper',
      email: 'rachel.cooper@workshop.com',
      skills: getRandomSkills(2),
      shift: getRandomShift(),
      availability: { mon: '08-16', tue: '08-16', wed: '08-16', thu: '08-16', fri: '08-16' },
    },
    {
      name: 'Steve Mitchell',
      email: 'steve.mitchell@workshop.com',
      skills: getRandomSkills(2),
      shift: getRandomShift(),
      availability: { mon: '22-06', tue: '22-06', wed: '22-06', thu: '22-06', fri: '22-06' },
    },
    {
      name: 'Tina Parker',
      email: 'tina.parker@workshop.com',
      skills: getRandomSkills(2),
      shift: getRandomShift(),
      availability: { mon: '08-16', tue: '08-16', wed: '08-16', thu: '08-16', fri: '08-16' },
    },
    {
      name: 'Ulrich Weber',
      email: 'ulrich.weber@workshop.com',
      skills: getRandomSkills(2),
      shift: getRandomShift(),
      availability: { mon: '08-16', tue: '08-16', wed: '08-16', thu: '08-16', fri: '08-16' },
    },
    {
      name: 'Victoria Young',
      email: 'victoria.young@workshop.com',
      skills: getRandomSkills(2),
      shift: getRandomShift(),
      availability: { mon: '16-00', tue: '16-00', wed: '16-00', thu: '16-00', fri: '16-00' },
    },
    {
      name: 'William Bell',
      email: 'william.bell@workshop.com',
      skills: getRandomSkills(2),
      shift: getRandomShift(),
      availability: { mon: '08-16', tue: '08-16', wed: '08-16', thu: '08-16', fri: '08-16' },
    },
    {
      name: 'Xander Price',
      email: 'xander.price@workshop.com',
      skills: getRandomSkills(2),
      shift: getRandomShift(),
      availability: { mon: '08-16', tue: '08-16', wed: '08-16', thu: '08-16', fri: '08-16' },
    },
    {
      name: 'Yolanda Cruz',
      email: 'yolanda.cruz@workshop.com',
      skills: getRandomSkills(2),
      shift: getRandomShift(),
      availability: { mon: '16-00', tue: '16-00', wed: '16-00', thu: '16-00', fri: '16-00' },
    },
  ];

  const operators = await Promise.all(
    operatorData.map((data) =>
      prisma.operator.create({
        data: {
          ...data,
          status: 'ACTIVE' as const,
        },
      }),
    ),
  );

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
  const scheduledTasks: {
    title: string;
    description: string;
    durationMin: number;
    status: 'PENDING' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
    itemId: string;
    machineId: string | null;
    operatorId: string | null;
    scheduledAt: Date | null;
  }[] = [];
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

  const currentDate = new Date();

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
