'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/common';
import { useTournament } from '@/contexts/TournamentContext';

// PDF Download Component that only renders on client - MOVED OUTSIDE COMPONENT
const PDFDownloadButton = ({ className, fileName, matchData, tournamentData, teamData1, teamData2 }) => {
  const [isClient, setIsClient] = useState(false);
  const [PDFComponent, setPDFComponent] = useState(null);

  useEffect(() => {
    setIsClient(true);
    
    // Import PDF components only on client side
    const loadPDFComponents = async () => {
      try {
        const [{ PDFDownloadLink }, { SumulaPDF }] = await Promise.all([
          import('@react-pdf/renderer'),
          import('./SumulaPDF')
        ]);
        
        setPDFComponent(() => ({ PDFDownloadLink, SumulaPDF }));
      } catch (error) {
        console.error('Erro ao carregar componentes PDF:', error);
      }
    };

    loadPDFComponents();
  }, []);

  if (!isClient || !PDFComponent) {
    return (
      <Button 
        variant="secondary" 
        size="sm" 
        disabled
        className={className}
      >
        Carregando PDF...
      </Button>
    );
  }

  const { PDFDownloadLink, SumulaPDF } = PDFComponent;

  return (
    <PDFDownloadLink
      document={
        <SumulaPDF 
          match={matchData} 
          tournament={tournamentData} 
          showPenalities={false} 
          team1Data={teamData1} 
          team2Data={teamData2} 
        />
      }
      fileName={fileName}
      className={className}
    >
      {({ loading }) => (loading ? 'Gerando PDF...' : 'Exportar PDF')}
    </PDFDownloadLink>
  );
};

