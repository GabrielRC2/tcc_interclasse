const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// --- Listas de Nomes para Geração Aleatória ---
const nomesMasculinos = [
  'João', 'Pedro', 'Lucas', 'Gabriel', 'Mateus', 'Enzo', 'Miguel', 'Davi', 'Arthur', 'Heitor',
  'Bernardo', 'Guilherme', 'Rafael', 'Daniel', 'Felipe', 'Thiago', 'Leonardo', 'Vinícius', 'Eduardo', 'Caio'
];
const nomesFemininos = [
  'Maria', 'Ana', 'Alice', 'Laura', 'Sophia', 'Manuela', 'Júlia', 'Valentina', 'Helena', 'Isabella',
  'Luiza', 'Gabriela', 'Mariana', 'Beatriz', 'Giovanna', 'Camila', 'Fernanda', 'Larissa', 'Amanda', 'Letícia'
];
const sobrenomes = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes',
  'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Melo', 'Barbosa', 'Nunes', 'Mendes', 'Vieira'
];

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

// --- Função Principal do Seeder ---
async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     SEEDING DO BANCO DE DADOS - SISTEMA INTERCLASSE       ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // ETAPA 1: Criar usuários de teste
  await createTestUsers();

  // ETAPA 2: Limpeza do banco de dados
  console.log('🗑️  Limpando dados antigos do sistema...');
  await prisma.TimeJogador.deleteMany({});
  await prisma.PartidaTime.deleteMany({});
  await prisma.EventoPartida.deleteMany({});
  await prisma.Partida.deleteMany({});
  await prisma.GrupoTime.deleteMany({});
  await prisma.Grupo.deleteMany({});
  await prisma.Time.deleteMany({});
  await prisma.TorneioModalidade.deleteMany({});
  await prisma.Categoria.deleteMany({});
  await prisma.Jogador.deleteMany({});
  await prisma.LocalModalidade.deleteMany({});
  await prisma.Local.deleteMany({});
  await prisma.Curso.deleteMany({});
  await prisma.Modalidade.deleteMany({});
  await prisma.Torneio.deleteMany({});
  console.log('✅ Dados antigos removidos\n');

  // ETAPA 3: Inserir Locais
  console.log('📍 Criando Locais...');
  await prisma.Local.createMany({
    data: [
      { nome: 'Quadra de Cima' },
      { nome: 'Quadra de Baixo' },
    ],
  });
  console.log('✅ 2 locais criados\n');

  // ETAPA 4: Inserir Cursos
  console.log('🎓 Criando Cursos...');
  await prisma.Curso.createMany({
    data: [
      { nome: 'Desenvolvimento de Sistemas', sigla: 'DS' },
      { nome: 'Eletrônica', sigla: 'ETEL' },
      { nome: 'Eventos', sigla: 'EVE' },
      { nome: 'Química', sigla: 'ETIQ' },
      { nome: 'Humanas', sigla: 'HUM' },
      { nome: 'Edificações', sigla: 'EDA' },
      { nome: 'Administração', sigla: 'ADA' },
    ],
  });
  const cursos = await prisma.Curso.findMany();
  console.log('✅ 7 cursos criados\n');

  // ETAPA 5: Inserir Modalidades
  console.log('⚽ Criando Modalidades...');
  await prisma.Modalidade.createMany({
    data: [{ nome: 'Futsal' }, { nome: 'Vôlei' }, { nome: 'Basquete' }, { nome: 'Handebol' }],
  });
  const modalidades = await prisma.Modalidade.findMany();
  console.log('✅ 4 modalidades criadas\n');

  // ETAPA 6: Inserir Torneios
  console.log('🏆 Criando Torneios...');
  await prisma.Torneio.createMany({
    data: [
      { nome: 'Meio do Ano 2025', status: 'EM ANDAMENTO', inicio: new Date('2025-05-15T08:00:00'), fim: new Date('2025-06-30T18:00:00') },
      { nome: 'Fim de Ano 2025', status: 'PLANEJAMENTO', inicio: new Date('2025-10-15T08:00:00'), fim: new Date('2025-11-30T18:00:00') },
    ],
  });
  const torneios = await prisma.Torneio.findMany();
  const torneioMeioAno = torneios.find(t => t.nome === 'Meio do Ano 2025');
  const torneioFimAno = torneios.find(t => t.nome === 'Fim de Ano 2025');
  if (!torneioMeioAno || !torneioFimAno) throw new Error("Torneios não encontrados!");
  console.log('✅ 2 torneios criados (Meio e Fim de Ano 2025)\n');

  // ETAPA 7: Inserir Categorias
  console.log('🎯 Criando Categorias...');
  const volei = modalidades.find(m => m.nome === 'Vôlei');
  const handebol = modalidades.find(m => m.nome === 'Handebol');
  const futsal = modalidades.find(m => m.nome === 'Futsal');
  const basquete = modalidades.find(m => m.nome === 'Basquete');
  if (!volei || !handebol || !futsal || !basquete) throw new Error("Modalidades não encontradas!");

  await prisma.Categoria.createMany({
    data: [
      // Vôlei
      { nome: 'Vôlei Masculino', genero: 'Masculino', modalidadeId: volei.id },
      { nome: 'Vôlei Feminino', genero: 'Feminino', modalidadeId: volei.id },
      // Handebol
      { nome: 'Handebol Masculino', genero: 'Masculino', modalidadeId: handebol.id },
      { nome: 'Handebol Feminino', genero: 'Feminino', modalidadeId: handebol.id },
      // Futsal
      { nome: 'Futsal Masculino', genero: 'Masculino', modalidadeId: futsal.id },
      { nome: 'Futsal Feminino', genero: 'Feminino', modalidadeId: futsal.id },
      // Basquete
      { nome: 'Basquete Masculino', genero: 'Masculino', modalidadeId: basquete.id },
      { nome: 'Basquete Feminino', genero: 'Feminino', modalidadeId: basquete.id },
    ],
  });
  const categorias = await prisma.Categoria.findMany();
  console.log('✅ 8 categorias criadas (4 modalidades x 2 gêneros)\n');

  // ETAPA 8: Geração de Jogadores com Nomes Realistas
  console.log('👥 Gerando jogadores com nomes realistas...');
  const salas = ['1º', '2º', '3º'];
  let todosJogadoresParaCriar = [];

  for (const curso of cursos) {
    for (const sala of salas) {
      for (const genero of ['Masculino', 'Feminino']) {
        // Aumentando para 20 jogadores por grupo para ter mais variedade
        for (let i = 0; i < 20; i++) {

          // Lógica para gerar nome aleatório
          const primeiroNome = genero === 'Masculino'
            ? nomesMasculinos[Math.floor(Math.random() * nomesMasculinos.length)]
            : nomesFemininos[Math.floor(Math.random() * nomesFemininos.length)];

          const sobrenome1 = sobrenomes[Math.floor(Math.random() * sobrenomes.length)];
          const sobrenome2 = sobrenomes[Math.floor(Math.random() * sobrenomes.length)];

          const nomeCompleto = `${primeiroNome} ${sobrenome1} ${sobrenome2}`;

          todosJogadoresParaCriar.push({
            nome: nomeCompleto,
            sala,
            genero,
            cursoId: curso.id,
          });
        }
      }
    }
  }
  await prisma.Jogador.createMany({ data: todosJogadoresParaCriar });
  const jogadoresDoBanco = await prisma.Jogador.findMany();
  console.log(`✅ ${todosJogadoresParaCriar.length} jogadores criados\n`);

  // ETAPA 9: Geração de Times e associação de jogadores para AMBOS os torneios
  console.log('🏃 Criando times para os 2 torneios e associando jogadores...');
  let timesParaCriar = [];

  // Categorias do Meio do Ano (Vôlei e Handebol)
  const categoriasMeioAno = categorias.filter(c => 
    c.nome.includes('Vôlei') || c.nome.includes('Handebol')
  );

  // Categorias do Fim de Ano (Futsal e Basquete)
  const categoriasFimAno = categorias.filter(c => 
    c.nome.includes('Futsal') || c.nome.includes('Basquete')
  );

  // Criar times para Meio do Ano 2025 (Vôlei e Handebol)
  for (const curso of cursos) {
    for (const sala of salas) {
      for (const categoria of categoriasMeioAno) {
        timesParaCriar.push({
          nome: `${sala}${curso.sigla}`,
          sala,
          cursoId: curso.id,
          categoriaId: categoria.id,
          torneioId: torneioMeioAno.id,
        });
      }
    }
  }

  // Criar times para Fim de Ano 2025 (Futsal e Basquete)
  for (const curso of cursos) {
    for (const sala of salas) {
      for (const categoria of categoriasFimAno) {
        timesParaCriar.push({
          nome: `${sala}${curso.sigla}`,
          sala,
          cursoId: curso.id,
          categoriaId: categoria.id,
          torneioId: torneioFimAno.id,
        });
      }
    }
  }
  
  await prisma.Time.createMany({ data: timesParaCriar });
  const timesDoBanco = await prisma.Time.findMany({ include: { categoria: true } });

  let escalacoes = [];
  for (const time of timesDoBanco) {
    const jogadoresDisponiveis = jogadoresDoBanco.filter(j =>
      j.cursoId === time.cursoId &&
      j.sala === time.sala &&
      j.genero === time.categoria.genero
    );

    // Definir quantidade de jogadores por modalidade
    let numJogadoresParaEscalar = 6; // padrão vôlei
    if (time.categoria.nome.includes('Vôlei')) {
      numJogadoresParaEscalar = 6;
    } else if (time.categoria.nome.includes('Handebol')) {
      numJogadoresParaEscalar = 7;
    } else if (time.categoria.nome.includes('Futsal')) {
      numJogadoresParaEscalar = 5;
    } else if (time.categoria.nome.includes('Basquete')) {
      numJogadoresParaEscalar = 5;
    }

    const jogadoresParaEscalar = jogadoresDisponiveis.slice(0, numJogadoresParaEscalar);

    for (let i = 0; i < jogadoresParaEscalar.length; i++) {
      escalacoes.push({
        timeId: time.id,
        jogadorId: jogadoresParaEscalar[i].id,
        numeroCamisa: i + 1,
      });
    }
  }

  await prisma.TimeJogador.createMany({ data: escalacoes });
  
  const timesMeioAno = timesDoBanco.filter(t => t.torneioId === torneioMeioAno.id);
  const timesFimAno = timesDoBanco.filter(t => t.torneioId === torneioFimAno.id);
  
  console.log(`✅ ${timesDoBanco.length} times criados`);
  console.log(`   • Meio do Ano: ${timesMeioAno.length} times (Vôlei e Handebol)`);
  console.log(`   • Fim de Ano: ${timesFimAno.length} times (Futsal e Basquete)`);
  console.log(`✅ ${escalacoes.length} escalações de jogadores criadas\n`);

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║            SEEDING CONCLUÍDO COM SUCESSO! ✨               ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  console.log('📊 RESUMO FINAL:');
  console.log('   ✓ 5 usuários de teste');
  console.log('   ✓ 2 locais');
  console.log('   ✓ 7 cursos');
  console.log('   ✓ 4 modalidades (Futsal, Vôlei, Basquete, Handebol)');
  console.log('   ✓ 2 torneios (Meio e Fim de Ano 2025)');
  console.log('   ✓ 8 categorias (4 modalidades x 2 gêneros)');
  console.log(`   ✓ ${todosJogadoresParaCriar.length} jogadores`);
  console.log(`   ✓ ${timesDoBanco.length} times`);
  console.log(`   ✓ ${escalacoes.length} escalações\n`);
  
  console.log('🎯 DETALHES DOS TORNEIOS:');
  console.log('   🏐 Meio do Ano 2025: 15/05/2025 - 30/06/2025 (EM ANDAMENTO)');
  console.log('      Modalidades: Vôlei e Handebol');
  console.log(`      Times: ${timesMeioAno.length} (${categoriasMeioAno.length} categorias)`);
  console.log('');
  console.log('   ⚽ Fim de Ano 2025: 15/10/2025 - 30/11/2025 (PLANEJAMENTO)');
  console.log('      Modalidades: Futsal e Basquete');
  console.log(`      Times: ${timesFimAno.length} (${categoriasFimAno.length} categorias)\n`);
}

main()
  .then(() => {
    console.log('✨ Processo finalizado com sucesso!');
    process.exit(0);
  })
  .catch((e) => {
    console.error('\n❌ Ocorreu um erro durante o seeding:', e);
    console.error('\n💡 Dica: Verifique se:');
    console.log('   1. O Prisma Client está atualizado (npx prisma generate)');
    console.log('   2. As migrations foram executadas (npx prisma migrate dev)');
    console.log('   3. O banco de dados está acessível\n');
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


