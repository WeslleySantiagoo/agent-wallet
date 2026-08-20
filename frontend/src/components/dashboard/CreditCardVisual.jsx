import React from 'react';
import { CreditCard, Calendar } from 'lucide-react';

export const CreditCardVisual = ({ card }) => {
  const cardName = card?.name || 'Visa Infinite';
  const lastDigits = card?.last_four_digits || '9261';
  const usedLimit = card?.used_limit || 176.94;
  const totalLimit = card?.total_limit || 5000.0;
  const dueDay = card?.due_day || 7;

  return (
    <div className="card-glow p-5 h-44 flex flex-col justify-between bg-gradient-to-br from-[#3C3D37] via-[#2A2E24] to-[#181C14] border border-[#4A4B44] relative overflow-hidden group">
      {/* Top Card Bar */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-widest text-[#ECDFCC]/80 uppercase">{cardName}</span>
        <div className="flex items-center gap-1.5">
          <CreditCard className="w-5 h-5 text-[#697565]" />
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
      <div className="flex items-center justify-between text-[11px] text-[#9C9589] border-t border-[#4A4B44]/50 pt-2">
        <div className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-[#697565]" />
          <span>Vence dia {dueDay}</span>
        </div>
        <span>Limite: R$ {totalLimit.toLocaleString('pt-BR')}</span>
      </div>
    </div>
  );
};
