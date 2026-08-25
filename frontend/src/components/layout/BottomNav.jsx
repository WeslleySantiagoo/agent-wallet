import React, { useRef, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Wallet, CreditCard, Receipt } from 'lucide-react';

export const BottomNav = () => {
  const location = useLocation();

  const navItems = [
    { label: 'Início', path: '/', icon: LayoutDashboard },
    { label: 'Contas', path: '/accounts', icon: Wallet },
    { label: 'Cartões', path: '/credit-cards', icon: CreditCard },
    { label: 'Extrato', path: '/transactions', icon: Receipt },
  ];

  const tabRefs = useRef([]);
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0, opacity: 0 });

  const activeIndex = navItems.findIndex(item => item.path === location.pathname);
  const safeIndex = activeIndex >= 0 ? activeIndex : 0;

  const updatePillPosition = () => {
    const activeTabEl = tabRefs.current[safeIndex];
    if (activeTabEl) {
      setPillStyle({
        left: activeTabEl.offsetLeft,
        width: activeTabEl.offsetWidth,
        opacity: activeIndex >= 0 ? 1 : 0
      });
    }
  };

  useEffect(() => {
    updatePillPosition();
    window.addEventListener('resize', updatePillPosition);
    return () => window.removeEventListener('resize', updatePillPosition);
  }, [location.pathname, safeIndex, activeIndex]);

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#3C3D37]/95 backdrop-blur-md border-t border-[#4A4B44] flex items-center justify-between px-2 z-30 pb-safe">
      <nav className="relative flex items-center justify-between w-full h-full">
        {/* Pílula Deslizante */}
        <div
          className="absolute top-2 bottom-2 bg-[#697565] rounded-xl shadow-md transition-all duration-300 ease-out pointer-events-none"
          style={{
            left: `${pillStyle.left}px`,
            width: `${pillStyle.width}px`,
            opacity: pillStyle.opacity
          }}
        />

        {navItems.map((item, idx) => {
          const Icon = item.icon;
          const isActive = idx === safeIndex && activeIndex !== -1;
          return (
            <Link
              key={item.path}
              ref={el => tabRefs.current[idx] = el}
              to={item.path}
              className={`relative z-10 flex flex-col items-center justify-center flex-1 h-full gap-1 rounded-xl transition-colors duration-200 cursor-pointer ${
                isActive
                  ? 'text-[#ECDFCC] font-bold'
                  : 'text-[#ECDFCC]/70 hover:text-[#ECDFCC]'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
