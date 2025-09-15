const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUsers() {
  try {
    console.log('  Criando usuarios de teste...');

    // Hash para a senha "123456"
    const hashedPassword = await bcrypt.hash('123456', 12);

    // Deletar usuários existentes para evitar duplicatas
    await prisma.usuario.deleteMany({
      where: {
        email_usuario: {
          in: ['a@test.com', 's@test.com', 'r@test.com']
        }
      }
    });

    // Criar usuários de teste
    const usuarios = await prisma.usuario.createMany({
      data: [
        {
          nome_usuario: 'Admin Teste',
          email_usuario: 'a@test.com',
          senha_hash: hashedPassword,
          tipo_usuario: 'ADMIN'
        },
        {
          nome_usuario: 'Staff Teste',
          email_usuario: 's@test.com',
          senha_hash: hashedPassword,
          tipo_usuario: 'STAFF'
        },
        {
          nome_usuario: 'Representante Teste',
          email_usuario: 'r@test.com',
          senha_hash: hashedPassword,
          tipo_usuario: 'REPRESENTANTE'
        }
      ]
    });

    console.log('Usuarios de teste criados com sucesso!');
    console.log('Credenciais para teste:');
    console.log('');
    console.log('   ADMIN:');
    console.log('   Email: a@test.com');
    console.log('   Senha: 123456');
    console.log('   Acesso: Todas as páginas');
    console.log('');
    console.log('   STAFF:');
    console.log('   Email: s@test.com');
    console.log('   Senha: 123456');
    console.log('   Acesso: Home, Times, Cadastros');
    console.log('');
    console.log('   REPRESENTANTE:');
    console.log('   Email: r@test.com');
    console.log('   Senha: 123456');
    console.log('   Acesso: Home, Times');
    console.log('');

  } catch (error) {
    console.error(' Erro ao criar usuarios:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUsers();
