import React from 'react';
import { Layers } from 'lucide-react';

export const InstallmentsCard = ({ activeInstallmentsCount = 0 }) => {
  return (
    <div className="card-glow p-5 flex flex-col justify-between h-44 border border-[#3C3D37]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[#9C9589] uppercase tracking-wider">Parcelamentos</span>
        <div className="w-8 h-8 rounded-xl bg-[#697565]/20 flex items-center justify-center text-[#697565]">
          <Layers className="w-4 h-4" />
        </div>
      </div>

      <div>
        <h3 className="text-3xl font-bold text-[#ECDFCC]">
          {activeInstallmentsCount}
        </h3>
        <p className="text-xs text-[#9C9589] mt-1">
          {activeInstallmentsCount === 1 ? 'compra parcelada ativa' : 'compras parceladas ativas'}
        </p>
      </div>

      <div className="text-[11px] text-[#697565] font-medium border-t border-[#4A4B44]/40 pt-2 flex items-center justify-between">
        <span>Compromete o limite total</span>
        <span>Aloca por fatura</span>
      </div>
    </div>
  );
};
