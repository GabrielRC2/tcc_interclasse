'use client';
import React, { useState, useEffect } from 'react';
import { Trophy, Users, Calendar, Target, Clock, MapPin, Play, X, Filter } from 'lucide-react';
import { useTournament } from '@/contexts/TournamentContext';

export const DashboardPage = () => {
    const { selectedTournament, setSelectedTournament, tournaments } = useTournament();
    const [stats, setStats] = useState(null);
    const [partidas, setPartidas] = useState([]);
    const [jogadoresDestaque, setJogadoresDestaque] = useState({});
    const [loading, setLoading] = useState(true);
    const [filtros, setFiltros] = useState({
        masculino: true,
        feminino: true,
        jogosAnteriores: true
    });

    useEffect(() => {
        if (selectedTournament) {
            loadDashboardData();
        } else {
            setStats(null);
            setPartidas([]);
            setJogadoresDestaque({});
            setLoading(false);
        }
    }, [selectedTournament]);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            
            // Carregar stats primeiro
            try {
                const statsResponse = await fetch(`/api/dashboard/stats?torneioId=${selectedTournament.id}`);
                if (statsResponse.ok) {
                    const statsData = await statsResponse.json();
                    setStats(statsData);
                }
            } catch (error) {
                console.error('Erro ao carregar stats:', error);
            }

            // Carregar partidas
            try {
                const partidasResponse = await fetch(`/api/partidas?torneioId=${selectedTournament.id}`);
                if (partidasResponse.ok) {
                    const partidasData = await partidasResponse.json();
                    setPartidas(partidasData);
                } else {
                    console.error('Erro HTTP ao carregar partidas:', partidasResponse.status);
                    setPartidas([]);
                }
            } catch (error) {
                console.error('Erro ao carregar partidas:', error);
                setPartidas([]);
            }

            // Carregar jogadores
            try {
                const jogadoresResponse = await fetch(`/api/dashboard/jogadores-destaque?torneioId=${selectedTournament.id}`);
                if (jogadoresResponse.ok) {
                    const jogadoresData = await jogadoresResponse.json();
                    setJogadoresDestaque(jogadoresData);
                } else {
                    setJogadoresDestaque({});
                }
            } catch (error) {
                console.error('Erro ao carregar jogadores:', error);
                setJogadoresDestaque({});
            }

        } catch (error) {
            console.error('Erro geral no dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleFiltro = (filtro) => {
        setFiltros(prev => ({
            ...prev,
            [filtro]: !prev[filtro]
        }));
    };

    const partidasFiltradas = partidas.filter(partida => {
        // Filtro por gênero
        if (!filtros.masculino && partida.categoria?.genero === 'MASCULINO') return false;
        if (!filtros.feminino && partida.categoria?.genero === 'FEMININO') return false;
        
        // Filtro por jogos anteriores
        if (!filtros.jogosAnteriores && partida.status === 'FINALIZADA') return false;
        
        return true;
    });

    const partidasAoVivo = partidas.filter(p => p.status === 'EM_ANDAMENTO');
    const proximasPartidas = partidas.filter(p => p.status === 'AGENDADA').slice(0, 2);

    const formatarHorario = (dataHora) => {
        if (!dataHora) return '--:--';
        try {
            return new Date(dataHora).toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit',
                timeZone: 'America/Sao_Paulo'
            });
        } catch {
            return '--:--';
        }
    };

    const getStatusTexto = (status) => {
        switch (status) {
            case 'FINALIZADA': return 'Finalizada';
            case 'EM_ANDAMENTO': return 'Em andamento';
            case 'AGENDADA': return 'Próxima';
            case 'CANCELADA': return 'Cancelada';
            default: return 'Indefinido';
        }
    };

    const getStatusCor = (status) => {
        switch (status) {
            case 'FINALIZADA': 
                return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
            case 'EM_ANDAMENTO': 
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
            case 'AGENDADA': 
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
            case 'CANCELADA': 
                return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
            default: 
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-lg">Carregando...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">GERAL</h1>
                </div>
                
                {/* Seletor de Torneio - MANTIDO */}
                <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Torneio Ativo:
                    </label>
                    <select
                        value={selectedTournament?.id || ''}
                        onChange={(e) => {
                            const tournament = tournaments.find(t => t.id === parseInt(e.target.value));
                            setSelectedTournament(tournament);
                        }}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                        <option value="">Selecione um torneio</option>
                        {tournaments.map(tournament => (
                            <option key={tournament.id} value={tournament.id}>
                                {tournament.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {!selectedTournament ? (
                <div className="text-center py-12">
                    <Trophy size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                        Nenhum Torneio Selecionado
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                        Selecione um torneio para visualizar as informações
                    </p>
                </div>
            ) : (
                <>
                    {/* PARTIDAS ATUAIS - Design Exato do Original */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">PARTIDAS ATUAIS</h2>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {partidasAoVivo.length > 0 ? (
                                partidasAoVivo.slice(0, 2).map((partida) => (
                                    <div key={partida.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 relative overflow-hidden">
                                        {/* Elemento decorativo exato do design original */}
                                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-red-500/20 to-transparent rounded-bl-full"></div>
                                        
                                        {/* Badge AO VIVO - Design exato */}
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                            <span className="text-red-500 font-bold text-sm">AO VIVO</span>
                                        </div>
                                        
                                        {/* Times - Design exato */}
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                                            {partida.time1?.nome || 'TIME 1'} VS {partida.time2?.nome || 'TIME 2'}
                                        </h3>
                                        
                                        {/* Placar - Design exato */}
                                        <div className="text-3xl font-bold text-red-500 mb-4">
                                            {partida.placarTime1 || 0}:{partida.placarTime2 || 0}
                                        </div>
                                        
                                        {/* Informações da partida - Layout exato */}
                                        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                            <p><span className="font-medium">Esporte:</span> {partida.modalidade?.nome || 'N/A'}</p>
                                            <p><span className="font-medium">Modalidade:</span> {partida.categoria?.genero || 'N/A'}</p>
                                            <p><span className="font-medium">Local:</span> {partida.local || 'A definir'}</p>
                                        </div>
                                        
                                        {/* Horário - Posição exata do design */}
                                        <div className="absolute bottom-6 right-6 text-sm font-medium text-gray-500 dark:text-gray-400">
                                            {formatarHorario(partida.dataHora)}
                                        </div>
                                    </div>
                                ))
                            ) : proximasPartidas.length > 0 ? (
                                // Se não há partidas ao vivo, mostrar próximas partidas
                                proximasPartidas.map((partida) => (
                                    <div key={partida.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-blue-500/20 to-transparent rounded-bl-full"></div>
                                        
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                            <span className="text-blue-500 font-bold text-sm">PRÓXIMA</span>
                                        </div>
                                        
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                                            {partida.time1?.nome || 'TIME 1'} VS {partida.time2?.nome || 'TIME 2'}
                                        </h3>
                                        
                                        <div className="text-3xl font-bold text-blue-500 mb-4">
                                            VS
                                        </div>
                                        
                                        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                            <p><span className="font-medium">Esporte:</span> {partida.modalidade?.nome || 'N/A'}</p>
                                            <p><span className="font-medium">Modalidade:</span> {partida.categoria?.genero || 'N/A'}</p>
                                            <p><span className="font-medium">Local:</span> {partida.local || 'A definir'}</p>
                                        </div>
                                        
                                        <div className="absolute bottom-6 right-6 text-sm font-medium text-gray-500 dark:text-gray-400">
                                            {formatarHorario(partida.dataHora)}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                // Placeholder quando não há partidas
                                <div className="col-span-2 text-center py-12">
                                    <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
                                    <p className="text-gray-500 dark:text-gray-400">Nenhuma partida em andamento no momento</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* JOGADORES(AS) EM DESTAQUE - DESIGN ORIGINAL */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">JOGADORES(AS) EM DESTAQUE</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {Object.keys(jogadoresDestaque).length > 0 ? (
                                Object.entries(jogadoresDestaque).map(([modalidade, jogadores], index) => {
                                    const cores = ['blue', 'green', 'purple', 'orange'];
                                    const cor = cores[index % cores.length];
                                    
                                    return (
                                        <div key={modalidade} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">{modalidade}</h3>
                                            <div className="space-y-2 text-sm">
                                                {jogadores && jogadores.length > 0 ? (
                                                    jogadores.slice(0, 3).map((jogador, idx) => (
                                                        <div key={idx}>
                                                            <span className={`font-semibold text-${cor}-600`}>
                                                                {jogador.nome}
                                                            </span>
                                                            <span className="text-gray-500">
                                                                {' '}({jogador.time}) - {jogador.pontos} pontos
                                                            </span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-gray-500 text-center py-4">
                                                        Sem dados disponíveis
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                // Placeholder sem dados fictícios
                                <div className="col-span-4 text-center py-12">
                                    <Users size={48} className="mx-auto text-gray-400 mb-4" />
                                    <p className="text-gray-500 dark:text-gray-400">
                                        Nenhuma estatística de jogador disponível para este torneio
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* PARTIDAS - Tabela com Filtros Funcionais */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">PARTIDAS</h2>
                            
                            {/* Filtros Funcionais */}
                            <div className="flex gap-2 flex-wrap">
                                <button
                                    onClick={() => toggleFiltro('masculino')}
                                    className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 transition-colors ${
                                        filtros.masculino 
                                            ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' 
                                            : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                                    }`}
                                >
                                    Masculino
                                    {filtros.masculino && <X size={14} />}
                                </button>
                                
                                <button
                                    onClick={() => toggleFiltro('feminino')}
                                    className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 transition-colors ${
                                        filtros.feminino 
                                            ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' 
                                            : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                                    }`}
                                >
                                    Feminino
                                    {filtros.feminino && <X size={14} />}
                                </button>
                                
                                <button
                                    onClick={() => toggleFiltro('jogosAnteriores')}
                                    className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 transition-colors ${
                                        filtros.jogosAnteriores 
                                            ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' 
                                            : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                                    }`}
                                >
                                    Jogos Anteriores
                                    {filtros.jogosAnteriores && <X size={14} />}
                                </button>
                            </div>
                        </div>

                        {/* Tabela de Partidas */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Partida</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Horário</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Esporte</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Categoria</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Local</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ação</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {partidasFiltradas.length > 0 ? (
                                            partidasFiltradas.map((partida) => (
                                                <tr key={partida.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-gray-100">
                                                        <div>
                                                            {partida.time1?.nome || 'TIME 1'} VS {partida.time2?.nome || 'TIME 2'}
                                                        </div>
                                                        {partida.status === 'FINALIZADA' && (
                                                            <div className="text-sm text-gray-500 mt-1">
                                                                {partida.placarTime1 || 0} x {partida.placarTime2 || 0}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                                                        {formatarHorario(partida.dataHora)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                                                        {partida.modalidade?.nome || 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                                                        {partida.categoria?.genero || 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                                                        {partida.local || 'A definir'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusCor(partida.status)}`}>
                                                            {getStatusTexto(partida.status)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <button className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors">
                                                            Ver Súmula
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="7" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                                    {partidas.length === 0 
                                                        ? 'Nenhuma partida cadastrada para este torneio'
                                                        : 'Nenhuma partida encontrada com os filtros aplicados'
                                                    }
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};