'use client';
import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { Button, Input, Textarea, Select, CardSplat } from '@/components/common';
import { mockData } from '@/data';

export const RegistrationsPage = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const handleEdit = (item) => {
        setEditingItem(item);
        setIsModalOpen(true);
    }

    const handleCreate = () => {
        setEditingItem(null);
        setIsModalOpen(true);
    }

    const closeModal = () => setIsModalOpen(false);

    return (
        <>
            <div className="space-y-8">
                <div className="flex flex-wrap justify-between items-center gap-4">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">CADASTROS</h1>
                    <div className="flex items-center gap-4">
                        <button className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400">
                            <Trash2 size={24} />
                        </button>
                        <Button onClick={handleCreate}>Cadastrar Novo</Button>
                    </div>
                </div>
                <div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">ESPORTES</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {mockData.registrations.sports.map(item => (
                            <div key={item.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 relative overflow-hidden">
                                <div className="relative z-10">
                                    <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-gray-100">{item.name}</h3>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{item.description}</p>
                                    <div className="flex gap-2">
                                        <Button onClick={() => handleEdit(item)}>Editar</Button>
                                        <Button variant="secondary">Excluir</Button>
                                    </div>
                                </div>
                                <CardSplat />
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">LOCAIS</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {mockData.registrations.locations.map(item => (
                            <div key={item.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 relative overflow-hidden">
                                <div className="relative z-10">
                                    <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-gray-100">{item.name}</h3>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{item.description}</p>
                                    <div className="flex gap-2">
                                        <Button onClick={() => handleEdit(item)}>Editar</Button>
                                        <Button variant="secondary">Excluir</Button>
                                    </div>
                                </div>
                                <CardSplat />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingItem ? "EDITAR CADASTRO" : "CRIAR CADASTRO"}>
                <form className="space-y-4">
                    <Select label="Categoria" defaultValue={editingItem ? (mockData.registrations.sports.some(s => s.id === editingItem.id) ? 'Esportes' : 'Locais') : ''}>
                        <option>Selecionar</option>
                        <option>Esportes</option>
                        <option>Locais</option>
                    </Select>
                    <Input label="Nome do Cadastro" placeholder="Placeholder" defaultValue={editingItem?.name} />
                    <div className="flex justify-end pt-4">
                        <Button type="submit">Salvar</Button>
                    </div>
                </form>
            </Modal>
        </>
    );
};
