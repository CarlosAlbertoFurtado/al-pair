// ══════════════════════════════════════════════════════════════
// Posts Service - Regras de Negócio do Feed e Rematch
// ══════════════════════════════════════════════════════════════

import { prisma } from '../../../config/database.js';
import { cacheGet, cacheSet, cacheDel } from '../../../config/redis.js';
import { NotFoundError, ForbiddenError } from '../../../shared/errors/AppError.js';
import { createNotification } from '../../notifications/notifications.routes.js';
import { hasBlockBetween, visiblePostWhere } from '../../moderation/moderation.service.js';
type PostType = string;
type RematchUrgency = string;

// ─── Tipos ─────────────────────────────────────────────────

interface CreatePostInput {
  content?: string;
  imageUrl?: string;
  type: PostType;
  rematchUrgency?: RematchUrgency;
  rematchCity?: string;
  rematchState?: string;
  rematchCountry?: string;
}

interface FeedFilters {
  type?: PostType;
  cursor?: string;   // ID do último post (paginação por cursor)
  limit?: number;
  authorId?: string;
}

// Select padrão para retornar posts com dados do autor
const postSelect = {
  id: true,
  content: true,
  imageUrl: true,
  type: true,
  rematchUrgency: true,
  rematchCity: true,
  rematchState: true,
  rematchCountry: true,
  likesCount: true,
  commentsCount: true,
  createdAt: true,
  author: {
    select: {
      id: true,
      displayName: true,
      avatarUrl: true,
      role: true,
      isMentorActive: true,
      city: true,
      country: true,
    },
  },
} as const;

// ─── Service ───────────────────────────────────────────────

