const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// --- Função para Criar Usuários de Teste ---
async function createTestUsers() {
  console.log('\n🔄 Criando usuários de teste...');

  // Hash para a senha "123456"
  const hashedPassword = await bcrypt.hash('123456', 12);

  // Deletar usuários de teste existentes
  await prisma.usuario.deleteMany({
    where: {
      email: {
        in: [
          'admin@interclasse.com',
          'staff@interclasse.com',
          'rep1a@interclasse.com',
          'rep1b@interclasse.com',
          'rep2a@interclasse.com'
        ]
      }
    }
  });

  // Criar usuários
  const admin = await prisma.usuario.create({
    data: {
      nome: 'Administrador Sistema',
      email: 'admin@interclasse.com',
      senhaHash: hashedPassword,
      tipo: 'ADMIN'
    }
  });

  const staff = await prisma.usuario.create({
    data: {
      nome: 'Staff Organizador',
      email: 'staff@interclasse.com',
      senhaHash: hashedPassword,
      tipo: 'STAFF'
    }
  });

  const rep1A = await prisma.usuario.create({
    data: {
      nome: 'Representante Turma 1A',
      email: 'rep1a@interclasse.com',
      senhaHash: hashedPassword,
      tipo: 'REPRESENTANTE'
    }
  });

  const rep1B = await prisma.usuario.create({
    data: {
      nome: 'Representante Turma 1B',
      email: 'rep1b@interclasse.com',
      senhaHash: hashedPassword,
      tipo: 'REPRESENTANTE'
    }
  });

  const rep2A = await prisma.usuario.create({
    data: {
      nome: 'Representante Turma 2A',
      email: 'rep2a@interclasse.com',
      senhaHash: hashedPassword,
      tipo: 'REPRESENTANTE'
    }
  });

  console.log('✅ Usuários de teste criados com sucesso!\n');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📋 CREDENCIAIS PARA TESTE');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log('👨‍💼 ADMIN');
  console.log('   Email: admin@interclasse.com');
  console.log('   Senha: 123456');
  console.log('   ID: ' + admin.id + '\n');
  
  console.log('👔 STAFF');
  console.log('   Email: staff@interclasse.com');
  console.log('   Senha: 123456');
  console.log('   ID: ' + staff.id + '\n');
  
  console.log('👨‍🎓 REPRESENTANTES');
  console.log('   • rep1a@interclasse.com (ID: ' + rep1A.id + ')');
  console.log('   • rep1b@interclasse.com (ID: ' + rep1B.id + ')');
  console.log('   • rep2a@interclasse.com (ID: ' + rep2A.id + ')');
  console.log('   Senha: 123456\n');
  
  console.log('═══════════════════════════════════════════════════════════\n');
}

// --- Função Principal ---
async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         CRIAÇÃO DE USUÁRIOS - SISTEMA INTERCLASSE         ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  await createTestUsers();

  console.log('✅ Processo concluído com sucesso!');
}

main()
  .then(() => {
    console.log('✨ Usuários criados!');
    process.exit(0);
  })
  .catch((e) => {
    console.error('\n❌ Ocorreu um erro durante a criação de usuários:', e);
    console.error('\n💡 Dica: Verifique se:');
    console.log('   1. O Prisma Client está atualizado (npx prisma generate)');
    console.log('   2. As migrations foram executadas (npx prisma migrate dev)');
    console.log('   3. O banco de dados está acessível\n');
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