export const SumulaModal = ({ isOpen, onClose, match, mode = 'final', onSumulaEnviada = () => {} }) => {
  const estaAoVivo = mode === 'live';
  const { selectedTournament } = useTournament();
  const sumulaRef = useRef(null);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [jogadoresTimeA, setJogadoresTimeA] = useState([]);
  const [jogadoresTimeB, setJogadoresTimeB] = useState([]);
  const [eventos, setEventos] = useState([]);

  // estados editáveis (modo live ou edição manual)
  const [edicaoTimeA, setEdicaoTimeA] = useState([]); // [{ id, points, yellow, red }]
  const [edicaoTimeB, setEdicaoTimeB] = useState([]);

  const [placarA, setPlacarA] = useState(0);
  const [placarB, setPlacarB] = useState(0);

  // Estados para pênaltis (só para eliminatórias)
  const [penaltisA, setPenaltisA] = useState(0);
  const [penaltisB, setPenaltisB] = useState(0);
  const [temPenaltis, setTemPenaltis] = useState(false);

  // permite editar mesmo quando NÃO está ao vivo (botão "Editar súmula")
  const [permitirEdicao, setPermitirEdicao] = useState(false);
  // quando o usuário inicia edição de uma partida já finalizada, marcamos este estado
  // para garantir que o botão de export fique oculto até que os dados sejam efetivamente persistidos
  const [editingFinalizada, setEditingFinalizada] = useState(false);

  // Verifica se é partida eliminatória (permitir pênaltis)
  // Partidas eliminatórias são aquelas SEM grupo (grupoId = null)
  const ehEliminatoria = match?.grupoId === null || match?.grupoId === undefined;
  // Verifica se há empate (necessário pênaltis em eliminatórias)
  const hahEmpate = placarA === placarB;

  // Initialize scores safely
  useEffect(() => {
    if (match?.result) {
      const resultStr = String(match.result);
      const parts = resultStr.split(':');
      setPlacarA(parseInt(parts[0]) || 0);
      setPlacarB(parseInt(parts[1]) || 0);
    } else {
      setPlacarA(0);
      setPlacarB(0);
    }
  }, [match?.result, match?.id]);

  useEffect(() => {
    const carregarDados = async () => {
      setCarregando(true);
      try {
        const partidaRes = await fetch(`/api/partidas/${match.id}`);
        const partidaData = partidaRes.ok ? await partidaRes.json() : null;
        const time1Id = partidaData?.team1Id ?? match.team1Id;
        const time2Id = partidaData?.team2Id ?? match.team2Id;

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

        // inicializa edições a partir das estatísticas atuais
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

        // recalcula placar inicial a partir dos eventos
        const golsA = statsA.reduce((s, p) => s + (p.pontos || 0), 0);
        const golsB = statsB.reduce((s, p) => s + (p.pontos || 0), 0);
        setPlacarA(golsA);
        setPlacarB(golsB);

        // Carregar dados de pênaltis se disponíveis
        if (partidaData) {
          setPenaltisA(partidaData.penaltisCasa || 0);
          setPenaltisB(partidaData.penaltisVisitante || 0);
          
          // Detectar pênaltis se temPenaltis for true OU se o resultado contém " pen"
          const temPenaltisDetectado = partidaData.temPenaltis || 
            (partidaData.result && partidaData.result.includes(' pen')) ||
            (partidaData.penaltisCasa !== null && partidaData.penaltisVisitante !== null);
          
          setTemPenaltis(temPenaltisDetectado);
        }
      } catch (err) {
        console.error('Erro ao carregar súmula:', err);
      } finally {
        setCarregando(false);
      }
    };

    if (match?.id && isOpen) {
      carregarDados();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match?.id, isOpen]);

  // quando edições mudam em modo live OU quando estamos em edição manual, recalcula placar
  useEffect(() => {
    if (!(estaAoVivo || permitirEdicao)) return;
    const gA = (edicaoTimeA || []).reduce((s, p) => s + (p.points || 0), 0);
    const gB = (edicaoTimeB || []).reduce((s, p) => s + (p.points || 0), 0);
    setPlacarA(gA);
    setPlacarB(gB);
  }, [edicaoTimeA, edicaoTimeB, estaAoVivo, permitirEdicao]);

  // Early return for better React consistency - AFTER all hooks
  if (!match || !isOpen) return null;

  const tratarMudancaInput = (time, jogadorId, campo, valor) => {
    const v = Math.max(0, parseInt(valor || '0', 10));
    if (time === 1) {
      setEdicaoTimeA(prev => prev.map(p => p.id === jogadorId ? { ...p, [campo]: v } : p));
    } else {
      setEdicaoTimeB(prev => prev.map(p => p.id === jogadorId ? { ...p, [campo]: v } : p));
    }
  };

  // envia eventos ao backend e atualiza pontos finais; permite envio quando ao vivo ou quando permitirEdicao=true
  const enviarSumula = async () => {
    if (!(estaAoVivo || permitirEdicao)) return;
    
    // Validação especial para partidas eliminatórias
    if (ehEliminatoria && hahEmpate && (!temPenaltis || penaltisA === penaltisB)) {
      alert('Em partidas eliminatórias não pode haver empate! Se o jogo terminou empatado, você deve registrar os pênaltis para determinar o vencedor.');
      return;
    }
    
    setSalvando(true);
    try {
      // Reconcile events instead of blindly creating duplicates.
      // 1) Load existing events for this match
      const existingRes = await fetch(`/api/partidas/${match.id}/eventos`);
      const existingEvents = existingRes.ok ? await existingRes.json() : [];

      // Build lookup maps
      const golMap = new Map(); // jogadorId -> event
      const cardMap = new Map(); // `${jogadorId}:${tipo}` -> array of events
      existingEvents.forEach(ev => {
        const jid = parseInt(ev.jogadorId ?? ev.jogador ?? ev.jogador?.id, 10);
        if (!jid) return;
        if (ev.tipo === 'GOL') {
          golMap.set(jid, ev);
        } else if (ev.tipo === 'CARTAO_AMARELO' || ev.tipo === 'CARTAO_VERMELHO') {
          const key = `${jid}:${ev.tipo}`;
          const arr = cardMap.get(key) || [];
          arr.push(ev);
          cardMap.set(key, arr);
        }
      });

      const postsToCreate = [];
      const patchesToDo = [];
      const warnings = [];

      const reconciliarLista = (listaEdicao) => {
        listaEdicao.forEach(p => {
          const jogadorId = p.id;
          const desiredGols = Number(p.points || 0);

          // GOLS: se já existe evento do tipo GOL para este jogador -> PATCH com pontosGerados = desired
          const existingGol = golMap.get(jogadorId);
          if (existingGol) {
            const existingPoints = Number(existingGol.pontosGerados ?? existingGol.ponto ?? 0);
            if (existingPoints !== desiredGols) {
              patchesToDo.push({ id: existingGol.id, body: { pontosGerados: desiredGols } });
            }
          } else if (desiredGols > 0) {
            // criar novo evento de GOL com pontos acumulados do jogador
            postsToCreate.push({ tipo: 'GOL', ponto: desiredGols, jogador: jogadorId });
          }

          // CARTÕES: aqui cada cartão é um registro. Se faltam registros, criamos; se houverem mais do que o desejado, apenas avisamos (sem DELETE disponível).
          const desiredY = Number(p.yellow || 0);
          const keyY = `${jogadorId}:CARTAO_AMARELO`;
          const existingY = (cardMap.get(keyY) || []).length;
          if (desiredY > existingY) {
            for (let i = 0; i < desiredY - existingY; i++) postsToCreate.push({ tipo: 'CARTAO_AMARELO', ponto: 0, jogador: jogadorId });
          } else if (desiredY < existingY) {
            warnings.push(`Jogador ${jogadorId} tem mais cartões amarelos no banco (${existingY}) do que o desejado (${desiredY}) — remoção não suportada pelo cliente.`);
          }

          const desiredR = Number(p.red || 0);
          const keyR = `${jogadorId}:CARTAO_VERMELHO`;
          const existingR = (cardMap.get(keyR) || []).length;
          if (desiredR > existingR) {
            for (let i = 0; i < desiredR - existingR; i++) postsToCreate.push({ tipo: 'CARTAO_VERMELHO', ponto: 0, jogador: jogadorId });
          } else if (desiredR < existingR) {
            warnings.push(`Jogador ${jogadorId} tem mais cartões vermelhos no banco (${existingR}) do que o desejado (${desiredR}) — remoção não suportada pelo cliente.`);
          }
        });
      };

      reconciliarLista(edicaoTimeA);
      reconciliarLista(edicaoTimeB);

      if (postsToCreate.length === 0 && patchesToDo.length === 0) {
        if (!confirm('Nenhuma alteração detectada. Deseja enviar/confirmar mesmo assim?')) {
          setSalvando(false);
          return;
        }
      }

      // Execute patches first
      if (patchesToDo.length > 0) {
        await Promise.all(patchesToDo.map(p => fetch(`/api/partidas/${match.id}/eventos/${p.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(p.body)
        })));
      }

      // Then create any missing events in batch (POST accepts array)
      if (postsToCreate.length > 0) {
        const createRes = await fetch(`/api/partidas/${match.id}/eventos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(postsToCreate)
        });
        if (!createRes.ok) {
          const txt = await createRes.text().catch(() => '');
          throw new Error(txt || 'Erro ao criar eventos');
        }
      }

      // Show warnings if any (cards present more than desired and we couldn't delete)
      if (warnings.length) {
        console.warn('Avisos ao reconciliar eventos:', warnings.join('\n'));
        alert('Avisos: ' + warnings.join('\n'));
      }


      const pontosCasaCalc = (edicaoTimeA || []).reduce((s, p) => s + (p.points || 0), 0);
      const pontosVisitanteCalc = (edicaoTimeB || []).reduce((s, p) => s + (p.points || 0), 0);

      // Finalizar a partida usando o novo endpoint
      const finalizarResponse = await fetch(`/api/partidas/${match.id}/finalizar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pontosCasa: pontosCasaCalc,
          pontosVisitante: pontosVisitanteCalc,
          // Adicionar dados de pênaltis se for eliminatória e tiver pênaltis
          ...(ehEliminatoria && temPenaltis && {
            penaltisCasa: penaltisA,
            penaltisVisitante: penaltisB,
            temPenaltis: true
          })
        }),
      });

      if (!finalizarResponse.ok) {
        const error = await finalizarResponse.json();
        throw new Error(error.error || 'Falha ao finalizar a partida');
      }

      // Se chegamos aqui, a partida foi finalizada e os pontos calculados.
      try { onSumulaEnviada(match.id); } catch (e) { /* noop */ }

      // recarregar eventos e recomputar exibição
      const evRes = await fetch(`/api/partidas/${match.id}/eventos`);
      const evData = evRes.ok ? await evRes.json() : [];
      setEventos(evData || []);

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

      // se edição manual, atualizamos com valores calculados a partir da edição também
      if (permitirEdicao && !estaAoVivo) {
        setJogadoresTimeA(prev => prev.map(j => {
          const ed = edicaoTimeA.find(e => e.id === j.id) || {};
          return { ...j, points: ed.points ?? j.points, yellow: ed.yellow ?? j.yellow, red: ed.red ?? j.red };
        }));
        setJogadoresTimeB(prev => prev.map(j => {
          const ed = edicaoTimeB.find(e => e.id === j.id) || {};
          return { ...j, points: ed.points ?? j.points, yellow: ed.yellow ?? j.yellow, red: ed.red ?? j.red };
        }));
      }

  alert(estaAoVivo ? 'Súmula enviada e partida finalizada com sucesso.' : 'Súmula atualizada com sucesso.');
  setPermitirEdicao(false);
  setEditingFinalizada(false);
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
    <table key={`tabela-time-${numTime}`} className="w-full border-collapse">
      <thead>
        <tr className="bg-gray-50 dark:bg-gray-800">
          <th className="p-2 text-left text-gray-900 dark:text-gray-100">Jogador</th>
          <th className="p-2 text-center text-gray-900 dark:text-gray-100">Camisa</th>
          <th className="p-2 text-center text-gray-900 dark:text-gray-100">Gols</th>
          <th className="p-2 text-center text-gray-900 dark:text-gray-100">🟨</th>
          <th className="p-2 text-center text-gray-900 dark:text-gray-100">🟥</th>
        </tr>
      </thead>
      <tbody>
        {jogadores.length === 0 ? (
          <tr>
            <td colSpan="5" className="p-4 text-center text-gray-500 dark:text-gray-400">Nenhum jogador cadastrado</td>
          </tr>
        ) : (
          jogadores.map((j) => {
            const linhaEdicao = (edicao || []).find(x => x.id === j.id) || { points: 0, yellow: 0, red: 0 };
            const podeEditarCampo = estaAoVivo || permitirEdicao;
            return (
              <tr key={`jogador-${j.id}-${numTime}`} className="border-t">
                <td className="p-2 text-gray-900 dark:text-gray-100">{j.nome || j.name}</td>
                <td className="p-2 text-center">
                  <span className="inline-block bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-2 py-1 rounded-full text-sm">
                    {j.numeroCamisa ?? j.numero ?? j.number ?? '-'}
                  </span>
                </td>
                <td className="p-2 text-center">
                  {podeEditarCampo ? (
                    <input
                      key={`points-${j.id}-${numTime}`}
                      type="number"
                      min={0}
                      className="w-16 text-center border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded px-1 py-0.5"
                      value={linhaEdicao.points ?? 0}
                      onChange={e => tratarMudancaInput(numTime, j.id, 'points', e.target.value)}
                      disabled={salvando}
                    />
                  ) : (
                    <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">{j.points}</span>
                  )}
                </td>
                <td className="p-2 text-center">
                  {podeEditarCampo ? (
                    <input
                      key={`yellow-${j.id}-${numTime}`}
                      type="number"
                      min={0}
                      className="w-12 text-center border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded px-1 py-0.5"
                      value={linhaEdicao.yellow ?? 0}
                      onChange={e => tratarMudancaInput(numTime, j.id, 'yellow', e.target.value)}
                      disabled={salvando}
                    />
                  ) : (
                    <span className="text-yellow-500 font-bold">{j.yellow}</span>
                  )}
                </td>
                <td className="p-2 text-center">
                  {podeEditarCampo ? (
                    <input
                      key={`red-${j.id}-${numTime}`}
                      type="number"
                      min={0}
                      className="w-12 text-center border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded px-1 py-0.5"
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

  // Controle de export: se a partida é Finalizada, o botão prefere ficar à esquerda.
  // Entretanto, quando o usuário ativa "Editar súmula" devemos esconder o botão
  // até que a súmula seja enviada ao banco (permitirEdicao === false novamente).
  const exportEsquerdaBase = (match?.status === 'Finalizada');
  // Mostrar export somente quando não estivermos em modo de edição (nem edição iniciada para partida finalizada)
  const mostrarExport = !carregando && !permitirEdicao && !editingFinalizada;

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

              {/* SEÇÃO DE PÊNALTIS - Só para eliminatórias */}
              {ehEliminatoria && (estaAoVivo || permitirEdicao) && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-lg text-yellow-800 dark:text-yellow-200">⚽ PÊNALTIS</h4>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="penaltis-checkbox"
                        checked={temPenaltis}
                        onChange={(e) => setTemPenaltis(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <label htmlFor="penaltis-checkbox" className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                        Ativar pênaltis
                      </label>
                    </div>
                  </div>
                  
                  {temPenaltis && (
                    <>
                      <div className="bg-yellow-100 dark:bg-yellow-900/40 rounded-md p-3 mb-4">
                        <p className="text-xs text-yellow-800 dark:text-yellow-200 text-center">
                          ⚠️ <strong>Importante:</strong> Os gols de pênalti servem apenas para definir o vencedor. 
                          Não contam para estatísticas individuais dos jogadores.
                        </p>
                      </div>
                      
                      <div className="flex justify-around items-center">
                        <div className="text-center">
                          <p className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">{match.team1}</p>
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="tertiary"
                              size="sm"
                              onClick={() => setPenaltisA(Math.max(0, penaltisA - 1))}
                              className="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 text-white font-bold flex items-center justify-center"
                            >
                              −
                            </Button>
                            <span className="font-bold text-2xl text-yellow-800 dark:text-yellow-200 w-12 text-center">
                              {penaltisA}
                            </span>
                            <Button
                              variant="tertiary"
                              size="sm"
                              onClick={() => setPenaltisA(penaltisA + 1)}
                              className="w-8 h-8 rounded-full bg-green-500 hover:bg-green-600 text-white font-bold flex items-center justify-center"
                            >
                              +
                            </Button>
                          </div>
                        </div>
                        
                        <div className="font-bold text-2xl text-yellow-600 dark:text-yellow-400">PEN</div>
                        
                        <div className="text-center">
                          <p className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">{match.team2}</p>
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="tertiary"
                              size="sm"
                              onClick={() => setPenaltisB(Math.max(0, penaltisB - 1))}
                              className="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 text-white font-bold flex items-center justify-center"
                            >
                              −
                            </Button>
                            <span className="font-bold text-2xl text-yellow-800 dark:text-yellow-200 w-12 text-center">
                              {penaltisB}
                            </span>
                            <Button
                              variant="tertiary"
                              size="sm"
                              onClick={() => setPenaltisB(penaltisB + 1)}
                              className="w-8 h-8 rounded-full bg-green-500 hover:bg-green-600 text-white font-bold flex items-center justify-center"
                            >
                              +
                            </Button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Mostrar resultado dos pênaltis quando finalizados */}
              {ehEliminatoria && !estaAoVivo && !permitirEdicao && temPenaltis && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <h4 className="font-bold text-center text-yellow-800 dark:text-yellow-200 mb-2">⚽ RESULTADO DOS PÊNALTIS</h4>
                  <div className="flex justify-around items-center">
                    <div className="text-center">
                      <p className="font-medium text-yellow-800 dark:text-yellow-200">{match.team1}</p>
                      <p className="font-bold text-3xl text-yellow-800 dark:text-yellow-200">{penaltisA}</p>
                    </div>
                    <p className="font-bold text-2xl text-yellow-600 dark:text-yellow-400">:</p>
                    <div className="text-center">
                      <p className="font-medium text-yellow-800 dark:text-yellow-200">{match.team2}</p>
                      <p className="font-bold text-3xl text-yellow-800 dark:text-yellow-200">{penaltisB}</p>
                    </div>
                  </div>
                </div>
              )}

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
                <h3 className="font-bold text-lg mb-3 text-center text-gray-900 dark:text-gray-100">JOGADORES E ESTATÍSTICAS</h3>

                <div className="mb-4">
                  <div className="flex flex-col md:flex-row md:items-start md:space-x-6 gap-4">
                    <div className="md:flex-1">
                      <h4 className="font-semibold bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-2 text-center mb-2">{match.team1}</h4>
                      {renderTabelaJogadores(jogadoresTimeA, edicaoTimeA, 1)}
                    </div>

                    <div className="md:flex-1">
                      <h4 className="font-semibold bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-2 text-center mb-2">{match.team2}</h4>
                      {renderTabelaJogadores(jogadoresTimeB, edicaoTimeB, 2)}
                    </div>
                  </div>
                </div>

              </div>

              <div className="text-center text-xs text-gray-500 dark:text-gray-400 border-t pt-4 mt-8">
                <p>Documento gerado automaticamente pelo Sistema de Gerenciamento de Torneios</p>
                <p>Gerado em: {new Date().toLocaleString('pt-BR')}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer: duas áreas (esquerda / direita) para controlar posição do botão Exportar */}
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 mt-4 bg-white dark:bg-gray-800 px-4">
          {/* Left area */}
          <div className="flex justify-center md:justify-start">
            {exportEsquerdaBase && mostrarExport && (
              <PDFDownloadButton
                matchData={match}
                tournamentData={selectedTournament}
                teamData1={{ name: match.team1, players: jogadoresTimeA }}
                teamData2={{ name: match.team2, players: jogadoresTimeB }}
                fileName={gerarNomeArquivo()}
                className="inline-flex items-center justify-center px-4 py-2 bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white font-medium rounded-md transition-colors whitespace-nowrap w-full md:w-auto"
              />
            )}
          </div>

          {/* Right area */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-2">
            {/* If export should not be left, show it here */}
            {!exportEsquerdaBase && mostrarExport && (
              <PDFDownloadButton
                matchData={match}
                tournamentData={selectedTournament}
                teamData1={{ name: match.team1, players: jogadoresTimeA }}
                teamData2={{ name: match.team2, players: jogadoresTimeB }}
                fileName={gerarNomeArquivo()}
                className="inline-flex items-center justify-center px-4 py-2 bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white font-medium rounded-md transition-colors whitespace-nowrap w-full md:w-auto"
              />
            )}

            {estaAoVivo && !carregando && (
              <Button 
                onClick={enviarSumula} 
                disabled={salvando}
                className="whitespace-nowrap w-full md:w-auto"
              >
                {salvando ? 'Enviando...' : 'Enviar Súmula'}
              </Button>
            )}

            {/* Botão para permitir edição mesmo quando não está ao vivo */}
            {!estaAoVivo && (
              <Button
                onClick={() => {
                  const novo = !permitirEdicao;
                  setPermitirEdicao(novo);
                  // marca que estamos editando uma súmula que já estava finalizada
                  if (novo && match?.status === 'Finalizada') {
                    setEditingFinalizada(true);
                  }
                  if (!novo) {
                    // cancelando edição -> limpar flag
                    setEditingFinalizada(false);
                  }

                  // iniciar edições a partir do estado atual
                  setEdicaoTimeA(jogadoresTimeA.map(j => ({ id: j.id, points: j.points || 0, yellow: j.yellow || 0, red: j.red || 0 })));
                  setEdicaoTimeB(jogadoresTimeB.map(j => ({ id: j.id, points: j.points || 0, yellow: j.yellow || 0, red: j.red || 0 })));
                }}
                className="whitespace-nowrap w-full md:w-auto"
              >
                {permitirEdicao ? 'Cancelar edição' : 'Editar súmula'}
              </Button>
            )}

            {/* Quando permitimos edição manual, mostrar botão de salvar */}
            {!estaAoVivo && permitirEdicao && (
              <Button 
                onClick={enviarSumula} 
                disabled={salvando}
                className="whitespace-nowrap w-full md:w-auto"
              >
                {salvando ? 'Salvando...' : 'Salvar alterações'}
              </Button>
            )}

            <Button 
              onClick={() => { setPermitirEdicao(false); setEditingFinalizada(false); onClose(); }}
              className="whitespace-nowrap w-full md:w-auto"
            >
              Fechar
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};