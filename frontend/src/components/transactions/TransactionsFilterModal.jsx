import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { getInstitutionLogo } from '../../utils/institutions';
import { CustomDatePicker } from '../common/CustomDatePicker';

export const TransactionsFilterModal = ({ isOpen, onClose, categories = [], accounts = [], creditCards = [], currentFilters, onApply }) => {
  const [filters, setFilters] = useState(currentFilters || {
    period: 'Mês atual',
    banks: [],
    cards: [],
    categories: [],
    sortBy: 'Mais recentes',
    customStartDate: '',
    customEndDate: ''
  });
  const [showMoreCategories, setShowMoreCategories] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleArrayItem = (array, item) => {
    if (array.includes(item)) {
      return array.filter(i => i !== item);
    }
    return [...array, item];
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const periods = ['Hoje', 'Ontem', 'Últimos 7 dias', 'Últimos 15 dias', 'Mês atual', 'Mês passado', 'Últimos 6 meses', 'Este ano', 'Ano passado', 'Personalizado'];
  const sorts = ['Mais recentes', 'Mais antigas', 'Maior valor', 'Menor valor'];
  const origins = ['Open finance', 'Manuais'];

  const displayedCategories = showMoreCategories ? categories : categories.slice(0, 8);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#181C14] border border-[#3C3D37] rounded-3xl w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-[#3C3D37]">
          <h2 className="text-xl font-medium text-white">Filtros</h2>
          <button onClick={onClose} className="p-2 rounded-full bg-[#3C3D37]/50 text-[#9C9589] hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-8 custom-scrollbar">
          
          {/* Período */}
          <div>
            <h3 className="text-sm text-[#9C9589] font-medium mb-3">Período</h3>
            <div className="flex flex-wrap gap-2">
              {periods.map(p => (
                <button
                  key={p}
                  onClick={() => setFilters({ ...filters, period: p })}
                  className={`px-4 py-2 rounded-full text-xs font-medium border transition-colors ${
                    filters.period === p 
                      ? 'bg-white text-black border-white' 
                      : 'bg-[#181C14] text-[#9C9589] border-[#3C3D37] hover:bg-[#3C3D37]/30'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            
            {filters.period === 'Personalizado' && (
              <div className="mt-4 flex gap-4 animate-fadeIn">
                <div className="flex-1">
                  <label className="text-xs text-[#9C9589] font-semibold uppercase tracking-wider block mb-1.5">Data Inicial</label>
                  <CustomDatePicker 
                    value={filters.customStartDate} 
                    onChange={(date) => setFilters({ ...filters, customStartDate: date })} 
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-[#9C9589] font-semibold uppercase tracking-wider block mb-1.5">Data Final</label>
                  <CustomDatePicker 
                    value={filters.customEndDate} 
                    onChange={(date) => setFilters({ ...filters, customEndDate: date })} 
                  />
                </div>
              </div>
            )}
          </div>

          {/* Bancos */}
          {accounts.length > 0 && (
            <div>
              <h3 className="text-sm text-[#9C9589] font-medium mb-3">Bancos</h3>
              <div className="space-y-3">
                {accounts.map(acc => {
                  const logo = getInstitutionLogo(acc.institution);
                  const isChecked = filters.banks.includes(acc.id);
                  return (
                    <label key={acc.id} className="flex items-center justify-between cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white p-1 flex items-center justify-center shrink-0">
                          <img src={logo} alt={acc.name} className="w-full h-full object-contain" onError={(e) => { e.target.src = '/assets/logos/logo-generic-bank.svg'; }} />
                        </div>
                        <span className="text-sm text-[#ECDFCC]">{acc.name}</span>
                      </div>
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isChecked ? 'bg-white border-white' : 'border-[#4A4B44] group-hover:border-[#9C9589]'}`}>
                        {isChecked && <X className="w-3 h-3 text-black" style={{ transform: 'rotate(45deg)' }} />}
                      </div>
                      <input 
                        type="checkbox" 
                        className="hidden" 
                        checked={isChecked} 
                        onChange={() => setFilters({ ...filters, banks: toggleArrayItem(filters.banks, acc.id) })} 
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cartões */}
          {creditCards.length > 0 && (
            <div>
              <h3 className="text-sm text-[#9C9589] font-medium mb-3">Cartões</h3>
              <div className="space-y-3">
                {creditCards.map(card => {
                  const logo = getInstitutionLogo(card.institution);
                  const isChecked = filters.cards.includes(card.id);
                  return (
                    <label key={card.id} className="flex items-center justify-between cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white p-1 flex items-center justify-center shrink-0">
                          <img src={logo} alt={card.name} className="w-full h-full object-contain" onError={(e) => { e.target.src = '/assets/logos/logo-generic-bank.svg'; }} />
                        </div>
                        <span className="text-sm text-[#ECDFCC]">{card.name} - final {card.last_four_digits}</span>
                      </div>
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isChecked ? 'bg-white border-white' : 'border-[#4A4B44] group-hover:border-[#9C9589]'}`}>
                        {isChecked && <X className="w-3 h-3 text-black" style={{ transform: 'rotate(45deg)' }} />}
                      </div>
                      <input 
                        type="checkbox" 
                        className="hidden" 
                        checked={isChecked} 
                        onChange={() => setFilters({ ...filters, cards: toggleArrayItem(filters.cards, card.id) })} 
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Categoria */}
          <div>
            <h3 className="text-sm text-[#9C9589] font-medium mb-3">Categoria</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilters({ ...filters, categories: [] })}
                className={`px-4 py-2 rounded-full text-xs font-medium border transition-colors flex items-center gap-2 ${
                  filters.categories.length === 0 
                    ? 'bg-white text-black border-white' 
                    : 'bg-[#181C14] text-[#9C9589] border-[#3C3D37] hover:bg-[#3C3D37]/30'
                }`}
              >
                <span>Suas categorias</span>
              </button>
              {displayedCategories.map(cat => {
                const isSelected = filters.categories.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() => setFilters({ ...filters, categories: toggleArrayItem(filters.categories, cat.id) })}
                    className={`px-3 py-2 rounded-full text-xs font-medium border transition-colors flex items-center gap-2 ${
                      isSelected
                        ? 'bg-[#3C3D37] text-white border-[#9C9589]' 
                        : 'bg-[#181C14] text-[#9C9589] border-[#3C3D37] hover:bg-[#3C3D37]/30'
                    }`}
                  >
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>
            {categories.length > 8 && (
              <button 
                onClick={() => setShowMoreCategories(!showMoreCategories)}
                className="text-xs text-[#9C9589] hover:text-white mt-3 font-medium"
              >
                {showMoreCategories ? 'Mostrar menos' : 'Mostrar mais >'}
              </button>
            )}
          </div>

          {/* Ordenar por */}
          <div>
            <h3 className="text-sm text-[#9C9589] font-medium mb-3">Ordenar por</h3>
            <div className="flex flex-wrap gap-2">
              {sorts.map(s => (
                <button
                  key={s}
                  onClick={() => setFilters({ ...filters, sortBy: s })}
                  className={`px-4 py-2 rounded-full text-xs font-medium border transition-colors ${
                    filters.sortBy === s 
                      ? 'bg-white text-black border-white' 
                      : 'bg-[#181C14] text-[#9C9589] border-[#3C3D37] hover:bg-[#3C3D37]/30'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

        </div>

        <div className="p-5 border-t border-[#3C3D37] bg-[#181C14]">
          <button 
            onClick={handleApply}
            className="w-full py-3.5 bg-white text-black rounded-full font-semibold text-sm hover:bg-gray-200 transition-colors"
          >
            Mostrar resultados
          </button>
          <div className="text-center mt-4">
            <button 
              onClick={() => setFilters({
                period: 'Mês atual', banks: [], cards: [], categories: [], sortBy: 'Mais recentes', customStartDate: '', customEndDate: ''
              })}
              className="text-xs text-[#9C9589] font-medium hover:text-white"
            >
              Limpar tudo
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
