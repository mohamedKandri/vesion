import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { uniqueSlug } from '../../common/utils/slug';
import { NotificationsService } from '../notifications/notifications.service';
import { ApplyDto, CreateJobPostingDto, UpdateApplicationStatusDto } from './dto/careers.dto';

@Injectable()
export class CareersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  listOpenPostings() {
    return this.prisma.jobPosting.findMany({
      where: { isOpen: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        department: true,
        location: true,
        type: true,
        salaryRange: true,
        createdAt: true,
      },
    });
  }

  listAllPostings() {
    return this.prisma.jobPosting.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { applications: true } } },
    });
  }

  async findBySlug(slug: string) {
    const posting = await this.prisma.jobPosting.findUnique({ where: { slug } });
    if (!posting || !posting.isOpen) throw new NotFoundException('Job posting not found');
    return posting;
  }

  createPosting(dto: CreateJobPostingDto) {
    return this.prisma.jobPosting.create({ data: { ...dto, slug: uniqueSlug(dto.title) } });
  }

  async updatePosting(id: string, dto: CreateJobPostingDto) {
    const existing = await this.prisma.jobPosting.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new NotFoundException('Job posting not found');
    return this.prisma.jobPosting.update({ where: { id }, data: dto });
  }

  async apply(slug: string, dto: ApplyDto) {
    const posting = await this.prisma.jobPosting.findUnique({ where: { slug } });
    if (!posting || !posting.isOpen) throw new NotFoundException('Job posting not found');

    const duplicate = await this.prisma.jobApplication.findFirst({
      where: { postingId: posting.id, email: dto.email.toLowerCase() },
    });
    if (duplicate) throw new BadRequestException('You have already applied for this position');

    const application = await this.prisma.jobApplication.create({
      data: {
        postingId: posting.id,
        name: dto.name,
        email: dto.email.toLowerCase(),
        phone: dto.phone,
        coverLetter: dto.coverLetter,
      },
    });

    await this.notifications.notifyStaff({
      type: NotificationType.SYSTEM,
      title: `New application: ${posting.title}`,
      body: `${dto.name} applied for ${posting.title}.`,
      link: `/admin/careers`,
    });
    return { message: 'Application received. We will get back to you shortly.', id: application.id };
  }

  listApplications(postingId?: string) {
    return this.prisma.jobApplication.findMany({
      where: { postingId },
      include: { posting: { select: { id: true, title: true, slug: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateApplicationStatus(id: string, dto: UpdateApplicationStatusDto) {
    const existing = await this.prisma.jobApplication.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new NotFoundException('Application not found');
    return this.prisma.jobApplication.update({ where: { id }, data: { status: dto.status } });
  }
}
