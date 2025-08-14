// Teste de conexão com o banco
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
    try {
        console.log('🔗 Testando conexão com banco de dados...');

        // Teste básico de conexão
        await prisma.$connect();
        console.log('✅ Conexão com banco estabelecida!');

        // Teste de listagem de usuários
        console.log('📋 Testando busca de usuários...');
        const users = await prisma.usuario.findMany();
        console.log(`✅ Encontrados ${users.length} usuários no banco`);

        // Teste de criação de usuário
        console.log('➕ Testando criação de usuário...');
        const testUser = await prisma.usuario.create({
            data: {
                nome_usuario: 'Teste Usuario',
                email_usuario: 'teste@exemplo.com',
                senha_hash: '$2a$10$hashedpassword',
                tipo_usuario: 'ADMIN'
            }
        });
        console.log('✅ Usuário de teste criado:', testUser);

        // Limpar usuário de teste
        await prisma.usuario.delete({
            where: { id_usuario: testUser.id_usuario }
        });
        console.log('🧹 Usuário de teste removido');

    } catch (error) {
        console.error('❌ Erro:', error);
        console.error('Código do erro:', error.code);
        console.error('Meta:', error.meta);
    } finally {
        await prisma.$disconnect();
    }
}

testConnection();
