import React, { useEffect, useState } from 'react';
import { getDashboardSummary } from '../services/api';
import { BalanceCard } from '../components/dashboard/BalanceCard';
import { MonthlyExpenseCard } from '../components/dashboard/MonthlyExpenseCard';
import { CreditCardVisual } from '../components/dashboard/CreditCardVisual';
import { EvolutionChart } from '../components/dashboard/EvolutionChart';
import { CreditLimitCard } from '../components/dashboard/CreditLimitCard';
import { InstallmentsCard } from '../components/dashboard/InstallmentsCard';
import { CashFlowCard } from '../components/dashboard/CashFlowCard';
import { RecentTransactions } from '../components/dashboard/RecentTransactions';
import { RefreshCw, Plus } from 'lucide-react';
import { useAIChat } from '../context/AIChatContext';

import { CreateTransactionModal } from '../components/transactions/CreateTransactionModal';

export const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { openChat } = useAIChat();

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const data = await getDashboardSummary();
      setSummary(data);
    } catch (err) {
      console.warn("Erro ao buscar resumo:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-[#9C9589] gap-3">
        <RefreshCw className="w-6 h-6 animate-spin text-[#697565]" />
        <span>Carregando dados financeiros reais...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#ECDFCC] tracking-tight">Visão Geral</h1>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#697565] text-[#ECDFCC] font-semibold text-xs hover:bg-[#7A8674] shadow-lg shadow-[#697565]/20 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Transação</span>
          </button>
        </div>
      </div>

      {/* Modular Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
        <div className="col-span-1 sm:col-span-2 lg:col-span-1">
          <BalanceCard
            totalBalance={summary?.total_balance || 0}
            accountsCount={summary?.active_accounts_count || 0}
            dailyBalance60Days={summary?.daily_balance_60_days || []}
          />
        </div>
        <div className="col-span-1 lg:col-span-1">
          <MonthlyExpenseCard
            totalExpenses={summary?.total_monthly_expenses || 0}
            categories={summary?.categories_breakdown || []}
          />
        </div>
        <div className="col-span-1 lg:col-span-1">
          <CreditCardVisual card={summary?.primary_card} />
        </div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
        <div className="col-span-1">
          <CreditLimitCard
            usedLimit={summary?.used_credit_limit || 0}
            totalLimit={summary?.total_credit_limit || 0}
          />
        </div>
        <div className="col-span-1">
          <InstallmentsCard activeInstallmentsCount={summary?.active_installments_count || 0} />
        </div>
        <div className="col-span-1">
          <CashFlowCard
            income={summary?.total_monthly_income || 0}
            expenses={summary?.total_monthly_expenses || 0}
          />
        </div>
        <div className="col-span-1">
          <div className="card-glow p-5 flex flex-col justify-between h-44 border border-[#3C3D37]">
            <span className="text-xs font-medium text-[#9C9589] uppercase tracking-wider">Lançamentos no Mês</span>
            <h3 className="text-3xl font-bold text-[#ECDFCC]">
              {summary?.recent_transactions?.length || 0}
            </h3>
          </div>
        </div>
      </div>

      {/* Third Row: Chart + Table */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
        <div className="col-span-1 sm:col-span-2 lg:col-span-2">
          <EvolutionChart data={summary?.monthly_evolution || []} />
        </div>
        <div className="col-span-1 sm:col-span-2 lg:col-span-1">
          <RecentTransactions transactions={summary?.recent_transactions || []} />
        </div>
      </div>

      {/* Floating Action Button for Mobile */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="md:hidden fixed bottom-[80px] right-4 w-14 h-14 bg-[#697565] text-[#ECDFCC] rounded-2xl shadow-xl flex items-center justify-center hover:bg-[#7A8674] transition-all z-30 shadow-[#697565]/30 cursor-pointer"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Modal de Criar Transacao Manual */}
      <CreateTransactionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchSummary}
      />
    </div>
  );
};
