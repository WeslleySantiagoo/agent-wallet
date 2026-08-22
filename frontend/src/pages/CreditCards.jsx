import React, { useEffect, useState } from 'react';
import { getCreditCards, createCreditCard, getAccounts, payInvoice } from '../services/api';
import { Plus, CreditCard as CardIcon, Calendar, CheckCircle2, RefreshCw } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { CurrencyInput } from '../components/common/CurrencyInput';
import { CustomSelect } from '../components/common/CustomSelect';
import { CustomNumberInput } from '../components/common/CustomNumberInput';

export const CreditCards = () => {
  const { toast } = useToast();
  const [cards, setCards] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    account_id: '',
    name: '',
    last_four_digits: '',
    total_limit: 1000,
    closing_day: 1,
    due_day: 10
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [cardsData, accsData] = await Promise.all([getCreditCards(), getAccounts()]);
      setCards(cardsData);
      setAccounts(accsData);
      if (accsData.length > 0 && !form.account_id) {
        setForm(prev => ({ ...prev, account_id: accsData[0].id }));
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createCreditCard({
        ...form,
        account_id: parseInt(form.account_id),
        total_limit: parseFloat(form.total_limit),
        closing_day: parseInt(form.closing_day),
        due_day: parseInt(form.due_day)
      });
      setShowModal(false);
      toast.success("Cartão de crédito criado com sucesso!");
      loadData();
    } catch (e) {
      toast.error("Erro ao criar cartão de crédito.");
    }
  };

  const handlePayInvoice = async (cardId) => {
    if (accounts.length === 0) {
      toast.error("Cadastre uma conta corrente primeiro para pagar a fatura.");
      return;
    }
    const accId = accounts[0].id;

    try {
      await payInvoice(cardId, 1, parseInt(accId));
      toast.success("Fatura paga com sucesso! Saldo debitado e limite liberado.");
      loadData();
    } catch (e) {
      toast.error("Status do pagamento: " + (e.response?.data?.detail || e.message));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#ECDFCC]">Cartões de Crédito</h1>
          <p className="text-xs text-[#9C9589]">Limite total comprometido no ato das compras parceladas</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#697565] text-[#ECDFCC] text-xs font-semibold hover:bg-[#7A8674] transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Cartão</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-[#9C9589] gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-[#697565]" />
          <span>Carregando cartões...</span>
        </div>
      ) : cards.length === 0 ? (
        <div className="card-glow p-8 text-center border border-[#3C3D37]">
          <CardIcon className="w-12 h-12 text-[#697565] mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-[#ECDFCC]">Nenhum cartão cadastrado</h3>
          <p className="text-xs text-[#9C9589] mt-1 mb-4">Adicione um cartão para controlar limites e parcelamentos.</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-xl bg-[#697565] text-[#ECDFCC] text-xs font-semibold"
          >
            Cadastrar Cartão
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {cards.map(c => (
            <div key={c.id} className="card-glow p-5 border border-[#3C3D37] flex flex-col justify-between h-52 bg-gradient-to-br from-[#3C3D37] to-[#181C14]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardIcon className="w-5 h-5 text-[#697565]" />
                  <h3 className="text-sm font-bold text-[#ECDFCC]">{c.name}</h3>
                </div>
                <span className="text-xs font-mono text-[#9C9589]">•••• {c.last_four_digits || '0000'}</span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-[#9C9589] uppercase">Limite Usado / Total</span>
                <p className="text-lg font-bold text-[#ECDFCC]">
                  R$ {Number(c.used_limit).toLocaleString('pt-BR')} / R$ {Number(c.total_limit).toLocaleString('pt-BR')}
                </p>
                <div className="w-full bg-[#181C14] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#697565] h-full rounded-full"
                    style={{ width: `${Math.min(100, (c.used_limit / c.total_limit) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#4A4B44]/40 text-xs">
                <div className="text-[11px] text-[#9C9589]">
                  <span>Fecha dia {c.closing_day} | Vence dia {c.due_day}</span>
                </div>

                <button
                  onClick={() => handlePayInvoice(c.id)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-[#4CAF50] bg-[#4CAF50]/10 px-2.5 py-1 rounded-lg hover:bg-[#4CAF50]/20"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Pagar Fatura</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Novo Cartão */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E2218] border border-[#3C3D37] rounded-2xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-base font-bold text-[#ECDFCC]">Cadastrar Cartão de Crédito</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-[#9C9589] font-medium block mb-1">Conta Vinculada</label>
                <CustomSelect
                  value={form.account_id}
                  onChange={(val) => setForm({ ...form, account_id: val })}
                  options={accounts.map(a => ({
                    value: a.id,
                    label: `${a.name} (${a.institution || 'Banco'})`
                  }))}
                  placeholder="Selecione uma conta..."
                />
              </div>

              <div>
                <label className="text-xs text-[#9C9589] font-medium block mb-1">Nome do Cartão</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Nubank Violeta"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-[#181C14] text-xs text-[#ECDFCC] p-2.5 rounded-xl border border-[#3C3D37] outline-none focus:border-[#697565]"
                />
              </div>
              <label className="text-xs text-[#9C9589] font-medium block mb-1">Últimos 4 Dígitos</label>
              <input
                type="text"
                maxLength={4}
                placeholder="9261"
                value={form.last_four_digits}
                onChange={e => setForm({ ...form, last_four_digits: e.target.value })}
                className="w-full bg-[#181C14] text-xs text-[#ECDFCC] p-2.5 rounded-xl border border-[#3C3D37] outline-none focus:border-[#697565]"
              />
              <label className="text-xs text-[#9C9589] font-medium block mb-1">Limite Total (R$)</label>
              <CurrencyInput
                value={form.total_limit}
                onChange={(val) => setForm({ ...form, total_limit: val })}
                isIncome={true}
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#9C9589] font-medium block mb-1">Dia Fechamento</label>
                  <CustomNumberInput
                    value={form.closing_day}
                    onChange={(val) => setForm({ ...form, closing_day: val })}
                    min={1}
                    max={31}
                  />
                </div>
                <div>
                  <label className="text-xs text-[#9C9589] font-medium block mb-1">Dia Vencimento</label>
                  <CustomNumberInput
                    value={form.due_day}
                    onChange={(val) => setForm({ ...form, due_day: val })}
                    min={1}
                    max={31}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-[#9C9589]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#697565] text-[#ECDFCC]"
                >
                  Salvar Cartão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
