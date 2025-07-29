'use client';
import React, { useState } from 'react';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/common';
import { mockData } from '@/data';

export const SumulaModal = ({ isOpen, onClose, match }) => {
    if (!match) return null;

    const [showPenalties, setShowPenalties] = useState(!!match.penaltyResult);
    
    const team1Data = mockData.teams.find(t => t.name === match.team1) || { players: [] };
    const team2Data = mockData.teams.find(t => t.name === match.team2) || { players: [] };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="INFORMAÇÕES DO TORNEIO" size="max-w-4xl max-h-[90vh]">
            {/* Container principal com flex column */}
            <div className="flex flex-col h-[70vh]">
                {/* Área de conteúdo com scroll */}
                <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800 hover:scrollbar-thumb-gray-500 dark:hover:scrollbar-thumb-gray-500">
                    <div className="space-y-6">
                        <div className="flex justify-around items-center text-center">
                            <div>
                                <p className="font-bold text-lg dark:text-gray-200">{match.team1}</p>
                                <p className="font-extrabold text-6xl text-gray-800 dark:text-gray-100">{match.result?.split(':')[0]}</p>
                            </div>
                            <p className="font-extrabold text-6xl text-gray-400 dark:text-gray-500">:</p>
                            <div>
                                <p className="font-bold text-lg dark:text-gray-200">{match.team2}</p>
                                <p className="font-extrabold text-6xl text-gray-800 dark:text-gray-100">{match.result?.split(':')[1]}</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-center gap-2">
                            <input type="checkbox" id="penaltis" checked={showPenalties} onChange={(e) => setShowPenalties(e.target.checked)} className="form-checkbox h-5 w-5 text-red-600 rounded border-gray-300 focus:ring-red-500"/>
                            <label htmlFor="penaltis" className="font-semibold text-gray-800 dark:text-gray-200">PÊNALTIS</label>
                        </div>

                        {showPenalties && (
                             <div className="flex justify-around items-center text-center border-t pt-4 dark:border-gray-700">
                                <div>
                                    <p className="font-extrabold text-4xl text-gray-800 dark:text-gray-100">{match.penaltyResult?.split(':')[0] || 0}</p>
                                </div>
                                <p className="font-extrabold text-4xl text-gray-400 dark:text-gray-500">:</p>
                                <div>
                                    <p className="font-extrabold text-4xl text-gray-800 dark:text-gray-100">{match.penaltyResult?.split(':')[1] || 0}</p>
                                </div>
                            </div>
                        )}
                        
                        <div>
                            <h3 className="font-bold text-center text-lg mb-2 dark:text-gray-200">JOGADORES</h3>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
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

                        {/* Espaço extra para garantir que o scroll funcione bem */}
                        <div className="pb-4"></div>
                    </div>
                </div>

                {/* Botões fixos no final - DENTRO do container principal */}
                <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700 mt-4 bg-white dark:bg-gray-800">
                    <Button variant="secondary">Exportar PDF</Button>
                    <Button>Salvar Alterações</Button>
                </div>
            </div>
        </Modal>
    );
};
