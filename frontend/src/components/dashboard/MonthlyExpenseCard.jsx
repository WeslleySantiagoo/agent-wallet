import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export const MonthlyExpenseCard = ({ totalExpenses = 0, categories = [] }) => {
  const defaultCategories = categories.length > 0 ? categories : [
    { name: 'Alimentação', color: '#697565', total: totalExpenses * 0.4 || 100 },
    { name: 'Transporte', color: '#4CAF50', total: totalExpenses * 0.3 || 70 },
    { name: 'Lazer', color: '#FFB74D', total: totalExpenses * 0.3 || 50 },
  ];

  return (
    <div className="card-glow p-5 flex items-center justify-between h-44 border border-[#3C3D37]">
      <div className="flex flex-col justify-between h-full">
        <div>
          <span className="text-xs font-medium text-[#9C9589] uppercase tracking-wider">Gastos do Mês</span>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#ECDFCC] mt-1">
            R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h2>
        </div>

        {/* Category Dots */}
        <div className="flex items-center gap-2 flex-wrap mt-2">
          {defaultCategories.slice(0, 3).map((cat, idx) => (
            <div key={idx} className="flex items-center gap-1.5 text-[11px] text-[#9C9589]">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color || '#697565' }} />
              <span className="truncate max-w-[80px]">{cat.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Mini Donut Chart */}
      <div className="w-20 h-20 relative shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={defaultCategories}
              dataKey="total"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={22}
              outerRadius={36}
              paddingAngle={3}
            >
              {defaultCategories.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || '#697565'} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
