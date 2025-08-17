'use client';
import React, { useMemo, useState } from 'react';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/common';
import { mockData } from '@/data';
import { useTournament } from '@/contexts/TournamentContext';

export const EventosModal = ({ isOpen, onClose, match }) => {
  if (!match) return null;

  const { selectedTournament } = useTournament();
  const [filterTeam, setFilterTeam] = useState('Todos');
  const [query, setQuery] = useState('');

  // exemplo de estrutura de eventos esperada:
  // match.events = [{ id, minute, type: 'gol'|'amarelo'|'vermelho'|'sub', team, player, description }]
  const events = match.events || [];

  // busca nomes de times via dados mock (fallback para match.teamX)
  const team1Name = match.team1;
  const team2Name = match.team2;

  const filtered = useMemo(() => {
    return events
      .filter(ev => filterTeam === 'Todos' || ev.team === filterTeam)
      .filter(ev => {
        if (!query) return true;
        const q = query.toLowerCase();
        return (
          (ev.player && ev.player.toLowerCase().includes(q)) ||
          (ev.description && ev.description.toLowerCase().includes(q)) ||
          (ev.type && ev.type.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => (a.minute || 0) - (b.minute || 0));
  }, [events, filterTeam, query]);

  const iconFor = (type) => {
    switch ((type || '').toLowerCase()) {
      case 'gol': return '⚽';
      case 'amarelo': return '🟨';
      case 'vermelho': return '🟥';
      case 'sub': return '🔁';
      default: return '•';
    }
  };

  const handlePrint = () => {
    // abre uma janela simples com lista de eventos para impressão sem alterar modal
    const html = `
      <html>
        <head>
          <title>Súmula - Eventos</title>
          <style>
            body { font-family: Arial, Helvetica, sans-serif; padding: 20px; color: #111; }
            h1,h2 { margin: 0 0 8px 0; }
            .meta { margin-bottom: 12px; color: #444; font-size: 14px; }
            .event { margin: 8px 0; padding: 8px; border-bottom: 1px solid #eee; }
            .minute { font-weight: bold; width:56px; display:inline-block; }
            .player { font-weight:600; }
          </style>
        </head>
        <body>
          <h1>Súmula de Partida</h1>
          <div class="meta">${selectedTournament?.name || 'Torneio Interclasse'} — ${new Date().toLocaleDateString('pt-BR')}</div>
          <h2>${team1Name} ${match.result || ''} ${team2Name}</h2>
          ${filtered.map(ev => `
            <div class="event">
              <div><span class="minute">${ev.minute ?? ''}'</span> ${iconFor(ev.type)} <span class="player">${ev.player || ''}</span> — <span style="color:#666">${ev.team || ''}</span></div>
              <div style="color:#333;margin-top:4px">${ev.description || ''}</div>
            </div>
          `).join('')}
        </body>
      </html>
    `;
    const w = window.open('', '_blank', 'width=800,height=900');
    if (!w) return alert('Bloqueador de pop-up impediu a impressão.');
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="EVENTOS DA PARTIDA" size="max-w-2xl max-h-[80vh]">
      <div className="flex flex-col h-[70vh]">
        <div className="flex-1 overflow-y-auto p-4 bg-white dark:bg-gray-800">
          <div className="text-center mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Eventos — {team1Name} {match.result || ''} {team2Name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {selectedTournament?.name || 'Torneio Interclasse'} — {new Date().toLocaleDateString('pt-BR')} • {match.location || ''}
            </p>
          </div>

          <div className="flex gap-2 items-center mb-4">
            <select
              value={filterTeam}
              onChange={(e) => setFilterTeam(e.target.value)}
              className="px-2 py-1 border rounded bg-white dark:bg-gray-700"
            >
              <option value="Todos">Todos</option>
              <option value={team1Name}>{team1Name}</option>
              <option value={team2Name}>{team2Name}</option>
            </select>

            <input
              type="search"
              placeholder="Pesquisar jogador / descrição / tipo..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 px-2 py-1 border rounded bg-white dark:bg-gray-700"
            />
          </div>

          <div className="space-y-2">
            {filtered.length === 0 && (
              <p className="text-center text-sm text-gray-500">Nenhum evento registrado para os filtros selecionados.</p>
            )}

            {filtered.map(ev => (
              <div key={ev.id ?? `${ev.minute}-${ev.type}-${Math.random()}`} className="p-3 rounded border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="text-xl">{iconFor(ev.type)}</div>
                    <div>
                      <div className="text-sm text-gray-700 dark:text-gray-200 font-semibold">
                        {ev.player || ev.team || 'Evento'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{ev.description}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-800 dark:text-gray-100">{ev.minute ?? '-' }'</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{ev.team}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-700 mt-4 bg-white dark:bg-gray-800 p-3">
          <Button onClick={handlePrint} variant="secondary">Imprimir / Exportar</Button>
          <Button onClick={onClose}>Fechar</Button>
        </div>
      </div>
    </Modal>
  );
};