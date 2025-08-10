'use client';
import React, { useState, useRef } from 'react';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/common';
import { mockData } from '@/data';
import { useTournament } from '@/contexts/TournamentContext';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { SumulaPDF } from './SumulaPDF';

export const SumulaModal = ({ isOpen, onClose, match }) => {
    if (!match) return null;

    const { selectedTournament } = useTournament();
    const [showPenalties, setShowPenalties] = useState(!!match.penaltyResult);
    const sumulaRef = useRef(null);
    
    const team1Data = mockData.teams.find(t => t.name === match.team1) || { players: [] };
    const team2Data = mockData.teams.find(t => t.name === match.team2) || { players: [] };

    // Função para gerar o nome do arquivo
    const generateFileName = () => {
        const tournamentName = selectedTournament?.name || 'Torneio';
        const team1Name = match.team1?.replace(/\s+/g, '_');
        const team2Name = match.team2?.replace(/\s+/g, '_');
        return `${tournamentName}_${team1Name}_${team2Name}.pdf`;
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="INFORMAÇÕES DO TORNEIO" size="max-w-4xl max-h-[90vh]">
            <div className="flex flex-col h-[70vh]">
                {/* Área de conteúdo - Modal visual (não usado para PDF) */}
                <div 
                    ref={sumulaRef}
                    className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800 hover:scrollbar-thumb-gray-500 dark:hover:scrollbar-thumb-gray-500 bg-white dark:bg-gray-800 p-4"
                >
                    {/* Header do Modal */}
                    <div className="text-center mb-6 border-b pb-4">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            SÚMULA DE PARTIDA
                        </h1>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            {selectedTournament?.name || 'Torneio Interclasse'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                            Data: {new Date().toLocaleDateString('pt-BR')} | 
                            Horário: {match.time} | 
                            Local: {match.location}
                        </p>
                    </div>

                    <div className="space-y-6">
                        {/* Placar Principal */}
                        <div className="flex justify-around items-center text-center">
                            <div>
                                <p className="font-bold text-lg dark:text-gray-200">{match.team1}</p>
                                <p className="font-extrabold text-6xl text-gray-800 dark:text-gray-100">
                                    {match.result?.split(':')[0]}
                                </p>
                            </div>
                            <p className="font-extrabold text-6xl text-gray-400 dark:text-gray-500">:</p>
                            <div>
                                <p className="font-bold text-lg dark:text-gray-200">{match.team2}</p>
                                <p className="font-extrabold text-6xl text-gray-800 dark:text-gray-100">
                                    {match.result?.split(':')[1]}
                                </p>
                            </div>
                        </div>

                        {/* Informações da Partida */}
                        <div className="grid grid-cols-2 gap-4 text-sm border-t pt-4">
                            <div>
                                <p><strong>Esporte:</strong> {match.modality}</p>
                                <p><strong>Categoria:</strong> {match.category}</p>
                            </div>
                            <div>
                                <p><strong>Status:</strong> {match.status}</p>
                                <p><strong>Fase:</strong> {match.phase || 'Grupos'}</p>
                            </div>
                        </div>

                        {/* Checkbox de Pênaltis */}
                        <div className="flex items-center justify-center gap-2">
                            <input 
                                type="checkbox" 
                                id="penaltis" 
                                checked={showPenalties} 
                                onChange={(e) => setShowPenalties(e.target.checked)} 
                                className="form-checkbox h-5 w-5 text-red-600 rounded border-gray-300 focus:ring-red-500"
                            />
                            <label htmlFor="penaltis" className="font-semibold text-gray-800 dark:text-gray-200">
                                PÊNALTIS
                            </label>
                        </div>

                        {/* Placar de Pênaltis */}
                        {showPenalties && (
                            <div className="flex justify-around items-center text-center border-t pt-4 dark:border-gray-700">
                                <div>
                                    <p className="font-extrabold text-4xl text-gray-800 dark:text-gray-100">
                                        {match.penaltyResult?.split(':')[0] || 0}
                                    </p>
                                </div>
                                <p className="font-extrabold text-4xl text-gray-400 dark:text-gray-500">:</p>
                                <div>
                                    <p className="font-extrabold text-4xl text-gray-800 dark:text-gray-100">
                                        {match.penaltyResult?.split(':')[1] || 0}
                                    </p>
                                </div>
                            </div>
                        )}
                        
                        {/* Jogadores */}
                        <div>
                            <h3 className="font-bold text-center text-lg mb-2 dark:text-gray-200">JOGADORES</h3>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <h4 className="font-semibold text-center mb-2">{match.team1}</h4>
                                    {team1Data.players.map(p => (
                                        <div key={p.id} className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300">
                                            <span>{p.name} | <span className="font-semibold">{p.points} PONTOS</span></span>
                                            <div className="flex gap-1">
                                                <span className="font-bold text-yellow-500">{p.yellow}</span>
                                                <span className="font-bold text-red-600">{p.red}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="space-y-1">
                                    <h4 className="font-semibold text-center mb-2">{match.team2}</h4>
                                    {team2Data.players.map(p => (
                                        <div key={p.id} className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300">
                                            <span>{p.name} | <span className="font-semibold">{p.points} PONTOS</span></span>
                                            <div className="flex gap-1">
                                                <span className="font-bold text-yellow-500">{p.yellow}</span>
                                                <span className="font-bold text-red-600">{p.red}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Footer para PDF */}
                        <div className="text-center text-xs text-gray-500 border-t pt-4 mt-8">
                            <p>Documento gerado automaticamente pelo Sistema de Gerenciamento de Torneios</p>
                            <p>Gerado em: {new Date().toLocaleString('pt-BR')}</p>
                        </div>
                    </div>
                </div>

                {/* Botões fixos */}
                <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700 mt-4 bg-white dark:bg-gray-800">
                    {/* Botão PDF com PDFDownloadLink - SEM FLASH DA SCROLLBAR! */}
                    <PDFDownloadLink
                        document={
                            <SumulaPDF 
                                match={match} 
                                tournament={selectedTournament} 
                                showPenalties={showPenalties}
                                team1Data={team1Data}
                                team2Data={team2Data}
                            />
                        }
                        fileName={generateFileName()}
                        className="inline-flex items-center px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {({ blob, url, loading, error }) => (
                            loading ? 'Gerando PDF...' : 'Exportar PDF'
                        )}
                    </PDFDownloadLink>
                    <Button>Salvar Alterações</Button>
                </div>
            </div>
        </Modal>
    );
};