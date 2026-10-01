import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanOrphanedData() {
  console.log('🧹 Inizio pulizia database...\n');

  try {
    // 1. Elimina documenti orfani (senza ordine e cliente)
    const docsDeleted = await prisma.document.deleteMany({
      where: {
        AND: [{ orderId: null }, { clientId: null }],
      },
    });
    console.log(`✅ Eliminati ${docsDeleted.count} documenti orfani`);

    // 2. Elimina commissioni (cascade eliminate dagli ordini)
    const commissionsDeleted = await prisma.commission.deleteMany({});
    console.log(`✅ Eliminate ${commissionsDeleted.count} commissioni`);

    // 3. Elimina ordini e relative righe
    const ordersDeleted = await prisma.order.deleteMany({});
    console.log(`✅ Eliminati ${ordersDeleted.count} ordini (e relative righe)`);

    // 4. Verifica che OrderItem sia pulito (dovrebbe essere già cascadato)
    const itemsCount = await prisma.orderItem.count();
    console.log(
      `✅ OrderItem count: ${itemsCount} (dovrebbe essere 0 dopo cascade delete)`
    );

    // 5. Verifica commission count
    const commCount = await prisma.commission.count();
    console.log(
      `✅ Commission count: ${commCount} (dovrebbe essere 0 dopo cascade delete)`
    );

    // 6. Verifica che non ci siano documenti orfani
    const orphanedDocsCount = await prisma.document.count({
      where: {
        AND: [{ orderId: null }, { clientId: null }],
      },
    });
    console.log(`✅ Documenti orfani rimasti: ${orphanedDocsCount} (dovrebbe essere 0)`);

    console.log('\n✨ Pulizia completata con successo!');
    console.log('\nRiassunto:');
    console.log(`- Documenti orfani eliminati: ${docsDeleted.count}`);
    console.log(`- Commissioni eliminate: ${commissionsDeleted.count}`);
    console.log(`- Ordini eliminati: ${ordersDeleted.count}`);
  } catch (error) {
    console.error('❌ Errore durante la pulizia:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanOrphanedData();
