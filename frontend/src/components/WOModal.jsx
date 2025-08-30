'use client';
import React, { useState } from 'react';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/common';

export const WOModal = ({ isOpen, onClose, match, onWOConfirmed }) => {
  const [timeWOSelecionado, setTimeWOSelecionado] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const handleCloseModal = () => {
    setTimeWOSelecionado(null);
    onClose();
  };

  const handleEnviarWO = async () => {
    if (!timeWOSelecionado || !match) return;
    
    setEnviando(true);
    try {
      // Enviar WO para a API
      const response = await fetch(`/api/partidas/${match.id}/wo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeWOId: timeWOSelecionado })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Erro ao registrar WO');
      }

      alert('WO registrado com sucesso!');
      onWOConfirmed?.();
      handleCloseModal();
    } catch (error) {
      console.error('Erro ao enviar WO:', error);
      alert('Erro ao registrar WO: ' + error.message);
    } finally {
      setEnviando(false);
    }
  };

  if (!match) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleCloseModal} title="Registrar WO" size="max-w-md">
      <div className="p-6">
        <div className="text-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Qual time está de WO?
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Selecione o time que não compareceu à partida
          </p>
        </div>

        <div className="space-y-4 mb-6">
          {/* Card do Time 1 */}
          <div
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
              timeWOSelecionado === match.team1Id
                ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
            onClick={() => setTimeWOSelecionado(match.team1Id)}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {match.team1}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {match.team1Course}
                </p>
              </div>
              {timeWOSelecionado === match.team1Id && (
                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Card do Time 2 */}
          <div
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
              timeWOSelecionado === match.team2Id
                ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
            onClick={() => setTimeWOSelecionado(match.team2Id)}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {match.team2}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {match.team2Course}
                </p>
              </div>
              {timeWOSelecionado === match.team2Id && (
                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button 
            onClick={handleCloseModal}
            variant="secondary" 
            className="flex-1"
            disabled={enviando}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleEnviarWO}
            disabled={!timeWOSelecionado || enviando}
            className="flex-1 bg-red-600 hover:bg-red-700"
          >
            {enviando ? 'Enviando...' : 'Enviar WO'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
