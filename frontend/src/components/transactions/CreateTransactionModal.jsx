import React, { useState, useEffect } from 'react';
import { getAccounts, getCreditCards, getCategories, createTransaction } from '../../services/api';
import { PillToggle } from '../common/PillToggle';
import { CurrencyInput } from '../common/CurrencyInput';
import { CustomDatePicker } from '../common/CustomDatePicker';
import { useToast } from '../../context/ToastContext';
import { 
  ArrowDownRight, ArrowUpRight, X, Utensils, Home, Car, Tv, 
  HeartPulse, GraduationCap, ShoppingBag, TrendingUp, DollarSign, 
  Tag, CreditCard as CardIcon, Building, Check, RefreshCw 
} from 'lucide-react';
import { getInstitutionLogo } from '../../utils/institutions';

const ICON_MAP = {
  Utensils,
  Home,
  Car,
  Tv,
  HeartPulse,
  GraduationCap,
  ShoppingBag,
  TrendingUp,
  DollarSign,
  Tag
};

export const CreateTransactionModal = ({ isOpen, onClose, onSuccess }) => {
  const { toast } = useToast();
  const [txType, setTxType] = useState('EXPENSE'); // 'EXPENSE' ou 'INCOME'
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState('');
  const [dateStr, setDateStr] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  
  // Destino / Origem (Conta ou Cartao)
  const [paymentMode, setPaymentMode] = useState('ACCOUNT'); // 'ACCOUNT' ou 'CARD'
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedCardId, setSelectedCardId] = useState('');

  const [accounts, setAccounts] = useState([]);
  const [cards, setCards] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadFormData();
    }
  }, [isOpen]);

  const loadFormData = async () => {
    setLoading(true);
    try {
      const [accsData, cardsData, catsData] = await Promise.all([
        getAccounts(),
        getCreditCards(),
        getCategories()
      ]);
      setAccounts(accsData || []);
      setCards(cardsData || []);
      setCategories(catsData || []);

      if (accsData && accsData.length > 0) {
        setSelectedAccountId(accsData[0].id);
      }
      if (cardsData && cardsData.length > 0) {
        setSelectedCardId(cardsData[0].id);
      }
      if (catsData && catsData.length > 0) {
        setSelectedCategoryId(catsData[0].id);
      }
    } catch (e) {
      console.warn("Erro ao carregar dados do formulario de transacao:", e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      toast.error("Insira um valor maior que zero.");
      return;
    }
    if (!description.trim()) {
      toast.error("Insira uma descrição para a transação.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        amount: amount,
        description: description.trim(),
        type: txType,
        date: dateStr,
        category_id: selectedCategoryId ? parseInt(selectedCategoryId) : null
      };

      if (txType === 'INCOME') {
        payload.account_id = parseInt(selectedAccountId);
      } else {
        if (paymentMode === 'CARD') {
          payload.type = 'CARD_PURCHASE';
          payload.credit_card_id = parseInt(selectedCardId);
        } else {
          payload.account_id = parseInt(selectedAccountId);
        }
      }

      await createTransaction(payload);
      toast.success("Transação registrada com sucesso!");
      if (onSuccess) onSuccess();
      onClose();

      // Reset form
      setAmount(0);
      setDescription('');
    } catch (err) {
      const errDetail = err.response?.data?.detail || err.message;
      toast.error("Erro ao registrar transação: " + errDetail);
    } finally {
      setSubmitting(false);
    }
  };

  const isIncome = txType === 'INCOME';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#181C14] border border-[#3C3D37] rounded-3xl p-6 w-full max-w-lg space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#3C3D37] pb-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#ECDFCC]">Nova Transação Manual</h2>
            <p className="text-xs text-[#9C9589]">Cadastre despesas ou receitas diretamente</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#9C9589] hover:text-[#ECDFCC] hover:bg-[#3C3D37] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-[#9C9589] gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-[#697565]" />
            <span>Carregando dados...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* 1. Toggle Button Entrada vs Saida (PillToggle inspirado na Imagem 1) */}
            <div>
              <label className="text-xs text-[#9C9589] font-semibold uppercase tracking-wider block mb-2">
                Tipo de Lançamento
              </label>
              <PillToggle
                value={txType}
                onChange={(val) => {
                  setTxType(val);
                  if (val === 'INCOME') {
                    setPaymentMode('ACCOUNT');
                  }
                }}
                options={[
                  { value: 'EXPENSE', label: 'Saída (Despesa)', icon: ArrowDownRight },
                  { value: 'INCOME', label: 'Entrada (Receita)', icon: ArrowUpRight }
                ]}
              />
            </div>

            {/* 2. Currency Input (Real R$ 9.999,99 formatado dinamicamente) */}
            <div>
              <label className="text-xs text-[#9C9589] font-semibold uppercase tracking-wider block mb-1.5">
                Valor da Transação
              </label>
              <CurrencyInput
                value={amount}
                onChange={(val) => setAmount(val)}
                isIncome={isIncome}
              />
            </div>

            {/* 3. Descricao */}
            <div>
              <label className="text-xs text-[#9C9589] font-semibold uppercase tracking-wider block mb-1.5">
                Descrição
              </label>
              <input
                type="text"
                required
                placeholder={isIncome ? "Ex: Salário mensal, Freelance..." : "Ex: Mercado, Almoço, Combustível..."}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-[#181C14] text-xs text-[#ECDFCC] p-3 rounded-2xl border border-[#3C3D37] outline-none focus:border-[#697565] transition-all shadow-inner"
              />
            </div>

            {/* 4. Date Picker Personalizado */}
            <div>
              <label className="text-xs text-[#9C9589] font-semibold uppercase tracking-wider block mb-1.5">
                Data da Transação
              </label>
              <CustomDatePicker
                value={dateStr}
                onChange={(val) => setDateStr(val)}
              />
            </div>

            {/* 5. Forma de Pagamento / Destino (Conta ou Cartao) */}
            <div>
              <label className="text-xs text-[#9C9589] font-semibold uppercase tracking-wider block mb-1.5">
                {isIncome ? 'Conta de Destino' : 'Forma de Pagamento'}
              </label>
              
              {!isIncome && cards.length > 0 && (
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMode('ACCOUNT')}
                    className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      paymentMode === 'ACCOUNT'
                        ? 'bg-[#697565]/30 border-[#697565] text-[#ECDFCC]'
                        : 'bg-[#181C14] border-[#3C3D37] text-[#9C9589]'
                    }`}
                  >
                    Conta Bancária / Carteira
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode('CARD')}
                    className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      paymentMode === 'CARD'
                        ? 'bg-[#697565]/30 border-[#697565] text-[#ECDFCC]'
                        : 'bg-[#181C14] border-[#3C3D37] text-[#9C9589]'
                    }`}
                  >
                    Cartão de Crédito
                  </button>
                </div>
              )}

              {paymentMode === 'ACCOUNT' || isIncome ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {accounts.map(acc => {
                    const isSelected = selectedAccountId === acc.id;
                    const logoUrl = getInstitutionLogo(acc.institution || acc.name);
                    return (
                      <div
                        key={acc.id}
                        onClick={() => setSelectedAccountId(acc.id)}
                        className={`p-2.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#697565]/30 border-[#697565] text-[#ECDFCC] shadow-md'
                            : 'bg-[#181C14] border-[#3C3D37] text-[#9C9589] hover:border-[#697565]/40'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <div className="w-7 h-7 rounded-lg bg-[#181C14] p-1 flex items-center justify-center border border-[#3C3D37] shrink-0">
                            <img src={logoUrl} alt={acc.name} className="w-full h-full object-contain" />
                          </div>
                          <span className="text-xs font-medium truncate">{acc.name}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[#4CAF50] shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {cards.map(c => {
                    const isSelected = selectedCardId === c.id;
                    return (
                      <div
                        key={c.id}
                        onClick={() => setSelectedCardId(c.id)}
                        className={`p-2.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#697565]/30 border-[#697565] text-[#ECDFCC] shadow-md'
                            : 'bg-[#181C14] border-[#3C3D37] text-[#9C9589] hover:border-[#697565]/40'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <CardIcon className="w-5 h-5 text-[#697565] shrink-0" />
                          <span className="text-xs font-medium truncate">{c.name}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[#4CAF50] shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 6. Selecao de Categoria (Estilizada com Icones e Cores conforme Imagem 2) */}
            <div>
              <label className="text-xs text-[#9C9589] font-semibold uppercase tracking-wider block mb-2">
                Categoria
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto p-1">
                {categories.map((cat) => {
                  const isSelected = selectedCategoryId === cat.id;
                  const IconComp = ICON_MAP[cat.icon] || Tag;
                  const catColor = cat.color || '#697565';

                  return (
                    <div
                      key={cat.id}
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className={`p-2.5 rounded-2xl border flex items-center gap-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[#697565]/30 border-[#697565] text-[#ECDFCC] shadow-md scale-[1.02]'
                          : 'bg-[#181C14] border-[#3C3D37] text-[#9C9589] hover:border-[#697565]/40 hover:text-[#ECDFCC]'
                      }`}
                    >
                      <div 
                        className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 shadow-inner"
                        style={{ backgroundColor: `${catColor}25`, color: catColor }}
                      >
                        <IconComp className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold truncate">{cat.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#3C3D37]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-2xl text-xs text-[#9C9589] hover:bg-[#3C3D37] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold text-white transition-all shadow-lg cursor-pointer ${
                  isIncome ? 'bg-[#4CAF50] hover:bg-[#43A047]' : 'bg-[#697565] hover:bg-[#7A8674]'
                }`}
              >
                {submitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Adicionar Transação</span>
                )}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
