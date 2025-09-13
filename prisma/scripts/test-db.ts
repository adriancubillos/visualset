import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const machine = await prisma.machine.create({
    data: {
      name: 'CNC Lathe #1',
      type: 'CNC',
    },
  });

  console.log('inserted machine:', machine);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
