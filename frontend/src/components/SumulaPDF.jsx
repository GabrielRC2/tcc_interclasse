import React from 'react';
import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet
} from '@react-pdf/renderer';

// Estilos para o PDF (tabela semelhante à SumulaModal)
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 20,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#111'
  },
  header: {
    textAlign: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 9,
    color: '#666',
    marginBottom: 2,
  },
  scoreSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginVertical: 10,
  },
  teamContainer: {
    alignItems: 'center',
    flex: 1,
  },
  teamName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  score: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  infoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  infoText: {
    fontSize: 9,
    color: '#333',
  },

  // tabela
  tabela: {
    marginTop: 8,
    borderWidth: 0.5,
    borderColor: '#e6e6e6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  tabelaCabecalho: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e6e6e6',
  },
  th: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#111',
  },
  linha: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  celulaNome: {
    flex: 1.0,
    paddingRight: 4,
  },
  celulaCamisa: {
    width: 40,
    textAlign: 'center',
  },
  celulaGols: {
    width: 40,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  celulaCartao: {
    width: 36,
    textAlign: 'center',
  },
  cardAmarelo: {
    fontSize: 8,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  cardVermelho: {
    fontSize: 8,
    textAlign: 'center',
    fontWeight: 'bold',
  },

  playersSection: {
    marginTop: 12,
  },
  playersTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },

  // novos estilos para exibir os dois times lado a lado no PDF
  playersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  playersColumn: {
    width: '48%',
  },

  footer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    textAlign: 'center',
    fontSize: 8,
    color: '#666',
    borderTopWidth: 0.5,
    borderTopColor: '#e6e6e6',
    paddingTop: 6,
  },
});

/**
 * SumulaPDF
 * Props:
 *  - match: objeto da partida (team1, team2, result, time, modality, category, location, status, etc.)
 *  - tournament: objeto do torneio
 *  - showPenalties: boolean
 *  - team1Data: { name, players: [...] }  (deverá ser fornecido pelo SumulaModal)
 *  - team2Data: { name, players: [...] }  (deverá ser fornecido pelo SumulaModal)
 *
 * Observação: este componente NÃO utiliza mais dados mockados — espera receber team1Data/team2Data
 * (se não receber, exibirá listas vazias).
 */
