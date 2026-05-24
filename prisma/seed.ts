import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const demoEmail = process.env.DEMO_EMAIL ?? 'demo@expensetracker.pro';
  const demoPassword = process.env.DEMO_PASSWORD ?? 'Passw0rd!2026';
  const passwordHash = await hash(demoPassword, 12);

  const user = await prisma.user.upsert({
    where: { email: demoEmail },
    update: {},
    create: {
      email: demoEmail,
      name: 'Demo User',
      passwordHash,
    },
  });

  const categoryCount = await prisma.category.count({
    where: { userId: user.id },
  });

  if (categoryCount === 0) {
    const { defaultCategories } =
      await import('../src/categories/default-categories');
    await prisma.category.createMany({
      data: defaultCategories.map((category) => ({
        ...category,
        userId: user.id,
      })),
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
