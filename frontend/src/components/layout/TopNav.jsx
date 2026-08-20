import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Wallet, LayoutDashboard, CreditCard, Receipt, Settings, Bot, Bell } from 'lucide-react';
import { useAIChat } from '../../context/AIChatContext';

export const TopNav = () => {
  const location = useLocation();
  const { toggleChat, isChatOpen } = useAIChat();

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Contas', path: '/accounts', icon: Wallet },
    { label: 'Cartões', path: '/credit-cards', icon: CreditCard },
    { label: 'Transações', path: '/transactions', icon: Receipt },
    { label: 'Configurações', path: '/settings', icon: Settings },
  ];

  return (
    <header className="hidden md:flex h-16 bg-[#181C14] border-b border-[#3C3D37] px-6 items-center justify-between sticky top-0 z-40">
      {/* Brand Logo */}
      <Link to="/" className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#697565] flex items-center justify-center text-[#ECDFCC] shadow-lg shadow-[#697565]/20">
          <Wallet className="w-6 h-6" />
        </div>
        <span className="text-xl font-bold tracking-tight text-[#ECDFCC]">Parse<span className="text-[#697565]">Fin</span></span>
      </Link>

      {/* Navigation Tabs */}
      <nav className="flex items-center gap-1 bg-[#3C3D37]/50 p-1.5 rounded-2xl border border-[#3C3D37]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-[#697565] text-[#ECDFCC] shadow-md'
                  : 'text-[#ECDFCC]/70 hover:text-[#ECDFCC] hover:bg-[#3C3D37]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        <button className="p-2.5 rounded-xl bg-[#3C3D37] text-[#ECDFCC]/80 hover:text-[#ECDFCC] hover:bg-[#4A4B44] transition-colors">
          <Bell className="w-5 h-5" />
        </button>

        <button
          onClick={toggleChat}
          className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 border ${
            isChatOpen
              ? 'bg-[#697565] text-[#ECDFCC] border-[#697565] shadow-lg shadow-[#697565]/30'
              : 'bg-[#3C3D37] text-[#ECDFCC] border-[#4A4B44] hover:bg-[#4A4B44]'
          }`}
        >
          <Bot className="w-5 h-5 text-[#ECDFCC]" />
          <span>IA Assistant</span>
          <span className="w-2 h-2 rounded-full bg-[#4CAF50] animate-pulse"></span>
        </button>
      </div>
    </header>
  );
};
