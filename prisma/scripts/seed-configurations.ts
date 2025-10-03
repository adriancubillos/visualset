import { PrismaClient, ConfigurationCategory } from '@prisma/client';

const prisma = new PrismaClient();

// Data from workshop-properties.ts
const configurationData: Record<ConfigurationCategory, Array<{ value: string; label: string }>> = {
  AVAILABLE_SKILLS: [{ value: '3D_PRINTING', label: '3D Printing' }],
  MACHINE_TYPES: [{ value: '3D_Printer', label: '3D Printer' }],
  OPERATOR_SHIFTS: [{ value: 'DIURNO', label: 'Horario (8AM - 6PM)' }],
  TASK_PRIORITY: [
    { value: 'BAJA', label: 'Baja' },
    { value: 'MEDIA', label: 'Media' },
    { value: 'ALTA', label: 'Alta' },
    { value: 'URGENTE', label: 'Urgente' },
  ],
  TASK_TITLES: [
    { value: 'ARCHIVOS_IMPRESION_CORTE', label: 'Archivos impresion y corte' },
    { value: 'CABLEADO_ILUMINACION', label: 'Cableado iluminación' },
    { value: 'CARPINTERIA', label: 'Carpinteria' },
    { value: 'COMPRA_MATERIALES', label: 'Compra de materiales' },
    { value: 'CORTE', label: 'Corte' },
    { value: 'CUENTA_MATERIALES', label: 'Cuenta de materiales' },
    { value: 'EMPAQUE', label: 'Empaque' },
    { value: 'ENSAMBLE', label: 'Ensamble' },
    { value: 'IMPRESION', label: 'Impresion' },
    { value: 'INSTALACION', label: 'Instalacion' },
    { value: 'LAMINADO', label: 'Laminado' },
    { value: 'ORNAMENTACION', label: 'Ornamentacion' },
    { value: 'PINTURA', label: 'Pintura' },
    { value: 'PLANOS_ESTRUCTURAS', label: 'Planos estructuras' },
    { value: 'PLANO_GENERAL_VISUAL', label: 'Plano general y visual' },
    { value: 'TRANSPORTE', label: 'Transporte' },
  ],
};

async function seedConfigurations() {
  console.log('🌱 Starting configuration seeding...');

  try {
    // Clear existing configuration data
    await prisma.configuration.deleteMany({});
    console.log('🗑️  Cleared existing configurations');

    // Seed each category
    for (const [category, items] of Object.entries(configurationData)) {
      console.log(`📝 Seeding ${category}...`);

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        await prisma.configuration.create({
          data: {
            category: category as ConfigurationCategory,
            value: item.value,
            label: item.label,
            sortOrder: i + 1,
            isActive: true,
          },
        });
      }

      console.log(`✅ Seeded ${items.length} items for ${category}`);
    }

    console.log('🎉 Configuration seeding completed successfully!');

    // Display summary
    const counts = await prisma.configuration.groupBy({
      by: ['category'],
      _count: {
        category: true,
      },
    });

    console.log('📊 Summary:');
    counts.forEach(({ category, _count }) => {
      console.log(`   ${category}: ${_count.category} items`);
    });
  } catch (error) {
    console.error('❌ Error seeding configurations:', error);
    throw error;
  }
}

async function main() {
  try {
    await seedConfigurations();
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding if this file is executed directly
if (require.main === module) {
  main();
}

export { seedConfigurations };
