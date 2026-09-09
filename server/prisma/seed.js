import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();
async function main() {
    console.log('🌱 Starting database seed...');
    // Limpar tabelas
    await prisma.comment.deleteMany();
    await prisma.like.deleteMany();
    await prisma.post.deleteMany();
    await prisma.user.deleteMany();
    const passwordHash = await bcrypt.hash('Teste123', 12);
    // Criar Usuário 1 (Candidata)
    const user1 = await prisma.user.create({
        data: {
            email: 'anna@example.com',
            passwordHash,
            displayName: 'Anna Silva',
            role: 'CANDIDATE',
            city: 'São Paulo',
            country: 'Brasil',
        },
    });
    // Criar Usuário 2 (Alumni/Mentor)
    const user2 = await prisma.user.create({
        data: {
            email: 'julia@example.com',
            passwordHash,
            displayName: 'Julia (Mentor)',
            role: 'MENTOR',
            isMentorActive: true,
            city: 'New York',
            country: 'USA',
        },
    });
    // Criar Post
    await prisma.post.create({
        data: {
            authorId: user1.id,
            content: 'Ansiosa para o meu match! Alguém de NY por aí?',
            type: 'FEED',
        },
    });
    console.log('✅ Seed finished successfully!');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map