import React, { useEffect, useState } from 'react';
import { getTransactions, deleteTransaction } from '../services/api';
import { Receipt, Trash2, ArrowUpRight, ArrowDownRight, CreditCard, RefreshCw } from 'lucide-react';
import { useAIChat } from '../context/AIChatContext';
import { useToast } from '../context/ToastContext';
import { getInstitutionLogo } from '../utils/institutions';

import { CreateTransactionModal } from '../components/transactions/CreateTransactionModal';
import { Plus } from 'lucide-react';

export const Transactions = () => {
  const { toast } = useToast();
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { openChat } = useAIChat();

  const load = async () => {
    setLoading(true);
    try {
      const data = await getTransactions();
      setTxs(data);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id) => {
    try {
      await deleteTransaction(id);
      toast.success("Transação excluída com sucesso.");
      load();
    } catch (e) {
      toast.error("Erro ao excluir transação.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#ECDFCC]">Extrato de Lançamentos</h1>
          <p className="text-xs text-[#9C9589]">Histórico completo de despesas, receitas e compras parceladas por instituição</p>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#697565] text-[#ECDFCC] text-xs font-semibold hover:bg-[#7A8674] cursor-pointer shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Transação</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-[#9C9589] gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-[#697565]" />
          <span>Carregando extrato...</span>
        </div>
      ) : txs.length === 0 ? (
        <div className="card-glow p-8 text-center border border-[#3C3D37]">
          <Receipt className="w-12 h-12 text-[#697565] mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-[#ECDFCC]">Nenhum lançamento encontrado</h3>
          <p className="text-xs text-[#9C9589] mt-1 mb-4">Envie um texto para o assistente de IA ou adicione lançamentos.</p>
          <button onClick={openChat} className="px-4 py-2 rounded-xl bg-[#697565] text-[#ECDFCC] text-xs font-semibold cursor-pointer">
            Abrir Chat IA
          </button>
        </div>
      ) : (
        <div className="card-glow border border-[#3C3D37] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#181C14] text-[#9C9589] uppercase tracking-wider font-medium border-b border-[#3C3D37]">
                  <th className="py-3.5 px-4">Instituição & Lançamento</th>
                  <th className="py-3.5 px-4">Data</th>
                  <th className="py-3.5 px-4">Tipo</th>
                  <th className="py-3.5 px-4 text-right">Valor</th>
                  <th className="py-3.5 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3C3D37]/60">
                {txs.map(t => {
                  const isIncome = t.type === 'INCOME';
                  const isCard = t.type === 'CARD_PURCHASE';
                  const instName = t.institution || t.account_name || 'Instituição';
                  const logoUrl = getInstitutionLogo(instName);

                  return (
                    <tr key={t.id} className="hover:bg-[#4A4B44]/20 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-[#ECDFCC] flex items-center gap-3">
                        {/* Logo da Instituição Bancária / Carteira */}
                        <div className="relative w-9 h-9 rounded-xl bg-[#181C14] border border-[#3C3D37] p-1.5 flex items-center justify-center shrink-0 shadow-inner">
                          <img 
                            src={logoUrl} 
                            alt={instName} 
                            className="w-full h-full object-contain" 
                            onError={(e) => { e.target.src = '/assets/logos/logo-generic-bank.svg'; }}
                          />
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${
                            isIncome ? 'bg-[#4CAF50] text-white' : isCard ? 'bg-[#697565] text-white' : 'bg-[#E57373] text-white'
                          }`}>
                            {isIncome ? <ArrowUpRight className="w-2.5 h-2.5" /> : isCard ? <CreditCard className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-xs text-[#ECDFCC]">{t.description}</p>
                            {instName && (
                              <span className="px-2 py-0.2 rounded-full text-[9px] font-mono bg-[#181C14] text-[#9C9589] border border-[#3C3D37]">
                                {instName}
                              </span>
                            )}
                          </div>
                          {t.is_installment && (
                            <span className="text-[10px] text-[#697565] block font-mono">
                              Parcela {t.installment_number}/{t.total_installments}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-[#9C9589] font-mono text-[11px]">
                        {new Date(t.date).toLocaleDateString('pt-BR')}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                          isIncome ? 'bg-[#4CAF50]/20 text-[#4CAF50] border border-[#4CAF50]/30' : isCard ? 'bg-[#697565]/30 text-[#ECDFCC] border border-[#697565]/40' : 'bg-[#E57373]/20 text-[#E57373] border border-[#E57373]/30'
                        }`}>
                          {isIncome ? 'Receita' : isCard ? 'Cartão Crédito' : 'Despesa'}
                        </span>
                      </td>

                      <td className={`py-3.5 px-4 text-right font-bold ${isIncome ? 'text-[#4CAF50]' : 'text-[#ECDFCC]'}`}>
                        {isIncome ? '+' : '-'}R$ {Number(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="p-1.5 rounded-lg text-[#E57373] hover:bg-[#E57373]/10 cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
        onSuccess={load}
      />
    </div>
  );
};
