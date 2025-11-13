const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Dados dos times baseados no arquivo timesfda25.txt
const timesData = [
  { curso: 'Administração', ano: '1º', modalidades: ['Basquete Masculino', 'Futsal Masculino'] },
  { curso: 'Administração', ano: '2º', modalidades: ['Basquete Masculino', 'Basquete Feminino', 'Futsal Masculino', 'Futsal Feminino'] },
  { curso: 'Administração', ano: '3º', modalidades: ['Basquete Masculino', 'Basquete Feminino', 'Futsal Masculino', 'Futsal Feminino'] },
  
  { curso: 'Ciências da Natureza e Ciências Biológicas', ano: '1º', modalidades: ['Futsal Masculino', 'Futsal Feminino'] },
  { curso: 'Ciências da Natureza e Ciências Biológicas', ano: '2º', modalidades: ['Futsal Masculino'] },
  { curso: 'Ciências da Natureza e Ciências Biológicas', ano: '3º', modalidades: ['Basquete Masculino', 'Futsal Masculino'] },
  
  { curso: 'Ciências Humanas', ano: '3º', modalidades: ['Futsal Feminino', 'Basquete Feminino'] },
  
  { curso: 'Desenvolvimento de Sistemas', ano: '1º', turma: 'Manhã', modalidades: ['Basquete Masculino', 'Futsal Masculino'] },
  { curso: 'Desenvolvimento de Sistemas', ano: '1º', turma: 'Tarde', modalidades: ['Basquete Masculino', 'Futsal Masculino'] },
  { curso: 'Desenvolvimento de Sistemas', ano: '2º', turma: 'Manhã', modalidades: ['Basquete Masculino', 'Futsal Masculino'] },
  { curso: 'Desenvolvimento de Sistemas', ano: '2º', turma: 'Tarde', modalidades: ['Basquete Masculino', 'Futsal Masculino'] },
  { curso: 'Desenvolvimento de Sistemas', ano: '3º', modalidades: ['Basquete Masculino', 'Futsal Masculino'] },
  { curso: 'Desenvolvimento de Sistemas', ano: 'MISTO', modalidades: ['Futsal Feminino'] },
  
  { curso: 'Edificações', ano: '1º', modalidades: ['Futsal Masculino', 'Basquete Masculino'] },
  { curso: 'Edificações', ano: '2º', modalidades: ['Basquete Masculino', 'Basquete Feminino', 'Futsal Masculino'] },
  { curso: 'Edificações', ano: '3º', modalidades: ['Basquete Masculino', 'Basquete Feminino', 'Futsal Masculino', 'Futsal Feminino'] },
  
  { curso: 'Eletrônica', ano: '1º', modalidades: ['Basquete Masculino', 'Basquete Feminino', 'Futsal Masculino', 'Futsal Feminino'] },
  { curso: 'Eletrônica', ano: '2º', modalidades: ['Basquete Masculino', 'Basquete Feminino', 'Futsal Masculino', 'Futsal Feminino'] },
  { curso: 'Eletrônica', ano: '3º', modalidades: ['Basquete Masculino', 'Basquete Feminino', 'Futsal Masculino', 'Futsal Feminino'] },
  
  { curso: 'Eventos', ano: '1º', modalidades: [] }, // Sem inscrições
  { curso: 'Eventos', ano: '2º', modalidades: ['Basquete Masculino', 'Futsal Masculino'] },
  { curso: 'Eventos', ano: '3º', modalidades: ['Basquete Masculino', 'Futsal Masculino', 'Futsal Feminino'] },
  
  { curso: 'Química', ano: '1º', modalidades: ['Basquete Masculino', 'Basquete Feminino', 'Futsal Masculino', 'Futsal Feminino'] },
  { curso: 'Química', ano: '2º', modalidades: ['Basquete Masculino', 'Futsal Masculino'] },
  { curso: 'Química', ano: '3º', modalidades: ['Basquete Feminino', 'Basquete Masculino', 'Futsal Masculino', 'Futsal Feminino'] },
];

// Mapeamento de nomes de cursos para siglas
const cursoParaSigla = {
  'Administração': 'ADA',
  'Ciências da Natureza e Ciências Biológicas': 'CNAT',
  'Ciências Humanas': 'HUM',
  'Desenvolvimento de Sistemas': 'DS',
  'Edificações': 'EDA',
  'Eletrônica': 'ETEL',
  'Eventos': 'EVE',
  'Química': 'ETIQ'
};

