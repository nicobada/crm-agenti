import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // ============================================================
  // 1. Roles & Permissions
  // ============================================================
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN', description: 'Amministratore del sistema' },
  });

  const managerRole = await prisma.role.upsert({
    where: { name: 'MANAGER' },
    update: {},
    create: { name: 'MANAGER', description: 'Manager' },
  });

  const agentRole = await prisma.role.upsert({
    where: { name: 'AGENT' },
    update: {},
    create: { name: 'AGENT', description: 'Agente commerciale' },
  });

  console.log('✅ Roles created');

  // ============================================================
  // 2. Admin user
  // ✅ FIX: always update passwordHash to ensure sync with seed credentials
  // ============================================================
  const adminHash = await bcrypt.hash('admin123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@crm.local' },
    update: {
      // ✅ Always overwrite hash so login always works after re-seed
      passwordHash: adminHash,
      firstName: 'Admin',
      lastName: 'CRM',
      isActive: true,
    },
    create: {
      email: 'admin@crm.local',
      passwordHash: adminHash,
      firstName: 'Admin',
      lastName: 'CRM',
      isActive: true,
      roles: { connect: [{ id: adminRole.id }, { id: managerRole.id }] },
    },
  });

  // Ensure admin has roles even if user existed without them
  await prisma.user.update({
    where: { id: adminUser.id },
    data: {
      roles: {
        connect: [{ id: adminRole.id }, { id: managerRole.id }],
      },
    },
  });

  console.log(`✅ Admin user: admin@crm.local / admin123`);

  // ============================================================
  // 3. Agent user
  // ✅ FIX: always update passwordHash
  // ============================================================
  const agentHash = await bcrypt.hash('agent123', 10);

  const agentUser = await prisma.user.upsert({
    where: { email: 'agent@crm.local' },
    update: {
      passwordHash: agentHash,
      firstName: 'Agente',
      lastName: 'Test',
      isActive: true,
    },
    create: {
      email: 'agent@crm.local',
      passwordHash: agentHash,
      firstName: 'Agente',
      lastName: 'Test',
      isActive: true,
      roles: { connect: { id: agentRole.id } },
    },
  });

  await prisma.user.update({
    where: { id: agentUser.id },
    data: { roles: { connect: { id: agentRole.id } } },
  });

  // Create Agent record if missing
  const existingAgent = await prisma.agent.findUnique({
    where: { userId: agentUser.id },
  });

  let testAgent = existingAgent;
  if (!existingAgent) {
    testAgent = await prisma.agent.create({
      data: {
        userId: agentUser.id,
        code: 'AGT-001',
        commissionRate: 10.0,
        region: 'nord-ovest',
      },
    });
    console.log(`✅ Agent record created: AGT-001`);
  } else {
    console.log(`ℹ️  Agent record already exists: ${existingAgent.code}`);
  }

  console.log(`✅ Agent user: agent@crm.local / agent123`);

  // ============================================================
  // 4. Sample products
  // ============================================================
  const products = [
    { sku: 'PROD-001', name: 'Prodotto Alpha', basePrice: 150.0, category: 'Categoria A' },
    { sku: 'PROD-002', name: 'Prodotto Beta',  basePrice: 280.0, category: 'Categoria A' },
    { sku: 'PROD-003', name: 'Prodotto Gamma', basePrice: 95.0,  category: 'Categoria B' },
    { sku: 'PROD-004', name: 'Prodotto Delta', basePrice: 420.0, category: 'Categoria B' },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: { name: p.name, basePrice: p.basePrice },
      create: { ...p, isActive: true },
    });
  }

  console.log(`✅ ${products.length} products seeded`);

  // ============================================================
  // 5. Sample client (requires agent)
  // ============================================================
  if (testAgent) {
    const existingClient = await prisma.client.findFirst({
      where: { name: 'Dr. Cliente Demo', agentId: testAgent.id },
    });

    if (!existingClient) {
      await prisma.client.create({
        data: {
          agentId: testAgent.id,
          type: 'DOCTOR',
          name: 'Dr. Cliente Demo',
          email: 'cliente@demo.it',
          city: 'Milano',
          phone: '+39 02 1234567',
        },
      });
      console.log('✅ Sample client created');
    }
  }

  console.log('\n🎉 Seed completed successfully!');
  console.log('   Admin:  admin@crm.local  / admin123');
  console.log('   Agent:  agent@crm.local  / agent123');
}

main()
  .catch(e => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
