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
