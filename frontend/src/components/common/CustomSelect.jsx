import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export const CustomSelect = ({ value, onChange, options = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const normalizedOptions = options.map(opt => 
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  const selectedOption = normalizedOptions.find(opt => opt.value === value) || normalizedOptions[0];

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Botao Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="bg-[#181C14] text-[#ECDFCC] text-xs font-medium rounded-xl px-3 py-2 border border-[#4A4B44] flex items-center justify-between gap-2 hover:border-[#697565] transition-all cursor-pointer shadow-sm outline-none"
      >
        <span className="truncate">{selectedOption?.label || value}</span>
        <ChevronDown 
          className={`w-3.5 h-3.5 text-[#9C9589] transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#ECDFCC]' : 'rotate-0'}`} 
        />
      </button>

      {/* Menu Expandido de Opcoes com Animacao de Entrada e Saida Suave em Tailwind */}
      <div 
        className={`absolute right-0 top-full mt-1.5 w-36 bg-[#181C14] border border-[#3C3D37] rounded-xl shadow-2xl p-1 z-50 backdrop-blur-xl space-y-0.5 origin-top transition-all duration-300 ease-in-out transform ${
          isOpen 
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' 
            : 'opacity-0 scale-90 -translate-y-2 pointer-events-none'
        }`}
      >
        {normalizedOptions.map((opt) => {
          const isSelected = opt.value === value;
          return (
            <div
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                isSelected
                  ? 'bg-[#697565]/30 text-[#ECDFCC] font-bold border border-[#697565]/40'
                  : 'text-[#9C9589] hover:bg-[#3C3D37]/60 hover:text-[#ECDFCC]'
              }`}
            >
              <span className="truncate">{opt.label}</span>
              {isSelected && <Check className="w-3.5 h-3.5 text-[#4CAF50] shrink-0 ml-1" />}
            </div>
          );
        })}
      </div>
    </div>
  );
};
