import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const CashFlowCard = ({ income = 0, expenses = 0 }) => {
  const net = income - expenses;

  return (
    <div className="card-glow p-5 flex flex-col justify-between h-44 border border-[#3C3D37]">
      <div>
        <span className="text-xs font-medium text-[#9C9589] uppercase tracking-wider">Fluxo de Caixa Mês</span>
        <h3 className={`text-2xl font-bold mt-1 ${net >= 0 ? 'text-[#4CAF50]' : 'text-[#E57373]'}`}>
          {net >= 0 ? '+' : ''}R$ {net.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </h3>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 text-[#4CAF50]">
            <ArrowUpRight className="w-3.5 h-3.5" /> Receitas
          </span>
          <span className="font-semibold text-[#ECDFCC]">R$ {income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="w-full bg-[#181C14] h-2 rounded-full overflow-hidden">
          <div className="bg-[#4CAF50] h-full rounded-full" style={{ width: `${Math.min(100, (income / (income + expenses || 1)) * 100)}%` }} />
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 text-[#E57373]">
            <ArrowDownRight className="w-3.5 h-3.5" /> Despesas
          </span>
          <span className="font-semibold text-[#ECDFCC]">R$ {expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>
    </div>
  );
};
