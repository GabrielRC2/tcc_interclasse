'use client';
import React, { useState, useEffect } from 'react';
import { Plus, Calendar, MapPin, Trophy, Users, Clock } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { Button, Input, Select, CardSplat } from '@/components/common';

export const SeasonsPage = () => {
    const [seasons, setSeasons] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSeason, setEditingSeason] = useState(null);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        name: '',
        location: 'ETEC João Belarmino',
        startDate: '',
        endDate: '',
        modalities: 'Futsal, Vôlei, Basquete, Handebol'
    });

    useEffect(() => {
        loadSeasons();
    }, []);

    const loadSeasons = async () => {
        try {
            const response = await fetch('/api/torneios');
            const data = await response.json();
            setSeasons(data);
        } catch (error) {
            console.error('Erro ao carregar torneios:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            let endpoint = '/api/torneios';
            let method = 'POST';
            
            if (editingSeason) {
                endpoint = `/api/torneios/${editingSeason.id}`;
                method = 'PUT';
            }

            const response = await fetch(endpoint, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                await loadSeasons();
                closeModal();
                alert(`Torneio ${editingSeason ? 'editado' : 'criado'} com sucesso!`);
            } else {
                const error = await response.json();
                alert(error.error || 'Erro ao salvar torneio');
            }
        } catch (error) {
            console.error('Erro ao salvar torneio:', error);
            alert('Erro ao salvar torneio');
        }
    };

    const handleEdit = (season) => {
        setEditingSeason(season);
        setFormData({
            name: season.name,
            location: season.location,
            startDate: season.startDate,
            endDate: season.endDate,
            modalities: season.modalities
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (season) => {
        if (!confirm(`Tem certeza que deseja excluir o torneio "${season.name}"?`)) {
            return;
        }

        try {
            const response = await fetch(`/api/torneios/${season.id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await loadSeasons();
                alert('Torneio excluído com sucesso!');
            } else {
                const error = await response.json();
                alert(error.error || 'Erro ao excluir torneio');
            }
        } catch (error) {
            console.error('Erro ao excluir torneio:', error);
            alert('Erro ao excluir torneio');
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingSeason(null);
        setFormData({
            name: '',
            location: 'ETEC João Belarmino',
            startDate: '',
            endDate: '',
            modalities: 'Futsal, Vôlei, Basquete, Handebol'
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'ATIVO': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'PLANEJAMENTO': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'FINALIZADO': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
            default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64">Carregando...</div>;
    }

    return (
        <>
            <div className="space-y-6">
                <div className="flex flex-wrap justify-between items-center gap-4">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">TORNEIOS</h1>
                    <Button onClick={() => setIsModalOpen(true)}>
                        <Plus size={20} className="mr-2" />
                        Novo Torneio
                    </Button>
                </div>

                <div className="grid gap-6">
                    {seasons.length === 0 ? (
                        <div className="text-center py-12">
                            <Trophy size={48} className="mx-auto text-gray-400 mb-4" />
                            <p className="text-gray-500 dark:text-gray-400 text-lg">Nenhum torneio encontrado</p>
                            <Button onClick={() => setIsModalOpen(true)} className="mt-4">
                                Criar Primeiro Torneio
                            </Button>
                        </div>
                    ) : (
                        seasons.map(season => (
                            <div key={season.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6 relative overflow-hidden">
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                                                {season.name}
                                            </h3>
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(season.status)}`}>
                                                {season.status}
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button onClick={() => handleEdit(season)}>
                                                Editar
                                            </Button>
                                            <Button 
                                                onClick={() => handleDelete(season)}
                                                className="bg-red-600 hover:bg-red-700"
                                            >
                                                Excluir
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                            <MapPin size={16} />
                                            <span className="text-sm">{season.location}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                            <Calendar size={16} />
                                            <span className="text-sm">{season.startDate} - {season.endDate}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                            <Users size={16} />
                                            <span className="text-sm">{season.teamsCount} times</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                            <Clock size={16} />
                                            <span className="text-sm">{season.matchesPlayed}/{season.matchesTotal} partidas</span>
                                        </div>
                                    </div>

                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        <strong>Modalidades:</strong> {season.modalities}
                                    </div>
                                </div>
                                <CardSplat />
                            </div>
                        ))
                    )}
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingSeason ? "Editar Torneio" : "Novo Torneio"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input 
                        label="Nome do Torneio" 
                        placeholder="Digite o nome do torneio" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        required
                    />
                    
                    <Input 
                        label="Local" 
                        placeholder="Digite o local" 
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                        required
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input 
                            label="Data de Início" 
                            type="date" 
                            value={formData.startDate}
                            onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                            required
                        />
                        <Input 
                            label="Data de Fim" 
                            type="date" 
                            value={formData.endDate}
                            onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                            required
                        />
                    </div>
                    
                    <Input 
                        label="Modalidades" 
                        placeholder="Digite as modalidades" 
                        value={formData.modalities}
                        onChange={(e) => setFormData({...formData, modalities: e.target.value})}
                        required
                    />
                    
                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" onClick={closeModal} className="bg-gray-500">
                            Cancelar
                        </Button>
                        <Button type="submit">
                            {editingSeason ? 'Salvar' : 'Criar'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </>
    );
};
