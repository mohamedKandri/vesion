import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType, Prisma, TaskStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { paginated, safeSort } from '../../common/utils/pagination';
import { uniqueSlug } from '../../common/utils/slug';
import type { AuthUser } from '../../common/types/auth-user';
import { NotificationsService } from '../notifications/notifications.service';
import {
  AddMemberDto,
  CreateMilestoneDto,
  CreateProjectDto,
  ListProjectsQueryDto,
  UpdateMilestoneDto,
  UpdateProjectDto,
} from './dto/projects.dto';

const SORTABLE = ['createdAt', 'name', 'status', 'dueDate', 'progress'] as const;

const LIST_INCLUDE = {
  company: { select: { id: true, name: true } },
  manager: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
  _count: { select: { tasks: true, milestones: true, members: true } },
} satisfies Prisma.ProjectInclude;

export function isStaff(role: UserRole): boolean {
  return role === UserRole.ADMIN || role === UserRole.MANAGER || role === UserRole.DEVELOPER;
}

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async findAll(query: ListProjectsQueryDto, actor: AuthUser) {
    const where: Prisma.ProjectWhereInput = {
      status: query.status,
      managerId: query.managerId,
      // Clients are always scoped to their own company.
      companyId: isStaff(actor.role) ? query.companyId : actor.companyId ?? '__none__',
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { description: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where,
        include: LIST_INCLUDE,
        orderBy: safeSort(query.sortBy, SORTABLE, 'createdAt', query.sortOrder),
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.project.count({ where }),
    ]);

    return paginated(items, query.page, query.limit, total);
  }

  async findOne(id: string, actor: AuthUser) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        ...LIST_INCLUDE,
        members: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, jobTitle: true } },
          },
        },
        milestones: { orderBy: { order: 'asc' } },
      },
    });
    if (!project) throw new NotFoundException('Project not found');
    this.assertAccess(project.companyId, actor);
    return project;
  }

  async create(dto: CreateProjectDto, actor: AuthUser) {
    const project = await this.prisma.project.create({
      data: {
        name: dto.name,
        slug: uniqueSlug(dto.name),
        description: dto.description,
        companyId: dto.companyId,
        managerId: dto.managerId ?? actor.id,
        status: dto.status,
        budget: dto.budget,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
      include: LIST_INCLUDE,
    });

    await this.notifications.notifyCompany(project.companyId, {
      type: NotificationType.PROJECT,
      title: 'New project created',
      body: `"${project.name}" has been set up. Follow progress in your dashboard.`,
      link: `/dashboard/projects/${project.id}`,
    });
    return project;
  }

  async update(id: string, dto: UpdateProjectDto, actor: AuthUser) {
    const existing = await this.findOne(id, actor);
    const completed =
      dto.status === 'COMPLETED' && existing.status !== 'COMPLETED' ? new Date() : undefined;

    return this.prisma.project.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        companyId: dto.companyId,
        managerId: dto.managerId,
        status: dto.status,
        progress: dto.progress,
        budget: dto.budget,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        completedAt: completed,
      },
      include: LIST_INCLUDE,
    });
  }

  async remove(id: string) {
    const project = await this.prisma.project.findUnique({ where: { id }, select: { id: true } });
    if (!project) throw new NotFoundException('Project not found');
    await this.prisma.project.delete({ where: { id } });
    return { message: 'Project deleted' };
  }

  // ── Members ─────────────────────────────────────────────────

  async addMember(projectId: string, dto: AddMemberDto, actor: AuthUser) {
    await this.findOne(projectId, actor);
    return this.prisma.projectMember.upsert({
      where: { projectId_userId: { projectId, userId: dto.userId } },
      update: { roleTitle: dto.roleTitle ?? 'Contributor' },
      create: { projectId, userId: dto.userId, roleTitle: dto.roleTitle ?? 'Contributor' },
      include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
    });
  }

  async removeMember(projectId: string, userId: string) {
    await this.prisma.projectMember.deleteMany({ where: { projectId, userId } });
    return { message: 'Member removed' };
  }

  // ── Milestones ──────────────────────────────────────────────

  async addMilestone(projectId: string, dto: CreateMilestoneDto, actor: AuthUser) {
    await this.findOne(projectId, actor);
    return this.prisma.milestone.create({
      data: {
        projectId,
        title: dto.title,
        description: dto.description,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        order: dto.order ?? 0,
      },
    });
  }

  async updateMilestone(projectId: string, milestoneId: string, dto: UpdateMilestoneDto) {
    const milestone = await this.prisma.milestone.findFirst({
      where: { id: milestoneId, projectId },
    });
    if (!milestone) throw new NotFoundException('Milestone not found');

    const updated = await this.prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        order: dto.order,
      },
    });
    await this.recalculateProgress(projectId);
    return updated;
  }

  async removeMilestone(projectId: string, milestoneId: string) {
    await this.prisma.milestone.deleteMany({ where: { id: milestoneId, projectId } });
    await this.recalculateProgress(projectId);
    return { message: 'Milestone deleted' };
  }

  /** Timeline view: milestones + tasks ordered by date for Gantt-style rendering. */
  async timeline(projectId: string, actor: AuthUser) {
    await this.findOne(projectId, actor);
    const [milestones, tasks] = await this.prisma.$transaction([
      this.prisma.milestone.findMany({ where: { projectId }, orderBy: { order: 'asc' } }),
      this.prisma.task.findMany({
        where: { projectId },
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }],
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          milestoneId: true,
          createdAt: true,
          assignee: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        },
      }),
    ]);
    return { milestones, tasks };
  }

  /** Recomputes progress as the share of tasks in DONE status. */
  async recalculateProgress(projectId: string) {
    const [total, done] = await this.prisma.$transaction([
      this.prisma.task.count({ where: { projectId } }),
      this.prisma.task.count({ where: { projectId, status: TaskStatus.DONE } }),
    ]);
    const progress = total === 0 ? 0 : Math.round((done / total) * 100);
    await this.prisma.project.update({ where: { id: projectId }, data: { progress } });
    return progress;
  }

  assertAccess(companyId: string, actor: AuthUser) {
    if (!isStaff(actor.role) && actor.companyId !== companyId) {
      throw new ForbiddenException('You do not have access to this project');
    }
  }
}
