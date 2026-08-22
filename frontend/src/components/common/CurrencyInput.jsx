import React, { useState, useEffect } from 'react';

export const CurrencyInput = ({ value = 0, onChange, isIncome = false }) => {
  // Converte valor float em string de digitos em centavos
  const floatToCentsString = (val) => {
    if (!val || isNaN(val)) return '0';
    return Math.round(val * 100).toString();
  };

  const [digits, setDigits] = useState(floatToCentsString(value));

  useEffect(() => {
    setDigits(floatToCentsString(value));
  }, [value]);

  const handleInputChange = (e) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    const cleanDigits = rawVal.replace(/^0+/, '') || '0';
    setDigits(cleanDigits);
    const numericValue = parseFloat(cleanDigits) / 100;
    if (onChange) {
      onChange(numericValue);
    }
  };

  const formatDisplay = (digitsStr) => {
    const numericValue = parseFloat(digitsStr || '0') / 100;
    const formatted = numericValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return formatted;
  };

  return (
    <div className="relative w-full">
      <div className={`flex items-center bg-[#181C14] border border-[#3C3D37] rounded-2xl px-4 py-3 focus-within:border-[#697565] transition-all shadow-inner ${
        isIncome ? 'border-[#4CAF50]/30' : 'border-[#E57373]/30'
      }`}>
        <span className={`text-sm sm:text-base font-bold mr-2 select-none ${
          isIncome ? 'text-[#4CAF50]' : 'text-[#E57373]'
        }`}>
          {isIncome ? '+ R$' : '- R$'}
        </span>
        <input
          type="text"
          inputMode="numeric"
          value={formatDisplay(digits)}
          onChange={handleInputChange}
          placeholder="0,00"
          className={`w-full bg-transparent text-xl sm:text-2xl font-extrabold outline-none tracking-wide ${
            isIncome ? 'text-[#4CAF50]' : 'text-[#ECDFCC]'
          }`}
        />
      </div>
    </div>
  );
};
