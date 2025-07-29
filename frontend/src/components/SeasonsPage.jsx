'use client';
import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { Button, Input, Textarea, CardSplat } from '@/components/common';
import { mockData } from '@/data';

const AccordionItem = ({ season, onEdit }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center p-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 font-semibold text-gray-900 dark:text-gray-100">
                    <span>NOME: {season.name}</span>
                    <span>DATA: {season.date}</span>
                    <span>LOCAL: {season.location}</span>
                </div>
                {isOpen ? <ChevronUp size={20} className="text-gray-600 dark:text-gray-400" /> : <ChevronDown size={20} className="text-gray-600 dark:text-gray-400" />}
            </button>
            {isOpen && (
                <div className="p-6 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 relative">
                    <CardSplat />
                    <div className="relative z-10 space-y-2 text-gray-700 dark:text-gray-300">
                        <p><span className="font-semibold">Nome:</span> {season.name}</p>
                        <p><span className="font-semibold">Local:</span> {season.location}</p>
                        <p><span className="font-semibold">Data:</span> {season.date}</p>
                        <p><span className="font-semibold">Modalidades:</span> {season.modalities}</p>
                    </div>
                    <div className="flex justify-end gap-2 mt-4 relative z-10">
                        <Button variant="primary">Selecionar</Button>
                        <Button variant="secondary" onClick={() => onEdit(season)}>Editar</Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export const SeasonsPage = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSeason, setEditingSeason] = useState(null);

    const handleEdit = (season) => {
        setEditingSeason(season);
        setIsModalOpen(true);
    }

    const handleCreate = () => {
        setEditingSeason(null);
        setIsModalOpen(true);
    }

    const closeModal = () => setIsModalOpen(false);

    return (
        <>
            <div className="space-y-6">
                <div className="flex flex-wrap justify-between items-start gap-4">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">TEMPORADAS</h1>
                    <Button onClick={handleCreate}>Nova Temporada</Button>
                </div>
                <div className="space-y-4"> {/* Corrigido indentação aqui */}
                    {mockData.seasons.map(season => <AccordionItem key={season.id} season={season} onEdit={handleEdit} />)}
                </div>
            </div>
            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingSeason ? "Editar Temporada" : "Nova Temporada"}> {/* Ajustado texto do título */}
                <form className="space-y-4">
                    <Input label="Nome do Torneio" placeholder="Digite o nome" defaultValue={editingSeason?.name} />
                    <Input label="Local" placeholder="Digite o local" defaultValue={editingSeason?.location} />
                    <Input label="Data" type="text" placeholder="dd/mm - dd/mm" defaultValue={editingSeason?.date} />
                    <Input label="Modalidades" placeholder="Digite as modalidades" defaultValue={editingSeason?.modalities} />
                    <div className="flex justify-end pt-4">
                        <Button type="submit">Salvar</Button>
                    </div>
                </form>
            </Modal>
        </>
    );
};
