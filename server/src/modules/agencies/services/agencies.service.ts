// ══════════════════════════════════════════════════════════════
// Agencies Service - Guia de Avaliações de Agências
// ══════════════════════════════════════════════════════════════

import { prisma } from '../../../config/database.js';
import { NotFoundError, ConflictError } from '../../../shared/errors/AppError.js';

export const agenciesService = {
  /**
   * Lista todas as agências ordenadas por nota média.
   */
  async listAgencies() {
    return prisma.agency.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        logoUrl: true,
        website: true,
        country: true,
        averageRating: true,
        reviewsCount: true,
      },
      orderBy: { averageRating: 'desc' },
    });
  },

  /**
   * Busca uma agência com todas as reviews.
   */
  async getAgencyDetail(agencyId: string) {
    const agency = await prisma.agency.findUnique({
      where: { id: agencyId },
      select: {
        id: true,
        name: true,
        description: true,
        logoUrl: true,
        website: true,
        country: true,
        averageRating: true,
        reviewsCount: true,
        reviews: {
          select: {
            id: true,
            rating: true,
            title: true,
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
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!agency) throw new NotFoundError('Agência');
    return agency;
  },

  /**
   * Adiciona uma avaliação a uma agência.
   * Recalcula a média automaticamente via transação.
   */
  async addReview(agencyId: string, authorId: string, rating: number, title: string, content: string) {
    const agency = await prisma.agency.findUnique({ where: { id: agencyId } });
    if (!agency) throw new NotFoundError('Agência');

    // Verificar se já avaliou
    const existing = await prisma.agencyReview.findUnique({
      where: { agencyId_authorId: { agencyId, authorId } },
    });
    if (existing) throw new ConflictError('Você já avaliou esta agência.');

    // Calcular nova média
    const newCount = agency.reviewsCount + 1;
    const newAverage = ((agency.averageRating * agency.reviewsCount) + rating) / newCount;

    const [review] = await prisma.$transaction([
      prisma.agencyReview.create({
        data: {
          agencyId,
          authorId,
          rating,
          title: title.trim(),
          content: content.trim(),
        },
        select: {
          id: true,
          rating: true,
          title: true,
          content: true,
          createdAt: true,
          author: {
            select: { id: true, displayName: true, avatarUrl: true },
          },
        },
      }),
      prisma.agency.update({
        where: { id: agencyId },
        data: {
          averageRating: Math.round(newAverage * 10) / 10, // 1 casa decimal
          reviewsCount: newCount,
        },
      }),
    ]);

    return review;
  },
};
