import { prisma } from '../../config/database.js';
import { ConflictError, NotFoundError } from '../../shared/errors/AppError.js';
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
