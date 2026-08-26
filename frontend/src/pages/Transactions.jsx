import React, { useEffect, useState, useMemo } from 'react';
import { getTransactions, deleteTransaction, getCategories, getAccounts, getCreditCards } from '../services/api';
import { Receipt, RefreshCw, Plus, Search, SlidersHorizontal, Tag } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { getInstitutionLogo } from '../utils/institutions';
import { formatRelativeDate, formatShortDate } from '../utils/dateUtils';

import { CreateTransactionModal } from '../components/transactions/CreateTransactionModal';
import { TransactionsFilterModal } from '../components/transactions/TransactionsFilterModal';

export const Transactions = () => {
  const { toast } = useToast();
  const [txs, setTxs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [creditCards, setCreditCards] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [quickFilter, setQuickFilter] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState({
    period: 'Mês atual',
    banks: [],
    cards: [],
    categories: [],
    sortBy: 'Mais recentes',
    origins: [],
    showHidden: false,
    customStartDate: '',
    customEndDate: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [txData, catData, accData, cardsData] = await Promise.all([
        getTransactions(),
        getCategories(),
        getAccounts(),
        getCreditCards()
      ]);
      setTxs(txData);
      setCategories(catData);
      setAccounts(accData);
      setCreditCards(cardsData);
    } catch (e) {
      console.warn(e);
      toast.error("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEdit = (t) => {
    setEditingTx(t);
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingTx(null);
  };

  const handleDeleteTransaction = async (id) => {
    try {
      await deleteTransaction(id);
      toast.success("Transação excluída com sucesso.");
      loadData();
      setShowCreateModal(false);
      setEditingTx(null);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao excluir transação.");
    }
  };

  const getCategory = (catId) => categories.find(c => c.id === catId);
  
  const getCategoryIcon = (iconName) => {
    if (!iconName) return <Tag className="w-5 h-5" />;
    const IconComponent = Icons[iconName] || Icons.Tag;
    return <IconComponent className="w-5 h-5" />;
  };

  const getCategoryColor = (color) => color || '#9C9589';

  const isMatchingSearch = (tx) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const desc = (tx.description || '').toLowerCase();
    const cat = getCategory(tx.category_id)?.name?.toLowerCase() || '';
    const inst = (tx.institution || tx.account_name || '').toLowerCase();
    return desc.includes(term) || cat.includes(term) || inst.includes(term);
  };

  const isMatchingFilters = (tx) => {
    if (!isMatchingSearch(tx)) return false;
    
    // Filtros Rápidos (Chips)
    if (quickFilter === 'Entradas' && tx.type !== 'INCOME') return false;
    if (quickFilter === 'Saídas' && tx.type !== 'EXPENSE') return false;
    if (quickFilter === 'Pagamentos' && tx.type !== 'INVOICE_PAYMENT') return false;
    if (quickFilter === 'Cartão' && tx.type !== 'CARD_PURCHASE') return false;

    // Filtros Avançados (Modal)
    if (activeFilters.banks && activeFilters.banks.length > 0) {
      if (!activeFilters.banks.includes(tx.account_id)) return false;
    }
    if (activeFilters.cards && activeFilters.cards.length > 0) {
      if (!activeFilters.cards.includes(tx.credit_card_id)) return false;
    }
    if (activeFilters.categories && activeFilters.categories.length > 0) {
      if (!activeFilters.categories.includes(tx.category_id)) return false;
    }

    if (activeFilters.period) {
      const txDateStr = tx.date.split('T')[0];
      const txParts = txDateStr.split('-');
      if (txParts.length === 3) {
        const txDate = new Date(txParts[0], txParts[1] - 1, txParts[2]);
        const today = new Date();
        const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        if (activeFilters.period === 'Personalizado') {
          if (activeFilters.customStartDate) {
            const startParts = activeFilters.customStartDate.split('-');
            const startDate = new Date(startParts[0], startParts[1] - 1, startParts[2]);
            if (txDate < startDate) return false;
          }
          if (activeFilters.customEndDate) {
            const endParts = activeFilters.customEndDate.split('-');
            const endDate = new Date(endParts[0], endParts[1] - 1, endParts[2]);
            if (txDate > endDate) return false;
          }
        } else {
          const diffTime = todayLocal - txDate;
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

          if (activeFilters.period === 'Hoje' && diffDays !== 0) return false;
          if (activeFilters.period === 'Ontem' && diffDays !== 1) return false;
          if (activeFilters.period === 'Últimos 7 dias' && (diffDays < 0 || diffDays > 7)) return false;
          if (activeFilters.period === 'Últimos 15 dias' && (diffDays < 0 || diffDays > 15)) return false;
          if (activeFilters.period === 'Mês atual' && (txDate.getMonth() !== todayLocal.getMonth() || txDate.getFullYear() !== todayLocal.getFullYear())) return false;
          if (activeFilters.period === 'Mês passado') {
            const lastMonth = new Date(todayLocal);
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            if (txDate.getMonth() !== lastMonth.getMonth() || txDate.getFullYear() !== lastMonth.getFullYear()) return false;
          }
          if (activeFilters.period === 'Este ano' && txDate.getFullYear() !== todayLocal.getFullYear()) return false;
          if (activeFilters.period === 'Ano passado' && txDate.getFullYear() !== todayLocal.getFullYear() - 1) return false;
        }
      }
    }
    
    return true;
  };

  const handleQuickFilter = (type) => {
    setQuickFilter(prev => prev === type ? '' : type);
  };

  const groupedAndFilteredTxs = useMemo(() => {
    let filtered = txs.filter(isMatchingFilters);
    
    filtered.sort((a, b) => {
      if (activeFilters.sortBy === 'Mais recentes') {
        return new Date(b.date) - new Date(a.date);
      } else if (activeFilters.sortBy === 'Mais antigas') {
        return new Date(a.date) - new Date(b.date);
      } else if (activeFilters.sortBy === 'Maior valor') {
        return b.amount - a.amount;
      } else if (activeFilters.sortBy === 'Menor valor') {
        return a.amount - b.amount;
      }
      return 0;
    });

    const groups = {};
    filtered.forEach(tx => {
      const dateKey = tx.date;
      if (!groups[dateKey]) {
        groups[dateKey] = {
          dateStr: dateKey,
          label: formatRelativeDate(dateKey),
          transactions: []
        };
      }
      groups[dateKey].transactions.push(tx);
    });

    return Object.values(groups).sort((a, b) => {
      if (activeFilters.sortBy === 'Mais antigas') {
        return new Date(a.dateStr) - new Date(b.dateStr);
      }
      return new Date(b.dateStr) - new Date(a.dateStr);
    });
  }, [txs, searchTerm, activeFilters, quickFilter, categories]);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#ECDFCC]">Atividades</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditingTx(null);
              setShowCreateModal(true);
            }}
            className="w-10 h-10 rounded-full bg-[#697565] text-[#ECDFCC] shadow-lg flex items-center justify-center hover:bg-[#7A8674] cursor-pointer transition-all"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-[#9C9589]" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 rounded-2xl border border-[#3C3D37] bg-[#181C14] text-sm text-[#ECDFCC] placeholder-[#9C9589] focus:outline-none focus:border-[#697565] transition-colors"
            placeholder="Buscar"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar hide-scrollbar-mobile">
          <button 
            onClick={() => setShowFilterModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#3C3D37] bg-[#181C14] text-[#ECDFCC] text-xs font-medium hover:bg-[#3C3D37]/30 transition-colors whitespace-nowrap"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filtros
          </button>
          
          {['Entradas', 'Saídas', 'Pagamentos', 'Cartão'].map(chip => (
            <button 
              key={chip}
              onClick={() => handleQuickFilter(chip)}
              className={`px-4 py-2 rounded-full border text-xs font-medium transition-colors whitespace-nowrap ${
                quickFilter === chip 
                  ? 'bg-white text-black border-white'
                  : 'border-[#3C3D37] bg-[#181C14] text-[#ECDFCC] hover:bg-[#3C3D37]/30'
              }`}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-[#9C9589] gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-[#697565]" />
          <span>Carregando atividades...</span>
        </div>
      ) : groupedAndFilteredTxs.length === 0 ? (
        <div className="card-glow p-8 text-center border border-[#3C3D37]">
          <Receipt className="w-12 h-12 text-[#697565] mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-[#ECDFCC]">Nenhuma atividade encontrada</h3>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedAndFilteredTxs.map((group) => (
            <div key={group.dateStr} className="space-y-3">
              <h3 className="text-sm font-bold text-white px-1">{group.label}</h3>
              
              <div className="space-y-4">
                {group.transactions.map(t => {
                  const isIncome = t.type === 'INCOME';
                  const instName = t.institution || t.account_name || 'Instituição';
                  const logoUrl = getInstitutionLogo(instName);
                  
                  const category = getCategory(t.category_id);
                  const catName = category ? category.name : 'Outros';
                  const catColor = getCategoryColor(category?.color);

                  return (
                    <div key={t.id} className="flex items-center justify-between px-1 group cursor-pointer" onClick={() => handleEdit(t)}>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div 
                            className="w-11 h-11 rounded-full flex items-center justify-center text-white shadow-sm"
                            style={{ backgroundColor: '#181C14', border: '1px solid #3C3D37' }}
                          >
                            <div style={{ color: catColor }}>
                              {getCategoryIcon(category?.icon)}
                            </div>
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-white flex items-center justify-center shadow-[0_0_0_2px_#101010]">
                            <img 
                              src={logoUrl} 
                              alt={instName} 
                              className="w-3 h-3 object-contain rounded-full" 
                              onError={(e) => { e.target.src = '/assets/logos/logo-generic-bank.svg'; }}
                            />
                          </div>
                        </div>

                        <div>
                          <p className="font-semibold text-sm text-white">{t.description}</p>
                          <p className="text-xs text-[#9C9589] mt-0.5">
                            {formatShortDate(t.date)} • {catName}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className={`font-semibold text-sm ${isIncome ? 'text-[#4CAF50]' : 'text-[#E57373]'}`}>
                          {isIncome ? '+R$ ' : '-R$ '}{Number(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <TransactionsFilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        categories={categories}
        accounts={accounts}
        creditCards={creditCards}
        currentFilters={activeFilters}
        onApply={(filters) => setActiveFilters(filters)}
      />
      
      <CreateTransactionModal
        isOpen={showCreateModal}
        onClose={handleCloseModal}
        onSuccess={loadData}
        transactionToEdit={editingTx}
        onDelete={handleDeleteTransaction}
      />
    </div>
  );
};
