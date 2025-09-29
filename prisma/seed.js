const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Check if admin already exists
  const adminCount = await prisma.user.count({
    where: { role: 'ADMIN' }
  });

  if (adminCount > 0) {
    console.log('Admin user already exists');
    return;
  }

  // Create default admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Administrator',
      password: hashedPassword,
      role: 'ADMIN'
    }
  });

  console.log('Default admin user created:', admin);

  // Create sample contractor for testing
  const sampleContractor = await prisma.contractor.create({
    data: {
      shortName: 'ООО Пример',
      fullName: 'Общество с ограниченной ответственностью "Пример компании"',
      ogrn: '12345678901234567',
      inn: '123456789012',
      kpp: '123401001',
      okpo: '12345678',
      okved: '62.01',
      legalAddress: 'г. Москва, ул. Примерная, д. 1',
      actualAddress: 'г. Москва, ул. Примерная, д. 1',
      checkingAccount: '40702810000000000001',
      bankName: 'ПАО СБЕРБАНК',
      correspondentAccount: '30101810400000000225',
      bik: '044525225',
      director: 'Иванов Иван Иванович',
      phone: '+7 (495) 123-45-67',
      email: 'info@example.com',
      createdBy: admin.id
    }
  });

  console.log('Sample contractor created:', sampleContractor);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
