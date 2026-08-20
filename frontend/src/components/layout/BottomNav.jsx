import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Receipt, Bot, Settings } from 'lucide-react';
import { useAIChat } from '../../context/AIChatContext';

export const BottomNav = () => {
  const location = useLocation();
  const { toggleChat, isChatOpen } = useAIChat();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#3C3D37]/95 backdrop-blur-md border-t border-[#4A4B44] flex items-center justify-around px-2 z-40">
      <Link
        to="/"
        className={`flex flex-col items-center justify-center gap-1 w-14 h-12 rounded-xl ${
          location.pathname === '/' ? 'text-[#697565]' : 'text-[#ECDFCC]/70'
        }`}
      >
        <LayoutDashboard className="w-5 h-5" />
        <span className="text-[10px] font-medium">Início</span>
      </Link>

      <Link
        to="/transactions"
        className={`flex flex-col items-center justify-center gap-1 w-14 h-12 rounded-xl ${
          location.pathname === '/transactions' ? 'text-[#697565]' : 'text-[#ECDFCC]/70'
        }`}
      >
        <Receipt className="w-5 h-5" />
        <span className="text-[10px] font-medium">Extrato</span>
      </Link>

      {/* AI Chat Central Button */}
      <button
        onClick={toggleChat}
        className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-xs transition-all ${
          isChatOpen
            ? 'bg-[#697565] text-[#ECDFCC] shadow-lg shadow-[#697565]/40 scale-105'
            : 'bg-[#697565]/90 text-[#ECDFCC] hover:bg-[#697565]'
        }`}
      >
        <Bot className="w-4 h-4 animate-bounce" />
        <span>Pergunte à IA</span>
      </button>

      <Link
        to="/settings"
        className={`flex flex-col items-center justify-center gap-1 w-14 h-12 rounded-xl ${
          location.pathname === '/settings' ? 'text-[#697565]' : 'text-[#ECDFCC]/70'
        }`}
      >
        <Settings className="w-5 h-5" />
        <span className="text-[10px] font-medium">Config</span>
      </Link>
    </div>
  );
};
