import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { createReadStream, existsSync } from 'fs';
import { unlink } from 'fs/promises';
import { join, basename } from 'path';
import { PrismaService } from '../../database/prisma.service';
import type { AuthUser } from '../../common/types/auth-user';

interface UploadContext {
  projectId?: string;
  taskId?: string;
  ticketId?: string;
}

function isStaff(role: UserRole): boolean {
  return role === UserRole.ADMIN || role === UserRole.MANAGER || role === UserRole.DEVELOPER;
}

@Injectable()
export class FilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async register(file: Express.Multer.File, context: UploadContext, actor: AuthUser) {
    await this.assertContextAccess(context, actor);
    return this.prisma.fileAsset.create({
      data: {
        key: basename(file.path),
        name: file.originalname.slice(0, 255),
        mimeType: file.mimetype,
        size: file.size,
        uploaderId: actor.id,
        projectId: context.projectId,
        taskId: context.taskId,
        ticketId: context.ticketId,
      },
    });
  }

  async listForProject(projectId: string, actor: AuthUser) {
    await this.assertContextAccess({ projectId }, actor);
    return this.prisma.fileAsset.findMany({
      where: { projectId },
      include: { uploader: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Streams a file after verifying the requester may access its parent entity. */
  async download(id: string, actor: AuthUser) {
    const file = await this.prisma.fileAsset.findUnique({
      where: { id },
      include: {
        project: { select: { companyId: true } },
        task: { select: { project: { select: { companyId: true } } } },
        ticket: { select: { requesterId: true, companyId: true } },
      },
    });
    if (!file) throw new NotFoundException('File not found');

    if (!isStaff(actor.role)) {
      const companyId =
        file.project?.companyId ?? file.task?.project.companyId ?? file.ticket?.companyId ?? null;
      const isOwner = file.uploaderId === actor.id || file.ticket?.requesterId === actor.id;
      if (!isOwner && (!companyId || companyId !== actor.companyId)) {
        throw new ForbiddenException('You do not have access to this file');
      }
    }

    const path = join(this.config.get<string>('uploads.dir')!, file.key);
    if (!existsSync(path)) throw new NotFoundException('File contents are missing from storage');

    return {
      stream: createReadStream(path),
      name: file.name,
      mimeType: file.mimeType,
      size: file.size,
    };
  }

  async remove(id: string, actor: AuthUser) {
    const file = await this.prisma.fileAsset.findUnique({ where: { id } });
    if (!file) throw new NotFoundException('File not found');
    if (!isStaff(actor.role) && file.uploaderId !== actor.id) {
      throw new ForbiddenException('You can only delete files you uploaded');
    }

    await this.prisma.fileAsset.delete({ where: { id } });
    const path = join(this.config.get<string>('uploads.dir')!, file.key);
    if (existsSync(path)) await unlink(path);
    return { message: 'File deleted' };
  }

  private async assertContextAccess(context: UploadContext, actor: AuthUser) {
    if (!context.projectId && !context.taskId && !context.ticketId) {
      throw new BadRequestException('A projectId, taskId, or ticketId is required');
    }
    if (isStaff(actor.role)) return;

    if (context.projectId) {
      const project = await this.prisma.project.findUnique({
        where: { id: context.projectId },
        select: { companyId: true },
      });
      if (!project || project.companyId !== actor.companyId) {
        throw new ForbiddenException('You do not have access to this project');
      }
    }
    if (context.taskId) {
      const task = await this.prisma.task.findUnique({
        where: { id: context.taskId },
        select: { project: { select: { companyId: true } } },
      });
      if (!task || task.project.companyId !== actor.companyId) {
        throw new ForbiddenException('You do not have access to this task');
      }
    }
    if (context.ticketId) {
      const ticket = await this.prisma.ticket.findUnique({
        where: { id: context.ticketId },
        select: { requesterId: true },
      });
      if (!ticket || ticket.requesterId !== actor.id) {
        throw new ForbiddenException('You do not have access to this ticket');
      }
    }
  }
}
