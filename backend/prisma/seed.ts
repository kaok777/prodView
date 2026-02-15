import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  const categories = await Promise.all([
    prisma.category.create({
      data: { name: 'Electronics' },
    }),
    prisma.category.create({
      data: { name: 'Software' },
    }),
    prisma.category.create({
      data: { name: 'Services' },
    }),
  ]);

  console.log(`Created ${categories.length} categories`);

  const useCases = await Promise.all([
    prisma.useCase.create({
      data: { name: 'Business' },
    }),
    prisma.useCase.create({
      data: { name: 'Personal' },
    }),
    prisma.useCase.create({
      data: { name: 'Education' },
    }),
  ]);

  console.log(`Created ${useCases.length} use cases`);

  console.log('Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
