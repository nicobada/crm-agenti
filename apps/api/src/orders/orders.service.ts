import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { OrderStatus, CommissionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LogsService } from '../logs/logs.service';
import { CommissionCalculationService } from '../commissions/commission-calculation.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AuthenticatedUser, isAdminOrManager } from '../common/types/auth-user.type';

const DEDUCTED_STATUSES: OrderStatus[] = [
  OrderStatus.CONFIRMED,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
  OrderStatus.INVOICED,
  OrderStatus.PAID,
];

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private logsService: LogsService,
    private commissionCalculationService: CommissionCalculationService,
  ) {}

  private async getAgentId(user: AuthenticatedUser): Promise<string | null> {
    if (user.agentId) return user.agentId;
    const agent = await this.prisma.agent.findFirst({ where: { userId: user.id } });
    return agent ? agent.id : null;
  }

  private async generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.order.count();
    return `ORD-${year}-${(count + 1).toString().padStart(4, '0')}`;
  }

  async findAll(filters: { user: AuthenticatedUser }) {
    const user = filters?.user;
    const isAdmin = isAdminOrManager(user);
    const actualAgentId = await this.getAgentId(user);

    const where = isAdmin ? {} : { agentId: actualAgentId || 'UNAUTHORIZED_ID' };

    return this.prisma.order.findMany({
      where,
      include: {
        client: true,
        agent: { include: { user: true } },
        items: true,
        documents: true,
        commissions: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findRecent(limit: number, user: AuthenticatedUser) {
    const isAdmin = isAdminOrManager(user);
    const actualAgentId = await this.getAgentId(user);

    const where = isAdmin ? {} : { agentId: actualAgentId || 'UNAUTHORIZED_ID' };

    return this.prisma.order.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        documents: true,
        client: true,
        agent: { include: { user: true } },
        commissions: true,
      },
    });
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const isAdmin = isAdminOrManager(user);
    const actualAgentId = await this.getAgentId(user);

    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        client: true,
        agent: { include: { user: true } },
        documents: true,
        commissions: true,
      },
    });

    if (!order) throw new NotFoundException('Ordine non trovato');

    if (!isAdmin && order.agentId !== actualAgentId) {
      throw new ForbiddenException('Questo ordine appartiene ad un altro agente.');
    }

    return order;
  }

  async create(dto: CreateOrderDto, user: AuthenticatedUser) {
    const client = await this.prisma.client.findUnique({
      where: { id: dto.clientId },
      include: { agent: true },
    });

    if (!client || !client.agentId || !client.agent) {
      throw new BadRequestException("Impossibile creare l'ordine: cliente inesistente o senza agente assegnato.");
    }

    const targetAgentId = client.agentId;

    const totalAmount = dto.items.reduce((acc: number, item) => {
      const subtotal = Number(item.quantity) * Number(item.unitPrice);
      return acc + (subtotal - (subtotal * Number(item.discount || 0)) / 100);
    }, 0);

    // Calcolo gerarchico delle provvigioni tramite CommissionCalculationService
    const commissionCalc = await this.commissionCalculationService.calculateCommission({
      orderId: 'PENDING_CREATION',
      agentId: targetAgentId,
      clientId: dto.clientId,
      totalAmount,
      items: dto.items.map((i) => ({
        productId: i.productId,
        productName: i.productName,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice),
        discount: Number(i.discount || 0),
      })),
    });

    const initialStatus: OrderStatus = (dto.status as OrderStatus) || OrderStatus.PENDING;
    const shouldDeduct = DEDUCTED_STATUSES.includes(initialStatus);

    const newOrder = await this.prisma.$transaction(async (tx) => {
      const orderNumber = await this.generateOrderNumber();
      const order = await tx.order.create({
        data: {
          orderNumber,
          totalAmount,
          status: initialStatus,
          notes: dto.notes || null,
          client: { connect: { id: dto.clientId } },
          agent: { connect: { id: targetAgentId } },
          items: {
            create: dto.items.map((i) => ({
              productName: i.productName,
              quantity: Number(i.quantity),
              unitPrice: Number(i.unitPrice),
              discount: Number(i.discount || 0),
              ...(i.productId ? { product: { connect: { id: i.productId } } } : {}),
            })),
          },
          commissions: {
            create: {
              agentId: targetAgentId,
              commissionRuleId: commissionCalc.ruleId || null,
              baseAmount: totalAmount,
              percentage: commissionCalc.appliedPercentage,
              amount: commissionCalc.totalCommission,
              overrideReason: commissionCalc.overrideReason || null,
              status: CommissionStatus.PENDING,
            },
          },
        },
        include: {
          items: true,
          client: true,
          agent: { include: { user: true } },
          documents: true,
          commissions: true,
        },
      });

      if (shouldDeduct) {
        for (const item of order.items) {
          if (item.productId) {
            const product = await tx.product.findUnique({ where: { id: item.productId } });
            if (product) {
              const currentStock = product.stock ?? 0;
              const newStock = Math.max(0, currentStock - item.quantity);
              await tx.product.update({
                where: { id: item.productId },
                data: { stock: newStock },
              });
            }
          }
        }
      }

      return order;
    });

    await this.logsService.logAction(
      user.id,
      user.email,
      'CREATE',
      'ORDER',
      newOrder.id,
      `Creato ordine ${newOrder.orderNumber} (${newOrder.status}) con provvigione automatica (€${commissionCalc.totalCommission}).${shouldDeduct ? ' Stock scalato.' : ''}`,
    );

    return newOrder;
  }

  async updateStatus(id: string, status: OrderStatus, user: AuthenticatedUser) {
    const isAdmin = isAdminOrManager(user);
    const actualAgentId = await this.getAgentId(user);

    const orderCheck = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!orderCheck) throw new NotFoundException('Ordine non trovato');
    if (!isAdmin && orderCheck.agentId !== actualAgentId) {
      throw new ForbiddenException('Non puoi modificare gli ordini di un altro agente.');
    }

    const wasDeducted = DEDUCTED_STATUSES.includes(orderCheck.status);
    const shouldBeDeducted = DEDUCTED_STATUSES.includes(status);

    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id },
        data: { status },
        include: {
          items: true,
          client: true,
          agent: { include: { user: true } },
          documents: true,
          commissions: true,
        },
      });

      // Se passa da non-dedotto (es. PENDING) a confermato/avanzato: scarica lo stock
      if (!wasDeducted && shouldBeDeducted) {
        for (const item of orderCheck.items) {
          if (item.productId) {
            const product = await tx.product.findUnique({ where: { id: item.productId } });
            if (product) {
              const currentStock = product.stock ?? 0;
              const newStock = Math.max(0, currentStock - item.quantity);
              await tx.product.update({
                where: { id: item.productId },
                data: { stock: newStock },
              });
            }
          }
        }
      }
      // Se era confermato/avanzato e viene annullato o riportato in PENDING: ripristina lo stock
      else if (wasDeducted && !shouldBeDeducted) {
        for (const item of orderCheck.items) {
          if (item.productId) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } },
            });
          }
        }
      }

      return order;
    });

    const stockMsg =
      !wasDeducted && shouldBeDeducted
        ? ' Stock prodotti scaricato.'
        : wasDeducted && !shouldBeDeducted
          ? ' Stock prodotti ripristinato.'
          : '';

    await this.logsService.logAction(
      user.id,
      user.email,
      'UPDATE_STATUS',
      'ORDER',
      id,
      `Stato dell'ordine ${updatedOrder.orderNumber} modificato da ${orderCheck.status} a ${status}.${stockMsg}`,
    );

    return updatedOrder;
  }
}