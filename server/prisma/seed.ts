import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  await prisma.notification.deleteMany();
  await prisma.bookmark.deleteMany();
  await prisma.userJourneyItem.deleteMany();
  await prisma.journeyTask.deleteMany();
  await prisma.userBadge.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.agencyReview.deleteMany();
  await prisma.agency.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationUser.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.roomParticipant.deleteMany();
  await prisma.room.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.like.deleteMany();
  await prisma.post.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('Demo123!', 12);

  const user1 = await prisma.user.create({
    data: {
      email: 'demo@aupair.com',
      passwordHash,
      displayName: 'Anna Silva',
      role: 'CANDIDATE',
      city: 'São Paulo',
      country: 'Brasil',
      latitude: -23.5505,
      longitude: -46.6333,
      bio: 'Candidata au pair — animada para conhecer novas culturas!',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'mentor@aupair.com',
      passwordHash,
      displayName: 'Julia (Mentor)',
      role: 'MENTOR',
      isMentorActive: true,
      city: 'New York',
      country: 'USA',
      latitude: 40.7128,
      longitude: -74.006,
      hourlyRate: 45,
      bio: 'Au pair alumni com 5 anos de experiência nos EUA.',
    },
  });

  const user3 = await prisma.user.create({
    data: {
      email: 'alumni@aupair.com',
      passwordHash,
      displayName: 'Camila Rocha',
      role: 'ALUMNI',
      city: 'Seattle',
      country: 'USA',
      latitude: 47.6062,
      longitude: -122.3321,
    },
  });

  await prisma.agency.createMany({
    data: [
      { name: 'Cultural Exchange BR', description: 'Suporte rápido pós-embarque.', country: 'Brasil', averageRating: 4.8, reviewsCount: 1240 },
      { name: 'Global Au Pair Viagens', description: 'Variedade de famílias.', country: 'Brasil', averageRating: 3.9, reviewsCount: 856 },
      { name: 'AuPair America Pro', description: 'Especializada em rematch.', country: 'USA', averageRating: 4.5, reviewsCount: 620 },
    ],
  });

  await prisma.badge.createMany({
    data: [
      { slug: 'first-post', name: 'Primeira Publicação', description: 'Publicou no feed pela primeira vez', xpReward: 50 },
      { slug: 'mentor', name: 'Mentor Ativo', description: 'Ativou modo consultoria', xpReward: 100 },
      { slug: 'explorer', name: 'Exploradora', description: 'Conectou com 10 au pairs', xpReward: 75 },
    ],
  });

  await prisma.journeyTask.createMany({
    data: [
      { slug: 'passport', title: 'Passaporte válido', description: 'Verifique validade mínima de 6 meses', category: 'Documentos', sortOrder: 1, xpReward: 25 },
      { slug: 'visa', title: 'Solicitar visto', description: 'Inicie o processo de visto J-1', category: 'Documentos', sortOrder: 2, xpReward: 50 },
      { slug: 'agency', title: 'Escolher agência', description: 'Compare avaliações na plataforma', category: 'Preparação', sortOrder: 3, xpReward: 30 },
      { slug: 'profile', title: 'Completar perfil', description: 'Foto, bio e localização', category: 'Perfil', sortOrder: 4, xpReward: 20 },
      { slug: 'community', title: 'Conectar na comunidade', description: 'Siga 5 au pairs ou mentors', category: 'Social', sortOrder: 5, xpReward: 40 },
      { slug: 'emergency', title: 'Contatos de emergência', description: 'Cadastre pelo menos 1 contato SOS', category: 'Segurança', sortOrder: 6, xpReward: 35 },
    ],
  });

  await prisma.post.createMany({
    data: [
      { authorId: user1.id, content: 'Ansiosa para o meu match! Alguém de NY por aí?', type: 'FEED' },
      { authorId: user2.id, content: 'Dicas para entrevista com host family — perguntem!', type: 'FEED', likesCount: 12, commentsCount: 3 },
      { authorId: user3.id, content: 'Família em Seattle busca rematch urgente. Gêmeos de 4 anos, hosts incríveis.', type: 'REMATCH', rematchUrgency: 'URGENT', rematchCity: 'Seattle', rematchState: 'WA', rematchCountry: 'USA' },
      { authorId: user2.id, content: 'Story: Primeiro dia na host family!', type: 'STORY', imageUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400' },
    ],
  });

  const conv = await prisma.conversation.create({
    data: {
      participants: { create: [{ userId: user1.id }, { userId: user2.id }] },
      lastMessageAt: new Date(),
      lastMessagePreview: 'Oi Anna! Posso te ajudar com dicas de NY.',
    },
  });

  await prisma.message.create({
    data: {
      conversationId: conv.id,
      senderId: user2.id,
      content: 'Oi Anna! Posso te ajudar com dicas de NY.',
      status: 'DELIVERED',
    },
  });

  await prisma.room.create({
    data: {
      title: 'Rematch & Host Families — Q&A ao vivo',
      description: 'Tire dúvidas sobre rematch com mentors experientes.',
      hostId: user2.id,
      status: 'LIVE',
      startedAt: new Date(),
      participantCount: 1,
      participants: { create: [{ userId: user2.id, isSpeaker: true }] },
    },
  });

  console.log('✅ Seed finished successfully!');
  console.log('   demo@aupair.com / Demo123!');
  console.log('   mentor@aupair.com / Demo123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
