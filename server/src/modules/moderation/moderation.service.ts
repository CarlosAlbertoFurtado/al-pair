import { prisma } from '../../config/database.js';
import { ConflictError, ForbiddenError, NotFoundError } from '../../shared/errors/AppError.js';
import { env } from '../../config/env.js';
import { z } from 'zod';

export function visibleUserWhere(viewerId?: string) {
  if (!viewerId) return {};

  return {
    AND: [
      { blocksReceived: { none: { blockerId: viewerId } } },
      { blocksInitiated: { none: { blockedId: viewerId } } },
    ],
  };
}

export function visiblePostWhere(viewerId?: string) {
  if (!viewerId) return {};

  return {
    author: visibleUserWhere(viewerId),
  };
}

export const reportSchema = z.object({
  targetType: z.enum(['USER', 'POST', 'MESSAGE']),
  targetId: z.string().min(1),
  reason: z.string().trim().min(3).max(100),
  description: z.string().trim().max(500).optional(),
});

export type ReportInput = z.infer<typeof reportSchema>;

export const reportStatusSchema = z.object({
  status: z.enum(['OPEN', 'REVIEWING', 'ACTIONED', 'DISMISSED']),
});

export const reportListQuerySchema = z.object({
  status: z.enum(['OPEN', 'REVIEWING', 'ACTIONED', 'DISMISSED', 'ALL']).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export type ReportStatusInput = z.infer<typeof reportStatusSchema>;
export type ReportListQuery = z.infer<typeof reportListQuerySchema>;

export function parseAdminEmails(value = env.ADMIN_EMAILS) {
  return value
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function assertModerator(userId: string) {
  const admins = parseAdminEmails();
  if (admins.length === 0) {
    throw new ForbiddenError('Painel de moderação não configurado.');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (!user || !admins.includes(user.email.toLowerCase())) {
    throw new ForbiddenError('Acesso restrito à moderação.');
  }
}

export function buildReportData(reporterId: string, report: ReportInput) {
  const description = report.description?.trim();

  return {
    reporterId,
    targetType: report.targetType,
    targetId: report.targetId,
    reason: report.reason.trim(),
    description: description || undefined,
  };
}

export async function createReport(reporterId: string, report: ReportInput) {
  if (report.targetType === 'USER') {
    const user = await prisma.user.findUnique({ where: { id: report.targetId }, select: { id: true } });
    if (!user) throw new NotFoundError('Usuário');
  }

  if (report.targetType === 'POST') {
    const post = await prisma.post.findUnique({ where: { id: report.targetId }, select: { id: true } });
    if (!post) throw new NotFoundError('Post');
  }

  if (report.targetType === 'MESSAGE') {
    const message = await prisma.message.findUnique({ where: { id: report.targetId }, select: { id: true } });
    if (!message) throw new NotFoundError('Mensagem');
  }

  return prisma.report.create({
    data: buildReportData(reporterId, report),
  });
}

export async function listReports(query: ReportListQuery = {}) {
  const status = query.status ?? 'OPEN';
  const reports = await prisma.report.findMany({
    where: status === 'ALL' ? {} : { status },
    orderBy: { createdAt: 'desc' },
    take: query.limit ?? 50,
    include: {
      reporter: {
        select: {
          id: true,
          displayName: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  });

  const [users, posts, messages] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: reports.filter(report => report.targetType === 'USER').map(report => report.targetId) } },
      select: { id: true, displayName: true, email: true, avatarUrl: true },
    }),
    prisma.post.findMany({
      where: { id: { in: reports.filter(report => report.targetType === 'POST').map(report => report.targetId) } },
      select: { id: true, content: true, imageUrl: true, authorId: true },
    }),
    prisma.message.findMany({
      where: { id: { in: reports.filter(report => report.targetType === 'MESSAGE').map(report => report.targetId) } },
      select: { id: true, content: true, senderId: true },
    }),
  ]);

  const usersById = new Map(users.map(user => [user.id, user]));
  const postsById = new Map(posts.map(post => [post.id, post]));
  const messagesById = new Map(messages.map(message => [message.id, message]));

  return reports.map(report => ({
    ...report,
    target: report.targetType === 'USER'
      ? usersById.get(report.targetId) ?? null
      : report.targetType === 'POST'
        ? postsById.get(report.targetId) ?? null
        : messagesById.get(report.targetId) ?? null,
  }));
}

export async function updateReportStatus(reportId: string, input: ReportStatusInput) {
  const report = await prisma.report.findUnique({ where: { id: reportId }, select: { id: true } });
  if (!report) throw new NotFoundError('Denúncia');

  return prisma.report.update({
    where: { id: reportId },
    data: { status: input.status },
  });
}

export async function blockUser(blockerId: string, blockedId: string) {
  if (blockerId === blockedId) throw new ConflictError('Não é possível bloquear a si mesmo.');

  const target = await prisma.user.findUnique({ where: { id: blockedId }, select: { id: true } });
  if (!target) throw new NotFoundError('Usuário');

  await prisma.$transaction([
    prisma.userBlock.upsert({
      where: { blockerId_blockedId: { blockerId, blockedId } },
      create: { blockerId, blockedId },
      update: {},
    }),
    prisma.follow.deleteMany({
      where: {
        OR: [
          { followerId: blockerId, followingId: blockedId },
          { followerId: blockedId, followingId: blockerId },
        ],
      },
    }),
  ]);
}

export async function unblockUser(blockerId: string, blockedId: string) {
  await prisma.userBlock.deleteMany({
    where: { blockerId, blockedId },
  });
}

export async function hasBlockBetween(userIdA: string, userIdB: string) {
  const block = await prisma.userBlock.findFirst({
    where: {
      OR: [
        { blockerId: userIdA, blockedId: userIdB },
        { blockerId: userIdB, blockedId: userIdA },
      ],
    },
    select: { id: true },
  });

  return Boolean(block);
}
