import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LogsService {
  constructor(private prisma: PrismaService) {}

  async logAction(
    userId: string,
    userEmail: string | undefined | null,
    action: string,
    entity: string,
    entityId: string,
    details?: string
  ) {
    try {
      await this.prisma.activityLog.create({
        data: {
          userId,
          userEmail: userEmail || 'Sconosciuta',
          action,
          entity,
          entityId,
          details,
        },
      });
    } catch (error) {
      console.error('Errore critico: salvataggio Audit Log fallito', error);
    }
  }

  // NUOVO METODO: Per leggere i log dal database
  async findAll() {
    return this.prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200, // Mostriamo solo gli ultimi 200 per non appesantire il caricamento
    });
  }
}