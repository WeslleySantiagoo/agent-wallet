import React, { useMemo } from 'react';
import { Wallet, TrendingUp } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, ReferenceLine } from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const dateObj = new Date(data.date + "T00:00:00");
    const dateStr = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    return (
      <div className="bg-[#181C14] border border-[#3C3D37] p-2 rounded-lg shadow-lg">
        <p className="text-[10px] text-[#9C9589] font-medium mb-1">{dateStr}</p>
        <p className="text-xs font-bold text-[#ECDFCC]">
          R$ {Number(data.val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>
    );
  }
  return null;
};

export const BalanceCard = ({ totalBalance = 0, accountsCount = 0, dailyBalance60Days = [] }) => {
  // Se não houver dados diários vindos do backend, faz um fallback
  const sparkData = useMemo(() => {
    if (dailyBalance60Days && dailyBalance60Days.length > 0) {
      return dailyBalance60Days;
    }
    return [
      { date: new Date().toISOString(), val: totalBalance * 0.7 },
      { date: new Date().toISOString(), val: totalBalance * 0.85 },
      { date: new Date().toISOString(), val: totalBalance * 0.8 },
      { date: new Date().toISOString(), val: totalBalance * 0.95 },
      { date: new Date().toISOString(), val: totalBalance }
    ];
  }, [dailyBalance60Days, totalBalance]);

  // Identificar mudanças de mês para as ReferenceLines
  const monthBoundaries = useMemo(() => {
    const boundaries = [];
    if (!dailyBalance60Days || dailyBalance60Days.length === 0) return boundaries;
    
    let currentMonth = dailyBalance60Days[0].month;
    for (let i = 1; i < dailyBalance60Days.length; i++) {
      if (dailyBalance60Days[i].month !== currentMonth) {
        boundaries.push(dailyBalance60Days[i].date);
        currentMonth = dailyBalance60Days[i].month;
      }
    }
    return boundaries;
  }, [dailyBalance60Days]);

  return (
    <div className="card-glow h-full p-5 flex flex-col justify-between min-h-[9rem] sm:h-44 relative overflow-hidden group border border-[#3C3D37]">
      <div className="relative z-10 pointer-events-none">
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

      {/* Sparkline background with interactive tooltip */}
      <div className="absolute bottom-0 left-0 right-0 h-14 opacity-40 group-hover:opacity-100 transition-opacity z-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sparkData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#697565" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#697565" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#9C9589', strokeWidth: 1, strokeDasharray: '3 3' }} />
            <XAxis dataKey="date" hide={true} />
            {monthBoundaries.map((dateStr, idx) => (
              <ReferenceLine key={idx} x={dateStr} stroke="#3C3D37" strokeDasharray="3 3" />
            ))}
            <Area 
              type="monotone" 
              dataKey="val" 
              stroke="#697565" 
              fillOpacity={1} 
              fill="url(#colorVal)" 
              strokeWidth={2} 
              activeDot={{ r: 4, fill: '#ECDFCC', stroke: '#697565', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
