import { prisma } from '../../config/database.js';

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