export const SumulaPDF = ({ match = {}, tournament = {}, showPenalties = false, team1Data = null, team2Data = null }) => {
  // preparar dados fornecidos pelo SumulaModal (não usar mock)
  const t1 = {
    name: (team1Data && (team1Data.name || team1Data.nome)) || match?.team1 || '-',
    players: (team1Data && Array.isArray(team1Data.players) ? team1Data.players : [])
  };
  const t2 = {
    name: (team2Data && (team2Data.name || team2Data.nome)) || match?.team2 || '-',
    players: (team2Data && Array.isArray(team2Data.players) ? team2Data.players : [])
  };

  const obterNomeJogador = (p) => p?.nome ?? p?.name ?? '-';
  const obterNumeroCamisa = (p) => (p?.numeroCamisa ?? p?.numero ?? p?.number ?? '-');
  const obterGols = (p) => {
    const v = p?.points ?? p?.pontos ?? p?.gols ?? 0;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  const obterAmarelos = (p) => {
    const v = p?.yellow ?? p?.amarelos ?? 0;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  const obterVermelhos = (p) => {
    const v = p?.red ?? p?.vermelhos ?? 0;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  // renderizador de "tabela" para cada time
  const renderListaJogadores = (timeData) => {
    const players = (timeData?.players || []).map(p => ({
      id: p?.id ?? `${Math.random()}`,
      nome: obterNomeJogador(p),
      camisa: obterNumeroCamisa(p),
      gols: obterGols(p),
      amarelos: obterAmarelos(p),
      vermelhos: obterVermelhos(p),
    }));

    return (
      <View style={styles.tabela}>
        <View style={styles.tabelaCabecalho}>
          <Text style={[styles.th, styles.celulaNome]}>Jogador</Text>
          <Text style={[styles.th, styles.celulaCamisa]}>Camisa</Text>
          <Text style={[styles.th, styles.celulaGols]}>Gols</Text>
          <Text style={[styles.th, styles.celulaCartao]}>Ama.</Text>
          <Text style={[styles.th, styles.celulaCartao]}>Ver.</Text>
        </View>

        {players.length === 0 ? (
          <View style={styles.linha}>
            <Text style={styles.celulaNome}>Nenhum jogador cadastrado</Text>
          </View>
        ) : players.map(player => (
          <View key={String(player.id)} style={styles.linha}>
            <Text style={styles.celulaNome}>{player.nome}</Text>
            <Text style={styles.celulaCamisa}>{player.camisa ?? '-'}</Text>
            <Text style={styles.celulaGols}>{String(player.gols)}</Text>
            <View style={styles.celulaCartao}>
              {player.amarelos > 0 ? <Text style={styles.cardAmarelo}>{String(player.amarelos)}</Text> : <Text>-</Text>}
            </View>
            <View style={styles.celulaCartao}>
              {player.vermelhos > 0 ? <Text style={styles.cardVermelho}>{String(player.vermelhos)}</Text> : <Text>-</Text>}
            </View>
          </View>
        ))}
      </View>
    );
  };

  // calcular placar final: preferência para campos persistidos (pontosCasa/pontosVisitante),
  // senão tentar extrair de match.result (string), senão somar gols dos jogadores enviados.
  const parseResultadoString = (resStr) => {
    try {
      if (!resStr || typeof resStr !== 'string') return null;
      const parts = resStr.split(':').map(s => s.trim());
      if (parts.length !== 2) return null;
      const a = parseInt(parts[0], 10);
      const b = parseInt(parts[1], 10);
      if (Number.isFinite(a) && Number.isFinite(b)) return { a, b };
      return null;
    } catch {
      return null;
    }
  };

  const resultadoParseado = parseResultadoString(match?.result ?? match?.resultado ?? null);

  const placarA = (typeof match?.pontosCasa === 'number')
    ? match.pontosCasa
    : (resultadoParseado ? resultadoParseado.a : t1.players.reduce((s, p) => s + obterGols(p), 0));

  const placarB = (typeof match?.pontosVisitante === 'number')
    ? match.pontosVisitante
    : (resultadoParseado ? resultadoParseado.b : t2.players.reduce((s, p) => s + obterGols(p), 0));

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>SÚMULA DE PARTIDA</Text>
          <Text style={styles.subtitle}>{tournament?.name || 'Torneio Interclasse'}</Text>
          <Text style={styles.subtitle}>
            Data: {new Date().toLocaleDateString('pt-BR')} • Horário: {match?.time || '-'} • Local: {match?.location || '-'}
          </Text>
        </View>

        {/* Placar */}
        <View style={styles.scoreSection}>
          <View style={styles.teamContainer}>
            <Text style={styles.teamName}>{t1.name}</Text>
            <Text style={styles.score}>{placarA}</Text>
          </View>

          <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#666' }}>:</Text>

          <View style={styles.teamContainer}>
            <Text style={styles.teamName}>{t2.name}</Text>
            <Text style={styles.score}>{placarB}</Text>
          </View>
        </View>

        {/* Informações */}
        <View style={styles.infoSection}>
          <Text style={styles.infoText}><Text style={{ fontWeight: 'bold' }}>Esporte: </Text>{match?.modality ?? match?.modalidade ?? '-'}</Text>
          <Text style={styles.infoText}><Text style={{ fontWeight: 'bold' }}>Categoria: </Text>{match?.category ?? match?.categoria ?? '-'}</Text>
        </View>
        <View style={styles.infoSection}>
          <Text style={styles.infoText}><Text style={{ fontWeight: 'bold' }}>Status: </Text>{match?.status ?? '-'}</Text>
          <Text style={styles.infoText}><Text style={{ fontWeight: 'bold' }}>Fase: </Text>{match?.phase ?? match?.fase ?? 'Grupos'}</Text>
        </View>

        {/* Jogadores e estatísticas — tabelas lado a lado */}
        <View style={styles.playersSection}>
          <Text style={styles.playersTitle}>JOGADORES E ESTATÍSTICAS</Text>

          <View style={styles.playersRow}>
            <View style={styles.playersColumn}>
              <Text style={[styles.playersTitle, { marginBottom: 6 }]}>{t1.name}</Text>
              {renderListaJogadores(t1)}
            </View>

            <View style={styles.playersColumn}>
              <Text style={[styles.playersTitle, { marginBottom: 6 }]}>{t2.name}</Text>
              {renderListaJogadores(t2)}
            </View>
          </View>
        </View>

        {/* Pênaltis (opcional) */}
        {showPenalties && (
          <View style={{ marginTop: 10 }}>
            <Text style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 6, textAlign: 'center' }}>PÊNALTIS</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold' }}>{String((match?.penaltyResult || '0:0').split(':')[0] ?? '0')}</Text>
              <Text style={{ fontSize: 24, fontWeight: 'bold', marginHorizontal: 8 }}>:</Text>
              <Text style={{ fontSize: 24, fontWeight: 'bold' }}>{String((match?.penaltyResult || '0:0').split(':')[1] ?? '0')}</Text>
            </View>
          </View>
        )}

        <Text style={styles.footer}>
          Documento gerado automaticamente pelo Sistema de Gerenciamento de Torneios{'\n'}
          Gerado em: {new Date().toLocaleString('pt-BR')}
        </Text>
      </Page>
    </Document>
  );
};