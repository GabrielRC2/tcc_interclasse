'use client';
import React, { useState } from 'react';
import { Edit } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { SumulaModal } from '@/components/SumulaModal';
import { Button, Input, Select } from '@/components/common';
import { mockData } from '@/data';

export const MatchesPage = () => {
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleEdit = (match) => {
    setSelectedMatch(match);
    setIsEditModalOpen(true);
  }

  const handleSumula = (match) => {
    setSelectedMatch(match);
  }

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedMatch(null);
  }
  
  const closeSumulaModal = () => {
    setSelectedMatch(null);
  }

  return (
    <>
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">PARTIDAS</h1>
            <div>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">PARTIDAS RECENTES</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                    {mockData.matches.slice(0, 4).map(match => (
                        <div key={match.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 text-center">
                            <p className="font-semibold text-gray-500 dark:text-gray-400">PARTIDA {match.id}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Grupo I</p>
                            <div className="flex items-center justify-center gap-2 my-2 text-gray-900 dark:text-gray-100">
                                <span className="font-bold text-lg">{match.team1}</span>
                                <span className="text-red-600 font-bold text-lg">X</span>
                                <span className="font-bold text-lg">{match.team2}</span>
                                <button className="text-red-600" onClick={() => handleEdit(match)}><Edit size={16} /></button>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{match.modality} | {match.category} | {match.location}</p>
                        </div>
                    ))}
                </div>
            </div>
            <div>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">TODAS AS PARTIDAS</h2>
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {mockData.matches.map(match => (
                                <tr key={match.id}>
                                <td className="p-4 text-gray-800 dark:text-gray-200 font-semibold whitespace-nowrap">{match.team1} VS {match.team2}</td>
                                <td className="p-4 text-gray-800 dark:text-gray-200 font-bold">{match.result}</td>
                                <td className="p-4 text-gray-600 dark:text-gray-300">{match.modality}</td>
                                <td className="p-4 text-gray-600 dark:text-gray-300">{match.category}</td>
                                <td className="p-4 text-gray-600 dark:text-gray-300">{match.location}</td>
                                <td className="p-4 text-right flex justify-end gap-2">
                                    <Button onClick={() => handleEdit(match)}>Editar</Button>
                                    <Button variant="secondary" onClick={() => handleSumula(match)}>Ver Súmula</Button>
                                </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        <Modal isOpen={isEditModalOpen} onClose={closeEditModal} title="EDITAR PARTIDA">
             <form className="space-y-4">
                <Input label="Time 1" defaultValue={selectedMatch?.team1} />
                <Input label="Time 2" defaultValue={selectedMatch?.team2} />
                <Input label="Resultado" defaultValue={selectedMatch?.result} />
                <Select label="Modalidade" defaultValue={selectedMatch?.modality}>
                    {mockData.registrations.sports.map(s => <option key={s.id}>{s.name}</option>)}
                </Select>
                <div className="flex justify-end pt-4">
                    <Button type="submit">Salvar Alterações</Button>
                </div>
            </form>
        </Modal>
        <SumulaModal isOpen={!!selectedMatch && !isEditModalOpen} onClose={closeSumulaModal} match={selectedMatch} />
    </>
  );
};
