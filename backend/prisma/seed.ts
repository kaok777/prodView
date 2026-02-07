import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  const existingAdmin = await prisma.adminUser.findFirst();
  if (existingAdmin) {
    console.log('Admin user already exists. Skipping seed.');
    return;
  }

  const defaultEmail = 'vibrationconnect@gmail.com';
  const defaultPassword = 'Cxserfd345;';
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(defaultPassword, saltRounds);

  const admin = await prisma.adminUser.create({
    data: {
      email: defaultEmail,
      passwordHash,
      role: 'admin',
    },
  });

  console.log('Created default admin user:');
  console.log(`Email: ${defaultEmail}`);
  console.log(`Password: ${defaultPassword}`);
  console.log(`Admin ID: ${admin.id}`);

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
