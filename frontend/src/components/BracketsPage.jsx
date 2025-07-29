'use client';
import { Button } from '@/components/common';

export const BracketsPage = () => {
    const modalities = [
        { name: 'BASQUETE FEMININO', teams: [['1º ADA', '2º EVE'], ['1º ETIQ', '2º ETEL'], ['3º DS', '1º CNAT']] },
        { name: 'FUTSAL MASCULINO', teams: [['1º DS', '2º ADA'], ['3º EVE', '1º ETEL'], ['2º CNAT', '3º ETIQ']] },
        { name: 'BASQUETE MASCULINO', teams: [['2º ETIQ', '3º CNAT'], ['1º EVE', '2º DS'], ['3º ETEL', '1º ADA']] },
        { name: 'FUTSAL FEMININO', teams: [['3º ETEL', '1º DS'], ['2º EVE', '3º ADA'], ['1º CNAT', '2º ETIQ']] }
    ];
    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">CHAVEAMENTO</h1>
                <div className="flex flex-wrap gap-2">
                    <Button>Gerar Chaveamento Automático</Button>
                    <Button variant="secondary">Exportar Partidas</Button>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8">
                {modalities.map(modality => (
                    <div key={modality.name}>
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">{modality.name}</h2>
                        <div className="space-y-4 relative">
                            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-700 -translate-x-1/2"></div>
                            {modality.teams.map((match, i) => (
                                <div key={i} className="flex items-center justify-between relative">
                                    <div className="w-2/5 text-center border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-semibold">{match[0]}</div>
                                    <div className="text-gray-500 dark:text-gray-400 font-semibold z-10 bg-gray-50 dark:bg-gray-900 px-1 rounded-full">VS</div>
                                    <div className="w-2/5 text-center border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-semibold">{match[1]}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
