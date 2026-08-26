/**
 * Formata uma string no formato YYYY-MM-DD ou objeto Date para DD/MM/YYYY
 * sem sofrer deslocamentos por fusos horários (timezones).
 */
export const formatDisplayDate = (dateVal) => {
  if (!dateVal) return '';

  if (typeof dateVal === 'string') {
    const cleanStr = dateVal.split('T')[0];
    const parts = cleanStr.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    }
  }

  try {
    const d = new Date(dateVal);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (e) {
    return String(dateVal);
  }
};

/**
 * Retorna uma data no formato "Hoje", "Ontem", "Segunda-feira" ou "DD de MMM."
 * baseando-se no YYYY-MM-DD
 */
export const formatRelativeDate = (dateStr) => {
  if (!dateStr) return '';
  
  const cleanStr = typeof dateStr === 'string' ? dateStr.split('T')[0] : '';
  if (!cleanStr) return '';
  
  const parts = cleanStr.split('-');
  if (parts.length !== 3) return formatDisplayDate(dateStr);
  
  const [year, month, day] = parts.map(Number);
  const targetDate = new Date(year, month - 1, day);
  
  const today = new Date();
  const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  const diffTime = todayLocal - targetDate;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Ontem';
  
  // Se estiver nos últimos 7 dias (excluindo hoje e ontem), exibe o dia da semana
  if (diffDays >= 2 && diffDays <= 6) {
    const weekdays = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    return weekdays[targetDate.getDay()];
  }
  
  const months = ['jan.', 'fev.', 'mar.', 'abr.', 'maio', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'];
  const monthName = months[targetDate.getMonth()];
  return `${day} de ${monthName}`;
};

/**
 * Retorna a data no formato simplificado "DD de MMM."
 */
export const formatShortDate = (dateStr) => {
  if (!dateStr) return '';
  const cleanStr = typeof dateStr === 'string' ? dateStr.split('T')[0] : '';
  if (!cleanStr) return '';
  
  const parts = cleanStr.split('-');
  if (parts.length !== 3) return formatDisplayDate(dateStr);
  
  const [year, month, day] = parts.map(Number);
  const targetDate = new Date(year, month - 1, day);
  
  const months = ['jan.', 'fev.', 'mar.', 'abr.', 'maio', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'];
  return `${day} de ${months[targetDate.getMonth()]}`;
};
