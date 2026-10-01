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

  async remove(id: string, user: AuthenticatedUser) {
    const isAdmin = isAdminOrManager(user);
    const actualAgentId = await this.getAgentId(user);
    const client = await this.prisma.client.findUnique({ where: { id } });

    if (!client) throw new NotFoundException('Cliente non trovato');

    if (!isAdmin && client.agentId !== actualAgentId) {
      throw new ForbiddenException('Non puoi eliminare i clienti di un altro agente.');
    }

    return this.prisma.client.delete({ where: { id } });
  }
}