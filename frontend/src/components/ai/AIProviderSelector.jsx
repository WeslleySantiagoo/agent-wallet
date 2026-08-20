import React, { useState, useRef, useEffect } from 'react';
import { useAIChat } from '../../context/AIChatContext';
import { Cpu, ChevronDown, Check, Sparkles } from 'lucide-react';

export const AIProviderSelector = () => {
  const { selectedProvider, setSelectedProvider, selectedModel, setSelectedModel, providersData } = useAIChat();
  const [isOpen, setIsOpen] = useState(false);
  const dropupRef = useRef(null);

  // Fechar dropup ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropupRef.current && !dropupRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Dados do modelo selecionado atualmente
  const currentModelData = providersData?.[selectedProvider]?.[selectedModel];
  let currentDisplayName = selectedModel || 'Selecione um Modelo';
  let currentInputType = 'text';

  if (typeof currentModelData === 'object' && currentModelData !== null && !Array.isArray(currentModelData)) {
    currentDisplayName = currentModelData.name || selectedModel;
    currentInputType = currentModelData.input_type || 'text';
  } else if (Array.isArray(currentModelData)) {
    currentDisplayName = currentModelData[0];
  }

  const providerEntries = Object.entries(providersData || {});

  return (
    <div className="relative inline-block" ref={dropupRef}>
      {/* Botão Pill Dropup (Preservado conforme edição manual do usuário) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-none text-[#ECDFCC] px-3 py-1.5 rounded-xl hover:scale-102 transition-transform text-xs cursor-pointer"
      >
        <Sparkles className="w-3.5 h-3.5 text-[#697565]" />
        <span className="font-semibold">{currentDisplayName}</span>
        <span className="text-[10px] text-[#9C9589] font-mono hidden sm:inline">({selectedProvider})</span>
        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono font-semibold bg-[#697565]/20 text-[#ECDFCC] border border-[#697565]/30">
          {currentInputType}
        </span>
        <ChevronDown 
          className={`w-3.5 h-3.5 text-[#9C9589] ml-1 transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#ECDFCC]' : 'rotate-0'}`} 
        />
      </button>

      {/* Menu Dropup (Expande para cima com Animação de Entrada e Saída Suave) */}
      <div 
        className={`absolute bottom-full left-0 mb-2 w-72 max-h-80 overflow-y-auto bg-[#181C14] border border-[#3C3D37] rounded-2xl shadow-2xl p-2.5 z-50 backdrop-blur-xl space-y-4 origin-bottom transition-all duration-300 ease-in-out transform ${
          isOpen 
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' 
            : 'opacity-0 scale-90 translate-y-2 pointer-events-none'
        }`}
      >
        <div className="px-2 py-1 text-[10px] uppercase font-bold text-[#9C9589] tracking-wider border-b border-[#3C3D37]/60">
          Modelos de IA Disponíveis
        </div>

        {providerEntries.map(([pName, modelsDict]) => {
          const modelEntries = Object.entries(modelsDict || {});
          if (modelEntries.length === 0) return null;

          return (
            <div key={pName} className="space-y-2">
              {/* Cabeçalho do Provedor com estilização de IDE */}
              <div className="flex items-center gap-1.5 px-2 pt-1 text-[10px] font-mono font-bold uppercase tracking-wider text-[#697565] border-b border-[#3C3D37]/40 pb-1">
                <Cpu className="w-3 h-3 text-[#697565]" />
                <span>{pName}</span>
              </div>

              {/* Lista de Modelos do Provedor (Preservado conforme edição manual do usuário) */}
              <div className="space-y-1">
                {modelEntries.map(([mId, mData]) => {
                  let displayName = mId;
                  let inputType = 'text';

                  if (typeof mData === 'object' && mData !== null && !Array.isArray(mData)) {
                    displayName = mData.name || mId;
                    inputType = mData.input_type || 'text';
                  } else if (Array.isArray(mData)) {
                    displayName = mData[0];
                  }

                  const isSelected = selectedProvider === pName && selectedModel === mId;

                  return (
                    <div
                      key={mId}
                      onClick={() => {
                        setSelectedProvider(pName);
                        setSelectedModel(mId);
                        setIsOpen(false);
                      }}
                      className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[#697565]/30 border border-[#697565] text-[#ECDFCC] hover:scale-102 transition-transform'
                          : 'bg-none hover:scale-102 transition-transform text-[#9C9589] hover:text-[#ECDFCC]'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <span className="font-medium truncate text-[#ECDFCC]">{displayName}</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-[#181C14] text-[#9C9589] border border-[#4A4B44] shrink-0">
                          {inputType}
                        </span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#4CAF50] shrink-0" />}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
