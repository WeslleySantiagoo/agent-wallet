import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export const MonthlyExpenseCard = ({ totalExpenses = 0, categories = [] }) => {
  const hasCategories = categories && categories.length > 0;

  return (
    <div className="card-glow h-full p-4 sm:p-5 flex items-center justify-between min-h-[7rem] sm:h-44 border border-[#3C3D37]">
      <div className="flex flex-col justify-between h-full flex-1">
        <div>
          <span className="text-xs font-medium text-[#9C9589] uppercase tracking-wider">Gastos do Mês</span>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#ECDFCC] mt-1">
            R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h2>
        </div>

        {/* Category Dots */}
        {!hasCategories ? (
          <p className="text-[11px] text-[#9C9589] mt-2">Sem categorias com despesas neste mês</p>
        ) : (
          <div className="hidden sm:flex items-center gap-2 flex-wrap mt-2">
            {categories.slice(0, 3).map((cat, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-[11px] text-[#9C9589]">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color || '#697565' }} />
                <span className="truncate max-w-[80px]">{cat.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mini Donut Chart */}
      {hasCategories && (
        <div className="w-16 h-16 sm:w-20 sm:h-20 relative shrink-0 ml-2 pointer-events-none">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categories}
                dataKey="total"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="100%"
                paddingAngle={3}
                stroke="none"
              >
                {categories.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || '#697565'} style={{ outline: 'none' }} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
