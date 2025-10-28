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
  await prisma.Usuario.deleteMany({});

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
  // Ajuste: os torneios criados acima são de 2025, então buscamos pelos nomes corretos
  const torneioMeioAno = await prisma.Torneio.findFirst({ where: { nome: 'Meio do Ano 2025' } });
  const torneioFimAno = await prisma.Torneio.findFirst({ where: { nome: 'Fim de Ano 2025' } });
  if (!torneioMeioAno) throw new Error("Torneio principal não encontrado!");

  // 5.1 Associar Modalidades aos Torneios
  console.log('Associando modalidades aos torneios...');
  const volei = modalidades.find(m => m.nome === 'Vôlei');
  const handebol = modalidades.find(m => m.nome === 'Handebol');
  const futsal = modalidades.find(m => m.nome === 'Futsal');
  const basquete = modalidades.find(m => m.nome === 'Basquete');

  // Torneio Meio do Ano 2025: Vôlei e Handebol
  await prisma.TorneioModalidade.createMany({
    data: [
      { torneioId: torneioMeioAno.id, modalidadeId: volei.id },
      { torneioId: torneioMeioAno.id, modalidadeId: handebol.id },
    ]
  });

  // Torneio Fim de Ano 2025: Futsal e Basquete
  await prisma.TorneioModalidade.createMany({
    data: [
      { torneioId: torneioFimAno.id, modalidadeId: futsal.id },
      { torneioId: torneioFimAno.id, modalidadeId: basquete.id },
    ]
  });

  // 6. Inserir Categorias
  console.log('Criando Categorias...');
  if (!volei || !handebol) throw new Error("Modalidades de Vôlei ou Handebol não encontradas!");

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

  // Função auxiliar para decidir se uma turma participa (aleatorizado)
  const turmaParticipa = (probabilidade = 0.7) => Math.random() < probabilidade;

  // ===== MEIO DO ANO 2025: VÔLEI E HANDEBOL =====
  console.log('   Gerando times para Meio do Ano (Vôlei e Handebol)...');
  
  for (const categoria of categoriasMeioAno) {
    const isVolei = categoria.nome.includes('Vôlei');
    const isHandebol = categoria.nome.includes('Handebol');

    // DS - Desenvolvimento de Sistemas (alta participação)
    const ds = cursos.find(c => c.sigla === 'DS');
    if (turmaParticipa(0.9)) timesParaCriar.push({ nome: `1º${ds.sigla}`, sala: '1º', turma: null, cursoId: ds.id, categoriaId: categoria.id, torneioId: torneioMeioAno.id });
    if (turmaParticipa(0.9)) timesParaCriar.push({ nome: `2º${ds.sigla}`, sala: '2º', turma: null, cursoId: ds.id, categoriaId: categoria.id, torneioId: torneioMeioAno.id });
    if (turmaParticipa(0.85)) timesParaCriar.push({ nome: `3º${ds.sigla}`, sala: '3º', turma: null, cursoId: ds.id, categoriaId: categoria.id, torneioId: torneioMeioAno.id });

    // ETEL - Eletrônica (participação moderada)
    const etel = cursos.find(c => c.sigla === 'ETEL');
    if (turmaParticipa(0.7)) timesParaCriar.push({ nome: `1º${etel.sigla}`, sala: '1º', turma: null, cursoId: etel.id, categoriaId: categoria.id, torneioId: torneioMeioAno.id });
    if (turmaParticipa(0.75)) timesParaCriar.push({ nome: `2º${etel.sigla}`, sala: '2º', turma: null, cursoId: etel.id, categoriaId: categoria.id, torneioId: torneioMeioAno.id });
    if (turmaParticipa(0.65)) timesParaCriar.push({ nome: `3º${etel.sigla}`, sala: '3º', turma: null, cursoId: etel.id, categoriaId: categoria.id, torneioId: torneioMeioAno.id });

    // EVE - Eventos (gostam mais de Vôlei)
    const eve = cursos.find(c => c.sigla === 'EVE');
    if (isVolei && turmaParticipa(0.9)) timesParaCriar.push({ nome: `1º${eve.sigla}`, sala: '1º', turma: null, cursoId: eve.id, categoriaId: categoria.id, torneioId: torneioMeioAno.id });
    if (isVolei && turmaParticipa(0.85)) timesParaCriar.push({ nome: `2º${eve.sigla}`, sala: '2º', turma: null, cursoId: eve.id, categoriaId: categoria.id, torneioId: torneioMeioAno.id });
    if (isHandebol && turmaParticipa(0.5)) timesParaCriar.push({ nome: `1º${eve.sigla}`, sala: '1º', turma: null, cursoId: eve.id, categoriaId: categoria.id, torneioId: torneioMeioAno.id });

    // ETIQ - Química (participação moderada)
    const etiq = cursos.find(c => c.sigla === 'ETIQ');
    if (turmaParticipa(0.65)) timesParaCriar.push({ nome: `1º${etiq.sigla}`, sala: '1º', turma: null, cursoId: etiq.id, categoriaId: categoria.id, torneioId: torneioMeioAno.id });
    if (turmaParticipa(0.7)) timesParaCriar.push({ nome: `2º${etiq.sigla}`, sala: '2º', turma: null, cursoId: etiq.id, categoriaId: categoria.id, torneioId: torneioMeioAno.id });
    if (turmaParticipa(0.6)) timesParaCriar.push({ nome: `3º${etiq.sigla}`, sala: '3º', turma: null, cursoId: etiq.id, categoriaId: categoria.id, torneioId: torneioMeioAno.id });

    // HUM - Humanas (preferem Handebol)
    const hum = cursos.find(c => c.sigla === 'HUM');
    if (isHandebol && turmaParticipa(0.85)) timesParaCriar.push({ nome: `1º${hum.sigla}`, sala: '1º', turma: null, cursoId: hum.id, categoriaId: categoria.id, torneioId: torneioMeioAno.id });
    if (isHandebol && turmaParticipa(0.8)) timesParaCriar.push({ nome: `2º${hum.sigla}`, sala: '2º', turma: null, cursoId: hum.id, categoriaId: categoria.id, torneioId: torneioMeioAno.id });
    if (isVolei && turmaParticipa(0.5)) timesParaCriar.push({ nome: `1º${hum.sigla}`, sala: '1º', turma: null, cursoId: hum.id, categoriaId: categoria.id, torneioId: torneioMeioAno.id });

    // EDA - Edificações (participação baixa no meio do ano)
    const eda = cursos.find(c => c.sigla === 'EDA');
    if (turmaParticipa(0.5)) timesParaCriar.push({ nome: `2º${eda.sigla}`, sala: '2º', turma: null, cursoId: eda.id, categoriaId: categoria.id, torneioId: torneioMeioAno.id });
    if (turmaParticipa(0.45)) timesParaCriar.push({ nome: `3º${eda.sigla}`, sala: '3º', turma: null, cursoId: eda.id, categoriaId: categoria.id, torneioId: torneioMeioAno.id });

    // ADA - Administração (participação variada)
    const ada = cursos.find(c => c.sigla === 'ADA');
    if (turmaParticipa(0.7)) timesParaCriar.push({ nome: `1º${ada.sigla}`, sala: '1º', turma: null, cursoId: ada.id, categoriaId: categoria.id, torneioId: torneioMeioAno.id });
    if (turmaParticipa(0.6)) timesParaCriar.push({ nome: `2º${ada.sigla}`, sala: '2º', turma: null, cursoId: ada.id, categoriaId: categoria.id, torneioId: torneioMeioAno.id });
    if (turmaParticipa(0.55)) timesParaCriar.push({ nome: `3º${ada.sigla}`, sala: '3º', turma: null, cursoId: ada.id, categoriaId: categoria.id, torneioId: torneioMeioAno.id });
  }

  // ===== FIM DO ANO 2025: FUTSAL E BASQUETE =====
  console.log('   Gerando times para Fim de Ano (Futsal e Basquete)...');
  
  for (const categoria of categoriasFimAno) {
    const isFutsal = categoria.nome.includes('Futsal');
    const isBasquete = categoria.nome.includes('Basquete');

    // DS - Desenvolvimento de Sistemas (alta participação em ambos)
    const ds = cursos.find(c => c.sigla === 'DS');
    if (turmaParticipa(0.95)) timesParaCriar.push({ nome: `1º${ds.sigla}`, sala: '1º', turma: null, cursoId: ds.id, categoriaId: categoria.id, torneioId: torneioFimAno.id });
    if (turmaParticipa(0.95)) timesParaCriar.push({ nome: `2º${ds.sigla}`, sala: '2º', turma: null, cursoId: ds.id, categoriaId: categoria.id, torneioId: torneioFimAno.id });
    if (turmaParticipa(0.9)) timesParaCriar.push({ nome: `3º${ds.sigla}`, sala: '3º', turma: null, cursoId: ds.id, categoriaId: categoria.id, torneioId: torneioFimAno.id });

    // ETEL - Eletrônica (preferem Futsal)
    const etel = cursos.find(c => c.sigla === 'ETEL');
    if (isFutsal && turmaParticipa(0.9)) timesParaCriar.push({ nome: `1º${etel.sigla}`, sala: '1º', turma: null, cursoId: etel.id, categoriaId: categoria.id, torneioId: torneioFimAno.id });
    if (isFutsal && turmaParticipa(0.85)) timesParaCriar.push({ nome: `2º${etel.sigla}`, sala: '2º', turma: null, cursoId: etel.id, categoriaId: categoria.id, torneioId: torneioFimAno.id });
    if (isFutsal && turmaParticipa(0.8)) timesParaCriar.push({ nome: `3º${etel.sigla}`, sala: '3º', turma: null, cursoId: etel.id, categoriaId: categoria.id, torneioId: torneioFimAno.id });
    if (isBasquete && turmaParticipa(0.6)) timesParaCriar.push({ nome: `2º${etel.sigla}`, sala: '2º', turma: null, cursoId: etel.id, categoriaId: categoria.id, torneioId: torneioFimAno.id });

    // EVE - Eventos (participação baixa no fim do ano - organizando eventos)
    const eve = cursos.find(c => c.sigla === 'EVE');
    if (turmaParticipa(0.4)) timesParaCriar.push({ nome: `1º${eve.sigla}`, sala: '1º', turma: null, cursoId: eve.id, categoriaId: categoria.id, torneioId: torneioFimAno.id });

    // ETIQ - Química (preferem Basquete no fim do ano)
    const etiq = cursos.find(c => c.sigla === 'ETIQ');
    if (isBasquete && turmaParticipa(0.8)) timesParaCriar.push({ nome: `1º${etiq.sigla}`, sala: '1º', turma: null, cursoId: etiq.id, categoriaId: categoria.id, torneioId: torneioFimAno.id });
    if (isBasquete && turmaParticipa(0.85)) timesParaCriar.push({ nome: `2º${etiq.sigla}`, sala: '2º', turma: null, cursoId: etiq.id, categoriaId: categoria.id, torneioId: torneioFimAno.id });
    if (isFutsal && turmaParticipa(0.65)) timesParaCriar.push({ nome: `1º${etiq.sigla}`, sala: '1º', turma: null, cursoId: etiq.id, categoriaId: categoria.id, torneioId: torneioFimAno.id });
    if (isFutsal && turmaParticipa(0.7)) timesParaCriar.push({ nome: `3º${etiq.sigla}`, sala: '3º', turma: null, cursoId: etiq.id, categoriaId: categoria.id, torneioId: torneioFimAno.id });

    // HUM - Humanas (alta participação no Futsal)
    const hum = cursos.find(c => c.sigla === 'HUM');
    if (isFutsal && turmaParticipa(0.9)) timesParaCriar.push({ nome: `1º${hum.sigla}`, sala: '1º', turma: null, cursoId: hum.id, categoriaId: categoria.id, torneioId: torneioFimAno.id });
    if (isFutsal && turmaParticipa(0.85)) timesParaCriar.push({ nome: `2º${hum.sigla}`, sala: '2º', turma: null, cursoId: hum.id, categoriaId: categoria.id, torneioId: torneioFimAno.id });
    if (isBasquete && turmaParticipa(0.5)) timesParaCriar.push({ nome: `1º${hum.sigla}`, sala: '1º', turma: null, cursoId: hum.id, categoriaId: categoria.id, torneioId: torneioFimAno.id });

    // EDA - Edificações (maior participação no fim do ano)
    const eda = cursos.find(c => c.sigla === 'EDA');
    if (turmaParticipa(0.8)) timesParaCriar.push({ nome: `1º${eda.sigla}`, sala: '1º', turma: null, cursoId: eda.id, categoriaId: categoria.id, torneioId: torneioFimAno.id });
    if (turmaParticipa(0.85)) timesParaCriar.push({ nome: `2º${eda.sigla}`, sala: '2º', turma: null, cursoId: eda.id, categoriaId: categoria.id, torneioId: torneioFimAno.id });
    if (turmaParticipa(0.75)) timesParaCriar.push({ nome: `3º${eda.sigla}`, sala: '3º', turma: null, cursoId: eda.id, categoriaId: categoria.id, torneioId: torneioFimAno.id });

    // ADA - Administração (participação moderada-alta)
    const ada = cursos.find(c => c.sigla === 'ADA');
    if (turmaParticipa(0.8)) timesParaCriar.push({ nome: `1º${ada.sigla}`, sala: '1º', turma: null, cursoId: ada.id, categoriaId: categoria.id, torneioId: torneioFimAno.id });
    if (turmaParticipa(0.75)) timesParaCriar.push({ nome: `2º${ada.sigla}`, sala: '2º', turma: null, cursoId: ada.id, categoriaId: categoria.id, torneioId: torneioFimAno.id });
    if (turmaParticipa(0.7)) timesParaCriar.push({ nome: `3º${ada.sigla}`, sala: '3º', turma: null, cursoId: ada.id, categoriaId: categoria.id, torneioId: torneioFimAno.id });
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

  // 9. Criação de Usuários de Teste
  console.log('Criando usuários de teste...');
  
  // Hash para a senha "123456"
  const hashedPassword = await bcrypt.hash('123456', 12);

  // Criar usuários de teste
  await prisma.Usuario.createMany({
    data: [
      {
        nome: 'Admin Teste',
        email: 'a@test.com',
        senhaHash: hashedPassword,
        tipo: 'ADMIN'
      },
      {
        nome: 'Staff Teste',
        email: 's@test.com',
        senhaHash: hashedPassword,
        tipo: 'STAFF'
      },
      {
        nome: 'Representante Teste',
        email: 'r@test.com',
        senhaHash: hashedPassword,
        tipo: 'REPRESENTANTE'
      }
    ]
  });

  console.log('✅ Seeding concluído com sucesso!');
  console.log('');
  console.log('📝 Usuários de teste criados:');
  console.log('');
  console.log('   👤 ADMIN:');
  console.log('      Email: a@test.com');
  console.log('      Senha: 123456');
  console.log('      Acesso: Todas as páginas');
  console.log('');
  console.log('   👤 STAFF:');
  console.log('      Email: s@test.com');
  console.log('      Senha: 123456');
  console.log('      Acesso: Home, Times, Cadastros');
  console.log('');
  console.log('   👤 REPRESENTANTE:');
  console.log('      Email: r@test.com');
  console.log('      Senha: 123456');
  console.log('      Acesso: Home, Times');
  console.log('');
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


