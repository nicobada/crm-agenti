import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CommissionStatus } from '@prisma/client';
import { LogsService } from '../logs/logs.service';

@Injectable()
export class CommissionsService {
  constructor(
    private prisma: PrismaService,
    private logsService: LogsService
  ) {}

  private async getAgentId(user: any): Promise<string | null> {
    if (user.agentId) return user.agentId;
    const agent = await this.prisma.agent.findFirst({ where: { userId: user.id } });
    return agent ? agent.id : null;
  }

  async findAll(user: any) {
    const isAdminOrManager = user.roles.includes('ADMIN') || user.roles.includes('MANAGER');
    const actualAgentId = await this.getAgentId(user);
    
    // Se non è admin, lo blocchiamo sulla sua ID (o UNAUTHORIZED_ID se per qualche motivo non ne ha una)
    const where = isAdminOrManager ? {} : { agentId: actualAgentId || 'UNAUTHORIZED_ID' };

    const commissions = await this.prisma.commission.findMany({
      where,
      include: {
        agent: { include: { user: { select: { firstName: true, lastName: true } } } },
        order: { include: { client: { select: { id: true, name: true, email: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return commissions.map((commission) => ({
      id: commission.id,
      amount: Number(commission.amount),
      percentage: Number(commission.percentage),
      baseAmount: Number(commission.baseAmount),
      status: commission.status,
      createdAt: commission.createdAt,
      paidAt: commission.paidAt,
      clientName: commission.order?.client?.name ?? 'N/A',
      clientId: commission.order?.client?.id ?? null,
      orderTotal: Number(commission.order?.totalAmount ?? 0),
      orderId: commission.orderId,
      orderNumber: commission.order?.orderNumber ?? 'N/D',
      agentCode: commission.agent?.code ?? 'N/A',
      agentName: commission.agent?.user
        ? `${commission.agent.user.firstName} ${commission.agent.user.lastName}`.trim()
        : 'N/A',
    }));
  }

  async payCommission(id: string, user: any) {
    const isAdminOrManager = user.roles.includes('ADMIN') || user.roles.includes('MANAGER');
    if (!isAdminOrManager) {
      throw new ForbiddenException('Solo Admin/Manager possono pagare le commissioni');
    }

    const commission = await this.prisma.commission.findUnique({ where: { id } });
    if (!commission) throw new NotFoundException('Commissione non trovata');

    const updated = await this.prisma.commission.update({
      where: { id },
      data: { status: CommissionStatus.PAID, paidAt: new Date() },
    });

    await this.logsService.logAction(
      user.id, 
      user.email, 
      'PAY', 
      'COMMISSION', 
      id, 
      `Provvigione di €${updated.amount} contrassegnata come PAGATA.`
    );

    return updated;
  }

  async approveCommission(id: string, user: any) {
    const isAdminOrManager = user.roles.includes('ADMIN') || user.roles.includes('MANAGER');
    if (!isAdminOrManager) {
      throw new ForbiddenException('Solo Admin/Manager possono approvare');
    }

    const commission = await this.prisma.commission.findUnique({ where: { id } });
    if (!commission) throw new NotFoundException('Commissione non trovata');

    const updated = await this.prisma.commission.update({
      where: { id },
      data: { status: CommissionStatus.APPROVED },
    });

    await this.logsService.logAction(
      user.id, 
      user.email, 
      'APPROVE', 
      'COMMISSION', 
      id, 
      `Provvigione di €${updated.amount} contrassegnata come APPROVATA.`
    );

    return updated;
  }
}