import { PrismaClient } from '@prisma/client';
// Adjust the import path if the file is located elsewhere, for example:
import configurationService from '../../src/services/configurationService';

const prisma = new PrismaClient();

async function testTaskTitleCascading() {
  try {
    console.log('🧪 Testing task title cascading update...');

    // Find a task title configuration to update
    const config = await prisma.configuration.findFirst({
      where: {
        category: 'TASK_TITLES',
        value: 'CABLEADO_ILUMINACION',
      },
    });

    if (!config) {
      console.log('❌ No configuration found');
      return;
    }

    console.log('📋 Before update:');
    console.log(`  Config: ${config.value} → "${config.label}"`);

    // Check tasks with this title
    const tasksBefore = await prisma.task.findMany({
      where: { title: config.value },
      select: { id: true, title: true },
    });
    console.log(`  Tasks with title "${config.value}": ${tasksBefore.length}`);

    // Update the configuration using the service
    console.log('\n🔄 Updating configuration...');
    const updatedConfig = await configurationService.updateConfiguration(prisma, config.id, {
      value: 'ADVANCED_ELECTRICAL_WIRING',
      label: 'Advanced Electrical Wiring System',
    });

    console.log('📋 After update:');
    console.log(`  Config: ${updatedConfig.value} → "${updatedConfig.label}"`);

    // Check if tasks were updated
    const tasksAfter = await prisma.task.findMany({
      where: { title: 'ADVANCED_ELECTRICAL_WIRING' },
      select: { id: true, title: true },
    });
    console.log(`  Tasks with new title "ADVANCED_ELECTRICAL_WIRING": ${tasksAfter.length}`);

    // Check if any tasks still have old title
    const oldTasks = await prisma.task.findMany({
      where: { title: 'CABLEADO_ILUMINACION' },
      select: { id: true, title: true },
    });
    console.log(`  Tasks with old title "CABLEADO_ILUMINACION": ${oldTasks.length}`);

    if (tasksAfter.length === tasksBefore.length && oldTasks.length === 0) {
      console.log('\n✅ Cascading update SUCCESS! All tasks were updated.');
    } else {
      console.log('\n❌ Cascading update FAILED! Some tasks were not updated.');
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testTaskTitleCascading().catch(console.error);
