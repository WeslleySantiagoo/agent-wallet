import React, { useEffect, useState } from 'react';
import { getTransactions, deleteTransaction } from '../services/api';
import { Receipt, Trash2, ArrowUpRight, ArrowDownRight, CreditCard, RefreshCw } from 'lucide-react';
import { useAIChat } from '../context/AIChatContext';

export const Transactions = () => {
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);
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
    if (!confirm("Tem certeza que deseja excluir esta transação?")) return;
    try {
      await deleteTransaction(id);
      load();
    } catch (e) {
      alert("Erro ao excluir transação.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#ECDFCC]">Extrato de Lançamentos</h1>
          <p className="text-xs text-[#9C9589]">Histórico completo de despesas, receitas e compras parceladas</p>
        </div>

        <button
          onClick={openChat}
          className="px-4 py-2 rounded-xl bg-[#697565] text-[#ECDFCC] text-xs font-semibold hover:bg-[#7A8674]"
        >
          + Adicionar via IA
        </button>
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
          <button onClick={openChat} className="px-4 py-2 rounded-xl bg-[#697565] text-[#ECDFCC] text-xs font-semibold">
            Abrir Chat IA
          </button>
        </div>
      ) : (
        <div className="card-glow border border-[#3C3D37] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#181C14] text-[#9C9589] uppercase tracking-wider font-medium border-b border-[#3C3D37]">
                  <th className="py-3 px-4">Descrição</th>
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4 text-right">Valor</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3C3D37]">
                {txs.map(t => {
                  const isIncome = t.type === 'INCOME';
                  const isCard = t.type === 'CARD_PURCHASE';

                  return (
                    <tr key={t.id} className="hover:bg-[#4A4B44]/20 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-[#ECDFCC] flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isIncome ? 'bg-[#4CAF50]/20 text-[#4CAF50]' : isCard ? 'bg-[#697565]/30 text-[#ECDFCC]' : 'bg-[#E57373]/20 text-[#E57373]'
                        }`}>
                          {isIncome ? <ArrowUpRight className="w-4 h-4" /> : isCard ? <CreditCard className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-semibold text-xs text-[#ECDFCC]">{t.description}</p>
                          {t.is_installment && (
                            <span className="text-[10px] text-[#697565]">Parcela {t.installment_number}/{t.total_installments}</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-[#9C9589]">
                        {new Date(t.date).toLocaleDateString('pt-BR')}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                          isIncome ? 'bg-[#4CAF50]/20 text-[#4CAF50]' : isCard ? 'bg-[#697565]/30 text-[#ECDFCC]' : 'bg-[#E57373]/20 text-[#E57373]'
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
                          className="p-1.5 rounded-lg text-[#E57373] hover:bg-[#E57373]/10"
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
    </div>
  );
};
