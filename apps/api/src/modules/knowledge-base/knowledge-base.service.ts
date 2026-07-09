import { Injectable, NotFoundException } from '@nestjs/common';
import { PostStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CacheService } from '../../infrastructure/redis/cache.service';
import { paginated } from '../../common/utils/pagination';
import { slugify, uniqueSlug } from '../../common/utils/slug';
import type { AuthUser } from '../../common/types/auth-user';
import {
  ArticleFeedbackDto,
  CreateArticleDto,
  CreateKbCategoryDto,
  ListArticlesQueryDto,
  UpdateArticleDto,
} from './dto/knowledge-base.dto';

const CACHE_PREFIX = 'kb:';

@Injectable()
export class KnowledgeBaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  listCategories() {
    return this.cache.remember(`${CACHE_PREFIX}categories`, 300, () =>
      this.prisma.kbCategory.findMany({
        orderBy: { order: 'asc' },
        include: { _count: { select: { articles: { where: { status: PostStatus.PUBLISHED } } } } },
      }),
    );
  }

  async createCategory(dto: CreateKbCategoryDto) {
    const category = await this.prisma.kbCategory.create({
      data: { name: dto.name, slug: slugify(dto.name), order: dto.order ?? 0 },
    });
    await this.cache.delByPrefix(CACHE_PREFIX);
    return category;
  }

  async findAll(query: ListArticlesQueryDto, staff: boolean) {
    const where: Prisma.KbArticleWhereInput = {
      status: staff ? query.status : PostStatus.PUBLISHED,
      ...(query.category ? { category: { slug: query.category } } : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' } },
              { excerpt: { contains: query.search, mode: 'insensitive' } },
              { body: { contains: query.search, mode: 'insensitive' } },
              { keywords: { has: query.search.toLowerCase() } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.kbArticle.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          status: true,
          views: true,
          helpfulYes: true,
          helpfulNo: true,
          publishedAt: true,
          updatedAt: true,
          category: { select: { id: true, name: true, slug: true } },
        },
        orderBy: query.search ? { views: 'desc' } : { publishedAt: 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.kbArticle.count({ where }),
    ]);

    return paginated(items, query.page, query.limit, total);
  }

  async findBySlug(slug: string, staff: boolean) {
    const article = await this.prisma.kbArticle.findUnique({
      where: { slug },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        author: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!article || (!staff && article.status !== PostStatus.PUBLISHED)) {
      throw new NotFoundException('Article not found');
    }

    await this.prisma.kbArticle.update({ where: { id: article.id }, data: { views: { increment: 1 } } });
    return article;
  }

  async create(dto: CreateArticleDto, actor: AuthUser) {
    const article = await this.prisma.kbArticle.create({
      data: {
        title: dto.title,
        slug: uniqueSlug(dto.title),
        excerpt: dto.excerpt,
        body: dto.body,
        categoryId: dto.categoryId,
        authorId: actor.id,
        keywords: dto.keywords?.map((k) => k.toLowerCase()),
        status: dto.status,
        publishedAt: dto.status === PostStatus.PUBLISHED ? new Date() : null,
      },
    });
    await this.cache.delByPrefix(CACHE_PREFIX);
    return article;
  }

  async update(id: string, dto: UpdateArticleDto) {
    const existing = await this.prisma.kbArticle.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Article not found');

    const article = await this.prisma.kbArticle.update({
      where: { id },
      data: {
        title: dto.title,
        excerpt: dto.excerpt,
        body: dto.body,
        categoryId: dto.categoryId,
        keywords: dto.keywords?.map((k) => k.toLowerCase()),
        status: dto.status,
        publishedAt:
          dto.status === PostStatus.PUBLISHED && !existing.publishedAt ? new Date() : undefined,
      },
    });
    await this.cache.delByPrefix(CACHE_PREFIX);
    return article;
  }

  async remove(id: string) {
    const existing = await this.prisma.kbArticle.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new NotFoundException('Article not found');
    await this.prisma.kbArticle.delete({ where: { id } });
    await this.cache.delByPrefix(CACHE_PREFIX);
    return { message: 'Article deleted' };
  }

  async feedback(slug: string, dto: ArticleFeedbackDto) {
    const article = await this.prisma.kbArticle.findUnique({ where: { slug }, select: { id: true } });
    if (!article) throw new NotFoundException('Article not found');
    await this.prisma.kbArticle.update({
      where: { id: article.id },
      data: dto.helpful ? { helpfulYes: { increment: 1 } } : { helpfulNo: { increment: 1 } },
    });
    return { message: 'Thanks for your feedback' };
  }

  /**
   * Ranked full-text search used by both the KB search box and the AI assistant.
   * Scores by keyword, title, excerpt, and body hits.
   */
  async search(term: string, limit = 5) {
    const needle = term.trim().toLowerCase();
    if (!needle) return [];

    const words = needle.split(/\s+/).filter((w) => w.length > 2);
    const articles = await this.prisma.kbArticle.findMany({
      where: {
        status: PostStatus.PUBLISHED,
        OR: [
          { title: { contains: needle, mode: 'insensitive' } },
          { body: { contains: needle, mode: 'insensitive' } },
          ...words.flatMap((w) => [
            { title: { contains: w, mode: 'insensitive' as const } },
            { keywords: { has: w } },
          ]),
        ],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        body: true,
        keywords: true,
        views: true,
      },
      take: 25,
    });

    const scored = articles
      .map((a) => {
        let score = 0;
        const title = a.title.toLowerCase();
        const body = a.body.toLowerCase();
        if (title.includes(needle)) score += 10;
        for (const w of words) {
          if (title.includes(w)) score += 4;
          if (a.keywords.includes(w)) score += 3;
          if (a.excerpt.toLowerCase().includes(w)) score += 2;
          if (body.includes(w)) score += 1;
        }
        return { ...a, score };
      })
      .filter((a) => a.score > 0)
      .sort((a, b) => b.score - a.score || b.views - a.views)
      .slice(0, limit);

    return scored.map(({ body: _body, keywords: _keywords, score: _score, ...rest }) => rest);
  }
}
