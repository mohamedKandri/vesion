import { Injectable, NotFoundException } from '@nestjs/common';
import { PostStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CacheService } from '../../infrastructure/redis/cache.service';
import { paginated } from '../../common/utils/pagination';
import { uniqueSlug } from '../../common/utils/slug';
import {
  CreateFaqDto,
  CreatePortfolioItemDto,
  CreateTestimonialDto,
  ListPortfolioQueryDto,
  UpdatePortfolioItemDto,
} from './dto/portfolio.dto';

const CACHE_PREFIX = 'portfolio:';

@Injectable()
export class PortfolioService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  // ── Portfolio / case studies ─────────────────────────────────

  async findAll(query: ListPortfolioQueryDto, staff: boolean) {
    const where: Prisma.PortfolioItemWhereInput = {
      status: staff ? query.status : PostStatus.PUBLISHED,
      industry: query.industry ? { equals: query.industry, mode: 'insensitive' } : undefined,
      ...(query.technology ? { technologies: { has: query.technology } } : {}),
      ...(query.caseStudiesOnly ? { isCaseStudy: true } : {}),
      ...(query.featured !== undefined ? { featured: query.featured } : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' } },
              { summary: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.portfolioItem.findMany({
        where,
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.portfolioItem.count({ where }),
    ]);

    return paginated(items, query.page, query.limit, total);
  }

  async findBySlug(slug: string, staff: boolean) {
    const item = await this.prisma.portfolioItem.findUnique({ where: { slug } });
    if (!item || (!staff && item.status !== PostStatus.PUBLISHED)) {
      throw new NotFoundException('Portfolio item not found');
    }
    return item;
  }

  async create(dto: CreatePortfolioItemDto) {
    const item = await this.prisma.portfolioItem.create({
      data: { ...dto, slug: uniqueSlug(dto.title), metrics: dto.metrics as Prisma.InputJsonValue },
    });
    await this.cache.delByPrefix(CACHE_PREFIX);
    return item;
  }

  async update(id: string, dto: UpdatePortfolioItemDto) {
    const existing = await this.prisma.portfolioItem.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new NotFoundException('Portfolio item not found');
    const item = await this.prisma.portfolioItem.update({
      where: { id },
      data: { ...dto, metrics: dto.metrics as Prisma.InputJsonValue },
    });
    await this.cache.delByPrefix(CACHE_PREFIX);
    return item;
  }

  async remove(id: string) {
    const existing = await this.prisma.portfolioItem.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new NotFoundException('Portfolio item not found');
    await this.prisma.portfolioItem.delete({ where: { id } });
    await this.cache.delByPrefix(CACHE_PREFIX);
    return { message: 'Portfolio item deleted' };
  }

  // ── Testimonials ────────────────────────────────────────────

  listTestimonials(includeUnpublished = false) {
    return this.cache.remember(
      `${CACHE_PREFIX}testimonials:${includeUnpublished}`,
      300,
      () =>
        this.prisma.testimonial.findMany({
          where: includeUnpublished ? {} : { isPublished: true },
          orderBy: { order: 'asc' },
        }),
    );
  }

  async createTestimonial(dto: CreateTestimonialDto) {
    const t = await this.prisma.testimonial.create({ data: dto });
    await this.cache.delByPrefix(CACHE_PREFIX);
    return t;
  }

  async removeTestimonial(id: string) {
    await this.prisma.testimonial.delete({ where: { id } });
    await this.cache.delByPrefix(CACHE_PREFIX);
    return { message: 'Testimonial deleted' };
  }

  // ── FAQ ─────────────────────────────────────────────────────

  listFaq(includeUnpublished = false) {
    return this.cache.remember(
      `${CACHE_PREFIX}faq:${includeUnpublished}`,
      300,
      () =>
        this.prisma.faqItem.findMany({
          where: includeUnpublished ? {} : { isPublished: true },
          orderBy: [{ category: 'asc' }, { order: 'asc' }],
        }),
    );
  }

  async createFaq(dto: CreateFaqDto) {
    const item = await this.prisma.faqItem.create({ data: dto });
    await this.cache.delByPrefix(CACHE_PREFIX);
    return item;
  }

  async updateFaq(id: string, dto: CreateFaqDto) {
    const existing = await this.prisma.faqItem.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new NotFoundException('FAQ item not found');
    const item = await this.prisma.faqItem.update({ where: { id }, data: dto });
    await this.cache.delByPrefix(CACHE_PREFIX);
    return item;
  }

  async removeFaq(id: string) {
    await this.prisma.faqItem.delete({ where: { id } });
    await this.cache.delByPrefix(CACHE_PREFIX);
    return { message: 'FAQ item deleted' };
  }

  /** FAQ search used by the AI assistant. */
  async searchFaq(term: string, limit = 3) {
    const needle = term.trim().toLowerCase();
    if (!needle) return [];
    const words = needle.split(/\s+/).filter((w) => w.length > 2);

    const faqs = await this.prisma.faqItem.findMany({ where: { isPublished: true } });
    return faqs
      .map((f) => {
        let score = 0;
        const q = f.question.toLowerCase();
        const a = f.answer.toLowerCase();
        if (q.includes(needle)) score += 10;
        for (const w of words) {
          if (q.includes(w)) score += 3;
          if (a.includes(w)) score += 1;
        }
        return { faq: f, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((x) => x.faq);
  }
}
