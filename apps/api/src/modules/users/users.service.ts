import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service';
import { paginated, safeSort } from '../../common/utils/pagination';
import { CreateUserDto, ListUsersQueryDto, UpdateProfileDto, UpdateUserDto } from './dto/users.dto';

const USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  avatarUrl: true,
  phone: true,
  jobTitle: true,
  isActive: true,
  emailVerifiedAt: true,
  twoFactorEnabled: true,
  lastLoginAt: true,
  companyId: true,
  company: { select: { id: true, name: true } },
  createdAt: true,
} satisfies Prisma.UserSelect;

const SORTABLE = ['createdAt', 'firstName', 'lastName', 'email', 'role', 'lastLoginAt'] as const;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async findAll(query: ListUsersQueryDto) {
    const where: Prisma.UserWhereInput = {
      role: query.role,
      companyId: query.companyId,
      isActive: query.isActive,
      ...(query.search
        ? {
            OR: [
              { email: { contains: query.search, mode: 'insensitive' } },
              { firstName: { contains: query.search, mode: 'insensitive' } },
              { lastName: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: USER_SELECT,
        orderBy: safeSort(query.sortBy, SORTABLE, 'createdAt', query.sortOrder),
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return paginated(items, query.page, query.limit, total);
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: USER_SELECT });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (existing) throw new ConflictException('An account with this email already exists');

    const passwordHash = await bcrypt.hash(dto.password, this.config.get<number>('auth.bcryptRounds')!);
    return this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role,
        companyId: dto.companyId,
        jobTitle: dto.jobTitle,
        emailVerifiedAt: new Date(), // staff accounts are provisioned pre-verified
      },
      select: USER_SELECT,
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.ensureExists(id);
    return this.prisma.user.update({ where: { id }, data: dto, select: USER_SELECT });
  }

  async deactivate(id: string) {
    await this.ensureExists(id);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id }, data: { isActive: false } }),
      this.prisma.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
    return { message: 'User deactivated and sessions revoked' };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({ where: { id: userId }, data: dto, select: USER_SELECT });
  }

  /** Recent audit entries for the authenticated user's activity history. */
  async activity(userId: string, limit = 50) {
    return this.prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
      select: { id: true, action: true, entityType: true, entityId: true, createdAt: true, ip: true },
    });
  }

  private async ensureExists(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!user) throw new NotFoundException('User not found');
  }
}
