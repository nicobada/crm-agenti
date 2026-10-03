import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { AuthenticatedUser, isAdminOrManager } from '../common/types/auth-user.type';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  private async getAgentId(user: AuthenticatedUser): Promise<string | null> {
    if (user.agentId) return user.agentId;
    const agent = await this.prisma.agent.findFirst({ where: { userId: user.id } });
    return agent ? agent.id : null;
  }

  async create(dto: CreateClientDto, user: AuthenticatedUser) {
    const isAdmin = isAdminOrManager(user);
    const actualAgentId = await this.getAgentId(user);

    const targetAgentId = isAdmin ? dto.agentId : actualAgentId;

    if (!targetAgentId) {
      throw new BadRequestException('ID Agente mancante. Impossibile assegnare il cliente.');
    }

    return this.prisma.client.create({
      data: {
        name: dto.name,
        type: dto.type,
        email: dto.email || null,
        phone: dto.phone || null,
        address: dto.address || null,
        city: dto.city || null,
        vatNumber: dto.vatNumber || null,
        specialization: dto.specialization || null,
        notes: dto.notes || null,
        agent: { connect: { id: targetAgentId } },
      },
    });
  }

  async findAll(filters: { user: AuthenticatedUser }) {
    const user = filters?.user;
    const isAdmin = isAdminOrManager(user);
    const actualAgentId = await this.getAgentId(user);

    const where = isAdmin ? {} : { agentId: actualAgentId || 'UNAUTHORIZED_ID' };

    return this.prisma.client.findMany({
      where,
      include: { agent: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const isAdmin = isAdminOrManager(user);
    const actualAgentId = await this.getAgentId(user);
    const client = await this.prisma.client.findUnique({ where: { id }, include: { agent: true } });

    if (!client) throw new NotFoundException('Cliente non trovato');

    if (!isAdmin && client.agentId !== actualAgentId) {
      throw new ForbiddenException('Accesso negato. Questo cliente appartiene ad un altro agente.');
    }

    return client;
  }

  async update(id: string, dto: Partial<CreateClientDto>, user: AuthenticatedUser) {
    const isAdmin = isAdminOrManager(user);
    const actualAgentId = await this.getAgentId(user);
    const client = await this.prisma.client.findUnique({ where: { id } });

    if (!client) throw new NotFoundException('Cliente non trovato');

    if (!isAdmin && client.agentId !== actualAgentId) {
      throw new ForbiddenException('Non puoi modificare l\'anagrafica dei clienti di un altro agente.');
    }

    const targetAgentId = isAdmin && dto.agentId ? dto.agentId : client.agentId;

    return this.prisma.client.update({
      where: { id },
      data: {
        name: dto.name,
        type: dto.type,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
        city: dto.city,
        vatNumber: dto.vatNumber,
        specialization: dto.specialization,
        notes: dto.notes,
        ...(targetAgentId ? { agentId: targetAgentId } : {}),
      },
    });
  }

  async exportData(id: string, user: AuthenticatedUser) {
    const isAdmin = isAdminOrManager(user);
    const actualAgentId = await this.getAgentId(user);
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        agent: {
          select: {
            id: true,
            code: true,
            phone: true,
            region: true,
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
        orders: {
          include: {
            items: true,
            commissions: true,
          },
          orderBy: { orderDate: 'desc' },
        },
        documents: {
          select: {
            id: true,
            fileName: true,
            type: true,
            size: true,
            createdAt: true,
          },
        },
      },
    });

    if (!client) throw new NotFoundException('Cliente non trovato');

    if (!isAdmin && client.agentId !== actualAgentId) {
      throw new ForbiddenException('Accesso negato ai dati del cliente richiesto.');
    }

    // Traccia l'esportazione GDPR nel registro di audit
    try {
      await this.prisma.activityLog.create({
        data: {
          userId: user.id,
          userEmail: user.email || 'Sconosciuta',
          action: 'GDPR_EXPORT',
          entity: 'CLIENT',
          entityId: client.id,
          details: `Esportazione portabilità dati (Art. 20 GDPR) eseguita per '${client.name}'.`,
        },
      });
    } catch {
      // Non bloccare l'export se il log fallisce
    }

    return {
      gdprNotice: "Esportazione dati rilasciata ai sensi dell'Art. 20 GDPR (Diritto alla Portabilità dei Dati).",
      exportTimestamp: new Date().toISOString(),
      requestedBy: {
        userId: user.id,
        userEmail: user.email,
        roles: user.roles,
      },
      personalData: {
        id: client.id,
        name: client.name,
        type: client.type,
        email: client.email,
        phone: client.phone,
        address: client.address,
        city: client.city,
        vatNumber: client.vatNumber,
        specialization: client.specialization,
        notes: client.notes,
        createdAt: client.createdAt,
        updatedAt: client.updatedAt,
      },
      commercialLedger: {
        assignedAgent: client.agent
          ? {
              code: client.agent.code,
              name: `${client.agent.user?.firstName || ''} ${client.agent.user?.lastName || ''}`.trim(),
              region: client.agent.region,
            }
          : null,
        totalOrdersCount: client.orders.length,
        orders: client.orders.map((o) => ({
          orderNumber: o.orderNumber,
          status: o.status,
          orderDate: o.orderDate,
          totalAmount: o.totalAmount,
          notes: o.notes,
          items: o.items.map((i) => ({
            productName: i.productName,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            discount: i.discount,
          })),
        })),
        documents: client.documents,
      },
    };
  }

  async anonymize(id: string, user: AuthenticatedUser) {
    const isAdmin = isAdminOrManager(user);
    const actualAgentId = await this.getAgentId(user);
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: { orders: { select: { id: true } } },
    });

    if (!client) throw new NotFoundException('Cliente non trovato');

    if (!isAdmin && client.agentId !== actualAgentId) {
      throw new ForbiddenException('Non puoi richiedere l\'anonimizzazione dei clienti di un altro agente.');
    }

    if (client.name.startsWith('[ANONIMIZZATO')) {
      throw new BadRequestException('Questo cliente è già stato anonimizzato ai sensi del GDPR.');
    }

    const shortId = client.id.substring(client.id.length - 6);
    const anonymizedClient = await this.prisma.client.update({
      where: { id },
      data: {
        name: `[ANONIMIZZATO - GDPR #${shortId}]`,
        email: `anonymized_${shortId}@gdpr.crm.internal`,
        phone: null,
        address: null,
        city: 'DATO RIMOSSO (Art. 17 GDPR)',
        vatNumber: null,
        specialization: null,
        notes: `Dati personali rimossi irreversibilmente in ottemperanza all'Art. 17 GDPR (Diritto all'Oblio). Record transazionale mantenuto ai sensi dell'Art. 17(3)(b) GDPR e norme civilistico-fiscali per la tracciabilità degli ordini.`,
      },
    });

    try {
      await this.prisma.activityLog.create({
        data: {
          userId: user.id,
          userEmail: user.email || 'Sconosciuta',
          action: 'GDPR_ANONYMIZE',
          entity: 'CLIENT',
          entityId: client.id,
          details: `Anonimizzazione irreversibile eseguita (Art. 17 GDPR). Ordini storici preservati: ${client.orders.length}.`,
        },
      });
    } catch {
      // Non bloccare se il log fallisce
    }

    return anonymizedClient;
  }

  async remove(id: string, user: AuthenticatedUser) {
    const isAdmin = isAdminOrManager(user);
    const actualAgentId = await this.getAgentId(user);
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: { orders: { select: { id: true } } },
    });

    if (!client) throw new NotFoundException('Cliente non trovato');

    if (!isAdmin && client.agentId !== actualAgentId) {
      throw new ForbiddenException('Non puoi eliminare i clienti di un altro agente.');
    }

    if (client.orders && client.orders.length > 0) {
      throw new BadRequestException(
        'Impossibile eliminare fisicamente il cliente: risultano ordini contabili registrati a suo nome. Per garantire la conformità GDPR senza violare gli obblighi di conservazione fiscale (art. 2220 C.C.), utilizza la funzione di Anonimizzazione (Art. 17 GDPR).'
      );
    }

    return this.prisma.client.delete({ where: { id } });
  }
}