import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAgentDto } from './dto/create-agent.dto';

// Esportiamo una classe base per l'update per semplificare
export class UpdateAgentDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  region?: string;
  commissionRate?: number;
}

@Injectable()
export class AgentsService {
  constructor(private prisma: PrismaService) {}

  private checkAdmin(user: any): boolean {
    if (!user?.roles) return false;
    const roles = user.roles.map((r: any) => typeof r === 'string' ? r : r.name);
    return roles.some((r: string) => ['ADMIN', 'MANAGER'].includes(r));
  }

  async getNextAgentCode(): Promise<string> {
    const lastAgent = await this.prisma.agent.findFirst({
      orderBy: { code: 'desc' },
    });
    if (!lastAgent) return 'AGT-001';
    
    // Estrae in modo robusto il numero finale
    const match = lastAgent.code.match(/AGT-(\d+)/);
    const lastNum = match ? parseInt(match[1], 10) : 0;
    return `AGT-${(lastNum + 1).toString().padStart(3, '0')}`;
  }

  async findAll(filters: any = {}) {
    const { search, skip, take } = filters;
    const where: any = {};
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
      ];
    }
    return this.prisma.agent.findMany({
      where,
      skip,
      take,
      include: { user: true },
      orderBy: { code: 'asc' },
    });
  }

  async findOne(id: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { id },
      include: { user: true }
    });
    if (!agent) throw new NotFoundException('Agente non trovato');
    return agent;
  }

  async create(dto: CreateAgentDto, requestUser: any) {
    if (!this.checkAdmin(requestUser)) throw new ForbiddenException('Azione non consentita');
    
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email già registrata');

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    // Usa il codice inviato o generane uno nuovo
    const code = dto.code || await this.getNextAgentCode();

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash: hashedPassword,
          firstName: dto.firstName,
          lastName: dto.lastName,
          roles: { connect: { name: 'AGENT' } },
        },
      });

      return tx.agent.create({
        data: {
          userId: user.id,
          code: code,
          phone: dto.phone || null,
          region: dto.region || null,
          commissionRate: dto.commissionRate !== undefined ? Number(dto.commissionRate) : 10,
        },
        include: { user: true }
      });
    });
  }

  async update(id: string, dto: UpdateAgentDto, requestUser: any) {
    if (!this.checkAdmin(requestUser)) throw new ForbiddenException('Accesso negato');
    
    // Controlla se l'agente esiste
    await this.findOne(id);

    return this.prisma.agent.update({
      where: { id },
      data: {
        phone: dto.phone,
        region: dto.region,
        commissionRate: dto.commissionRate !== undefined ? Number(dto.commissionRate) : undefined,
        user: {
          update: {
            firstName: dto.firstName,
            lastName: dto.lastName,
            email: dto.email
          }
        }
      },
      include: { user: true }
    });
  }

  async toggleStatus(id: string, requestUser: any) {
    if (!this.checkAdmin(requestUser)) throw new ForbiddenException('Accesso negato');
    const agent = await this.findOne(id);
    return this.prisma.user.update({
      where: { id: agent.userId },
      data: { isActive: !agent.user.isActive },
    });
  }
}