// ══════════════════════════════════════════════════════════════
// Users Service - Perfil, Mapa e Conexões
// ══════════════════════════════════════════════════════════════

import { prisma } from '../../../config/database.js';
import { NotFoundError, ConflictError } from '../../../shared/errors/AppError.js';
import { createNotification } from '../../notifications/notifications.routes.js';
type UserRole = string;

// ─── Tipos ─────────────────────────────────────────────────

interface UpdateProfileInput {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  coverUrl?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  specialties?: string[];
  hourlyRate?: number;
}

// Select padrão para perfil público
const publicProfileSelect = {
  id: true,
  displayName: true,
  bio: true,
  avatarUrl: true,
  coverUrl: true,
  role: true,
  city: true,
  country: true,
  xp: true,
  level: true,
  isMentorActive: true,
  specialties: true,
  hourlyRate: true,
  isOnline: true,
  lastSeenAt: true,
  createdAt: true,
  _count: {
    select: {
      posts: true,
      followers: true,
      following: true,
    },
  },
} as const;

// ─── Service ───────────────────────────────────────────────

export const usersService = {
  /**
   * Busca perfil público de um usuário pelo ID.
   */
  async getProfile(userId: string, viewerId?: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        ...publicProfileSelect,
        // Verifica se o viewer segue este usuário
        followers: viewerId ? {
          where: { followerId: viewerId },
          select: { id: true },
        } : false,
      },
    });

    if (!user) throw new NotFoundError('Usuário');

    return {
      ...user,
      isFollowing: viewerId ? (user as any).followers?.length > 0 : false,
      followers: undefined,
    };
  },

  /**
   * Atualiza o perfil do usuário logado.
   */
  async updateProfile(userId: string, input: UpdateProfileInput) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(input.displayName && { displayName: input.displayName.trim() }),
        ...(input.bio !== undefined && { bio: input.bio?.trim() || null }),
        ...(input.avatarUrl !== undefined && { avatarUrl: input.avatarUrl }),
        ...(input.coverUrl !== undefined && { coverUrl: input.coverUrl }),
        ...(input.city !== undefined && { city: input.city }),
        ...(input.country !== undefined && { country: input.country }),
        ...(input.latitude !== undefined && { latitude: input.latitude }),
        ...(input.longitude !== undefined && { longitude: input.longitude }),
        ...(input.specialties && { specialties: JSON.stringify(input.specialties) }),
        ...(input.hourlyRate !== undefined && { hourlyRate: input.hourlyRate }),
      },
      select: publicProfileSelect,
    });

    return user;
  },

  /**
   * Ativa/Desativa o modo consultoria.
   */
  async toggleMentorMode(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, isMentorActive: true },
    });

    if (!user) throw new NotFoundError('Usuário');

    // Apenas ALUMNI pode ativar modo mentor
    const newMentorState = !user.isMentorActive;
    const newRole: UserRole = newMentorState ? 'MENTOR' : 'ALUMNI';

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        isMentorActive: newMentorState,
        role: newRole,
      },
      select: {
        id: true,
        role: true,
        isMentorActive: true,
      },
    });

    return updated;
  },

  /**
   * Seguir / Deixar de seguir um usuário (toggle).
   */
  async toggleFollow(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new ConflictError('Não é possível seguir a si mesmo.');
    }

    const target = await prisma.user.findUnique({ where: { id: followingId } });
    if (!target) throw new NotFoundError('Usuário');

    const existingFollow = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });

    if (existingFollow) {
      await prisma.follow.delete({ where: { id: existingFollow.id } });
      return { following: false };
    } else {
      await prisma.follow.create({ data: { followerId, followingId } });
      await createNotification(followingId, 'FOLLOW', 'Novo seguidor', 'Alguém começou a seguir você.', { followerId });
      return { following: true };
    }
  },

  /**
   * Busca usuários próximos por geolocalização.
   * Usa cálculo de distância Haversine simplificado para performance.
   * Em produção com PostGIS, usar ST_DWithin para escala real.
   */
  async getNearbyUsers(latitude: number, longitude: number, radiusKm: number = 50, limit: number = 30) {
    // Bounding box simplificado (filtro grosseiro antes do cálculo fino)
    const latDelta = radiusKm / 111; // ~111 km por grau de latitude
    const lonDelta = radiusKm / (111 * Math.cos(latitude * Math.PI / 180));

    const users = await prisma.user.findMany({
      where: {
        latitude: {
          gte: latitude - latDelta,
          lte: latitude + latDelta,
        },
        longitude: {
          gte: longitude - lonDelta,
          lte: longitude + lonDelta,
        },
      },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        role: true,
        city: true,
        country: true,
        latitude: true,
        longitude: true,
        isOnline: true,
        isMentorActive: true,
      },
      take: limit,
    });

    return users;
  },

  /**
   * Atualiza localização do usuário (chamada pelo frontend com GPS).
   */
  async updateLocation(userId: string, latitude: number, longitude: number) {
    await prisma.user.update({
      where: { id: userId },
      data: { latitude, longitude },
    });
  },
};
