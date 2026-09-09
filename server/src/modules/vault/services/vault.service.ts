// ══════════════════════════════════════════════════════════════
// Vault Service - Gerenciamento do Cofre Digital Seguro
// ══════════════════════════════════════════════════════════════

import { prisma } from '../../../config/database.js';
import { NotFoundError, ForbiddenError } from '../../../shared/errors/AppError.js';
type VaultItemType = string;

export const vaultService = {
  /**
   * Lista todos os documentos do usuário no Cofre.
   */
  async listItems(userId: string) {
    return prisma.vaultItem.findMany({
      where: { userId },
      select: {
        id: true,
        type: true,
        label: true,
        fileUrl: true, // Em produção, isso seria assinado (Signed URL do S3)
        fileSizeKb: true,
        mimeType: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Adiciona um novo documento ao cofre.
   */
  async addItem(userId: string, type: VaultItemType, label: string, fileUrl: string, fileSizeKb: number, mimeType: string) {
    return prisma.vaultItem.create({
      data: {
        userId,
        type,
        label: label.trim(),
        fileUrl,
        fileSizeKb,
        mimeType,
      },
    });
  },

  /**
   * Remove um documento do cofre (Garante que só o dono pode remover).
   */
  async deleteItem(itemId: string, userId: string) {
    const item = await prisma.vaultItem.findUnique({
      where: { id: itemId },
      select: { userId: true },
    });

    if (!item) throw new NotFoundError('Documento');
    if (item.userId !== userId) throw new ForbiddenError('Você não tem permissão para acessar este documento.');

    // Aqui você também chamaria o AWS S3 para deletar o arquivo fisicamente
    // s3Service.deleteObject(item.fileUrl)

    await prisma.vaultItem.delete({ where: { id: itemId } });
  },
};
