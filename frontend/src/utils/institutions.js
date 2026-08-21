export const PREDEFINED_INSTITUTIONS = [
  {
    id: 'nubank',
    name: 'Nubank',
    defaultAccountName: 'Nubank Corrente',
    logo: '/assets/logos/logo-nubank.svg',
    color: '#8A05BE'
  },
  {
    id: 'inter',
    name: 'Banco Inter',
    defaultAccountName: 'Inter Corrente',
    logo: '/assets/logos/logo-banco-Inter.svg',
    color: '#FF7A00'
  },
  {
    id: 'banco-do-brasil',
    name: 'Banco do Brasil',
    defaultAccountName: 'BB Corrente',
    logo: '/assets/logos/banco-do-brasil.svg',
    color: '#FBF800'
  },
  {
    id: 'mercado-pago',
    name: 'Mercado Pago',
    defaultAccountName: 'Mercado Pago',
    logo: '/assets/logos/mercado-pago.svg',
    color: '#00A8E8'
  },
  {
    id: 'carteira',
    name: 'Carteira (Dinheiro Físico)',
    defaultAccountName: 'Carteira Física',
    logo: '/assets/logos/wallet.svg',
    color: '#4CAF50'
  },
  {
    id: 'outro',
    name: 'Outro (Personalizado)',
    defaultAccountName: '',
    logo: '/assets/logos/logo-generic-bank.svg',
    color: '#697565'
  }
];

export const getInstitutionLogo = (institutionName = '') => {
  if (!institutionName) return '/assets/logos/logo-generic-bank.svg';
  const norm = String(institutionName).toLowerCase().trim();
  
  if (norm.includes('nubank') || norm.includes('nu')) return '/assets/logos/logo-nubank.svg';
  if (norm.includes('inter')) return '/assets/logos/logo-banco-Inter.svg';
  if (norm.includes('brasil') || norm.includes('bb')) return '/assets/logos/banco-do-brasil.svg';
  if (norm.includes('mercado') || norm.includes('pago')) return '/assets/logos/mercado-pago.svg';
  if (
    norm.includes('carteira') ||
    norm.includes('dinheiro') ||
    norm.includes('fisico') ||
    norm.includes('físico') ||
    norm.includes('wallet') ||
    norm.includes('espécie') ||
    norm.includes('especie')
  ) return '/assets/logos/wallet.svg';
  
  return '/assets/logos/logo-generic-bank.svg';
};
