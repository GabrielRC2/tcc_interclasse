"use client";

import React, { useState } from 'react';
import { X } from 'lucide-react';

import { Button, Select } from '../components/common';

const courses = ['ETEL', 'ADA', 'DS', 'CNAT', 'EDA', 'ETIQ', 'EVE'];
const years = ['1º', '2º', '3º'];
let teamIdCounter = 1;
const seededTeams = [];
for (const course of courses) {
    for (const year of years) {
        seededTeams.push({
            id: teamIdCounter++,
            name: `${year} ${course}`,
            course: course,
            playersCount: Math.floor(Math.random() * 5) + 10,
        });
    }
}

const mockDataTeams = seededTeams;

export const GroupsPage = () => {
    const [numGroups, setNumGroups] = useState('');

    const [availableTeams, setAvailableTeams] = useState(mockDataTeams);

    const [selectedTeams, setSelectedTeams] = useState([]);

    const [formedGroups, setFormedGroups] = useState({});

    const groupOptions = [2, 4, 6, 8];

    const handleSelectTeam = (teamToMove) => {
        setSelectedTeams(prev => {
            if (!prev.find(team => team.id === teamToMove.id)) {
                return [...prev, teamToMove];
            }
            return prev;
        });
        setAvailableTeams(prev => prev.filter(team => team.id !== teamToMove.id));
    };

    const handleRemoveSelectedTeam = (teamToRemove) => {
        setSelectedTeams(prev => prev.filter(team => team.id !== teamToRemove.id));
        setAvailableTeams(prev => [...prev, teamToRemove].sort((a, b) => a.id - b.id));
    };

    const handleSelectAllAvailable = () => {
        setSelectedTeams(prev => [...prev, ...availableTeams]);
        setAvailableTeams([]);
    };

    const handleSelectAllSelected = () => {
        setAvailableTeams(prev => [...prev, ...selectedTeams]);
        setSelectedTeams([]);
    };

    const generateGroups = () => {
        if (!numGroups || parseInt(numGroups) === 0) {
            alert('Por favor, selecione a quantidade de grupos.');
            return;
        }
        if (selectedTeams.length < parseInt(numGroups)) {
            alert('Número insuficiente de equipes selecionadas para formar os grupos. Você precisa de pelo menos uma equipe por grupo.');
            return;
        }

        const teamsToDistribute = [...selectedTeams];
        const newGroups = {};

        for (let i = 0; i < parseInt(numGroups); i++) {
            newGroups[`GRUPO ${String.fromCharCode(65 + i)}`] = [];
        }

        let currentGroupIndex = 0;
        while (teamsToDistribute.length > 0) {
            const team = teamsToDistribute.shift();
            const groupName = `GRUPO ${String.fromCharCode(65 + (currentGroupIndex % parseInt(numGroups)))}`;
            newGroups[groupName].push(team);
            currentGroupIndex++;
        }

        setFormedGroups(newGroups);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">GRUPOS</h1>

            <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">MONTAR EQUIPES</h2>

                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 mb-8">
                    <div className="w-full sm:w-auto flex-grow">
                        <Select
                            label="QUANTIDADE DE GRUPOS"
                            value={numGroups}
                            onChange={(e) => setNumGroups(e.target.value)}
                            className="w-full sm:w-64"
                        >
                            <option value="">Selecione a Quantidade de Grupos</option>
                            {groupOptions.map(num => (
                                <option key={num} value={num}>{num}</option>
                            ))}
                        </Select>
                    </div>
                    <Button
                        onClick={generateGroups}
                        disabled={selectedTeams.length === 0 || !numGroups || parseInt(numGroups) === 0}
                    >
                        GERAR DISPOSIÇÃO
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4">
                        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                            <input
                                type="checkbox"
                                id="selectAllAvailable"
                                className="form-checkbox h-4 w-4 text-red-600 rounded border-gray-300 dark:border-gray-600 focus:ring-red-500 bg-white dark:bg-gray-900"
                                onChange={handleSelectAllAvailable}
                                checked={availableTeams.length === 0 && selectedTeams.length > 0}
                                disabled={availableTeams.length === 0}
                            />
                            <label htmlFor="selectAllAvailable" className="font-semibold text-gray-800 dark:text-gray-200">SELECIONAR EQUIPES</label>
                        </div>
                        <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                            {availableTeams.length === 0 ? (
                                <p className="text-gray-500 dark:text-gray-400 text-sm">Todas as equipes foram selecionadas ou não há equipes disponíveis.</p>
                            ) : (
                                availableTeams.map(team => (
                                    <button
                                        key={team.id}
                                        onClick={() => handleSelectTeam(team)}
                                        className="w-full text-left px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                                    >
                                        {team.name}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4">
                        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                            <input
                                type="checkbox"
                                id="selectAllSelected"
                                className="form-checkbox h-4 w-4 text-red-600 rounded border-gray-300 dark:border-gray-600 focus:ring-red-500 bg-white dark:bg-gray-900"
                                onChange={handleSelectAllSelected}
                                checked={selectedTeams.length === 0 && availableTeams.length > 0}
                                disabled={selectedTeams.length === 0}
                            />
                            <label htmlFor="selectAllSelected" className="font-semibold text-gray-800 dark:text-gray-200">EQUIPES DISPOSTAS</label>
                        </div>
                        <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                            {selectedTeams.length === 0 ? (
                                <p className="text-gray-500 dark:text-gray-400 text-sm">Nenhuma equipe disposta ainda. Selecione equipes na coluna ao lado.</p>
                            ) : (
                                selectedTeams.map(team => (
                                    <div key={team.id} className="flex justify-between items-center px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md">
                                        <span>{team.name}</span>
                                        <button onClick={() => handleRemoveSelectedTeam(team)} className="text-gray-500 hover:text-red-600 dark:hover:text-red-400 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                                            <X size={16} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 col-span-1 lg:col-span-1">
                        <h2 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">GRUPOS FORMADOS</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-80 overflow-y-auto pr-2">
                            {Object.keys(formedGroups).length === 0 ? (
                                <p className="col-span-full text-gray-500 dark:text-gray-400 text-sm">Nenhum grupo formado ainda. Clique em "Gerar Disposição".</p>
                            ) : (
                                Object.keys(formedGroups).map(groupName => (
                                    <div key={groupName} className="border border-gray-200 dark:border-gray-700 rounded-md p-3">
                                        <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">{groupName}</h3>
                                        <div className="space-y-1">
                                            {formedGroups[groupName].length === 0 ? (
                                                <p className="text-gray-500 dark:text-gray-400 text-xs">Nenhuma equipe neste grupo.</p>
                                            ) : (
                                                formedGroups[groupName].map(team => (
                                                    <div key={team.id} className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-sm">
                                                        {team.name}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};