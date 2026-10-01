import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function hardResetAllData() {
  console.log('🚨 RESET COMPLETO DATABASE - Eliminazione di TUTTI i dati...\n');
  console.log('⚠️  Questa operazione NON è reversibile!\n');

  try {
    // Elimina in ordine di dependency (inverse)
    
    // 1. Commission (dipende da Order, Agent)
    const commissionsCount = await prisma.commission.count();
    await prisma.commission.deleteMany({});
    console.log(`✅ Eliminate ${commissionsCount} commissioni`);

    // 2. Document (dipende da Order, Client)
    const docsCount = await prisma.document.count();
    await prisma.document.deleteMany({});
    console.log(`✅ Eliminati ${docsCount} documenti`);

    // 3. OrderItem (dipende da Order, Product)
    const itemsCount = await prisma.orderItem.count();
    await prisma.orderItem.deleteMany({});
    console.log(`✅ Eliminati ${itemsCount} articoli ordine`);

    // 4. Order (dipende da Client, Agent)
    const ordersCount = await prisma.order.count();
    await prisma.order.deleteMany({});
    console.log(`✅ Eliminati ${ordersCount} ordini`);

    // 5. Client (dipende da Agent)
    const clientsCount = await prisma.client.count();
    await prisma.client.deleteMany({});
    console.log(`✅ Eliminati ${clientsCount} clienti`);

    // 6. CommissionRule (dipende da Product)
    const rulesCount = await prisma.commissionRule.count();
    await prisma.commissionRule.deleteMany({});
    console.log(`✅ Eliminate ${rulesCount} regole provvigioni`);

    // 7. Product
    const productsCount = await prisma.product.count();
    await prisma.product.deleteMany({});
    console.log(`✅ Eliminati ${productsCount} prodotti`);

    // 8. Agent (dipende da User)
    const agentsCount = await prisma.agent.count();
    await prisma.agent.deleteMany({});
    console.log(`✅ Eliminati ${agentsCount} agenti`);

    // 9. AuditLog (dipende da User)
    const auditCount = await prisma.auditLog.count();
    await prisma.auditLog.deleteMany({});
    console.log(`✅ Eliminati ${auditCount} log audit`);

    // 10. User (dipende da Role via many-to-many)
    const usersCount = await prisma.user.count();
    await prisma.user.deleteMany({});
    console.log(`✅ Eliminati ${usersCount} utenti`);

    // 11. Permission (dipende da Role via many-to-many)
    const permsCount = await prisma.permission.count();
    await prisma.permission.deleteMany({});
    console.log(`✅ Eliminate ${permsCount} permessi`);

    // 12. Role (ultimo)
    const rolesCount = await prisma.role.count();
    await prisma.role.deleteMany({});
    console.log(`✅ Eliminati ${rolesCount} ruoli`);

    console.log('\n✨ Reset completo terminato!');
    console.log('💡 Ricordati di eseguire il seed per ripopolare i dati di base.');
  } catch (error) {
    console.error('❌ Errore durante il reset:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

hardResetAllData();
