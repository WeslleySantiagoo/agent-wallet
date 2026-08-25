import React, { useState, useEffect } from 'react';
import { Bot, Sparkles } from 'lucide-react';

const LOADING_PHRASES = [
  "Analisando seus dados financeiros...",
  "Consultando lançamentos no banco de dados...",
  "Calculando estatísticas e saldos...",
  "Processando solicitação com a IA...",
  "Organizando informações para você...",
  "Verificando categorias e parcelamentos...",
  "Formando resposta inteligente...",
  "Buscando informações relevantes...",
  "Conferindo receitas e despesas...",
  "Analisando seu histórico financeiro...",
  "Identificando padrões nos seus lançamentos...",
  "Calculando totais e médias...",
  "Verificando movimentações recentes...",
  "Agrupando despesas por categoria...",
  "Analisando seus gastos...",
  "Conferindo seus recebimentos...",
  "Processando seus lançamentos...",
  "Cruzando informações financeiras...",
  "Preparando uma análise detalhada...",
  "Interpretando seus dados financeiros...",
  "Organizando receitas e despesas...",
  "Verificando pagamentos pendentes...",
  "Analisando parcelas e vencimentos...",
  "Calculando seu saldo atual...",
  "Conferindo valores e datas...",
  "Buscando tendências nos seus gastos...",
  "Identificando movimentações importantes...",
  "Preparando informações financeiras...",
  "Resumindo seus dados...",
  "Montando uma visão geral das suas finanças...",
  "Analisando categorias de gastos...",
  "Verificando compromissos financeiros...",
  "Processando cálculos financeiros...",
  "Comparando períodos e movimentações...",
  "Organizando os resultados...",
  "Selecionando informações relevantes...",
  "Gerando insights financeiros...",
  "Interpretando suas movimentações...",
  "Preparando sua resposta...",
  "Consultando seus registros...",
  "Analisando os números...",
  "Conferindo os cálculos...",
  "Estruturando a análise...",
  "Transformando dados em informações úteis...",
  "Identificando pontos importantes...",
  "Consolidando seus dados financeiros...",
  "Finalizando os cálculos...",
  "Preparando os últimos detalhes...",
  "Gerando uma resposta personalizada...",
  "Quase tudo pronto..."
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
