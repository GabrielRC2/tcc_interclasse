'use client';
import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { Button, Input, Textarea, Select, CardSplat } from '@/components/common';
import { mockData } from '@/data'; // Certifique-se de que o caminho está correto

export const RegistrationsPage = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [editingUserListType, setEditingUserListType] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(''); // Adicione este estado
    const [formData, setFormData] = useState({ // Adicione este estado também
        nome: '',
        email: '',
        senha: '',
        tipo_usuario: ''
    });

    const handleEdit = (item) => {
        setEditingItem(item);
        setIsModalOpen(true);
        
        if (item.id_usuario) {
            setSelectedCategory('Usuários');
            setFormData({
                nome: item.nome_usuario,
                email: item.email_usuario,
                senha: '',
                tipo_usuario: item.tipo_usuario
            });
        } else {
            setSelectedCategory(
                item.id.startsWith('sport') ? 'Esportes' :
                item.id.startsWith('location') ? 'Locais' :
                'Cursos'
            );
            setFormData({
                nome: item.name,
                email: '',
                senha: '',
                tipo_usuario: ''
            });
        }
        
        setEditingUserListType(null);
    }

    const handleCreate = () => {
        setEditingItem(null);
        setIsModalOpen(true);
        setEditingUserListType(null); // Criação normal, não é uma lista de usuários
    }

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingUserListType(null); // Garante que o tipo de lista de usuários seja resetado ao fechar
    };

    // Funções para manipular usuários dentro do modal de admins/staff
    const handleAddUser = (type) => {
        // Lógica para adicionar um novo usuário (nome/email) à lista
        console.log(`Adicionar novo usuário para ${type}`);
        // Você precisaria de inputs dentro do modal para coletar nome e email
        // E então atualizar o estado ou mockData
    };

    const handleDeleteUser = (type, userId) => {
        // Lógica para deletar um usuário específico da lista
        console.log(`Deletar usuário ${userId} de ${type}`);
        // Atualizar o estado ou mockData removendo o usuário
    };

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

                {/* Seção ESPORTES */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">ESPORTES</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {mockData.registrations.sports?.map((item, index) => (
                            <div key={item.id || `sport-${index}`} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 relative overflow-hidden">
                                <div className="relative z-10">
                                    <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-gray-100">{item.name}</h3>
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

                {/* Seção LOCAIS */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">LOCAIS</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {mockData.registrations.locations?.map((item, index) => (
                            <div key={item.id || `location-${index}`} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 relative overflow-hidden">
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

                {/* Seção CURSOS */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">CURSOS</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {mockData.registrations.courses?.map((item, index) => (
                            <div key={item.id || `course-${index}`} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 relative overflow-hidden">
                                <div className="relative z-10">
                                    <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-gray-100">{item.name}</h3>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">Sigla: {item.sigla}</p>
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

                {/* Nova Seção ADMINISTRADORES */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">ADMINISTRADORES</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {mockData.registrations.admins.map(item => (
                            <div key={item.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 relative overflow-hidden">
                                <div className="relative z-10">
                                    <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-gray-100">{item.name}</h3>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{item.description}</p>
                                    <div className="flex gap-2">
                                        {/* Botão de Editar preto e sem Excluir */}
                                        <Button onClick={() => handleEdit(item)} className="bg-black text-white hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600">
                                            Editar
                                        </Button>
                                    </div>
                                </div>
                                <CardSplat />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Modal de Edição/Criação */}
            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingItem ? "EDITAR CADASTRO" : "CRIAR CADASTRO"}>
                {editingUserListType ? ( // Se for uma edição de "Administradores" ou "Staff"
                    <form className="space-y-4">
                        <h3 className="text-lg font-bold mb-4">Gerenciar Usuários de {editingItem?.name}</h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                            {editingItem?.users?.map(user => (
                                <div key={user.id} className="flex items-center justify-between p-2 border rounded-md dark:border-gray-600">
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-gray-100">{user.name}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-300">{user.email}</p>
                                    </div>
                                    <Button
                                        variant="secondary"
                                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
                                        onClick={() => handleDeleteUser(editingUserListType, user.id)}
                                    >
                                        Deletar
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <div className="pt-4 border-t dark:border-gray-700">
                            <h4 className="font-semibold mb-2">Adicionar Novo Usuário</h4>
                            <Input label="Nome" placeholder="Nome do usuário" />
                            <Input label="Email" placeholder="email@exemplo.com" type="email" className="mt-2" />
                            <Button onClick={() => handleAddUser(editingUserListType)} className="mt-4 w-full">Adicionar Usuário</Button>
                        </div>
                        <div className="flex justify-end pt-4">
                            <Button type="button" onClick={closeModal}>Fechar</Button>
                        </div>
                    </form>
                ) : ( // Modal para outros tipos de cadastro
                    <form className="space-y-4">
                        <Select
                            label="Categoria"
                            defaultValue={editingItem ? (
                                mockData.registrations.sports.some(s => s.id === editingItem.id) ? 'Esportes' :
                                    mockData.registrations.locations.some(l => l.id === editingItem.id) ? 'Locais' : 'Cursos'
                            ) : ''}
                        >
                            <option>Selecionar</option>
                            <option>Esportes</option>
                            <option>Locais</option>
                            <option>Cursos</option>
                            {/* Você pode adicionar 'Administradores' e 'Staff' aqui se quiser que sejam criáveis diretamente */}
                        </Select>
                        <Input label="Nome do Cadastro" placeholder="Digite o nome" defaultValue={editingItem?.name} />
                        {editingItem?.sigla !== undefined && (
                            <Input label="Sigla" placeholder="Digite a sigla" defaultValue={editingItem?.sigla} />
                        )}
                        {editingItem && !editingItem.id.startsWith('admin') && ( // Descrição apenas para Esportes e Locais
                            <Textarea label="Descrição" placeholder="Digite a descrição" defaultValue={editingItem?.description} />
                        )}
                        <div className="flex justify-end pt-4">
                            <Button type="submit">Salvar</Button>
                        </div>
                    </form>
                )}
            </Modal>
        </>
    );
};