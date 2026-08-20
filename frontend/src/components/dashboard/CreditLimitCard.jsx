import React from 'react';

export const CreditLimitCard = ({ usedLimit = 0, totalLimit = 5000 }) => {
  const available = Math.max(0, totalLimit - usedLimit);
  const percentage = Math.min(100, Math.round((usedLimit / totalLimit) * 100));

  // SVG Circular progress params
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="card-glow p-5 flex items-center justify-between h-44 border border-[#3C3D37]">
      <div className="flex flex-col justify-between h-full">
        <div>
          <span className="text-xs font-medium text-[#9C9589] uppercase tracking-wider">Limite Disponível</span>
          <h3 className="text-2xl font-bold text-[#ECDFCC] mt-1">
            R$ {available.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
        </div>
        <p className="text-xs text-[#9C9589]">
          de R$ {totalLimit.toLocaleString('pt-BR')} total
        </p>
      </div>

      {/* SVG Ring Gauge */}
      <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke="#181C14"
            strokeWidth="8"
            fill="transparent"
          />
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke="#697565"
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-500 ease-out"
          />
        </svg>
        <span className="absolute text-xs font-bold text-[#ECDFCC]">{percentage}%</span>
      </div>
    </div>
  );
};
