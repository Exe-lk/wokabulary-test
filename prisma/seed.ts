
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Hash the password for the demo admin
  const hashedPassword = await bcrypt.hash('admin123', 12);

  // Create demo admin user
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@restaurant.com' },
    update: {},
    create: {
      email: 'admin@restaurant.com',
      password: hashedPassword,
      name: 'Demo Administrator',
      role: 'admin',
      isActive: true,
    },
  });

  console.log('✅ Demo admin user created:', admin.email);
  console.log('📝 Login credentials:');
  console.log('   Email: admin@restaurant.com');
  console.log('   Password: admin123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('🎉 Database seeding completed!');
  }); 