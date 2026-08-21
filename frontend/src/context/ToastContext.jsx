import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const toast = {
    success: (msg, duration) => showToast(msg, 'success', duration),
    error: (msg, duration) => showToast(msg, 'error', duration),
    info: (msg, duration) => showToast(msg, 'info', duration),
  };

  return (
    <ToastContext.Provider value={{ showToast, toast }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none px-2 sm:px-0">
        {toasts.map((t) => {
          let bgClass = 'bg-[#181C14] border-[#3C3D37] text-[#ECDFCC] shadow-lg';
          let icon = <Info className="w-5 h-5 text-[#697565] shrink-0" />;

          if (t.type === 'success') {
            bgClass = 'bg-[#181C14] border-[#4CAF50]/50 text-[#ECDFCC] shadow-[0_0_15px_rgba(76,175,80,0.25)]';
            icon = <CheckCircle2 className="w-5 h-5 text-[#4CAF50] shrink-0" />;
          } else if (t.type === 'error') {
            bgClass = 'bg-[#181C14] border-[#E57373]/50 text-[#ECDFCC] shadow-[0_0_15px_rgba(229,115,115,0.25)]';
            icon = <AlertTriangle className="w-5 h-5 text-[#E57373] shrink-0" />;
          }

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-2xl border ${bgClass} backdrop-blur-md transition-all duration-300 animate-slideInRight`}
            >
              <div className="flex items-center gap-3">
                {icon}
                <p className="text-xs font-medium leading-snug">{t.message}</p>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-[#9C9589] hover:text-[#ECDFCC] p-1 rounded-lg hover:bg-[#3C3D37]/50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast deve ser usado dentro de um ToastProvider');
  }
  return context;
};
