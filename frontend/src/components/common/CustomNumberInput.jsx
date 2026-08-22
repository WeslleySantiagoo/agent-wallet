import React from 'react';
import { Minus, Plus } from 'lucide-react';

export const CustomNumberInput = ({
  value = 1,
  onChange,
  min = 1,
  max = 31,
  step = 1,
  placeholder = '',
  suffix = '',
  className = ''
}) => {
  const numValue = parseInt(value) || min;

  const handleDecrement = () => {
    const nextVal = Math.max(min, numValue - step);
    if (onChange) onChange(nextVal);
  };

  const handleIncrement = () => {
    const nextVal = Math.min(max, numValue + step);
    if (onChange) onChange(nextVal);
  };

  const handleInputChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (raw === '') {
      if (onChange) onChange('');
      return;
    }
    let parsed = parseInt(raw);
    if (isNaN(parsed)) parsed = min;
    if (parsed > max) parsed = max;
    if (onChange) onChange(parsed);
  };

  const handleBlur = () => {
    if (!value || parseInt(value) < min) {
      if (onChange) onChange(min);
    }
  };

  return (
    <div className={`flex items-center bg-[#181C14] border border-[#3C3D37] rounded-xl overflow-hidden focus-within:border-[#697565] transition-all shadow-inner ${className}`}>
      <button
        type="button"
        onClick={handleDecrement}
        disabled={numValue <= min}
        className="px-3 py-2.5 bg-[#181C14] hover:bg-[#3C3D37] text-[#9C9589] hover:text-[#ECDFCC] disabled:opacity-30 disabled:hover:bg-transparent transition-colors active:scale-95 cursor-pointer flex items-center justify-center"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>

      <div className="flex-1 flex items-center justify-center px-1">
        <input
          type="text"
          inputMode="numeric"
          value={value}
          onChange={handleInputChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="w-full bg-transparent text-center text-xs font-bold text-[#ECDFCC] outline-none"
        />
        {suffix && (
          <span className="text-[10px] text-[#9C9589] font-medium pr-2 select-none">
            {suffix}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={handleIncrement}
        disabled={numValue >= max}
        className="px-3 py-2.5 bg-[#181C14] hover:bg-[#3C3D37] text-[#9C9589] hover:text-[#ECDFCC] disabled:opacity-30 disabled:hover:bg-transparent transition-colors active:scale-95 cursor-pointer flex items-center justify-center"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
