import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CommissionAppliesTo } from '@prisma/client';

export interface CommissionCalculationInput {
  orderId: string;
  agentId: string;
  clientId: string;
  totalAmount: number;
  items: Array<{
    productId?: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    discount: number;
  }>;
}

export interface CommissionCalculationResult {
  totalCommission: number;
  appliedPercentage: number;
  baseRate: number;
  ruleId?: string;
  ruleName?: string;
  overrideReason?: string;
  breakdown: Array<{
    itemName: string;
    itemTotal: number;
    percentage: number;
    commission: number;
    ruleApplied: string;
  }>;
}

@Injectable()
export class CommissionCalculationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Calcola la provvigione per un ordine applicando regole gerarchiche:
   *
   * Priorità (dal più alto al più basso):
   * 1. Regola PRODOTTO specifica (se esiste per un item)
   * 2. Regola CLIENTE specifica
   * 3. Regola AGENTE specifica
   * 4. Percentuale base dell'agente (default)
   * 5. Regola GLOBALE
   *
   * La prima regola attiva e valida trovata viene applicata.
   */
  async calculateCommission(input: CommissionCalculationInput): Promise<CommissionCalculationResult> {
    const now = new Date();

    // 1. Recupera percentuale base dell'agente
    const agent = await this.prisma.agent.findUnique({
      where: { id: input.agentId },
      select: { commissionRate: true },
    });
    const baseRate = agent ? Number(agent.commissionRate) : 10.0;

    // 2. Recupera tutte le regole attive e valide
    const rules = await this.prisma.commissionRule.findMany({
      where: {
        isActive: true,
        validFrom: { lte: now },
        OR: [
          { validUntil: null },
          { validUntil: { gte: now } },
        ],
      },
      orderBy: { priority: 'desc' },
    });

    // 3. Trova la migliore regola per il contesto (CLIENTE)
    const clientRule = rules.find(
      (r) => r.appliesTo === CommissionAppliesTo.CLIENT && r.targetId === input.clientId,
    );

    // 4. Trova la migliore regola per il contesto (AGENTE)
    const agentRule = rules.find(
      (r) => r.appliesTo === CommissionAppliesTo.AGENT && r.targetId === input.agentId,
    );

    // 5. Trova regola GLOBALE
    const globalRule = rules.find((r) => r.appliesTo === CommissionAppliesTo.GLOBAL);

    // Determina la regola principale da applicare
    let mainRule = clientRule || agentRule || globalRule;
    let appliedPercentage = mainRule ? Number(mainRule.percentage) : baseRate;
    let overrideReason: string | undefined;

    if (mainRule) {
      if (clientRule) overrideReason = `Override cliente: ${clientRule.name}`;
      else if (agentRule) overrideReason = `Override agente: ${agentRule.name}`;
      else if (globalRule) overrideReason = `Regola globale: ${globalRule.name}`;
    }

    // 6. Calcola breakdown per ogni item (con possibile override per prodotto)
    const breakdown = input.items.map((item) => {
      const itemTotal = item.quantity * item.unitPrice * (1 - (item.discount || 0) / 100);

      // Cerca regola specifica per prodotto
      const productRule = item.productId
        ? rules.find(
            (r) => r.appliesTo === CommissionAppliesTo.PRODUCT && r.targetId === item.productId,
          )
        : null;

      const itemPercentage = productRule ? Number(productRule.percentage) : appliedPercentage;
      const itemCommission = (itemTotal * itemPercentage) / 100;

      // Verifica min/max se la regola principale li ha
      let finalCommission = itemCommission;
      if (mainRule?.minAmount && finalCommission < Number(mainRule.minAmount)) {
        finalCommission = Number(mainRule.minAmount);
      }
      if (mainRule?.maxAmount && finalCommission > Number(mainRule.maxAmount)) {
        finalCommission = Number(mainRule.maxAmount);
      }

      return {
        itemName: item.productName,
        itemTotal,
        percentage: itemPercentage,
        commission: finalCommission,
        ruleApplied: productRule
          ? `Prodotto: ${productRule.name}`
          : mainRule
            ? mainRule.name
            : 'Tariffa base agente',
      };
    });

    const totalCommission = breakdown.reduce((sum, b) => sum + b.commission, 0);

    return {
      totalCommission,
      appliedPercentage,
      baseRate,
      ruleId: mainRule?.id,
      ruleName: mainRule?.name,
      overrideReason,
      breakdown,
    };
  }

  /**
   * Crea il record Commission nel database dopo il calcolo
   */
  async createCommissionRecord(
    input: CommissionCalculationInput,
    calculation: CommissionCalculationResult,
  ) {
    return this.prisma.commission.create({
      data: {
        orderId: input.orderId,
        agentId: input.agentId,
        commissionRuleId: calculation.ruleId || null,
        amount: calculation.totalCommission,
        percentage: calculation.appliedPercentage,
        baseAmount: input.totalAmount,
        overrideReason: calculation.overrideReason,
        status: 'PENDING',
      },
      include: {
        order: { select: { orderNumber: true } },
        agent: { select: { code: true, user: { select: { firstName: true, lastName: true } } } },
        commissionRule: { select: { name: true, description: true } },
      },
    });
  }

  /**
   * Ricalcola provvigioni per un ordine esistente (es. dopo modifica)
   */
  async recalculateForOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: true } },
        commissions: true,
      },
    });

    if (!order) throw new Error('Ordine non trovato');

    // Elimina provvigioni esistenti
    await this.prisma.commission.deleteMany({ where: { orderId } });

    // Ricalcola
    const input: CommissionCalculationInput = {
      orderId: order.id,
      agentId: order.agentId,
      clientId: order.clientId,
      totalAmount: Number(order.totalAmount),
      items: order.items.map((i) => ({
        productId: i.productId || undefined,
        productName: i.productName,
        quantity: i.quantity,
        unitPrice: Number(i.unitPrice),
        discount: Number(i.discount),
      })),
    };

    const calculation = await this.calculateCommission(input);
    return this.createCommissionRecord(input, calculation);
  }
}
