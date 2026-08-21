import React from 'react';
import { Wallet, TrendingUp } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

export const BalanceCard = ({ totalBalance = 0, accountsCount = 0 }) => {
  // Sparkline data
  const sparkData = [
    { val: totalBalance * 0.7 },
    { val: totalBalance * 0.85 },
    { val: totalBalance * 0.8 },
    { val: totalBalance * 0.95 },
    { val: totalBalance }
  ];

  return (
    <div className="card-glow p-5 flex flex-col justify-between h-44 relative overflow-hidden group border border-[#3C3D37]">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-[#9C9589] uppercase tracking-wider">Saldo Total em Contas</span>
          <div className="w-8 h-8 rounded-xl bg-[#697565]/20 flex items-center justify-center text-[#697565]">
            <Wallet className="w-4 h-4" />
          </div>
        </div>

        <h2 className={`text-2xl md:text-3xl font-bold tracking-tight ${totalBalance < 0 ? 'text-[#E57373]' : 'text-[#ECDFCC]'}`}>
          R$ {totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </h2>

        <p className="text-xs text-[#9C9589] mt-1">
          {accountsCount} {accountsCount === 1 ? 'conta conectada' : 'contas conectadas'}
        </p>
      </div>

      {/* Sparkline background */}
      <div className="absolute bottom-0 left-0 right-0 h-16 opacity-30 group-hover:opacity-50 transition-opacity">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sparkData}>
            <Area type="monotone" dataKey="val" stroke="#697565" fill="#697565" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
