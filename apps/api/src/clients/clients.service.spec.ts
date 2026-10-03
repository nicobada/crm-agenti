import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ClientsService - GDPR Compliance & Data Privacy', () => {
  let service: ClientsService;
  let prisma: jest.Mocked<any>;

  const mockAdminUser: any = {
    id: 'user-admin',
    email: 'admin@crm.local',
    roles: ['ADMIN'],
  };

  const mockAgentUser: any = {
    id: 'user-agent-1',
    email: 'agent1@crm.local',
    roles: ['AGENT'],
    agentId: 'agent-1',
  };

  const mockOtherAgentUser: any = {
    id: 'user-agent-2',
    email: 'agent2@crm.local',
    roles: ['AGENT'],
    agentId: 'agent-2',
  };

  beforeEach(() => {
    prisma = {
      client: {
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      agent: {
        findFirst: jest.fn(),
      },
      activityLog: {
        create: jest.fn().mockResolvedValue({ id: 'log-1' }),
      },
    };

    service = new ClientsService(prisma as unknown as PrismaService);
  });

  describe('exportData (Art. 20 GDPR - Portabilità dei Dati)', () => {
    it('should export full data payload with GDPR notice for authorized user', async () => {
      const mockClient = {
        id: 'client-123456',
        name: 'Farmacia San Marco',
        type: 'PHARMACY',
        email: 'info@sanmarco.it',
        phone: '+39 02 123456',
        address: 'Via Roma 1',
        city: 'Milano',
        vatNumber: 'IT12345678901',
        agentId: 'agent-1',
        agent: {
          id: 'agent-1',
          code: 'AG-001',
          user: { firstName: 'Mario', lastName: 'Rossi', email: 'mario@rossi.it' },
        },
        orders: [
          {
            id: 'ord-1',
            orderNumber: 'ORD-2026-001',
            status: 'CONFIRMED',
            orderDate: new Date(),
            totalAmount: 1500,
            items: [{ productName: 'Prodotto A', quantity: 2, unitPrice: 750, discount: 0 }],
          },
        ],
        documents: [],
      };

      prisma.client.findUnique.mockResolvedValue(mockClient);

      const result = await service.exportData('client-123456', mockAgentUser);

      expect(result.gdprNotice).toContain('Art. 20 GDPR');
      expect(result.personalData.name).toBe('Farmacia San Marco');
      expect(result.commercialLedger.totalOrdersCount).toBe(1);
      expect(prisma.activityLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'GDPR_EXPORT',
            entity: 'CLIENT',
            entityId: 'client-123456',
          }),
        }),
      );
    });

    it('should forbid an agent from exporting data of another agent client', async () => {
      prisma.client.findUnique.mockResolvedValue({
        id: 'client-123',
        agentId: 'agent-999',
        orders: [],
      });

      await expect(service.exportData('client-123', mockAgentUser)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('anonymize (Art. 17 GDPR - Diritto all Oblio)', () => {
    it('should irreversibly anonymize client PII while retaining ledger integrity', async () => {
      const mockClient = {
        id: 'client-abcdef',
        name: 'Dott. Bianchi',
        email: 'bianchi@studio.it',
        phone: '+39 333 123456',
        agentId: 'agent-1',
        orders: [{ id: 'ord-1' }, { id: 'ord-2' }],
      };

      prisma.client.findUnique.mockResolvedValue(mockClient);
      prisma.client.update.mockImplementation(({ data }: any) => ({
        ...mockClient,
        ...data,
      }));

      const result = await service.anonymize('client-abcdef', mockAgentUser);

      expect(result.name).toContain('[ANONIMIZZATO - GDPR');
      expect(result.email).toContain('@gdpr.crm.internal');
      expect(result.phone).toBeNull();
      expect(result.address).toBeNull();
      expect(result.vatNumber).toBeNull();

      expect(prisma.activityLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'GDPR_ANONYMIZE',
            entity: 'CLIENT',
            entityId: 'client-abcdef',
          }),
        }),
      );
    });

    it('should prevent re-anonymizing already anonymized client', async () => {
      prisma.client.findUnique.mockResolvedValue({
        id: 'client-anon',
        name: '[ANONIMIZZATO - GDPR #abcdef]',
        agentId: 'agent-1',
        orders: [],
      });

      await expect(service.anonymize('client-anon', mockAgentUser)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('remove (Data Retention vs Hard Delete)', () => {
    it('should prevent hard delete when accounting orders exist and recommend anonymization', async () => {
      prisma.client.findUnique.mockResolvedValue({
        id: 'client-with-orders',
        agentId: 'agent-1',
        orders: [{ id: 'ord-1' }],
      });

      await expect(service.remove('client-with-orders', mockAgentUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should allow hard delete when no orders are associated', async () => {
      prisma.client.findUnique.mockResolvedValue({
        id: 'client-empty',
        agentId: 'agent-1',
        orders: [],
      });
      prisma.client.delete.mockResolvedValue({ id: 'client-empty' });

      await service.remove('client-empty', mockAgentUser);
      expect(prisma.client.delete).toHaveBeenCalledWith({ where: { id: 'client-empty' } });
    });
  });
});
