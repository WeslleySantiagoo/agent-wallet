import React, { useState, useRef } from 'react';
import { X, Bot, RefreshCw, Plus, History, Trash2, MessageSquare } from 'lucide-react';
import { useAIChat } from '../../context/AIChatContext';
import { AIProviderSelector } from './AIProviderSelector';
import { AIMessage } from './AIMessage';
import { AIChatInputBar } from './AIChatInputBar';
import { sendAIChat } from '../../services/api';

export const AISidebar = () => {
  const {
    isChatOpen, closeChat, messages, setMessages,
    selectedProvider, selectedModel, activeSessionId,
    sessionsList, createNewSession, switchSession, deleteSession,
    refreshSessionData
  } = useAIChat();

  const [isLoading, setIsLoading] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(380);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const isResizing = useRef(false);

  const handleMouseDown = () => {
    isResizing.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (!isResizing.current) return;
    const newWidth = window.innerWidth - e.clientX;
    if (newWidth >= 320 && newWidth <= 650) {
      setSidebarWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

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

  if (!isChatOpen) return null;

  return (
    <aside
      style={{ width: `${sidebarWidth}px` }}
      className="hidden md:flex flex-col fixed right-0 top-16 bottom-0 bg-[#1E2218] border-l border-[#3C3D37] z-30 shadow-2xl transition-all duration-300"
    >
      {/* Drag handle for resizing */}
      <div
        onMouseDown={handleMouseDown}
        className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-[#697565]/50 transition-colors z-40"
      />

      {/* Header */}
      <div className="p-3.5 border-b border-[#3C3D37] flex items-center justify-between bg-[#181C14]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#697565]/30 border border-[#697565] flex items-center justify-center text-[#ECDFCC]">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#ECDFCC]">ParseFin IA</h3>
            <p className="text-[10px] text-[#9C9589]">Histórico salvo no SQLite</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
            title="Histórico de Conversas"
            className={`p-1.5 rounded-lg border transition-colors ${
              showHistoryDrawer ? 'bg-[#697565] border-[#697565] text-[#ECDFCC]' : 'bg-[#3C3D37] border-[#4A4B44] text-[#ECDFCC]/70 hover:text-[#ECDFCC]'
            }`}
          >
            <History className="w-4 h-4" />
          </button>
          <button
            onClick={createNewSession}
            title="Nova Conversa"
            className="p-1.5 rounded-lg bg-[#697565] border border-[#697565] text-[#ECDFCC] hover:bg-[#7A8674] transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={closeChat}
            className="p-1.5 rounded-lg text-[#ECDFCC]/70 hover:text-[#ECDFCC] hover:bg-[#3C3D37] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Provider Selector Row */}
      <div className="p-2.5 border-b border-[#3C3D37] bg-[#181C14]/50">
        <AIProviderSelector />
      </div>

      {/* Sessions History Drawer (Collapsible) */}
      {showHistoryDrawer && (
        <div className="bg-[#181C14] border-b border-[#3C3D37] p-3 max-h-48 overflow-y-auto space-y-1.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-[#9C9589]">Sessões Salvas no SQLite</span>
            <button
              onClick={createNewSession}
              className="text-[10px] font-semibold text-[#697565] hover:underline flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Nova Conversa
            </button>
          </div>
          {sessionsList.map(s => (
            <div
              key={s.id}
              onClick={() => { switchSession(s.id); setShowHistoryDrawer(false); }}
              className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition-colors ${
                s.id === activeSessionId
                  ? 'bg-[#697565]/30 border border-[#697565] text-[#ECDFCC]'
                  : 'bg-[#3C3D37]/50 text-[#ECDFCC]/80 hover:bg-[#3C3D37]'
              }`}
            >
              <div className="flex items-center gap-2 truncate pr-2">
                <MessageSquare className="w-3.5 h-3.5 shrink-0 text-[#697565]" />
                <span className="truncate">{s.title}</span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
                className="text-[#E57373] p-1 rounded hover:bg-[#E57373]/10"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-10 text-xs text-[#9C9589] space-y-2">
            <Bot className="w-8 h-8 mx-auto text-[#697565]" />
            <p className="font-semibold text-[#ECDFCC]">Nenhuma mensagem nesta conversa.</p>
            <p>Digite algo para começar o registro ou tire dúvidas!</p>
          </div>
        ) : (
          messages.map(msg => (
            <AIMessage key={msg.id} msg={msg} />
          ))
        )}
        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-[#9C9589] p-3 bg-[#2A2E24] rounded-2xl w-fit">
            <RefreshCw className="w-4 h-4 animate-spin text-[#697565]" />
            <span>Processando solicitação...</span>
          </div>
        )}
      </div>

      {/* Dynamic Input Bar (text / audio / multimodal) */}
      <AIChatInputBar onSend={handleSendMessage} isLoading={isLoading} />
    </aside>
  );
};
