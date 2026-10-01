import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * OwnershipGuard verifica che l'utente autenticato possa accedere
 * alla risorsa richiesta in base al proprio ruolo e ownership.
 *
 * Logica:
 * - ADMIN / MANAGER: accesso totale (read:all)
 * - AGENT: può vedere solo i propri dati (read:own)
 * - Se la risorsa è "clients", l'agente vede TUTTA l'anagrafica
 *   (perché i clienti sono condivisi per consultazione)
 * - Se la risorsa è "commissions" o "orders", l'agente vede SOLO i propri
 */
@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) return false;

    const isAdmin = user.roles?.some((r) => r.name === 'ADMIN');
    const isManager = user.roles?.some((r) => r.name === 'MANAGER');

    // Admin e Manager hanno accesso illimitato
    if (isAdmin || isManager) return true;

    const resource = request.route?.path?.split('/')[2]; // es: /api/orders -> orders
    const resourceId = request.params?.id;

    // L'agente può sempre consultare l'anagrafica clienti generale
    if (resource === 'clients' && request.method === 'GET') {
      return true;
    }

    // Per ordini, provvigioni e clienti, verifica ownership tramite agentId
    if (resource === 'orders' || resource === 'commissions' || resource === 'clients') {
      if (!user.agent?.id) {
        throw new ForbiddenException('Utente non associato ad un agente');
      }

      // Se è una lista (GET senza ID), filtra nel service o qui per i clienti (i clienti sono consultabili da tutti in sola lettura)
      if (!resourceId) {
        if (resource === 'clients' && request.method === 'GET') return true;
        request.ownershipFilter = { agentId: user.agent.id };
        return true;
      }

      // Se è un dettaglio o operazione specifica, verifica ownership
      let record: { agentId: string | null } | null = null;
      if (resource === 'orders') {
        record = await this.prisma.order.findUnique({
          where: { id: resourceId },
          select: { agentId: true },
        });
      } else if (resource === 'commissions') {
        record = await this.prisma.commission.findUnique({
          where: { id: resourceId },
          select: { agentId: true },
        });
      } else if (resource === 'clients') {
        // Gli agenti possono vedere tutti i clienti in sola lettura
        if (request.method === 'GET') return true;
        
        record = await this.prisma.client.findUnique({
          where: { id: resourceId },
          select: { agentId: true },
        });
      }

      if (!record || record.agentId !== user.agent.id) {
        throw new ForbiddenException('Accesso negato alla risorsa');
      }
    }

    return true;
  }
}
