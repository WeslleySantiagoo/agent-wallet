import React, { useState, useEffect } from 'react';
import { getAccounts, getCardInvoices, payInvoice } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { CustomSelect } from '../common/CustomSelect';
import { CustomDatePicker } from '../common/CustomDatePicker';
import { CurrencyInput } from '../common/CurrencyInput';
import { X, RefreshCw, CheckCircle2 } from 'lucide-react';

export const PayInvoiceModal = ({ isOpen, onClose, onSuccess, cardId }) => {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [amountPaid, setAmountPaid] = useState(0);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  // Efeito para Scroll Lock no Body
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      loadData();
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen, cardId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [accsData, invsData] = await Promise.all([
        getAccounts(),
        getCardInvoices(cardId)
      ]);
      setAccounts(accsData || []);
      
      const openInvoices = (invsData || []).filter(i => i.status !== 'PAID');
      setInvoices(openInvoices);

      if (accsData && accsData.length > 0) {
        setSelectedAccountId(accsData[0].id);
      }
      
      if (openInvoices.length > 0) {
        handleInvoiceSelect(openInvoices[0], openInvoices[0].id);
      } else {
        setSelectedInvoiceId('');
        setAmountPaid(0);
      }

    } catch (e) {
      toast.error("Erro ao carregar dados para pagamento da fatura.");
    } finally {
      setLoading(false);
    }
  };

  const handleInvoiceSelect = (inv, id) => {
    setSelectedInvoiceId(id);
    if (inv) {
      setAmountPaid(inv.total_amount);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInvoiceId) {
      toast.error("Selecione uma fatura.");
      return;
    }
    if (!selectedAccountId) {
      toast.error("Selecione uma conta para debitar o pagamento.");
      return;
    }
    if (amountPaid <= 0) {
      toast.error("O valor pago deve ser maior que zero.");
      return;
    }

    setSubmitting(true);
    try {
      await payInvoice(cardId, selectedInvoiceId, {
        account_id: parseInt(selectedAccountId),
        amount_paid: parseFloat(amountPaid),
        payment_date: paymentDate
      });
      toast.success("Fatura paga com sucesso!");
      onSuccess();
      onClose();
    } catch (e) {
      toast.error("Erro ao pagar fatura: " + (e.response?.data?.detail || e.message));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1E2218] border border-[#3C3D37] rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[#3C3D37]">
          <h2 className="text-lg font-bold text-[#ECDFCC] flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#4CAF50]" />
            Pagar Fatura
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#9C9589] hover:text-[#ECDFCC] hover:bg-[#3C3D37] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-[#9C9589]">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              Carregando dados...
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[#9C9589]">Não há faturas em aberto para este cartão.</p>
            </div>
          ) : (
            <form id="payInvoiceForm" onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              
              <div>
                <label className="text-xs text-[#9C9589] font-medium block mb-1">Fatura</label>
                <CustomSelect
                  value={selectedInvoiceId}
                  onChange={(val) => {
                    const inv = invoices.find(i => i.id === parseInt(val));
                    handleInvoiceSelect(inv, val);
                  }}
                  options={invoices.map(i => ({
                    value: i.id,
                    label: `${String(i.month).padStart(2, '0')}/${i.year} - Total: R$ ${Number(i.total_amount).toLocaleString('pt-BR', {minimumFractionDigits: 2})}`
                  }))}
                  placeholder="Selecione a fatura..."
                />
              </div>

              <div>
                <label className="text-xs text-[#9C9589] font-medium block mb-1">Conta de Débito</label>
                <CustomSelect
                  value={selectedAccountId}
                  onChange={(val) => setSelectedAccountId(val)}
                  options={accounts.map(a => ({
                    value: a.id,
                    label: `${a.name} (${a.institution || 'Banco'})`
                  }))}
                  placeholder="Selecione uma conta..."
                />
              </div>

              <div>
                <label className="text-xs text-[#9C9589] font-medium block mb-1">Valor Pago (R$)</label>
                <CurrencyInput
                  value={amountPaid}
                  onChange={(val) => setAmountPaid(val)}
                  isIncome={false}
                />
                <p className="text-[10px] text-[#9C9589] mt-1">O valor padrão é o total da fatura, mas você pode ajustá-lo.</p>
              </div>

              <div>
                <label className="text-xs text-[#9C9589] font-medium block mb-1">Data do Pagamento</label>
                <CustomDatePicker
                  value={paymentDate}
                  onChange={(val) => setPaymentDate(val)}
                />
              </div>
            </form>
          )}
        </div>

        <div className="p-4 sm:p-6 border-t border-[#3C3D37] flex gap-3 bg-[#181C14]">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold text-[#ECDFCC] bg-[#3C3D37] hover:bg-[#4A4B44] transition-all"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="payInvoiceForm"
            disabled={submitting || invoices.length === 0}
            className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-[#4CAF50] hover:bg-[#43a047] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_rgba(76,175,80,0.3)]"
          >
            {submitting ? (
              <div className="flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Processando...
              </div>
            ) : (
              'Confirmar Pagamento'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
