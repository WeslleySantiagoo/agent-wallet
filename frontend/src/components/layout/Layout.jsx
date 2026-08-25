import React from 'react';
import { TopNav } from './TopNav';
import { BottomNav } from './BottomNav';
import { AISidebar } from '../ai/AISidebar';
import { AIFullscreen } from '../ai/AIFullscreen';
import { useAIChat } from '../../context/AIChatContext';
import { Wallet, Bot, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

const MobileHeader = () => {
  const { toggleChat } = useAIChat();

  return (
    <header className="md:hidden h-14 bg-[#181C14] border-b border-[#3C3D37] px-4 flex items-center justify-between sticky top-0 z-40">
      {/* Brand Logo */}
      <Link to="/" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-[#697565] flex items-center justify-center text-[#ECDFCC] shadow-md shadow-[#697565]/20">
          <Wallet className="w-4 h-4" />
        </div>
        <span className="text-lg font-bold tracking-tight text-[#ECDFCC]">Parse<span className="text-[#697565]">Fin</span></span>
      </Link>

      {/* Right Controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={toggleChat}
          className="p-2 rounded-xl text-[#ECDFCC]/80 hover:text-[#ECDFCC] hover:bg-[#3C3D37] transition-colors"
        >
          <Bot className="w-5 h-5" />
        </button>
        <Link
          to="/settings"
          className="p-2 rounded-xl text-[#ECDFCC]/80 hover:text-[#ECDFCC] hover:bg-[#3C3D37] transition-colors"
        >
          <Settings className="w-5 h-5" />
        </Link>
      </div>
    </header>
  );
};

export const Layout = ({ children }) => {
  const { isChatOpen } = useAIChat();

  return (
    <div className="min-h-screen bg-[#181C14] text-[#ECDFCC] flex flex-col antialiased">
      <TopNav />
      <MobileHeader />

      {/* Main Container */}
      <main className={`flex-1 transition-all duration-300 pb-20 md:pb-6 p-4 md:p-6 ${
        isChatOpen ? 'md:mr-[380px]' : ''
      }`}>
        <div className="max-w-7xl mx-auto relative h-full min-h-[80vh]">
          {children}
        </div>
      </main>

      <AISidebar />
      <AIFullscreen />
      <BottomNav />
    </div>
  );
};
