import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { getInstitutionLogo } from '../../utils/institutions';
import { formatDisplayDate } from '../../utils/dateUtils';

export const RecentTransactions = ({ transactions = [] }) => {
  const navigate = useNavigate();

  if (!transactions || transactions.length === 0) {
    return (
      <div className="card-glow p-5 border border-[#3C3D37] col-span-full h-72 flex flex-col justify-between">
        <h3 className="text-sm font-semibold text-[#ECDFCC] mb-4">Transações Recentes</h3>
        <p className="text-xs text-[#9C9589] text-center py-6">Nenhuma transação registrada ainda. Digite um lançamento no chat da IA para testar!</p>
      </div>
    );
  }

  // No mobile/desktop mostra até 10 transações dentro do card com altura h-72
  const displayTxs = transactions.slice(0, 10);

  return (
    <div className="card-glow p-5 border border-[#3C3D37] col-span-full h-72 relative flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <h3 className="text-sm font-semibold text-[#ECDFCC]">Transações Recentes</h3>
        <span className="text-xs text-[#697565] font-medium">{transactions.length} lançamentos</span>
      </div>

      {/* Table Container com overflow-hidden para respeitar h-72 da Evolução Mensal */}
      <div className="overflow-hidden flex-1 pb-10">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#4A4B44] text-[#9C9589] uppercase tracking-wider font-medium text-[10px]">
              <th className="pb-2 pl-1">Lançamento</th>
              <th className="pb-2">Data</th>
              <th className="pb-2 text-right pr-1">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#3C3D37]/40">
            {displayTxs.map((tx) => {
              const isIncome = tx.type === 'INCOME';
              const instName = tx.institution || tx.account_name || '';
              const logoUrl = getInstitutionLogo(instName);

              return (
                <tr key={tx.id} className="hover:bg-[#4A4B44]/20 transition-colors">
                  <td className="py-2 pl-1 font-medium text-[#ECDFCC] flex items-center gap-2">
                    <div className="relative w-6 h-6 rounded-lg bg-[#181C14] border border-[#3C3D37] p-1 flex items-center justify-center shrink-0">
                      <img 
                        src={logoUrl} 
                        alt={instName || 'Banco'} 
                        className="w-full h-full object-contain" 
                        onError={(e) => { e.target.src = '/assets/logos/logo-generic-bank.svg'; }}
                      />
                    </div>
                    <div className="truncate max-w-[140px] sm:max-w-[180px]">
                      <p className="font-semibold text-[11px] text-[#ECDFCC] truncate">{tx.description}</p>
                      {instName && (
                        <span className="text-[9px] text-[#9C9589] block font-mono truncate">
                          {instName}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-2 text-[#9C9589] font-mono text-[10px] whitespace-nowrap">
                    {formatDisplayDate(tx.date)}
                  </td>

                  <td className={`py-2 text-right pr-1 font-bold text-[11px] whitespace-nowrap ${
                    isIncome ? 'text-[#4CAF50]' : 'text-[#ECDFCC]'
                  }`}>
                    {isIncome ? '+' : '-'}R$ {Number(tx.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Degradê no fim + Botão Mostrar Mais direcionando para /transactions */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#181C14] via-[#181C14]/90 to-transparent flex items-end justify-center pb-3 z-10">
        <button
          onClick={() => navigate('/transactions')}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#3C3D37]/90 hover:bg-[#4A4B44] text-[#ECDFCC] text-xs font-semibold border border-[#4A4B44] backdrop-blur-sm transition-all cursor-pointer shadow-lg hover:scale-105"
        >
          <span>Mostrar mais</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