export const postsService = {
  /**
   * Busca posts paginados por cursor (infinitamente escalável).
   * Cursor-based pagination é MUITO mais performante que offset/limit
   * quando temos milhões de registros.
   */
  async getFeed(filters: FeedFilters, userId?: string) {
    const limit = Math.min(filters.limit ?? 20, 50); // Max 50 por request
    const cacheKey = `feed:${filters.type || 'ALL'}:${filters.authorId || 'ANY'}:${filters.cursor || 'start'}:${userId || 'anon'}`;

    if (!filters.cursor) {
      const cached = await cacheGet<{ posts: unknown[]; nextCursor: string | null; hasNextPage: boolean; hasMore: boolean }>(cacheKey);
      if (cached) return cached;
    }

    const posts = await prisma.post.findMany({
      where: {
        ...visiblePostWhere(userId),
        ...(filters.type && { type: filters.type }),
        ...(filters.authorId && { authorId: filters.authorId }),
      },
      select: {
        ...postSelect,
        likes: userId ? {
          where: { userId },
          select: { id: true },
        } : false,
        bookmarks: userId ? {
          where: { userId },
          select: { id: true },
        } : false,
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1, // Pegamos 1 a mais para saber se tem próxima página
      ...(filters.cursor && {
        cursor: { id: filters.cursor },
        skip: 1, // Pula o próprio cursor
      }),
    });

    const hasNextPage = posts.length > limit;
    const results = hasNextPage ? posts.slice(0, limit) : posts;
    const nextCursor = hasNextPage ? results[results.length - 1].id : null;

    const payload = {
      posts: results.map(post => ({
        ...post,
        isLiked: userId ? (post as any).likes?.length > 0 : false,
        isBookmarked: userId ? (post as any).bookmarks?.length > 0 : false,
        likes: undefined,
        bookmarks: undefined,
      })),
      nextCursor,
      hasNextPage,
      hasMore: hasNextPage,
    };

    if (!filters.cursor) {
      await cacheSet(cacheKey, payload, 30);
    }

    return payload;
  },

  /**
   * Cria um novo post (Timeline ou Rematch).
   */
  async createPost(authorId: string, input: CreatePostInput) {
    const post = await prisma.post.create({
      data: {
        authorId,
        content: input.content?.trim() || '',
        imageUrl: input.imageUrl,
        type: input.type,
        rematchUrgency: input.rematchUrgency,
        rematchCity: input.rematchCity,
        rematchState: input.rematchState,
        rematchCountry: input.rematchCountry,
      },
      select: postSelect,
    });

    await cacheDel('feed:*');
    return post;
  },

  /**
   * Deleta um post (apenas o autor pode deletar).
   */
  async deletePost(postId: string, userId: string) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    if (!post) throw new NotFoundError('Post');
    if (post.authorId !== userId) throw new ForbiddenError('Apenas o autor pode deletar este post.');

    await prisma.post.delete({ where: { id: postId } });
    await cacheDel('feed:*');
  },

  /**
   * Curtir / Descurtir um post (toggle).
   * Usa transação para garantir atomicidade do contador.
   */
  async toggleLike(postId: string, userId: string) {
    const existingLike = await prisma.like.findUnique({
      where: { postId_userId: { postId, userId } },
    });

    if (existingLike) {
      // Descurtir
      await prisma.$transaction([
        prisma.like.delete({ where: { id: existingLike.id } }),
        prisma.post.update({
          where: { id: postId },
          data: { likesCount: { decrement: 1 } },
        }),
      ]);
      await cacheDel('feed:*');
      return { liked: false };
    } else {
      const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true } });
      await prisma.$transaction([
        prisma.like.create({ data: { postId, userId } }),
        prisma.post.update({
          where: { id: postId },
          data: { likesCount: { increment: 1 } },
        }),
      ]);
      if (post && post.authorId !== userId) {
        await createNotification(post.authorId, 'LIKE', 'Nova curtida', 'Alguém curtiu sua publicação.', { postId });
      }
      await cacheDel('feed:*');
      return { liked: true };
    }
  },

  async toggleBookmark(postId: string, userId: string) {
    const existing = await prisma.bookmark.findUnique({
      where: { postId_userId: { postId, userId } },
    });
    if (existing) {
      await prisma.bookmark.delete({ where: { id: existing.id } });
      return { bookmarked: false };
    }
    await prisma.bookmark.create({ data: { postId, userId } });
    return { bookmarked: true };
  },

  async getBookmarks(userId: string) {
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId },
      include: {
        post: { select: postSelect },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return bookmarks.map((b) => b.post);
  },

  /**
   * Busca comentários de um post.
   */
  async getComments(postId: string, cursor?: string) {
    const limit = 20;

    const comments = await prisma.comment.findMany({
      where: { postId },
      select: {
        id: true,
        content: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
    });

    const hasNextPage = comments.length > limit;
    const results = hasNextPage ? comments.slice(0, limit) : comments;

    return {
      comments: results,
      nextCursor: hasNextPage ? results[results.length - 1].id : null,
      hasNextPage,
    };
  },

  /**
   * Adiciona um comentário a um post.
   * Usa transação para incrementar o contador.
   */
  async addComment(postId: string, authorId: string, content: string) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundError('Post');
    if (await hasBlockBetween(authorId, post.authorId)) {
      throw new ForbiddenError('Você não pode comentar nesta publicação.');
    }

    const [comment] = await prisma.$transaction([
      prisma.comment.create({
        data: {
          postId,
          authorId,
          content: content.trim(),
        },
        select: {
          id: true,
          content: true,
          createdAt: true,
          author: {
            select: {
              id: true,
              displayName: true,
              avatarUrl: true,
              role: true,
            },
          },
        },
      }),
      prisma.post.update({
        where: { id: postId },
        data: { commentsCount: { increment: 1 } },
      }),
    ]);

    if (post.authorId !== authorId) {
      await createNotification(post.authorId, 'COMMENT', 'Novo comentário', 'Alguém comentou na sua publicação.', { postId });
    }
    await cacheDel('feed:*');
    return comment;
  },
};
