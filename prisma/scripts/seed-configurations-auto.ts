import { PrismaClient, ConfigurationCategory } from '@prisma/client';

const prisma = new PrismaClient();

// Environment-based configuration data
const getConfigurationData = (): Record<ConfigurationCategory, Array<{ value: string; label: string }>> => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  // Production configuration (can be overridden via environment variables)
  if (nodeEnv === 'production') {
    return {
      AVAILABLE_SKILLS: [
        { 
          value: process.env.DEFAULT_SKILL_VALUE || 'PRINTING_IN_3D_SKILL', 
          label: process.env.DEFAULT_SKILL_LABEL || 'Printing in 3D skill' 
        }
      ],
      MACHINE_TYPES: [
        { 
          value: process.env.DEFAULT_MACHINE_TYPE || '3D_Printer', 
          label: process.env.DEFAULT_MACHINE_LABEL || '3D Printer' 
        }
      ],
      OPERATOR_SHIFTS: [
        { 
          value: process.env.DEFAULT_SHIFT_VALUE || 'DIURNO', 
          label: process.env.DEFAULT_SHIFT_LABEL || 'Horario (8AM - 6PM)' 
        }
      ],
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
  }
  
  // Development configuration (matches your current setup)
  return {
    AVAILABLE_SKILLS: [{ value: 'PRINTING_IN_3D_SKILL', label: 'Printing in 3D skill' }],
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
};

async function seedConfigurationsIfEmpty() {
  console.log('🌱 Checking if configuration seeding is needed...');

  try {
    // Check current environment
    const nodeEnv = process.env.NODE_ENV || 'development';
    console.log(`🔧 Environment: ${nodeEnv}`);

    // Check if configurations already exist
    const existingCount = await prisma.configuration.count();
    console.log(`📊 Found ${existingCount} existing configurations`);

    if (existingCount > 0) {
      console.log('✅ Configurations already exist - skipping seeding');
      return { seeded: false, reason: 'Database already has configurations' };
    }

    console.log('🌱 Database is empty - starting seeding...');

    // Get configuration data based on environment
    const configurationData = getConfigurationData();
    console.log(`🔧 Using configuration for environment: ${nodeEnv}`);

    // Seed each category
    let totalSeeded = 0;
    for (const [category, items] of Object.entries(configurationData)) {
      console.log(`📝 Seeding ${category}...`);

      for (const item of items) {
        await prisma.configuration.create({
          data: {
            category: category as ConfigurationCategory,
            value: item.value,
            label: item.label,
          },
        });
        totalSeeded++;
      }

      console.log(`✅ Seeded ${items.length} items for ${category}`);
    }

    console.log(`🎉 Configuration seeding completed! (${totalSeeded} total)`);

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

    return { seeded: true, total: totalSeeded };
  } catch (error) {
    console.error('❌ Error seeding configurations:', error);
    throw error;
  }
}

async function main() {
  try {
    const result = await seedConfigurationsIfEmpty();
    if (result.seeded) {
      console.log(`✅ Seeded ${result.total} configurations`);
    } else {
      console.log(`ℹ️  ${result.reason}`);
    }
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

export { seedConfigurationsIfEmpty };
