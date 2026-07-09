import { Injectable, NotFoundException } from '@nestjs/common';
import { PostStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CacheService } from '../../infrastructure/redis/cache.service';
import { paginated } from '../../common/utils/pagination';
import { slugify, uniqueSlug } from '../../common/utils/slug';
import type { AuthUser } from '../../common/types/auth-user';
import { CreateBlogCategoryDto, CreatePostDto, ListPostsQueryDto, UpdatePostDto } from './dto/blog.dto';

const CACHE_PREFIX = 'blog:';

const POST_LIST_SELECT = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  coverImage: true,
  tags: true,
  readingMinutes: true,
  status: true,
  views: true,
  publishedAt: true,
  category: { select: { id: true, name: true, slug: true } },
  author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
} satisfies Prisma.BlogPostSelect;

@Injectable()
export class BlogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  listCategories() {
    return this.cache.remember(`${CACHE_PREFIX}categories`, 600, () =>
      this.prisma.blogCategory.findMany({
        orderBy: { name: 'asc' },
        include: { _count: { select: { posts: { where: { status: PostStatus.PUBLISHED } } } } },
      }),
    );
  }

  async createCategory(dto: CreateBlogCategoryDto) {
    const category = await this.prisma.blogCategory.create({
      data: { name: dto.name, slug: slugify(dto.name) },
    });
    await this.cache.delByPrefix(CACHE_PREFIX);
    return category;
  }

  async findAll(query: ListPostsQueryDto, staff: boolean) {
    const where: Prisma.BlogPostWhereInput = {
      status: staff ? query.status : PostStatus.PUBLISHED,
      ...(query.category ? { category: { slug: query.category } } : {}),
      ...(query.tag ? { tags: { has: query.tag } } : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' } },
              { excerpt: { contains: query.search, mode: 'insensitive' } },
              { content: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.blogPost.findMany({
        where,
        select: POST_LIST_SELECT,
        orderBy: { publishedAt: { sort: 'desc', nulls: 'last' } },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.blogPost.count({ where }),
    ]);

    return paginated(items, query.page, query.limit, total);
  }

  async findBySlug(slug: string, staff: boolean) {
    const post = await this.prisma.blogPost.findUnique({
      where: { slug },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, jobTitle: true } },
      },
    });
    if (!post || (!staff && post.status !== PostStatus.PUBLISHED)) {
      throw new NotFoundException('Post not found');
    }

    await this.prisma.blogPost.update({ where: { id: post.id }, data: { views: { increment: 1 } } });

    const related = await this.prisma.blogPost.findMany({
      where: {
        status: PostStatus.PUBLISHED,
        id: { not: post.id },
        OR: [{ categoryId: post.categoryId ?? undefined }, { tags: { hasSome: post.tags } }],
      },
      select: POST_LIST_SELECT,
      orderBy: { publishedAt: 'desc' },
      take: 3,
    });

    return { ...post, related };
  }

  async create(dto: CreatePostDto, actor: AuthUser) {
    const post = await this.prisma.blogPost.create({
      data: {
        title: dto.title,
        slug: uniqueSlug(dto.title),
        excerpt: dto.excerpt,
        content: dto.content,
        coverImage: dto.coverImage,
        categoryId: dto.categoryId,
        authorId: actor.id,
        tags: dto.tags,
        readingMinutes: dto.readingMinutes ?? Math.max(1, Math.round(dto.content.split(/\s+/).length / 220)),
        status: dto.status,
        publishedAt: dto.status === PostStatus.PUBLISHED ? new Date() : null,
      },
    });
    await this.cache.delByPrefix(CACHE_PREFIX);
    return post;
  }

  async update(id: string, dto: UpdatePostDto) {
    const existing = await this.prisma.blogPost.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Post not found');

    const post = await this.prisma.blogPost.update({
      where: { id },
      data: {
        title: dto.title,
        excerpt: dto.excerpt,
        content: dto.content,
        coverImage: dto.coverImage,
        categoryId: dto.categoryId,
        tags: dto.tags,
        readingMinutes: dto.readingMinutes,
        status: dto.status,
        publishedAt:
          dto.status === PostStatus.PUBLISHED && !existing.publishedAt ? new Date() : undefined,
      },
    });
    await this.cache.delByPrefix(CACHE_PREFIX);
    return post;
  }

  async remove(id: string) {
    const existing = await this.prisma.blogPost.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new NotFoundException('Post not found');
    await this.prisma.blogPost.delete({ where: { id } });
    await this.cache.delByPrefix(CACHE_PREFIX);
    return { message: 'Post deleted' };
  }
}
