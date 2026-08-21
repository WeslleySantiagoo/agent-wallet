import React from 'react';
import { ArrowUpRight, ArrowDownRight, CreditCard } from 'lucide-react';
import { getInstitutionLogo } from '../../utils/institutions';

export const RecentTransactions = ({ transactions = [] }) => {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="card-glow p-5 border border-[#3C3D37] col-span-full">
        <h3 className="text-sm font-semibold text-[#ECDFCC] mb-4">Transações Recentes</h3>
        <p className="text-xs text-[#9C9589] text-center py-6">Nenhuma transação registrada ainda. Digite um lançamento no chat da IA para testar!</p>
      </div>
    );
  }

  return (
    <div className="card-glow p-5 border border-[#3C3D37] col-span-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#ECDFCC]">Transações Recentes por Banco</h3>
        <span className="text-xs text-[#697565] font-medium">{transactions.length} lançamentos</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#4A4B44] text-[#9C9589] uppercase tracking-wider font-medium">
              <th className="pb-3 pl-2">Descrição & Instituição</th>
              <th className="pb-3">Data</th>
              <th className="pb-3">Tipo</th>
              <th className="pb-3 text-right pr-2">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#3C3D37]/60">
            {transactions.map((tx) => {
              const isIncome = tx.type === 'INCOME';
              const isCard = tx.type === 'CARD_PURCHASE';
              const instName = tx.institution || tx.account_name || '';
              const logoUrl = getInstitutionLogo(instName);

              return (
                <tr key={tx.id} className="hover:bg-[#4A4B44]/30 transition-colors">
                  <td className="py-3 pl-2 font-medium text-[#ECDFCC] flex items-center gap-2.5">
                    {/* Logo da Instituição */}
                    <div className="relative w-8 h-8 rounded-xl bg-[#181C14] border border-[#3C3D37] p-1.5 flex items-center justify-center shrink-0 shadow-inner">
                      <img 
                        src={logoUrl} 
                        alt={instName || 'Banco'} 
                        className="w-full h-full object-contain" 
                        onError={(e) => { e.target.src = '/assets/logos/logo-generic-bank.svg'; }}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-xs text-[#ECDFCC]">{tx.description}</p>
                        {instName && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-[#181C14] text-[#9C9589] border border-[#3C3D37]">
                            {instName}
                          </span>
                        )}
                      </div>
                      {tx.is_installment && (
                        <span className="text-[10px] text-[#697565] block">Parcela {tx.installment_number}/{tx.total_installments}</span>
                      )}
                    </div>
                  </td>

                  <td className="py-3 text-[#9C9589] font-mono text-[11px]">{new Date(tx.date).toLocaleDateString('pt-BR')}</td>

                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      isIncome
                        ? 'bg-[#4CAF50]/20 text-[#4CAF50]'
                        : isCard
                        ? 'bg-[#697565]/30 text-[#ECDFCC]'
                        : 'bg-[#E57373]/20 text-[#E57373]'
                    }`}>
                      {isIncome ? 'Receita' : isCard ? 'Cartão Crédito' : 'Despesa'}
                    </span>
                  </td>

                  <td className={`py-3 text-right pr-2 font-bold ${
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
    </div>
  );
};
