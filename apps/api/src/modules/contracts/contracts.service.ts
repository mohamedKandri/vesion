import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ContractStatus, NotificationType, UserRole } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import type { AuthUser } from '../../common/types/auth-user';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateContractDto, SignContractDto } from './dto/contracts.dto';

@Injectable()
export class ContractsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async findAll(actor: AuthUser, companyId?: string) {
    const isStaff = actor.role === UserRole.ADMIN || actor.role === UserRole.MANAGER;
    return this.prisma.contract.findMany({
      where: {
        companyId: isStaff ? companyId : actor.companyId ?? '__none__',
        ...(isStaff ? {} : { status: { not: ContractStatus.DRAFT } }),
      },
      include: {
        company: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, actor: AuthUser) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        company: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
    });
    if (!contract) throw new NotFoundException('Contract not found');

    const isStaff = actor.role === UserRole.ADMIN || actor.role === UserRole.MANAGER;
    if (!isStaff && (contract.companyId !== actor.companyId || contract.status === ContractStatus.DRAFT)) {
      throw new ForbiddenException('You do not have access to this contract');
    }
    return contract;
  }

  create(dto: CreateContractDto) {
    return this.prisma.contract.create({
      data: {
        companyId: dto.companyId,
        projectId: dto.projectId,
        title: dto.title,
        body: dto.body,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
    });
  }

  async send(id: string) {
    const contract = await this.prisma.contract.findUnique({ where: { id } });
    if (!contract) throw new NotFoundException('Contract not found');
    if (contract.status !== ContractStatus.DRAFT) throw new BadRequestException('Contract already sent');

    const updated = await this.prisma.contract.update({
      where: { id },
      data: { status: ContractStatus.SENT, sentAt: new Date() },
    });
    await this.notifications.notifyCompany(updated.companyId, {
      type: NotificationType.PROJECT,
      title: 'Contract ready for signature',
      body: updated.title,
      link: `/dashboard/contracts/${updated.id}`,
    });
    return updated;
  }

  /** Client e-signature: typed legal name recorded with timestamp. */
  async sign(id: string, dto: SignContractDto, actor: AuthUser) {
    const contract = await this.findOne(id, actor);
    if (contract.status !== ContractStatus.SENT) {
      throw new BadRequestException('Only sent contracts can be signed');
    }
    if (contract.expiresAt && contract.expiresAt < new Date()) {
      throw new BadRequestException('This contract has expired');
    }

    const updated = await this.prisma.contract.update({
      where: { id },
      data: { status: ContractStatus.SIGNED, signedAt: new Date(), signedByName: dto.signedByName },
    });

    await this.notifications.notifyStaff({
      type: NotificationType.PROJECT,
      title: 'Contract signed',
      body: `"${updated.title}" was signed by ${dto.signedByName}.`,
      link: `/admin/contracts/${updated.id}`,
    });
    return updated;
  }

  async terminate(id: string) {
    const contract = await this.prisma.contract.findUnique({ where: { id } });
    if (!contract) throw new NotFoundException('Contract not found');
    return this.prisma.contract.update({
      where: { id },
      data: { status: ContractStatus.TERMINATED },
    });
  }
}
