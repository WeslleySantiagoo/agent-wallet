import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

export const EvolutionChart = () => {
  const data = [
    { mes: 'Mar', Receitas: 4500, Despesas: 3200 },
    { mes: 'Abr', Receitas: 4800, Despesas: 3500 },
    { mes: 'Mai', Receitas: 5100, Despesas: 2900 },
    { mes: 'Jun', Receitas: 4900, Despesas: 4100 },
    { mes: 'Jul', Receitas: 5500, Despesas: 3800 },
    { mes: 'Ago', Receitas: 5200, Despesas: 3280 },
  ];

  return (
    <div className="card-glow p-5 border border-[#3C3D37] col-span-1 md:col-span-2 h-72 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm font-semibold text-[#ECDFCC]">Evolução Mensal</h3>
          <p className="text-xs text-[#9C9589]">Comparativo de Receitas vs Despesas (Últimos 6 meses)</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-[#4CAF50]" />
            <span className="text-[#9C9589]">Receitas</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-[#697565]" />
            <span className="text-[#9C9589]">Despesas</span>
          </div>
        </div>
      </div>

      <div className="w-full h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={4}>
            <XAxis dataKey="mes" stroke="#9C9589" fontSize={11} tickLine={false} />
            <YAxis stroke="#9C9589" fontSize={11} tickLine={false} tickFormatter={(val) => `R$${val}`} />
            <Tooltip
              contentStyle={{ backgroundColor: '#3C3D37', border: '1px solid #4A4B44', borderRadius: '12px', color: '#ECDFCC' }}
              formatter={(val) => [`R$ ${val.toLocaleString('pt-BR')}`, '']}
            />
            <Bar dataKey="Receitas" fill="#4CAF50" radius={[6, 6, 0, 0]} />
            <Bar dataKey="Despesas" fill="#697565" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
