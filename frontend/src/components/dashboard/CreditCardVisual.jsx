import React from 'react';
import { CreditCard, Calendar, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export const CreditCardVisual = ({ card }) => {
  if (!card) {
    return (
      <div className="card-glow h-full p-4 sm:p-5 min-h-[9rem] sm:h-44 flex flex-col justify-between bg-gradient-to-br from-[#3C3D37]/50 via-[#2A2E24]/50 to-[#181C14] border border-[#3C3D37] relative overflow-hidden">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold tracking-widest text-[#9C9589] uppercase">Cartão de Crédito</span>
          <CreditCard className="w-5 h-5 text-[#9C9589]" />
        </div>

        <div>
          <span className="text-[11px] text-[#9C9589]">Nenhum cartão cadastrado</span>
          <h3 className="text-xl font-bold text-[#ECDFCC] mt-1">R$ 0,00</h3>
        </div>

        <div className="border-t border-[#3C3D37] pt-2 flex items-center justify-between text-[11px] text-[#9C9589]">
          <span>Cadastre um cartão para gerenciar faturas</span>
        </div>
      </div>
    );
  }

  const cardName = card.name;
  const lastDigits = card.last_four_digits || '0000';
  const usedLimit = card.used_limit || 0;
  const totalLimit = card.total_limit || 0;
  const dueDay = card.due_day || 1;

  return (
    <div className="card-glow h-full p-4 sm:p-5 min-h-[10rem] sm:h-44 flex flex-col justify-between bg-gradient-to-br from-[#3C3D37] via-[#2A2E24] to-[#181C14] border border-[#4A4B44] relative overflow-hidden group">
      {/* Top Card Bar */}
      <div className="flex items-start sm:items-center justify-between gap-2">
        <span className="text-xs font-semibold tracking-widest text-[#ECDFCC]/80 uppercase break-words flex-1 leading-tight">{cardName}</span>
        <div className="flex items-center gap-1.5 shrink-0">
          <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-[#697565]" />
          <span className="text-xs font-mono text-[#9C9589]">•••• {lastDigits}</span>
        </div>
      </div>

      {/* Invoice Details */}
      <div>
        <span className="text-[11px] text-[#9C9589]">Fatura Atual</span>
        <h3 className="text-xl md:text-2xl font-bold text-[#ECDFCC] tracking-tight">
          R$ {usedLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </h3>
      </div>

      {/* Footer info */}
      <div className="flex items-center justify-between flex-wrap gap-y-1 text-[11px] text-[#9C9589] border-t border-[#4A4B44]/50 pt-2">
        <div className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-[#697565] shrink-0" />
          <span className="whitespace-nowrap">Vence dia {dueDay}</span>
        </div>
        <span className="whitespace-nowrap">Limite: R$ {totalLimit.toLocaleString('pt-BR')}</span>
      </div>
    </div>
  );
};
