import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

export const CustomDatePicker = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);

  // Data atual selecionada ou hoje
  const selectedDate = value ? new Date(value + 'T00:00:00') : new Date();
  
  // Mes e Ano visualizados no calendario
  const [viewDate, setViewDate] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  const [slideDirection, setSlideDirection] = useState('animate-calendar-right');

  useEffect(() => {
    if (value) {
      const d = new Date(value + 'T00:00:00');
      setViewDate(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  }, [value]);

  // Fechar popover ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const prevMonth = () => {
    setSlideDirection('animate-calendar-left');
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setSlideDirection('animate-calendar-right');
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  // Gerar dias do mes
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const daysGrid = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    daysGrid.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    daysGrid.push(new Date(year, month, d));
  }

  const handleSelectDay = (dateObj) => {
    if (!dateObj) return;
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    onChange(dateStr);
    setIsOpen(false);
  };

  const formattedDisplay = selectedDate.toLocaleDateString('pt-BR');

  const isToday = (dObj) => {
    if (!dObj) return false;
    const today = new Date();
    return (
      dObj.getDate() === today.getDate() &&
      dObj.getMonth() === today.getMonth() &&
      dObj.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (dObj) => {
    if (!dObj) return false;
    return (
      dObj.getDate() === selectedDate.getDate() &&
      dObj.getMonth() === selectedDate.getMonth() &&
      dObj.getFullYear() === selectedDate.getFullYear()
    );
  };

  return (
    <div className="relative w-full" ref={popoverRef}>
      {/* Input Display Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-[#181C14] text-[#ECDFCC] text-xs p-3 rounded-2xl border border-[#3C3D37] hover:border-[#697565] flex items-center justify-between gap-2 transition-all cursor-pointer shadow-inner"
      >
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-[#697565]" />
          <span className="font-semibold">{formattedDisplay}</span>
        </div>
        <span className="text-[10px] text-[#9C9589] font-mono">Alterar</span>
      </button>

      {/* Popover Calendar Grid */}
      <div
        className={`absolute left-0 top-full mt-2 w-72 bg-[#181C14] border border-[#3C3D37] rounded-2xl shadow-2xl p-4 z-50 backdrop-blur-xl origin-top transition-all duration-300 ease-in-out transform overflow-hidden ${
          isOpen
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
        }`}
      >
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-3 border-b border-[#3C3D37] pb-2 select-none">
          <button
            type="button"
            onClick={prevMonth}
            className="p-1.5 rounded-xl hover:bg-[#3C3D37] text-[#9C9589] hover:text-[#ECDFCC] transition-all active:scale-90 cursor-pointer"
            title="Mês Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <span key={`header-${year}-${month}`} className={`text-xs font-bold text-[#ECDFCC] ${slideDirection}`}>
            {monthNames[month]} {year}
          </span>
          
          <button
            type="button"
            onClick={nextMonth}
            className="p-1.5 rounded-xl hover:bg-[#3C3D37] text-[#9C9589] hover:text-[#ECDFCC] transition-all active:scale-90 cursor-pointer"
            title="Próximo Mês"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-mono text-[#9C9589] mb-2 font-bold select-none">
          {dayNames.map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>

        {/* Calendar Days Animated Container */}
        <div key={`grid-${year}-${month}`} className={`grid grid-cols-7 gap-1 text-center ${slideDirection}`}>
          {daysGrid.map((dateObj, idx) => {
            if (!dateObj) {
              return <div key={`empty-${idx}`} className="h-8" />;
            }
            const active = isSelected(dateObj);
            const today = isToday(dateObj);

            return (
              <button
                key={dateObj.toISOString()}
                type="button"
                onClick={() => handleSelectDay(dateObj)}
                className={`h-8 rounded-xl text-xs font-medium flex items-center justify-center transition-all cursor-pointer ${
                  active
                    ? 'bg-[#697565] text-[#ECDFCC] font-bold shadow-md scale-105'
                    : today
                    ? 'bg-[#3C3D37] text-[#697565] font-bold border border-[#697565]/40'
                    : 'text-[#ECDFCC]/80 hover:bg-[#3C3D37]/60 hover:text-[#ECDFCC]'
                }`}
              >
                {dateObj.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
