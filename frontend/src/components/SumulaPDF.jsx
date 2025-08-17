import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

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
    paddingRight: 6,
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
    backgroundColor: '#fbbf24',
    color: '#000',
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 2,
    fontSize: 8,
    textAlign: 'center'
  },
  cardVermelho: {
    backgroundColor: '#dc2626',
    color: '#fff',
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 2,
    fontSize: 8,
    textAlign: 'center'
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
 *  - team1Data: { name, players: [...] }  (opcional — quando fornecido usa estes dados)
 *  - team2Data: { name, players: [...] }  (opcional)
 *
 * Players: cada player pode ter campos em português ou inglês:
 *  - id, nome|name, numeroCamisa|numero|number, points|pontos|gols, yellow|amarelos, red|vermelhos
 */
export const SumulaPDF = ({ match = {}, tournament = {}, showPenalties = false, team1Data = null, team2Data = null }) => {
  // fallback: se não recebeu dados de times, tenta usar mock (como antes)
  const mockData = {
    teams: [
      {
        name: match?.team1,
        players: [
          { id: 1, name: "João Silva", points: 2, yellow: 1, red: 0, numero: 10 },
          { id: 2, name: "Carlos Santos", points: 1, yellow: 0, red: 0, numero: 7 },
          { id: 3, name: "Pedro Lima", points: 0, yellow: 2, red: 1, numero: 5 },
        ]
      },
      {
        name: match?.team2,
        players: [
          { id: 4, name: "Ana Maria", points: 1, yellow: 0, red: 0, numero: 9 },
          { id: 5, name: "Beatriz Silva", points: 2, yellow: 1, red: 0, numero: 11 },
          { id: 6, name: "Carla Santos", points: 0, yellow: 0, red: 0, numero: 8 },
        ]
      }
    ]
  };

  const t1 = team1Data || mockData.teams[0];
  const t2 = team2Data || mockData.teams[1];

  const obterNomeJogador = (p) => p.nome ?? p.name ?? '-';
  const obterNumeroCamisa = (p) => (p.numeroCamisa ?? p.numero ?? p.number ?? '-');
  const obterGols = (p) => (p.points ?? p.pontos ?? p.gols ?? 0);
  const obterAmarelos = (p) => (p.yellow ?? p.amarelos ?? 0);
  const obterVermelhos = (p) => (p.red ?? p.vermelhos ?? 0);

  // helper para renderizar lista de jogadores como "tabela"
  const renderListaJogadores = (timeData) => {
    const players = (timeData?.players || []).map(p => ({
      id: p.id,
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
          <Text style={[styles.th, styles.celulaCartao]}>🟨</Text>
          <Text style={[styles.th, styles.celulaCartao]}>🟥</Text>
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

  // Placar principal (tenta extrair de match.result)
  const placarA = (match?.result && typeof match.result === 'string') ? (match.result.split(':')[0] ?? '0') : (match?.pontosCasa ?? '0');
  const placarB = (match?.result && typeof match.result === 'string') ? (match.result.split(':')[1] ?? '0') : (match?.pontosVisitante ?? '0');

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
            <Text style={styles.teamName}>{match?.team1}</Text>
            <Text style={styles.score}>{placarA}</Text>
          </View>

          <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#666' }}>:</Text>

          <View style={styles.teamContainer}>
            <Text style={styles.teamName}>{match?.team2}</Text>
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
              <Text style={{ fontSize: 24, fontWeight: 'bold' }}>{(match?.penaltyResult || '0:0').split(':')[0]}</Text>
              <Text style={{ fontSize: 24, fontWeight: 'bold', marginHorizontal: 8 }}>:</Text>
              <Text style={{ fontSize: 24, fontWeight: 'bold' }}>{(match?.penaltyResult || '0:0').split(':')[1]}</Text>
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