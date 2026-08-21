import React from 'react';
import { TopNav } from './TopNav';
import { BottomNav } from './BottomNav';
import { AISidebar } from '../ai/AISidebar';
import { AIFullscreen } from '../ai/AIFullscreen';
import { useAIChat } from '../../context/AIChatContext';

export const Layout = ({ children }) => {
  const { isChatOpen } = useAIChat();

  return (
    <div className="min-h-screen bg-[#181C14] text-[#ECDFCC] flex flex-col antialiased">
      <TopNav />

      {/* Main Container */}
      <main className={`flex-1 transition-all duration-300 pb-20 md:pb-6 p-4 md:p-6 ${
        isChatOpen ? 'md:mr-[380px]' : ''
      }`}>
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      <AISidebar />
      <AIFullscreen />
      <BottomNav />
    </div>
  );
};
