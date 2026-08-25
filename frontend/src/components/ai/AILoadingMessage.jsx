import React, { useState, useEffect } from 'react';
import { Bot, Sparkles } from 'lucide-react';

const LOADING_PHRASES = [
  "Analisando seus dados financeiros...",
  "Consultando lançamentos no banco de dados...",
  "Calculando estatísticas e saldos...",
  "Processando solicitação com a IA...",
  "Organizando informações para você...",
  "Verificando categorias e parcelamentos...",
  "Formando resposta inteligente..."
];

export const AILoadingMessage = () => {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setPhraseIndex((prevIndex) => {
          let nextIndex;
          do {
            nextIndex = Math.floor(Math.random() * LOADING_PHRASES.length);
          } while (nextIndex === prevIndex && LOADING_PHRASES.length > 1);
          return nextIndex;
        });
        setFade(true);
      }, 200);
    }, 2200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex gap-3 mb-4 flex-row items-start animate-fadeIn">
      {/* Bot Icon */}
      <div className="w-8 h-8 rounded-full bg-[#3C3D37] border border-[#4A4B44] flex items-center justify-center text-[#ECDFCC] shrink-0 shadow-md">
        <Bot className="w-4 h-4 text-[#697565] animate-pulse" />
      </div>

      {/* Loading Bubble */}
      <div className="bg-[#2A2E24] text-[#ECDFCC] rounded-2xl rounded-tl-none border border-[#3C3D37] p-3.5 text-xs shadow-lg flex items-center gap-2.5 max-w-[85%]">
        <Sparkles className="w-4 h-4 text-[#697565] animate-spin shrink-0" />
        <span
          className={`transition-opacity duration-300 font-medium ${
            fade ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {LOADING_PHRASES[phraseIndex]}
        </span>
      </div>
    </div>
  );
};
