import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

function createPrismaMock() {
  return {
    invoice: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      create: jest.fn((args: { data: unknown }) => Promise.resolve({ id: 'inv1', ...(args.data as object) })),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      delete: jest.fn(),
    },
    discountCode: { findUnique: jest.fn(), update: jest.fn() },
    taxRate: { findUnique: jest.fn() },
    $transaction: jest.fn((ops: unknown[]) => Promise.all(ops as Promise<unknown>[])),
  };
}

describe('InvoicesService', () => {
  let service: InvoicesService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(async () => {
    prisma = createPrismaMock();
    const moduleRef = await Test.createTestingModule({
      providers: [
        InvoicesService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: NotificationsService,
          useValue: { notifyCompany: jest.fn(), notifyStaff: jest.fn(), notifyUser: jest.fn() },
        },
      ],
    }).compile();
    service = moduleRef.get(InvoicesService);
  });

  describe('create — totals computation', () => {
    const baseDto = {
      companyId: 'c1',
      dueDate: '2026-08-01',
      items: [
        { description: 'Design sprint', quantity: 2, unitPrice: 1500 },
        { description: 'Development', quantity: 10, unitPrice: 120.5 },
      ],
    };

    it('computes the subtotal from line items', async () => {
      await service.create(baseDto);
      const data = prisma.invoice.create.mock.calls[0][0].data;
      expect(data.subtotal).toBe(4205); // 2*1500 + 10*120.50
      expect(data.total).toBe(4205);
      expect(data.number).toMatch(/^INV-\d{4}-0001$/);
    });

    it('applies percentage discounts before tax', async () => {
      prisma.discountCode.findUnique.mockResolvedValue({
        id: 'd1',
        code: 'SAVE10',
        type: 'PERCENTAGE',
        value: 10,
        isActive: true,
        expiresAt: null,
        maxRedemptions: null,
        redeemedCount: 0,
      });
      prisma.taxRate.findUnique.mockResolvedValue({ id: 't1', ratePercent: 21 });

      await service.create({ ...baseDto, discountCode: 'SAVE10', taxRateId: 't1' });
      const data = prisma.invoice.create.mock.calls[0][0].data;

      expect(data.subtotal).toBe(4205);
      expect(data.discountAmount).toBe(420.5);
      expect(data.taxAmount).toBe(794.75); // (4205 - 420.5) * 21%
      expect(data.total).toBe(4579.25);
      expect(prisma.discountCode.update).toHaveBeenCalled(); // redemption counted
    });

    it('caps fixed discounts at the subtotal', async () => {
      prisma.discountCode.findUnique.mockResolvedValue({
        id: 'd2',
        code: 'MEGA',
        type: 'FIXED',
        value: 99999,
        isActive: true,
        expiresAt: null,
        maxRedemptions: null,
        redeemedCount: 0,
      });

      await service.create({ ...baseDto, discountCode: 'MEGA' });
      const data = prisma.invoice.create.mock.calls[0][0].data;
      expect(data.discountAmount).toBe(4205);
      expect(data.total).toBe(0);
    });

    it('rejects expired discount codes', async () => {
      prisma.discountCode.findUnique.mockResolvedValue({
        id: 'd3',
        type: 'PERCENTAGE',
        value: 10,
        isActive: true,
        expiresAt: new Date(Date.now() - 1000),
        maxRedemptions: null,
        redeemedCount: 0,
      });
      await expect(service.create({ ...baseDto, discountCode: 'OLD' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('applyPayment', () => {
    it('marks the invoice PAID when the balance is settled', async () => {
      prisma.invoice.findUniqueOrThrow.mockResolvedValue({
        id: 'inv1',
        total: 1000,
        amountPaid: 600,
      });
      await service.applyPayment('inv1', 400);
      expect(prisma.invoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ amountPaid: 1000, status: 'PAID' }),
        }),
      );
    });

    it('marks partial payments PARTIALLY_PAID', async () => {
      prisma.invoice.findUniqueOrThrow.mockResolvedValue({ id: 'inv1', total: 1000, amountPaid: 0 });
      await service.applyPayment('inv1', 250);
      expect(prisma.invoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ amountPaid: 250, status: 'PARTIALLY_PAID', paidAt: null }),
        }),
      );
    });
  });

  describe('send', () => {
    it('only sends draft invoices', async () => {
      prisma.invoice.findUnique.mockResolvedValue({ id: 'inv1', status: 'SENT' });
      await expect(service.send('inv1')).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
