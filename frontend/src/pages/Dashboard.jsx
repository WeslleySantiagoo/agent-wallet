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

export const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
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
          <p className="text-xs text-[#9C9589]">Seu controle financeiro local-first em tempo real</p>
        </div>

        <button
          onClick={openChat}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#697565] text-[#ECDFCC] font-semibold text-xs hover:bg-[#7A8674] shadow-lg shadow-[#697565]/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Lançamento com IA</span>
        </button>
      </div>

      {/* Modular Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <BalanceCard
          totalBalance={summary?.total_balance || 0}
          accountsCount={summary?.active_accounts_count || 0}
        />
        <MonthlyExpenseCard
          totalExpenses={summary?.total_monthly_expenses || 0}
          categories={summary?.categories_breakdown || []}
        />
        <CreditCardVisual card={summary?.primary_card} />
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <CreditLimitCard
          usedLimit={summary?.used_credit_limit || 0}
          totalLimit={summary?.total_credit_limit || 0}
        />
        <InstallmentsCard activeInstallmentsCount={summary?.active_installments_count || 0} />
        <CashFlowCard
          income={summary?.total_monthly_income || 0}
          expenses={summary?.total_monthly_expenses || 0}
        />
        <div className="card-glow p-5 flex flex-col justify-between h-44 border border-[#3C3D37]">
          <span className="text-xs font-medium text-[#9C9589] uppercase tracking-wider">Lançamentos no Mês</span>
          <h3 className="text-3xl font-bold text-[#ECDFCC]">
            {summary?.recent_transactions?.length || 0}
          </h3>
          <p className="text-xs text-[#697565] font-medium">Registrados em SQLite</p>
        </div>
      </div>

      {/* Third Row: Chart + Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <EvolutionChart data={summary?.monthly_evolution || []} />
        <RecentTransactions transactions={summary?.recent_transactions || []} />
      </div>
    </div>
  );
};
