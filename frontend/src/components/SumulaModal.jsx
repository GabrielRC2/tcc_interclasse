'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/common';
import { useTournament } from '@/contexts/TournamentContext';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { SumulaPDF } from './SumulaPDF';

export const SumulaModal = ({ isOpen, onClose, match, mode = 'final', onSumulaEnviada = () => {} }) => {
  if (!match) return null;

  const estaAoVivo = mode === 'live';
  const { selectedTournament } = useTournament();
  const sumulaRef = useRef(null);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [jogadoresTimeA, setJogadoresTimeA] = useState([]); // exibição (modo final)
  const [jogadoresTimeB, setJogadoresTimeB] = useState([]);
  const [eventos, setEventos] = useState([]);

  // estados editáveis (modo live)
  const [edicaoTimeA, setEdicaoTimeA] = useState([]); // [{ id, pontos, amarelos, vermelhos }]
  const [edicaoTimeB, setEdicaoTimeB] = useState([]);

  const [placarA, setPlacarA] = useState(match.result ? parseInt(match.result.split(':')[0]) || 0 : 0);
  const [placarB, setPlacarB] = useState(match.result ? parseInt(match.result.split(':')[1]) || 0 : 0);

  useEffect(() => {
    const carregarDados = async () => {
      setCarregando(true);
      try {
        const partidaRes = await fetch(`/api/partidas/${match.id}`);
        const partidaData = partidaRes.ok ? await partidaRes.json() : null;
        const time1Id = partidaData?.team1Id ?? match.team1Id;
        const time2Id = partidaData?.team2Id ?? match.team2Id;

        if (!time1Id || !time2Id) {
          console.error('IDs dos times não encontrados', { partidaData, match });
        }

        const [resT1, resT2, resEv] = await Promise.all([
          fetch(`/api/teams/${time1Id}/jogadores`),
          fetch(`/api/teams/${time2Id}/jogadores`),
          fetch(`/api/partidas/${match.id}/eventos`)
        ]);

        const dataT1 = resT1.ok ? await resT1.json() : [];
        const dataT2 = resT2.ok ? await resT2.json() : [];
        const dataEv = resEv.ok ? await resEv.json() : [];

        const mappedT1 = dataT1.map(p => ({ ...p, pontos: 0, amarelos: 0, vermelhos: 0 }));
        const mappedT2 = dataT2.map(p => ({ ...p, pontos: 0, amarelos: 0, vermelhos: 0 }));

        setJogadoresTimeA(mappedT1);
        setJogadoresTimeB(mappedT2);
        setEventos(dataEv || []);

        const montarEstatisticas = (jogadores, listaEventos) => {
          const mapa = {};
          jogadores.forEach(j => { mapa[j.id] = { pontos: 0, amarelos: 0, vermelhos: 0 }; });
          (listaEventos || []).forEach(ev => {
            const pid = parseInt(ev.jogadorId ?? ev.jogador ?? ev.jogador?.id);
            if (!pid || !(pid in mapa)) return;
            if (ev.tipo === 'GOL') mapa[pid].pontos += Number(ev.pontosGerados ?? ev.ponto ?? 1);
            else if (ev.tipo === 'CARTAO_AMARELO') mapa[pid].amarelos += 1;
            else if (ev.tipo === 'CARTAO_VERMELHO') mapa[pid].vermelhos += 1;
          });
          return Object.keys(mapa).map(k => ({ id: Number(k), ...mapa[k] }));
        };

        const statsA = montarEstatisticas(mappedT1, dataEv);
        const statsB = montarEstatisticas(mappedT2, dataEv);

        // inicializa edições (modo live)
        setEdicaoTimeA(statsA.map(s => ({ id: s.id, points: s.pontos, yellow: s.amarelos, red: s.vermelhos })));
        setEdicaoTimeB(statsB.map(s => ({ id: s.id, points: s.pontos, yellow: s.amarelos, red: s.vermelhos })));

        // atualiza exibição (modo final) com estatísticas
        setJogadoresTimeA(mappedT1.map(j => {
          const s = statsA.find(x => x.id === j.id) || {};
          return { ...j, points: s.pontos || 0, yellow: s.amarelos || 0, red: s.vermelhos || 0 };
        }));
        setJogadoresTimeB(mappedT2.map(j => {
          const s = statsB.find(x => x.id === j.id) || {};
          return { ...j, points: s.pontos || 0, yellow: s.amarelos || 0, red: s.vermelhos || 0 };
        }));

        // recalcula placar inicial
        const golsA = statsA.reduce((s, p) => s + (p.pontos || 0), 0);
        const golsB = statsB.reduce((s, p) => s + (p.pontos || 0), 0);
        setPlacarA(golsA);
        setPlacarB(golsB);
      } catch (err) {
        console.error('Erro ao carregar súmula:', err);
      } finally {
        setCarregando(false);
      }
    };

    carregarDados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match?.id]);

  // quando edições mudam em modo live, recalcula placar
  useEffect(() => {
    if (!estaAoVivo) return;
    const gA = (edicaoTimeA || []).reduce((s, p) => s + (p.points || 0), 0);
    const gB = (edicaoTimeB || []).reduce((s, p) => s + (p.points || 0), 0);
    setPlacarA(gA);
    setPlacarB(gB);
  }, [edicaoTimeA, edicaoTimeB, estaAoVivo]);

  const tratarMudancaInput = (time, jogadorId, campo, valor) => {
    const v = Math.max(0, parseInt(valor || '0', 10));
    if (time === 1) {
      setEdicaoTimeA(prev => prev.map(p => p.id === jogadorId ? { ...p, [campo]: v } : p));
    } else {
      setEdicaoTimeB(prev => prev.map(p => p.id === jogadorId ? { ...p, [campo]: v } : p));
    }
  };

  // envia eventos ao backend e finaliza partida (muda status para Finalizada)
  const enviarSumula = async () => {
    if (!estaAoVivo) return;
    setSalvando(true);
    try {
      const eventosEnviar = [];

      const adicionarEventosDeLista = (listaEdicao) => {
        listaEdicao.forEach(p => {
          const pontos = p.points || 0;
          if (pontos > 0) {
            eventosEnviar.push({ tipo: 'GOL', ponto: pontos, jogador: p.id });
          }
          for (let i = 0; i < (p.yellow || 0); i++) {
            eventosEnviar.push({ tipo: 'CARTAO_AMARELO', ponto: 0, jogador: p.id });
          }
          for (let i = 0; i < (p.red || 0); i++) {
            eventosEnviar.push({ tipo: 'CARTAO_VERMELHO', ponto: 0, jogador: p.id });
          }
        });
      };

      adicionarEventosDeLista(edicaoTimeA);
      adicionarEventosDeLista(edicaoTimeB);

      if (eventosEnviar.length === 0) {
        if (!confirm('Nenhum evento foi alterado. Deseja enviar mesmo assim?')) {
          setSalvando(false);
          return;
        }
      }

      // POST eventos
      const res = await fetch(`/api/partidas/${match.id}/eventos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventosEnviar)
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || 'Erro ao enviar eventos');
      }

      // após salvar eventos, atualiza status da partida para "Finalizada"
      const patchRes = await fetch(`/api/partidas/${match.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Finalizada' }) // endpoint mapeia para DB
      });

      if (!patchRes.ok) {
        const txt = await patchRes.text().catch(() => '');
        console.warn('Eventos salvos, mas falha ao atualizar status:', txt);
        // não bloqueamos sucesso dos eventos; informamos usuário
        alert('Eventos salvos, mas falha ao atualizar status da partida: ' + txt);
      } else {
        // notifica parent para atualizar listagens (MatchesPage / Dashboard)
        try {
          onSumulaEnviada(match.id);
        } catch (e) { /* noop */ }
      }

      // recarregar eventos atualizados para exibição
      const evRes = await fetch(`/api/partidas/${match.id}/eventos`);
      const evData = evRes.ok ? await evRes.json() : [];
      setEventos(evData || []);

      // recomputar exibição de estatísticas
      const recomputar = (jogadores, listaEventos) => {
        const mapa = {};
        jogadores.forEach(j => mapa[j.id] = { pontos: 0, amarelos: 0, vermelhos: 0 });
        (listaEventos || []).forEach(ev => {
          const pid = parseInt(ev.jogadorId ?? ev.jogador ?? ev.jogador?.id);
          if (!pid || !(pid in mapa)) return;
          if (ev.tipo === 'GOL') mapa[pid].pontos += Number(ev.pontosGerados ?? ev.ponto ?? 1);
          else if (ev.tipo === 'CARTAO_AMARELO') mapa[pid].amarelos += 1;
          else if (ev.tipo === 'CARTAO_VERMELHO') mapa[pid].vermelhos += 1;
        });
        return jogadores.map(j => ({ ...j, points: mapa[j.id].pontos, yellow: mapa[j.id].amarelos, red: mapa[j.id].vermelhos }));
      };

      setJogadoresTimeA(prev => recomputar(prev, evData));
      setJogadoresTimeB(prev => recomputar(prev, evData));

      alert('Súmula enviada e partida finalizada com sucesso.');
      onClose();
    } catch (err) {
      console.error('Erro ao enviar súmula:', err);
      alert('Erro ao enviar súmula: ' + (err.message || err));
    } finally {
      setSalvando(false);
    }
  };

  const gerarNomeArquivo = () => {
    const torneio = selectedTournament?.name || 'Torneio';
    const t1 = (match.team1 || '').replace(/\s+/g, '_');
    const t2 = (match.team2 || '').replace(/\s+/g, '_');
    return `${torneio}_${t1}_${t2}.pdf`;
  };

  const renderTabelaJogadores = (jogadores, edicao, numTime) => (
    <table className="w-full border-collapse">
      <thead>
        <tr className="bg-gray-50 dark:bg-gray-800">
          <th className="p-2 text-left">Jogador</th>
          <th className="p-2 text-center">Camisa</th>
          <th className="p-2 text-center">Gols</th>
          <th className="p-2 text-center">🟨</th>
          <th className="p-2 text-center">🟥</th>
        </tr>
      </thead>
      <tbody>
        {jogadores.length === 0 ? (
          <tr>
            <td colSpan="5" className="p-4 text-center text-gray-500">Nenhum jogador cadastrado</td>
          </tr>
        ) : (
          jogadores.map(j => {
            const linhaEdicao = (edicao || []).find(x => x.id === j.id) || { points: 0, yellow: 0, red: 0 };
            return (
              <tr key={j.id} className="border-t">
                <td className="p-2">{j.nome || j.name}</td>
                <td className="p-2 text-center">
                  <span className="inline-block bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full text-sm">
                    {j.numeroCamisa ?? j.numero ?? j.number ?? '-'}
                  </span>
                </td>
                <td className="p-2 text-center">
                  {estaAoVivo ? (
                    <input
                      type="number"
                      min={0}
                      className="w-16 text-center border rounded px-1 py-0.5"
                      value={linhaEdicao.points ?? 0}
                      onChange={e => tratarMudancaInput(numTime, j.id, 'points', e.target.value)}
                      disabled={salvando}
                    />
                  ) : (
                    <span className="text-lg font-semibold">{j.points}</span>
                  )}
                </td>
                <td className="p-2 text-center">
                  {estaAoVivo ? (
                    <input
                      type="number"
                      min={0}
                      className="w-12 text-center border rounded px-1 py-0.5"
                      value={linhaEdicao.yellow ?? 0}
                      onChange={e => tratarMudancaInput(numTime, j.id, 'yellow', e.target.value)}
                      disabled={salvando}
                    />
                  ) : (
                    <span className="text-yellow-500 font-bold">{j.yellow}</span>
                  )}
                </td>
                <td className="p-2 text-center">
                  {estaAoVivo ? (
                    <input
                      type="number"
                      min={0}
                      className="w-12 text-center border rounded px-1 py-0.5"
                      value={linhaEdicao.red ?? 0}
                      onChange={e => tratarMudancaInput(numTime, j.id, 'red', e.target.value)}
                      disabled={salvando}
                    />
                  ) : (
                    <span className="text-red-500 font-bold">{j.red}</span>
                  )}
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="INFORMAÇÕES DO TORNEIO" size="max-w-4xl max-h-[90vh]">
      <div className="flex flex-col h-[70vh]">
        <div ref={sumulaRef} className="flex-1 overflow-y-auto pr-2 bg-white dark:bg-gray-800 p-4">
          <div className="text-center mb-6 border-b pb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              SÚMULA DE PARTIDA {estaAoVivo && <span className="text-red-500">(AO VIVO)</span>}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{selectedTournament?.name || 'Torneio Interclasse'}</p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Data: {new Date().toLocaleDateString('pt-BR')} | Horário: {match.time || '-'} | Local: {match.location || '-'}
            </p>
          </div>

          {carregando ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 dark:border-white"></div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-around items-center text-center">
                <div>
                  <p className="font-bold text-lg dark:text-gray-200">{match.team1}</p>
                  <p className="font-extrabold text-6xl text-gray-800 dark:text-gray-100">{placarA}</p>
                </div>
                <p className="font-extrabold text-6xl text-gray-400 dark:text-gray-500">:</p>
                <div>
                  <p className="font-bold text-lg dark:text-gray-200">{match.team2}</p>
                  <p className="font-extrabold text-6xl text-gray-800 dark:text-gray-100">{placarB}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm border-t pt-4">
                <div>
                  <p><strong>Esporte:</strong> {match.modality || match.modalidade || '-'}</p>
                  <p><strong>Categoria:</strong> {match.category || match.categoria || '-'}</p>
                </div>
                <div>
                  <p><strong>Status:</strong> {match.status || '-'}</p>
                  <p><strong>Fase:</strong> {match.phase || match.fase || 'Grupos'}</p>
                </div>
              </div>

              <div className="mt-4 border-t pt-4">
                <h3 className="font-bold text-lg mb-3 text-center">JOGADORES E ESTATÍSTICAS</h3>

                {/* tabelas lado a lado em telas médias/maiores, empilhadas em telas pequenas */}
                <div className="mb-4">
                  <div className="flex flex-col md:flex-row md:items-start md:space-x-6 gap-4">
                    <div className="md:flex-1">
                      <h4 className="font-semibold bg-gray-100 dark:bg-gray-700 p-2 text-center mb-2">{match.team1}</h4>
                      {renderTabelaJogadores(jogadoresTimeA, edicaoTimeA, 1)}
                    </div>

                    <div className="md:flex-1">
                      <h4 className="font-semibold bg-gray-100 dark:bg-gray-700 p-2 text-center mb-2">{match.team2}</h4>
                      {renderTabelaJogadores(jogadoresTimeB, edicaoTimeB, 2)}
                    </div>
                  </div>
                </div>

              </div>

              <div className="text-center text-xs text-gray-500 border-t pt-4 mt-8">
                <p>Documento gerado automaticamente pelo Sistema de Gerenciamento de Torneios</p>
                <p>Gerado em: {new Date().toLocaleString('pt-BR')}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700 mt-4 bg-white dark:bg-gray-800">
          {estaAoVivo && !carregando ? (
            <Button onClick={enviarSumula} disabled={salvando}>
              {salvando ? 'Enviando...' : 'Enviar Súmula'}
            </Button>
          ) : (
            !carregando && (
              <PDFDownloadLink
                document={<SumulaPDF match={match} tournament={selectedTournament} showPenalties={false} team1Data={{ name: match.team1, players: jogadoresTimeA }} team2Data={{ name: match.team2, players: jogadoresTimeB }} />}
                fileName={gerarNomeArquivo()}
                className="inline-flex items-center px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-md transition-colors"
              >
                {({ loading }) => (loading ? 'Gerando PDF...' : 'Exportar PDF')}
              </PDFDownloadLink>
            )
          )}

          <Button onClick={onClose}>Fechar</Button>
        </div>
      </div>
    </Modal>
  );
};