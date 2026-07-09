import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateDiscountCodeDto, CreateTaxRateDto, UpdateDiscountCodeDto } from './dto/payments.dto';

/** Admin-managed billing reference data: tax rates and discount codes. */
@Injectable()
export class BillingCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Tax rates ───────────────────────────────────────────────

  listTaxRates() {
    return this.prisma.taxRate.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
  }

  async createTaxRate(dto: CreateTaxRateDto) {
    if (dto.isDefault) {
      await this.prisma.taxRate.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
    }
    return this.prisma.taxRate.create({ data: dto });
  }

  async deactivateTaxRate(id: string) {
    const rate = await this.prisma.taxRate.findUnique({ where: { id } });
    if (!rate) throw new NotFoundException('Tax rate not found');
    await this.prisma.taxRate.update({ where: { id }, data: { isActive: false, isDefault: false } });
    return { message: 'Tax rate deactivated' };
  }

  // ── Discount codes ──────────────────────────────────────────

  listDiscountCodes() {
    return this.prisma.discountCode.findMany({ orderBy: { createdAt: 'desc' } });
  }

  createDiscountCode(dto: CreateDiscountCodeDto) {
    return this.prisma.discountCode.create({
      data: {
        code: dto.code,
        type: dto.type,
        value: dto.value,
        maxRedemptions: dto.maxRedemptions,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
    });
  }

  async updateDiscountCode(id: string, dto: UpdateDiscountCodeDto) {
    const code = await this.prisma.discountCode.findUnique({ where: { id } });
    if (!code) throw new NotFoundException('Discount code not found');
    return this.prisma.discountCode.update({
      where: { id },
      data: {
        isActive: dto.isActive,
        maxRedemptions: dto.maxRedemptions,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
    });
  }
}
