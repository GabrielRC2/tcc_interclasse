import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

// Estilos para o PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    textAlign: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 3,
  },
  scoreSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginVertical: 20,
    paddingVertical: 20,
  },
  teamContainer: {
    alignItems: 'center',
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  score: {
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  separator: {
    fontSize: 48,
    fontWeight: 'bold',
    marginHorizontal: 20,
  },
  infoSection: {
    flexDirection: 'row',
    marginVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    paddingTop: 15,
  },
  infoColumn: {
    flex: 1,
    paddingRight: 10,
  },
  infoText: {
    fontSize: 11,
    marginBottom: 3,
    color: '#333',
  },
  playersSection: {
    marginTop: 20,
  },
  playersTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingBottom: 5,
  },
  playersGrid: {
    flexDirection: 'row',
    gap: 20,
  },
  playersList: {
    flex: 1,
  },
  teamHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    backgroundColor: '#f5f5f5',
    padding: 8,
  },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 10,
    marginBottom: 4,
    paddingVertical: 3,
    paddingHorizontal: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
  },
  playerName: {
    flex: 1,
  },
  playerStats: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  cardContainer: {
    flexDirection: 'row',
    gap: 3,
  },
  yellowCard: {
    backgroundColor: '#fbbf24',
    color: '#000',
    fontSize: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
    fontWeight: 'bold',
  },
  redCard: {
    backgroundColor: '#dc2626',
    color: '#fff',
    fontSize: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
    fontWeight: 'bold',
  },
  penaltiesSection: {
    marginVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    paddingTop: 15,
  },
  penaltiesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  penaltiesScore: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  penaltyScore: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#666',
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    paddingTop: 10,
  },
});

export const SumulaPDF = ({ match, tournament, showPenalties }) => {
  // Mesma lógica de buscar dados dos times
  const mockData = {
    teams: [
      {
        name: match?.team1,
        players: [
          { id: 1, name: "João Silva", points: 2, yellow: 1, red: 0 },
          { id: 2, name: "Carlos Santos", points: 1, yellow: 0, red: 0 },
          { id: 3, name: "Pedro Lima", points: 0, yellow: 2, red: 1 },
          { id: 4, name: "Lucas Oliveira", points: 1, yellow: 0, red: 0 },
          { id: 5, name: "Rafael Costa", points: 1, yellow: 1, red: 0 },
        ]
      },
      {
        name: match?.team2,
        players: [
          { id: 6, name: "Ana Maria", points: 1, yellow: 0, red: 0 },
          { id: 7, name: "Beatriz Silva", points: 2, yellow: 1, red: 0 },
          { id: 8, name: "Carla Santos", points: 0, yellow: 0, red: 0 },
          { id: 9, name: "Diana Lima", points: 0, yellow: 1, red: 0 },
          { id: 10, name: "Elena Costa", points: 0, yellow: 0, red: 0 },
        ]
      }
    ]
  };

  const team1Data = mockData.teams.find(t => t.name === match?.team1) || { players: [] };
  const team2Data = mockData.teams.find(t => t.name === match?.team2) || { players: [] };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>SÚMULA DE PARTIDA</Text>
          <Text style={styles.subtitle}>{tournament?.name || 'Torneio Interclasse'}</Text>
          <Text style={styles.subtitle}>
            Data: {new Date().toLocaleDateString('pt-BR')} | 
            Horário: {match?.time} | 
            Local: {match?.location}
          </Text>
        </View>

        {/* Placar Principal */}
        <View style={styles.scoreSection}>
          <View style={styles.teamContainer}>
            <Text style={styles.teamName}>{match?.team1}</Text>
            <Text style={styles.score}>{match?.result?.split(':')[0] || '0'}</Text>
          </View>
          <Text style={styles.separator}>:</Text>
          <View style={styles.teamContainer}>
            <Text style={styles.teamName}>{match?.team2}</Text>
            <Text style={styles.score}>{match?.result?.split(':')[1] || '0'}</Text>
          </View>
        </View>

        {/* Informações da Partida */}
        <View style={styles.infoSection}>
          <View style={styles.infoColumn}>
            <Text style={styles.infoText}>
              <Text style={{ fontWeight: 'bold' }}>Esporte:</Text> {match?.modality}
            </Text>
            <Text style={styles.infoText}>
              <Text style={{ fontWeight: 'bold' }}>Categoria:</Text> {match?.category}
            </Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoText}>
              <Text style={{ fontWeight: 'bold' }}>Status:</Text> {match?.status}
            </Text>
            <Text style={styles.infoText}>
              <Text style={{ fontWeight: 'bold' }}>Fase:</Text> {match?.phase || 'Grupos'}
            </Text>
          </View>
        </View>

        {/* Pênaltis (se habilitado) */}
        {showPenalties && (
          <View style={styles.penaltiesSection}>
            <Text style={styles.penaltiesTitle}>PÊNALTIS</Text>
            <View style={styles.penaltiesScore}>
              <Text style={styles.penaltyScore}>
                {match?.penaltyResult?.split(':')[0] || '0'}
              </Text>
              <Text style={styles.penaltyScore}>:</Text>
              <Text style={styles.penaltyScore}>
                {match?.penaltyResult?.split(':')[1] || '0'}
              </Text>
            </View>
          </View>
        )}

        {/* Jogadores */}
        <View style={styles.playersSection}>
          <Text style={styles.playersTitle}>JOGADORES E ESTATÍSTICAS</Text>
          <View style={styles.playersGrid}>
            {/* Time 1 */}
            <View style={styles.playersList}>
              <Text style={styles.teamHeader}>{match?.team1}</Text>
              {team1Data.players.map(player => (
                <View key={player.id} style={styles.playerRow}>
                  <Text style={styles.playerName}>{player.name}</Text>
                  <View style={styles.playerStats}>
                    <Text style={{ fontWeight: 'bold' }}>{player.points} gols</Text>
                    <View style={styles.cardContainer}>
                      {player.yellow > 0 && (
                        <Text style={styles.yellowCard}>{player.yellow}</Text>
                      )}
                      {player.red > 0 && (
                        <Text style={styles.redCard}>{player.red}</Text>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* Time 2 */}
            <View style={styles.playersList}>
              <Text style={styles.teamHeader}>{match?.team2}</Text>
              {team2Data.players.map(player => (
                <View key={player.id} style={styles.playerRow}>
                  <Text style={styles.playerName}>{player.name}</Text>
                  <View style={styles.playerStats}>
                    <Text style={{ fontWeight: 'bold' }}>{player.points} gols</Text>
                    <View style={styles.cardContainer}>
                      {player.yellow > 0 && (
                        <Text style={styles.yellowCard}>{player.yellow}</Text>
                      )}
                      {player.red > 0 && (
                        <Text style={styles.redCard}>{player.red}</Text>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Documento gerado automaticamente pelo Sistema de Gerenciamento de Torneios{'\n'}
          Gerado em: {new Date().toLocaleString('pt-BR')}
        </Text>
      </Page>
    </Document>
  );
};