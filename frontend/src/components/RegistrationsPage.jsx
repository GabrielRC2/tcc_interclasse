'use client';
import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { Button, Input, Select, CardSplat } from '@/components/common';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/Confirm';

export const RegistrationsPage = () => {
    const toast = useToast();
    const confirm = useConfirm();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [category, setCategory] = useState('');
    
    const [sports, setSports] = useState([]);
    const [locations, setLocations] = useState([]);
    const [courses, setCourses] = useState([]);
    const [administrators, setAdministrators] = useState([
        { id: 1, name: 'Admin Principal', email: 'admin@interclasse.com', role: 'Super Admin' },
        { id: 2, name: 'João Silva', email: 'joao@interclasse.com', role: 'Moderador' },
        { id: 3, name: 'Maria Santos', email: 'maria@interclasse.com', role: 'Editor' }
    ]);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        name: '',
        sigla: ''
    });

    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
        try {
            const [sportsRes, locationsRes, coursesRes] = await Promise.all([
                fetch('/api/modalidades'),
                fetch('/api/locais'),
                fetch('/api/cursos')
            ]);

            const sportsData = await sportsRes.json();
            const locationsData = await locationsRes.json();
            const coursesData = await coursesRes.json();

            setSports(sportsData);
            setLocations(locationsData);
            setCourses(coursesData);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (item, type) => {
        setEditingItem(item);
        setCategory(type);
        setFormData({
            name: item.nome || item.name || '',
            sigla: item.sigla || ''
        });
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setEditingItem(null);
        setCategory('');
        setFormData({ name: '', sigla: '' });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            let endpoint = '';
            let body = {};
            let method = editingItem ? 'PUT' : 'POST';

            switch (category) {
                case 'Esportes':
                    endpoint = editingItem ? `/api/modalidades/${editingItem.id}` : '/api/modalidades';
                    body = { name: formData.name };
                    break;
                case 'Locais':
                    endpoint = editingItem ? `/api/locais/${editingItem.id}` : '/api/locais';
                    body = { name: formData.name };
                    break;
                case 'Cursos':
                    endpoint = editingItem ? `/api/cursos/${editingItem.id}` : '/api/cursos';
                    body = { name: formData.name, sigla: formData.sigla };
                    break;
                default:
                    toast.warning('Selecione uma categoria');
                    return;
            }

            const response = await fetch(endpoint, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (response.ok) {
                await loadAllData();
                setIsModalOpen(false);
                toast.success(`${category.slice(0, -1)} ${editingItem ? 'editado' : 'criado'} com sucesso!`);
            } else {
                toast.error(`Erro ao ${editingItem ? 'editar' : 'criar'} cadastro`);
            }
        } catch (error) {
            console.error('Erro ao salvar:', error);
            toast.error('Erro ao salvar cadastro');
        }
    };

    const handleDelete = async (item, type) => {
        const confirmed = await confirm.danger(`Tem certeza que deseja excluir "${item.nome || item.name}"?`, {
            title: 'Confirmar Exclusão',
            confirmText: 'Excluir',
            cancelText: 'Cancelar'
        });
        
        if (!confirmed) {
            return;
        }

        try {
            let endpoint = '';
            switch (type) {
                case 'Esportes':
                    endpoint = `/api/modalidades/${item.id}`;
                    break;
                case 'Locais':
                    endpoint = `/api/locais/${item.id}`;
                    break;
                case 'Cursos':
                    endpoint = `/api/cursos/${item.id}`;
                    break;
                default:
                    return;
            }

            const response = await fetch(endpoint, {
                method: 'DELETE'
            });

            if (response.ok) {
                await loadAllData();
                toast.success(`${type.slice(0, -1)} excluído com sucesso!`);
            } else {
                toast.error('Erro ao excluir cadastro');
            }
        } catch (error) {
            console.error('Erro ao excluir:', error);
            toast.error('Erro ao excluir cadastro');
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setFormData({ name: '', sigla: '' });
        setCategory('');
        setEditingItem(null);
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64 text-gray-600 dark:text-gray-400">Carregando...</div>;
    }

    return (
        <>
            <div className="space-y-8">
                <div className="flex flex-wrap justify-between items-center gap-4">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">CADASTROS</h1>
                    <Button onClick={handleCreate}>Cadastrar Novo</Button>
                </div>

                <div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">ESPORTES</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {sports.map(item => (
                            <div key={item.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 relative overflow-hidden">
                                <div className="relative z-10">
                                    <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-gray-100">{item.nome}</h3>
                                    <div className="flex gap-2">
                                        <Button onClick={() => handleEdit(item, 'Esportes')}>Editar</Button>
                                        <Button 
                                            onClick={() => handleDelete(item, 'Esportes')}
                                            className="bg-red-600 hover:bg-red-700"
                                        >
                                            Excluir
                                        </Button>
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
                        {locations.map(item => (
                            <div key={item.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 relative overflow-hidden">
                                <div className="relative z-10">
                                    <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-gray-100">{item.nome}</h3>
                                    <div className="flex gap-2">
                                        <Button onClick={() => handleEdit(item, 'Locais')}>Editar</Button>
                                        <Button 
                                            onClick={() => handleDelete(item, 'Locais')}
                                            className="bg-red-600 hover:bg-red-700"
                                        >
                                            Excluir
                                        </Button>
                                    </div>
                                </div>
                                <CardSplat />
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">CURSOS</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {courses.map(item => (
                            <div key={item.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 relative overflow-hidden">
                                <div className="relative z-10">
                                    <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-gray-100">{item.nome}</h3>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">Sigla: {item.sigla}</p>
                                    <div className="flex gap-2">
                                        <Button onClick={() => handleEdit(item, 'Cursos')}>Editar</Button>
                                        <Button 
                                            onClick={() => handleDelete(item, 'Cursos')}
                                            className="bg-red-600 hover:bg-red-700"
                                        >
                                            Excluir
                                        </Button>
                                    </div>
                                </div>
                                <CardSplat />
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">ADMINISTRADORES</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {administrators.map(admin => (
                            <div key={admin.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 relative overflow-hidden">
                                <div className="relative z-10">
                                    <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-gray-100">{admin.name}</h3>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-1">{admin.email}</p>
                                    <p className="text-gray-500 dark:text-gray-400 text-xs mb-4">{admin.role}</p>
                                    <div className="flex gap-2">
                                        <Button>Editar</Button>
                                        <Button className="bg-red-600 hover:bg-red-700">Excluir</Button>
                                    </div>
                                </div>
                                <CardSplat />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingItem ? "EDITAR CADASTRO" : "CRIAR CADASTRO"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Select
                        label="Categoria"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        required
                    >
                        <option value="">Selecionar categoria</option>
                        <option value="Esportes">Esportes</option>
                        <option value="Locais">Locais</option>
                        <option value="Cursos">Cursos</option>
                    </Select>
                    
                    <Input 
                        label="Nome" 
                        placeholder="Digite o nome" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        required
                    />
                    
                    {category === 'Cursos' && (
                        <Input 
                            label="Sigla" 
                            placeholder="Digite a sigla" 
                            value={formData.sigla}
                            onChange={(e) => setFormData({...formData, sigla: e.target.value})}
                            required
                        />
                    )}
                    
                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" onClick={closeModal} className="bg-gray-500">
                            Cancelar
                        </Button>
                        <Button type="submit">{editingItem ? 'Salvar' : 'Criar'}</Button>
                    </div>
                </form>
            </Modal>
        </>
    );
};