// Função para criar usuários
async function createUsers() {
  console.log('🔄 Criando usuários...');

  const adminPassword = await bcrypt.hash('icm007belarmino', 12);
  const staffPassword = await bcrypt.hash('equipeconfiavel', 12);
  const repPassword = await bcrypt.hash('vozdosalunos', 12);

  await prisma.usuario.createMany({
    data: [
      { nome: 'Administrador Sistema', email: 'admin@interclasse.com', senhaHash: adminPassword, tipo: 'ADMIN' },
      { nome: 'Staff Organizador', email: 'staff@interclasse.com', senhaHash: staffPassword, tipo: 'STAFF' },
      { nome: 'Representante 1', email: 'rep1@interclasse.com', senhaHash: repPassword, tipo: 'REPRESENTANTE' },
      { nome: 'Representante 2', email: 'rep2@interclasse.com', senhaHash: repPassword, tipo: 'REPRESENTANTE' },
      { nome: 'Representante 3', email: 'rep3@interclasse.com', senhaHash: repPassword, tipo: 'REPRESENTANTE' },
    ]
  });

  console.log('✅ 5 usuários criados\n');
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║       SEEDING FDA 2025 - SISTEMA INTERCLASSE              ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // ETAPA 1: Limpeza do banco de dados
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
  console.log('✅ Limpeza concluída!\n');

  // ETAPA 2: Criar usuários
  await createUsers();

  // ETAPA 3: Criar Locais
  console.log('📍 Criando Locais...');
  await prisma.Local.createMany({
    data: [
      { nome: 'Quadra de Cima' },
      { nome: 'Quadra de Baixo' },
    ],
  });
  console.log('✅ 2 locais criados\n');

  // ETAPA 4: Criar Cursos
  console.log('🎓 Criando Cursos...');
  await prisma.Curso.createMany({
    data: [
      { nome: 'Desenvolvimento de Sistemas', sigla: 'DS' },
      { nome: 'Eletrônica', sigla: 'ETEL' },
      { nome: 'Eventos', sigla: 'EVE' },
      { nome: 'Química', sigla: 'ETIQ' },
      { nome: 'Ciências Humanas', sigla: 'HUM' },
      { nome: 'Edificações', sigla: 'EDA' },
      { nome: 'Administração', sigla: 'ADA' },
      { nome: 'Ciências da Natureza e Ciências Biológicas', sigla: 'CNAT' },
    ],
  });
  const cursos = await prisma.Curso.findMany();
  console.log('✅ 8 cursos criados\n');

  // ETAPA 5: Criar Modalidades
  console.log('⚽ Criando Modalidades...');
  await prisma.Modalidade.createMany({
    data: [
      { nome: 'Futsal' },
      { nome: 'Basquete' },
    ],
  });
  const modalidades = await prisma.Modalidade.findMany();
  console.log('✅ 2 modalidades criadas\n');

  // ETAPA 6: Criar Torneio
  console.log('🏆 Criando Torneio...');
  await prisma.Torneio.create({
    data: {
      nome: 'Fim de Ano 2025',
      status: 'EM ANDAMENTO',
      inicio: new Date('2025-10-15T08:00:00'),
      fim: new Date('2025-11-30T18:00:00')
    },
  });
  const torneio = await prisma.Torneio.findFirst({ where: { nome: 'Fim de Ano 2025' } });
  console.log(`✅ Torneio criado: ${torneio.nome}\n`);

  // ETAPA 7: Associar Modalidades ao Torneio
  console.log('🔗 Associando modalidades ao torneio...');
  const futsal = modalidades.find(m => m.nome === 'Futsal');
  const basquete = modalidades.find(m => m.nome === 'Basquete');

  await prisma.TorneioModalidade.createMany({
    data: [
      { torneioId: torneio.id, modalidadeId: futsal.id },
      { torneioId: torneio.id, modalidadeId: basquete.id },
    ]
  });
  console.log('✅ Modalidades associadas\n');

  // ETAPA 8: Criar Categorias
  console.log('📋 Criando Categorias...');
  await prisma.Categoria.createMany({
    data: [
      { nome: 'Futsal Masculino', genero: 'Masculino', modalidadeId: futsal.id },
      { nome: 'Futsal Feminino', genero: 'Feminino', modalidadeId: futsal.id },
      { nome: 'Basquete Masculino', genero: 'Masculino', modalidadeId: basquete.id },
      { nome: 'Basquete Feminino', genero: 'Feminino', modalidadeId: basquete.id },
    ],
  });
  const categorias = await prisma.Categoria.findMany();
  console.log(`✅ ${categorias.length} categorias criadas\n`);

  // ETAPA 9: Criar Times baseados nos dados do FDA 2025
  console.log('🏃 Criando times do FDA 2025...\n');
  let timesParaCriar = [];
  let timesCriadosLog = [];

  for (const timeData of timesData) {
    // Pular se não tiver modalidades
    if (timeData.modalidades.length === 0) {
      console.log(`   ⚠️  ${timeData.curso} ${timeData.ano} - Sem inscrições`);
      continue;
    }

    // Encontrar o curso
    const sigla = cursoParaSigla[timeData.curso];
    const curso = cursos.find(c => c.sigla === sigla);
    
    if (!curso) {
      console.log(`   ❌ Curso não encontrado: ${timeData.curso} (${sigla})`);
      continue;
    }

    // Para cada modalidade inscrita
    for (const modalidadeNome of timeData.modalidades) {
      const categoria = categorias.find(c => c.nome === modalidadeNome);
      
      if (!categoria) {
        console.log(`   ❌ Categoria não encontrada: ${modalidadeNome}`);
        continue;
      }

      const timeExistente = await prisma.Time.findFirst({
        where: {
          cursoId: curso.id,
          sala: timeData.ano,
          turma: timeData.turma || null,
          categoriaId: categoria.id,
          torneioId: torneio.id
        }
      });

      if (timeExistente) {
        console.log(`   ⚠️  Time já existe: ${timeData.curso} ${timeData.ano}${timeData.turma ? ` - ${timeData.turma}` : ''} - ${modalidadeNome}`);
        continue;
      }

      // Criar nome do time
      let nomeTime = `${timeData.ano}${sigla}`;
      if (timeData.turma && timeData.turma !== 'MISTO') {
        nomeTime = `${timeData.ano}${sigla} - ${timeData.turma}`;
      } else if (timeData.ano === 'MISTO') {
        nomeTime = `${sigla} MISTO`;
      }

      timesParaCriar.push({
        nome: nomeTime,
        sala: timeData.ano,
        turma: timeData.turma || null,
        cursoId: curso.id,
        categoriaId: categoria.id,
        torneioId: torneio.id
      });

      timesCriadosLog.push(`${nomeTime} - ${modalidadeNome}`);
    }
  }

  // Criar todos os times de uma vez
  if (timesParaCriar.length > 0) {
    await prisma.Time.createMany({ data: timesParaCriar });
    console.log(`\n✅ ${timesParaCriar.length} times criados com sucesso!\n`);
    
    // Mostrar resumo
    console.log('📋 Times criados:');
    timesCriadosLog.forEach(log => console.log(`   • ${log}`));
  } else {
    console.log('\n⚠️  Nenhum time novo foi criado (todos já existem ou dados inválidos)\n');
  }

  // Estatísticas
  const totalTimesFutsal = timesParaCriar.filter(t => {
    const cat = categorias.find(c => c.id === t.categoriaId);
    return cat?.nome.includes('Futsal');
  }).length;

  const totalTimesBasquete = timesParaCriar.filter(t => {
    const cat = categorias.find(c => c.id === t.categoriaId);
    return cat?.nome.includes('Basquete');
  }).length;

  console.log('\n📊 Estatísticas:');
  console.log(`   • Total de times: ${timesParaCriar.length}`);
  console.log(`   • Times de Futsal: ${totalTimesFutsal}`);
  console.log(`   • Times de Basquete: ${totalTimesBasquete}`);

  console.log('\n✅ Seeding FDA 2025 concluído com sucesso!');
}

main()
  .then(() => {
    console.log('✨ Processo finalizado com sucesso!');
    process.exit(0);
  })
  .catch((e) => {
    console.error('\n❌ Ocorreu um erro durante o seeding:', e);
    console.error('\n💡 Dica: Verifique se:');
    console.log('   1. O seed principal foi executado primeiro (npm run seed)');
    console.log('   2. O torneio "Fim de Ano 2025" existe no banco');
    console.log('   3. Os cursos e categorias estão criados\n');
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
