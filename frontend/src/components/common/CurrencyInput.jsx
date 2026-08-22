import React, { useState, useEffect, useRef } from 'react';

export const CurrencyInput = ({ value = 0, onChange, isIncome = false }) => {
  const inputRef = useRef(null);

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
    return numericValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formattedValue = formatDisplay(digits);
  const prefix = isIncome ? '+R$' : 'R$';

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      className="relative w-full py-2 flex items-center justify-start cursor-text select-none group"
    >
      {/* Elemento de input invisivel por cima do texto */}
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        value={formattedValue}
        onChange={handleInputChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-text outline-none border-none"
        autoFocus
      />

      {/* Exibicao tipografica minimalista alinhada a esquerda, mesmo tamanho de fonte e cor da IDV */}
      <div className="flex items-center justify-start tracking-tight">
        <span
          className={`text-4xl sm:text-5xl font-black ${
            isIncome ? 'text-[#4CAF50]' : 'text-[#ECDFCC]'
          }`}
        >
          {prefix}{formattedValue}
        </span>
      </div>
    </div>
  );
};
