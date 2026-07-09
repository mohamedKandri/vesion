import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { paginated, safeSort } from '../../common/utils/pagination';
import type { AuthUser } from '../../common/types/auth-user';
import { CreateCompanyDto, ListCompaniesQueryDto, UpdateCompanyDto } from './dto/companies.dto';

const SORTABLE = ['createdAt', 'name', 'industry', 'country'] as const;

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListCompaniesQueryDto) {
    const where: Prisma.CompanyWhereInput = query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' } },
            { industry: { contains: query.search, mode: 'insensitive' } },
            { country: { contains: query.search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [items, total] = await this.prisma.$transaction([
      this.prisma.company.findMany({
        where,
        include: { _count: { select: { users: true, projects: true, invoices: true } } },
        orderBy: safeSort(query.sortBy, SORTABLE, 'createdAt', query.sortOrder),
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.company.count({ where }),
    ]);

    return paginated(items, query.page, query.limit, total);
  }

  async findOne(id: string, actor: AuthUser) {
    this.assertCompanyAccess(id, actor);
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: {
        users: {
          select: { id: true, firstName: true, lastName: true, email: true, jobTitle: true, avatarUrl: true },
        },
        _count: { select: { projects: true, invoices: true, tickets: true, subscriptions: true } },
      },
    });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  create(dto: CreateCompanyDto) {
    return this.prisma.company.create({ data: dto });
  }

  async update(id: string, dto: UpdateCompanyDto, actor: AuthUser) {
    this.assertCompanyAccess(id, actor, true);
    await this.ensureExists(id);
    return this.prisma.company.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.company.delete({ where: { id } });
    return { message: 'Company and related records deleted' };
  }

  /**
   * Clients may only access their own company; staff can access any.
   * `mutating` additionally blocks client-side edits of protected fields
   * at the controller level (clients use a restricted DTO path).
   */
  private assertCompanyAccess(companyId: string, actor: AuthUser, _mutating = false) {
    const isStaff = ([UserRole.ADMIN, UserRole.MANAGER, UserRole.DEVELOPER] as UserRole[]).includes(
      actor.role,
    );
    if (!isStaff && actor.companyId !== companyId) {
      throw new ForbiddenException('You do not have access to this company');
    }
  }

  private async ensureExists(id: string) {
    const company = await this.prisma.company.findUnique({ where: { id }, select: { id: true } });
    if (!company) throw new NotFoundException('Company not found');
  }
}
