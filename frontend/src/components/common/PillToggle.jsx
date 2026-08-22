import React from 'react';

export const PillToggle = ({ value, onChange, options = [] }) => {
  const selectedIndex = options.findIndex(opt => opt.value === value);
  const activeIndex = selectedIndex >= 0 ? selectedIndex : 0;
  const isIncome = value === 'INCOME';

  return (
    <div className="relative w-full bg-[#181C14] border border-[#3C3D37] rounded-full p-1 flex items-center select-none shadow-inner h-12">
      {/* Sliding background pill */}
      <div
        className={`absolute top-1 bottom-1 rounded-full transition-all duration-300 ease-out shadow-md ${
          isIncome ? 'bg-[#4CAF50] text-white' : 'bg-[#E57373] text-white'
        }`}
        style={{
          width: `calc(${100 / options.length}% - 8px)`,
          left: `calc(${(activeIndex * 100) / options.length}% + 4px)`
        }}
      />

      {/* Toggle options text */}
      {options.map((opt, idx) => {
        const isSelected = idx === activeIndex;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`relative z-10 flex-1 text-center text-xs sm:text-sm font-bold transition-colors duration-200 cursor-pointer h-full flex items-center justify-center gap-2 ${
              isSelected ? 'text-white' : 'text-[#9C9589] hover:text-[#ECDFCC]'
            }`}
          >
            {opt.icon && <opt.icon className="w-4 h-4" />}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
};
