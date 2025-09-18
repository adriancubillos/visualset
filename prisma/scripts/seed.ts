import { PrismaClient } from '@prisma/client';
import { addDays, setHours, setMinutes, isBefore } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // --- Machines ---
    const machines = await Promise.all([
        prisma.machine.create({ data: { name: 'Cortadora CNC-001', type: 'CNC', status: 'AVAILABLE', location: 'Workshop A - Bay 1' } }),
        prisma.machine.create({ data: { name: 'Impresora 3D Prusa', type: '3D_Printer', status: 'AVAILABLE', location: 'Workshop B - Station 3' } }),
        prisma.machine.create({ data: { name: 'Soldadora MIG-200', type: 'Welding', status: 'AVAILABLE', location: 'Workshop A - Bay 2' } }),
        prisma.machine.create({ data: { name: 'Taladro Industrial', type: 'Drilling', status: 'AVAILABLE', location: 'Workshop A - Bay 3' } }),
        prisma.machine.create({ data: { name: 'Fresadora CNC-002', type: 'CNC', status: 'MAINTENANCE', location: 'Workshop A - Bay 4' } }),
        prisma.machine.create({ data: { name: 'Cortadora Laser', type: 'Laser', status: 'AVAILABLE', location: 'Workshop B - Station 1' } }),
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
                availability: { mon: '08-16', tue: '08-16', wed: '08-16', thu: '08-16', fri: '08-16' }
            }
        }),
        prisma.operator.create({
            data: {
                name: 'Jorge Gonzalez',
                email: 'jorge.gonzalez@workshop.com',
                skills: ['CNC_MILL', 'DRILL_PRESS', 'ASSEMBLY'],
                status: 'ACTIVE',
                shift: 'DAY',
                availability: { mon: '09-17', tue: '09-17', wed: '09-17', thu: '09-17', fri: '09-17' }
            }
        }),
        prisma.operator.create({
            data: {
                name: 'Mike Davis',
                email: 'mike.davis@workshop.com',
                skills: ['WELDING', 'ASSEMBLY'],
                status: 'ACTIVE',
                shift: 'EVENING',
                availability: { mon: '07-15', tue: '07-15', wed: '07-15', thu: '07-15', fri: '07-15' }
            }
        }),
        prisma.operator.create({
            data: {
                name: 'Ana Rodriguez',
                email: 'ana.rodriguez@workshop.com',
                skills: ['3D_PRINTING', 'QUALITY_CONTROL'],
                status: 'ACTIVE',
                shift: 'DAY',
                availability: { mon: '08-16', tue: '08-16', wed: '08-16', thu: '08-16', fri: '08-16' }
            }
        }),
        prisma.operator.create({
            data: {
                name: 'Carlos Mendez',
                email: 'carlos.mendez@workshop.com',
                skills: ['LASER_CUTTING', 'SHEET_METAL'],
                status: 'ON_LEAVE',
                shift: 'DAY',
                availability: { mon: '08-16', tue: '08-16', wed: '08-16', thu: '08-16', fri: '08-16' }
            }
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
                color: '#3B82F6', // Blue
                startDate: new Date('2025-01-01'),
                endDate: new Date('2025-03-31')
            }
        }),
        prisma.project.create({
            data: {
                name: 'BANCA EXAGONAL',
                description: 'Luxury hexagonal furniture production',
                status: 'ACTIVE',
                color: '#10B981', // Green
                startDate: new Date('2025-01-15'),
                endDate: new Date('2025-04-15')
            }
        }),
        prisma.project.create({
            data: {
                name: 'ALGODONES',
                description: 'Cotton processing equipment R&D',
                status: 'ACTIVE',
                color: '#F59E0B', // Amber
                startDate: new Date('2025-02-01'),
                endDate: new Date('2025-05-01')
            }
        }),
        prisma.project.create({
            data: {
                name: 'TUNEL ARCOS',
                description: 'Architectural arch tunnel construction components',
                status: 'ON_HOLD',
                color: '#EF4444', // Red
                startDate: new Date('2025-02-01'),
                endDate: new Date('2025-05-01')
            }
        }),
        prisma.project.create({
            data: {
                name: 'PROTOTIPO MESA',
                description: 'Custom table prototype development',
                status: 'COMPLETED',
                color: '#8B5CF6', // Purple
                startDate: new Date('2024-12-01'),
                endDate: new Date('2024-12-31')
            }
        }),
    ]);

    console.log(`✅ Created ${projects.length} projects`);

    // --- Task Scheduling Algorithm with Conflict Detection ---
    const scheduledTasks: any[] = [];
    const startOfDay = 8; // 8 AM
    const endOfDay = 17; // 5 PM

    // Track machine and operator schedules to prevent conflicts
    const machineSchedules = new Map<string, Array<{ start: Date, end: Date }>>();
    const operatorSchedules = new Map<string, Array<{ start: Date, end: Date }>>();

    // Initialize schedule maps
    machines.forEach(machine => machineSchedules.set(machine.id, []));
    operators.forEach(operator => operatorSchedules.set(operator.id, []));

    // Helper function to check if two time periods overlap
    const hasTimeConflict = (start1: Date, end1: Date, start2: Date, end2: Date): boolean => {
        return start1 < end2 && end1 > start2;
    };

    // Helper function to find available machine and operator for a time slot
    const findAvailableResources = (startTime: Date, endTime: Date) => {
        // Find available machine
        const availableMachine = machines.find(machine => {
            const schedule = machineSchedules.get(machine.id) || [];
            return !schedule.some(booking => hasTimeConflict(startTime, endTime, booking.start, booking.end));
        });

        // Find available operator
        const availableOperator = operators.find(operator => {
            const schedule = operatorSchedules.get(operator.id) || [];
            return !schedule.some(booking => hasTimeConflict(startTime, endTime, booking.start, booking.end));
        });

        return { machine: availableMachine, operator: availableOperator };
    };

    let currentDate = new Date();
    for (let day = 1; day <= 7; day++) {
        const date = addDays(currentDate, day);
        let hourPointer = startOfDay;

        for (let taskNum = 1; taskNum <= 6; taskNum++) { // Try to schedule 6 tasks per day
            const duration = 60 + Math.floor(Math.random() * 120); // 1–3 hours
            const durationHours = duration / 60;

            // Ensure task ends before end of day
            if (hourPointer + durationHours > endOfDay) {
                hourPointer = startOfDay; // Reset to start of day
            }

            const startTime = setHours(setMinutes(date, 0), Math.floor(hourPointer));
            const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

            // Find available resources
            const { machine, operator } = findAvailableResources(startTime, endTime);

            if (machine && operator) {
                // Book the resources
                machineSchedules.get(machine.id)?.push({ start: startTime, end: endTime });
                operatorSchedules.get(operator.id)?.push({ start: startTime, end: endTime });

                // Create the task
                scheduledTasks.push({
                    title: `Task ${day}-${taskNum}`,
                    description: `Automated task for day ${day}, task ${taskNum}`,
                    durationMin: duration,
                    status: 'IN_PROGRESS',
                    projectId: projects[(taskNum - 1) % projects.length].id,
                    machineId: machine.id,
                    operatorId: operator.id,
                    scheduledAt: startTime,
                });

                // Move hour pointer forward
                hourPointer += durationHours + 0.5; // Add 30min buffer between tasks
            } else {
                // No available resources, try next time slot
                hourPointer += 1; // Move 1 hour forward
            }

            // If we've reached end of day, break
            if (hourPointer >= endOfDay) break;
        }
    }

    // Add some unscheduled (PENDING) tasks
    const pendingTasks = [
        { title: 'Quality Inspection Batch A', description: 'Quality control for automotive parts', projectId: projects[0].id },
        { title: 'Wood Finishing Touch-up', description: 'Final finishing work on furniture', projectId: projects[1].id },
        { title: 'Prototype Testing Phase 2', description: 'Advanced testing of prototype components', projectId: projects[2].id },
        { title: 'Material Preparation', description: 'Prepare raw materials for next batch', projectId: projects[0].id },
        { title: 'Equipment Calibration', description: 'Calibrate precision measuring equipment', projectId: projects[2].id },
    ];

    pendingTasks.forEach(task => {
        scheduledTasks.push({
            ...task,
            durationMin: 60 + Math.floor(Math.random() * 120),
            status: 'PENDING',
            machineId: null,
            operatorId: null,
            scheduledAt: null,
        });
    });

    await prisma.task.createMany({ data: scheduledTasks, skipDuplicates: true });
    console.log(`✅ Created ${scheduledTasks.length} tasks (${scheduledTasks.filter(t => t.status === 'IN_PROGRESS').length} In Progress, ${scheduledTasks.filter(t => t.status === 'PENDING').length} pending)`);

    console.log('🎉 Database seeding completed successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
