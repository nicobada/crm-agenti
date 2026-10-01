import { Test, TestingModule } from '@nestjs/testing';
import { CommissionCalculationService, CommissionCalculationInput } from './commission-calculation.service';
import { PrismaService } from '../prisma/prisma.service';
import { CommissionAppliesTo } from '@prisma/client';

describe('CommissionCalculationService', () => {
  let service: CommissionCalculationService;
  let prismaMock: {
    agent: { findUnique: jest.Mock };
    commissionRule: { findMany: jest.Mock };
  };

  beforeEach(async () => {
    prismaMock = {
      agent: {
        findUnique: jest.fn(),
      },
      commissionRule: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommissionCalculationService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<CommissionCalculationService>(CommissionCalculationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateCommission', () => {
    it('should use agent baseRate if no rules are matched', async () => {
      prismaMock.agent.findUnique.mockResolvedValue({ commissionRate: '12.50' });
      prismaMock.commissionRule.findMany.mockResolvedValue([]);

      const input: CommissionCalculationInput = {
        orderId: 'ord-1',
        agentId: 'agt-1',
        clientId: 'cli-1',
        totalAmount: 1000,
        items: [
          {
            productName: 'Prodotto Test',
            quantity: 2,
            unitPrice: 500,
            discount: 0,
          },
        ],
      };

      const result = await service.calculateCommission(input);

      expect(result.baseRate).toBe(12.5);
      expect(result.appliedPercentage).toBe(12.5);
      expect(result.totalCommission).toBe(125); // 1000 * 12.5%
      expect(result.breakdown).toHaveLength(1);
      expect(result.breakdown[0].commission).toBe(125);
    });

    it('should apply client-level override rule over agent baseRate', async () => {
      prismaMock.agent.findUnique.mockResolvedValue({ commissionRate: '10.00' });
      prismaMock.commissionRule.findMany.mockResolvedValue([
        {
          id: 'rule-client-vip',
          name: 'Regola VIP Cliente',
          priority: 80,
          appliesTo: CommissionAppliesTo.CLIENT,
          targetId: 'cli-vip',
          percentage: '15.00',
          isActive: true,
        },
      ]);

      const input: CommissionCalculationInput = {
        orderId: 'ord-2',
        agentId: 'agt-1',
        clientId: 'cli-vip',
        totalAmount: 2000,
        items: [
          {
            productName: 'Prodotto Standard',
            quantity: 2,
            unitPrice: 1000,
            discount: 0,
          },
        ],
      };

      const result = await service.calculateCommission(input);

      expect(result.appliedPercentage).toBe(15.0);
      expect(result.totalCommission).toBe(300); // 2000 * 15%
      expect(result.ruleId).toBe('rule-client-vip');
      expect(result.overrideReason).toContain('VIP');
    });

    it('should apply product-specific rule for specific items in order', async () => {
      prismaMock.agent.findUnique.mockResolvedValue({ commissionRate: '10.00' });
      prismaMock.commissionRule.findMany.mockResolvedValue([
        {
          id: 'rule-prod-bonus',
          name: 'Bonus Prodotto Promozionale',
          priority: 100,
          appliesTo: CommissionAppliesTo.PRODUCT,
          targetId: 'prod-special',
          percentage: '20.00',
          isActive: true,
        },
      ]);

      const input: CommissionCalculationInput = {
        orderId: 'ord-3',
        agentId: 'agt-1',
        clientId: 'cli-1',
        totalAmount: 1500,
        items: [
          {
            productId: 'prod-standard',
            productName: 'Prodotto Standard',
            quantity: 1,
            unitPrice: 500,
            discount: 0,
          },
          {
            productId: 'prod-special',
            productName: 'Prodotto Speciale',
            quantity: 1,
            unitPrice: 1000,
            discount: 0,
          },
        ],
      };

      const result = await service.calculateCommission(input);

      expect(result.breakdown[0].percentage).toBe(10); // Standard item gets baseRate
      expect(result.breakdown[0].commission).toBe(50); // 500 * 10%
      expect(result.breakdown[1].percentage).toBe(20); // Special item gets 20%
      expect(result.breakdown[1].commission).toBe(200); // 1000 * 20%
      expect(result.totalCommission).toBe(250); // 50 + 200
    });

    it('should respect discount when calculating item total and commission', async () => {
      prismaMock.agent.findUnique.mockResolvedValue({ commissionRate: '10.00' });
      prismaMock.commissionRule.findMany.mockResolvedValue([]);

      const input: CommissionCalculationInput = {
        orderId: 'ord-4',
        agentId: 'agt-1',
        clientId: 'cli-1',
        totalAmount: 900,
        items: [
          {
            productName: 'Prodotto Scontato',
            quantity: 1,
            unitPrice: 1000,
            discount: 10, // 10% discount -> total 900
          },
        ],
      };

      const result = await service.calculateCommission(input);

      expect(result.breakdown[0].itemTotal).toBe(900);
      expect(result.totalCommission).toBe(90); // 900 * 10%
    });
  });
});
