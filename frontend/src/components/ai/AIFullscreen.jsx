import React, { useState } from 'react';
import { ArrowLeft, Bot, RefreshCw, Plus, History, Trash2, MessageSquare } from 'lucide-react';
import { useAIChat } from '../../context/AIChatContext';
import { AIProviderSelector } from './AIProviderSelector';
import { AIMessage } from './AIMessage';
import { AIChatInputBar } from './AIChatInputBar';
import { sendAIChat } from '../../services/api';

export const AIFullscreen = () => {
  const {
    isChatOpen, closeChat, messages, setMessages,
    selectedProvider, selectedModel, activeSessionId,
    sessionsList, createNewSession, switchSession, deleteSession,
    refreshSessionData
  } = useAIChat();

  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  if (!isChatOpen) return null;

  const handleSendMessage = async (textToSend) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      await sendAIChat(textToSend.trim(), selectedProvider, selectedModel, activeSessionId);
      await refreshSessionData();
    } catch (err) {
      const errorMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: `Erro ao comunicar com a IA: ${err.response?.data?.detail || err.message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="md:hidden fixed inset-0 bg-[#181C14] z-50 flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-[#3C3D37] flex items-center justify-between bg-[#1E2218]">
        <button
          onClick={closeChat}
          className="flex items-center gap-1.5 text-xs text-[#ECDFCC] bg-[#3C3D37] px-3 py-1.5 rounded-xl font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar</span>
        </button>

        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-[#697565]" />
          <span className="text-sm font-bold text-[#ECDFCC]">ParseFin IA</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="p-1.5 rounded-lg bg-[#3C3D37] text-[#ECDFCC]"
          >
            <History className="w-4 h-4" />
          </button>
          <button
            onClick={createNewSession}
            className="p-1.5 rounded-lg bg-[#697565] text-[#ECDFCC]"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Provider Selector Row */}
      <div className="p-2 border-b border-[#3C3D37] bg-[#181C14]">
        <AIProviderSelector />
      </div>

      {/* History Drawer Mobile */}
      {showHistory && (
        <div className="bg-[#181C14] border-b border-[#3C3D37] p-3 max-h-48 overflow-y-auto space-y-1.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-[#9C9589]">Sessões Salvas</span>
            <button onClick={createNewSession} className="text-[10px] text-[#697565] font-bold">
              + Nova Conversa
            </button>
          </div>
          {sessionsList.map(s => (
            <div
              key={s.id}
              onClick={() => { switchSession(s.id); setShowHistory(false); }}
              className={`flex items-center justify-between p-2.5 rounded-xl text-xs ${
                s.id === activeSessionId ? 'bg-[#697565]/30 border border-[#697565] text-[#ECDFCC]' : 'bg-[#3C3D37]/50 text-[#ECDFCC]/80'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <MessageSquare className="w-3.5 h-3.5 text-[#697565]" />
                <span className="truncate">{s.title}</span>
              </div>
              <button onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }} className="text-[#E57373] p-1">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map(msg => (
          <AIMessage key={msg.id} msg={msg} />
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-[#9C9589] p-3 bg-[#2A2E24] rounded-2xl w-fit">
            <RefreshCw className="w-4 h-4 animate-spin text-[#697565]" />
            <span>Processando...</span>
          </div>
        )}
      </div>

      {/* Dynamic Input Bar */}
      <AIChatInputBar onSend={handleSendMessage} isLoading={isLoading} />
    </div>
  );
};
