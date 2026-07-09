import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType, Prisma, TaskStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { paginated, safeSort } from '../../common/utils/pagination';
import type { AuthUser } from '../../common/types/auth-user';
import { ProjectsService } from '../projects/projects.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateCommentDto,
  CreateTaskDto,
  CreateTimeEntryDto,
  ListTasksQueryDto,
  MoveTaskDto,
  UpdateTaskDto,
} from './dto/tasks.dto';

const SORTABLE = ['createdAt', 'dueDate', 'priority', 'status', 'title', 'order'] as const;

const TASK_INCLUDE = {
  assignee: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
  reporter: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
  milestone: { select: { id: true, title: true } },
  _count: { select: { comments: true, files: true, timeEntries: true } },
} satisfies Prisma.TaskInclude;

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projects: ProjectsService,
    private readonly notifications: NotificationsService,
  ) {}

  async findAll(query: ListTasksQueryDto, actor: AuthUser) {
    if (query.projectId) await this.assertProjectAccess(query.projectId, actor);

    const where: Prisma.TaskWhereInput = {
      projectId: query.projectId,
      status: query.status,
      priority: query.priority,
      assigneeId: query.assigneeId,
      ...(query.search ? { title: { contains: query.search, mode: 'insensitive' } } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.task.findMany({
        where,
        include: TASK_INCLUDE,
        orderBy: safeSort(query.sortBy, SORTABLE, 'createdAt', query.sortOrder),
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.task.count({ where }),
    ]);

    return paginated(items, query.page, query.limit, total);
  }

  /** Kanban board: tasks for a project grouped by status column, in order. */
  async board(projectId: string, actor: AuthUser) {
    await this.assertProjectAccess(projectId, actor);
    const tasks = await this.prisma.task.findMany({
      where: { projectId },
      include: TASK_INCLUDE,
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });

    const columns: Record<TaskStatus, typeof tasks> = {
      BACKLOG: [],
      TODO: [],
      IN_PROGRESS: [],
      IN_REVIEW: [],
      DONE: [],
    };
    for (const task of tasks) columns[task.status].push(task);
    return columns;
  }

  async findOne(id: string, actor: AuthUser) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        ...TASK_INCLUDE,
        comments: {
          include: { author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
          orderBy: { createdAt: 'asc' },
        },
        timeEntries: {
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
          orderBy: { date: 'desc' },
        },
        files: true,
        project: { select: { id: true, name: true, companyId: true } },
      },
    });
    if (!task) throw new NotFoundException('Task not found');
    this.projects.assertAccess(task.project.companyId, actor);
    return task;
  }

  async create(dto: CreateTaskDto, actor: AuthUser) {
    await this.assertProjectAccess(dto.projectId, actor);
    const maxOrder = await this.prisma.task.aggregate({
      where: { projectId: dto.projectId, status: dto.status ?? TaskStatus.TODO },
      _max: { order: true },
    });

    const task = await this.prisma.task.create({
      data: {
        projectId: dto.projectId,
        title: dto.title,
        description: dto.description,
        status: dto.status,
        priority: dto.priority,
        milestoneId: dto.milestoneId,
        assigneeId: dto.assigneeId,
        reporterId: actor.id,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        estimatedHours: dto.estimatedHours,
        labels: dto.labels,
        order: (maxOrder._max.order ?? 0) + 1,
      },
      include: TASK_INCLUDE,
    });

    await this.projects.recalculateProgress(dto.projectId);
    if (dto.assigneeId && dto.assigneeId !== actor.id) {
      await this.notifications.notifyUser(dto.assigneeId, {
        type: NotificationType.TASK,
        title: 'Task assigned to you',
        body: task.title,
        link: `/admin/tasks/${task.id}`,
      });
    }
    return task;
  }

  async update(id: string, dto: UpdateTaskDto, actor: AuthUser) {
    const existing = await this.findOne(id, actor);
    const task = await this.prisma.task.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status,
        priority: dto.priority,
        milestoneId: dto.milestoneId,
        assigneeId: dto.assigneeId,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        estimatedHours: dto.estimatedHours,
        labels: dto.labels,
      },
      include: TASK_INCLUDE,
    });

    if (dto.status && dto.status !== existing.status) {
      await this.projects.recalculateProgress(existing.projectId);
    }
    if (dto.assigneeId && dto.assigneeId !== existing.assigneeId && dto.assigneeId !== actor.id) {
      await this.notifications.notifyUser(dto.assigneeId, {
        type: NotificationType.TASK,
        title: 'Task assigned to you',
        body: task.title,
        link: `/admin/tasks/${task.id}`,
      });
    }
    return task;
  }

  /** Drag-and-drop move: place the task at `order` in the `status` column. */
  async move(id: string, dto: MoveTaskDto, actor: AuthUser) {
    const task = await this.findOne(id, actor);

    await this.prisma.$transaction(async (tx) => {
      // Shift tasks at/after the target position down by one.
      await tx.task.updateMany({
        where: { projectId: task.projectId, status: dto.status, order: { gte: dto.order }, id: { not: id } },
        data: { order: { increment: 1 } },
      });
      await tx.task.update({ where: { id }, data: { status: dto.status, order: dto.order } });
    });

    await this.projects.recalculateProgress(task.projectId);
    return this.findOne(id, actor);
  }

  async remove(id: string, actor: AuthUser) {
    const task = await this.findOne(id, actor);
    await this.prisma.task.delete({ where: { id } });
    await this.projects.recalculateProgress(task.projectId);
    return { message: 'Task deleted' };
  }

  // ── Comments ────────────────────────────────────────────────

  async addComment(taskId: string, dto: CreateCommentDto, actor: AuthUser) {
    const task = await this.findOne(taskId, actor);
    const comment = await this.prisma.taskComment.create({
      data: { taskId, authorId: actor.id, body: dto.body },
      include: { author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
    });

    if (task.assigneeId && task.assigneeId !== actor.id) {
      await this.notifications.notifyUser(task.assigneeId, {
        type: NotificationType.TASK,
        title: `New comment on "${task.title}"`,
        body: dto.body.slice(0, 140),
        link: `/admin/tasks/${taskId}`,
      });
    }
    return comment;
  }

  async removeComment(taskId: string, commentId: string, actor: AuthUser) {
    await this.prisma.taskComment.deleteMany({
      where: { id: commentId, taskId, authorId: actor.id },
    });
    return { message: 'Comment deleted' };
  }

  // ── Time tracking ───────────────────────────────────────────

  async addTimeEntry(taskId: string, dto: CreateTimeEntryDto, actor: AuthUser) {
    await this.findOne(taskId, actor);
    return this.prisma.timeEntry.create({
      data: {
        taskId,
        userId: actor.id,
        minutes: dto.minutes,
        note: dto.note,
        date: new Date(dto.date),
      },
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  async removeTimeEntry(taskId: string, entryId: string, actor: AuthUser) {
    await this.prisma.timeEntry.deleteMany({ where: { id: entryId, taskId, userId: actor.id } });
    return { message: 'Time entry deleted' };
  }

  private async assertProjectAccess(projectId: string, actor: AuthUser) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { companyId: true },
    });
    if (!project) throw new NotFoundException('Project not found');
    this.projects.assertAccess(project.companyId, actor);
  }
}
