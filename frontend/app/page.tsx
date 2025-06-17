"use client";
import React, { useEffect, useState } from 'react';

type Groups = Record<string, string[]>;
type Match = { t1: string; t2: string };

const teamsList = Array.from({ length: 20 }, (_, i) => `Sala ${i + 1}`);

export default function Home() {
  const [numGroups, setNumGroups] = useState(2);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [disposedTeams, setDisposedTeams] = useState<string[]>([]);
  const [groups, setGroups] = useState<Groups>({});
  const [matches, setMatches] = useState<Match[]>([]);
  const [groupDisplay, setGroupDisplay] = useState<Groups>({});
  const [loading, setLoading] = useState(false);

  // Seleção de equipes
  const handleTeamSelect = (team: string) => {
    setSelectedTeams(prev =>
      prev.includes(team) ? prev.filter(t => t !== team) : [...prev, team]
    );
  };

  // Adiciona equipes selecionadas
  const addSelectedTeams = () => {
    setDisposedTeams(prev =>
      [...new Set([...prev, ...selectedTeams])]
    );
    setSelectedTeams([]);
  };

  // Remove última equipe disposta
  const removeSelectedTeam = () => {
    setDisposedTeams(prev => prev.slice(0, -1));
  };

  // Gera grupos aleatórios
  const generateDisposition = () => {
    if (disposedTeams.length === 0) {
      alert("Nenhuma equipe disposta para sorteio!");
      return;
    }
    const shuffled = [...disposedTeams].sort(() => 0.5 - Math.random());
    const tempGroups: Groups = {};
    for (let i = 0; i < numGroups; i++) {
      tempGroups[String.fromCharCode(65 + i)] = [];
    }
    shuffled.forEach((team, idx) => {
      tempGroups[String.fromCharCode(65 + (idx % numGroups))].push(team);
    });
    setGroups(tempGroups);
    setGroupDisplay(tempGroups);
    setMatches([]);
  };

  // Chama API Laravel para gerar partidas
  const gerarPartidas = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/gerar-partidas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupsData: groups }),
      });
      const data = await res.json();
      setMatches(data.lista_ordenada);
      setGroupDisplay(data.todas_partidas);
    } catch (e) {
      alert('Erro ao gerar partidas');
    }
    setLoading(false);
  };

  return (
    <div style={{ margin: 20 }}>
      <h1>Organizador de Grupos - Interclasses</h1>

      <div>
        <label htmlFor="numGroups">Quantidade de Grupos:</label>
        <select
          id="numGroups"
          value={numGroups}
          onChange={e => setNumGroups(Number(e.target.value))}
        >
          {[2,3,4,5,6,7,8].map(n => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 20 }}>
        <div className="section">
          <h3>Selecionar Equipes</h3>
          <div>
            {teamsList.map(team => (
              <div key={team}>
                <label>
                  <input
                    type="checkbox"
                    checked={selectedTeams.includes(team)}
                    onChange={() => handleTeamSelect(team)}
                  />
                  {team}
                </label>
              </div>
            ))}
          </div>
          <button onClick={addSelectedTeams}>Adicionar às Equipes Dispostas</button>
        </div>

        <div className="section">
          <h3>Equipes Dispostas</h3>
          <ul>
            {disposedTeams.map(team => (
              <li key={team}>{team}</li>
            ))}
          </ul>
          <button onClick={removeSelectedTeam}>Remover Última</button>
        </div>

        <div className="section">
          <h3>Grupos Formados</h3>
          <div>
            {Object.entries(groupDisplay).map(([group, teams]) => (
              <div key={group} className="group">
                <h4>Grupo {group}</h4>
                {Array.isArray(teams)
                  ? teams.map(team => <p key={team}>{team}</p>)
                  : // Se vier do backend, teams é array de rodadas
                    (teams as any[]).map((rodada, idx) => (
                      <div key={idx}>
                        <b>Rodada {idx + 1}</b>
                        <ul>
                          {rodada.map((jogo: any, i: number) =>
                            jogo[0] !== "--" && jogo[1] !== "--" ? (
                              <li key={i}>{jogo[0]} x {jogo[1]}</li>
                            ) : (
                              <li key={i}>{jogo[0] === "--" ? jogo[1] : jogo[0]} folga</li>
                            )
                          )}
                        </ul>
                      </div>
                    ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <button onClick={generateDisposition} style={{ marginTop: 20 }}>
        Gerar Grupos
      </button>

      <button
        onClick={gerarPartidas}
        style={{ marginLeft: 10, marginTop: 20 }}
        disabled={Object.keys(groups).length === 0 || loading}
      >
        {loading ? 'Gerando...' : 'Gerar Partidas'}
      </button>

      {matches.length > 0 && (
        <div style={{ marginTop: 30 }}>
          <h1>Ordem Geral de Partidas</h1>
          {matches.map((jogo, idx) => (
            <p key={idx}>
              Partida {idx + 1}: {jogo.t1} x {jogo.t2}
            </p>
          ))}
        </div>
      )}

      <style jsx>{`
        .section {
          background: white;
          width: 30%;
          min-width: 250px;
          border: 1px solid #ccc;
          padding: 15px;
          border-radius: 10px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .group {
          border: 1px solid #333;
          padding: 10px;
          margin-top: 10px;
          border-radius: 8px;
          background: #fafafa;
        }
        button {
          margin-top: 10px;
          padding: 10px 15px;
          background: #b71c1c;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
        }
        button:hover {
          background: #d32f2f;
        }
        ul {
          list-style: none;
          padding: 0;
        }
        li {
          cursor: pointer;
        }
        li:hover {
          background: #eee;
        }
      `}</style>
    </div>
  );
}