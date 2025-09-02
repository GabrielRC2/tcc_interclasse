
const { PrismaClient } = require('@prisma/client');

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

// --- Função Principal do Seeder ---
async function main() {
  console.log('Iniciando o processo de seeding com nomes realistas...');

  // 1. Limpeza do banco de dados
  console.log('Limpando dados antigos...');
  await prisma.timeJogador.deleteMany({});
  await prisma.partidaTime.deleteMany({});
  await prisma.eventoPartida.deleteMany({});
  await prisma.partida.deleteMany({});
  await prisma.grupoTime.deleteMany({});
  await prisma.grupo.deleteMany({});
  await prisma.time.deleteMany({});
  await prisma.torneioModalidade.deleteMany({});
  await prisma.categoria.deleteMany({});
  await prisma.jogador.deleteMany({});
  await prisma.local.deleteMany({});
  await prisma.curso.deleteMany({});
  await prisma.modalidade.deleteMany({});
  await prisma.torneio.deleteMany({});
  
  // 2. Inserir Locais
  console.log('Criando Locais...');
  await prisma.local.createMany({
    data: [
        { nome: 'Quadra de Cima' },
        { nome: 'Quadra de Baixo' },
    ],
  });

  // 3. Inserir Cursos
  console.log('Criando Cursos...');
  await prisma.curso.createMany({
    data: [
      { nome: 'Desenvolvimento de Sistemas', sigla: 'DS' },
      { nome: 'Eletrônica', sigla: 'ETEL' },
      { nome: 'Eventos', sigla: 'EVE' },
      { nome: 'Química', sigla: 'ETIQ' },
      { nome: 'Humanas', sigla: 'HUM' },
      { nome: 'Edificações', sigla: 'EDA' },
      { nome: 'Administração', sigla: 'ADM' },
    ],
  });
  const cursos = await prisma.curso.findMany();

  // 4. Inserir Modalidades
  console.log('Criando Modalidades...');
  await prisma.modalidade.createMany({
    data: [{ nome: 'Futsal' }, { nome: 'Vôlei' }, { nome: 'Basquete' }, { nome: 'Handebol' }],
  });
  const modalidades = await prisma.modalidade.findMany();

  // 5. Inserir Torneios
  console.log('Criando Torneios...');
  await prisma.torneio.createMany({
    data: [
      { nome: 'Meio do Ano 2024', status: 'EM ANDAMENTO', inicio: new Date('2024-05-15T08:00:00'), fim: new Date('2024-06-15T18:00:00') },
      { nome: 'Fim de Ano 2024', status: 'PLANEJAMENTO', inicio: new Date('2024-11-10T08:00:00'), fim: new Date('2024-12-10T18:00:00') },
    ],
  });
  const torneioPrincipal = await prisma.torneio.findFirst({ where: { nome: 'Meio do Ano 2024' }});
  if (!torneioPrincipal) throw new Error("Torneio principal não encontrado!");

  // 6. Inserir Categorias
  console.log('Criando Categorias...');
  const volei = modalidades.find(m => m.nome === 'Vôlei');
  const handebol = modalidades.find(m => m.nome === 'Handebol');
  if (!volei || !handebol) throw new Error("Modalidades de Vôlei ou Handebol não encontradas!");

  await prisma.categoria.createMany({
    data: [
      { nome: 'Vôlei Masculino', genero: 'Masculino', modalidadeId: volei.id },
      { nome: 'Vôlei Feminino', genero: 'Feminino', modalidadeId: volei.id },
      { nome: 'Handebol Masculino', genero: 'Masculino', modalidadeId: handebol.id },
      { nome: 'Handebol Feminino', genero: 'Feminino', modalidadeId: handebol.id },
    ],
  });
  const categorias = await prisma.categoria.findMany();
  
  // 7. Geração de Jogadores com Nomes Realistas
  console.log('Gerando jogadores com nomes realistas...');
  const salas = ['1º', '2º', '3º'];
  let todosJogadoresParaCriar = [];

  for (const curso of cursos) {
    for (const sala of salas) {
      for (const genero of ['Masculino', 'Feminino']) {
        for (let i = 0; i < 15; i++) { // Gerar 15 jogadores por grupo
          
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
  await prisma.jogador.createMany({ data: todosJogadoresParaCriar });
  const jogadoresDoBanco = await prisma.jogador.findMany();

  // 8. Geração de Times e associação de jogadores
  console.log('Criando times e associando jogadores...');
  let timesParaCriar = [];
  
  for (const curso of cursos) {
      for (const sala of salas) {
          for (const categoria of categorias) {
              timesParaCriar.push({
                  nome: `${sala}${curso.sigla}`,
                  sala,
                  cursoId: curso.id,
                  categoriaId: categoria.id,
                  torneioId: torneioPrincipal.id,
              });
          }
      }
  }
  await prisma.time.createMany({ data: timesParaCriar });
  const timesDoBanco = await prisma.time.findMany({ include: { categoria: true } });

  let escalacoes = [];
  for (const time of timesDoBanco) {
    const jogadoresDisponiveis = jogadoresDoBanco.filter(j => 
        j.cursoId === time.cursoId &&
        j.sala === time.sala &&
        j.genero === time.categoria.genero
    );

    const numJogadoresParaEscalar = time.categoria.nome.includes('Vôlei') ? 6 : 7;
    const jogadoresParaEscalar = jogadoresDisponiveis.slice(0, numJogadoresParaEscalar);

    for (let i = 0; i < jogadoresParaEscalar.length; i++) {
        escalacoes.push({
            timeId: time.id,
            jogadorId: jogadoresParaEscalar[i].id,
            numeroCamisa: i + 1,
        });
    }
  }

  await prisma.timeJogador.createMany({ data: escalacoes });

  console.log('Seeding concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('Ocorreu um erro durante o seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
