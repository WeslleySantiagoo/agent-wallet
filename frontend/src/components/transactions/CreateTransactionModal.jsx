import React, { useState, useEffect } from 'react';
import { getAccounts, getCreditCards, getCategories, createTransaction, createCategory } from '../../services/api';
import { PillToggle } from '../common/PillToggle';
import { CurrencyInput } from '../common/CurrencyInput';
import { CustomDatePicker } from '../common/CustomDatePicker';
import { useToast } from '../../context/ToastContext';
import { 
  ArrowDownRight, ArrowUpRight, X, Utensils, Home, Car, Tv, 
  HeartPulse, GraduationCap, ShoppingBag, Landmark, DollarSign, 
  Tag, CreditCard as CardIcon, Building, Check, RefreshCw, ChevronDown,
  Ticket, ShieldCheck, Dices, Heart, Sparkles, Plus
} from 'lucide-react';
import { getInstitutionLogo } from '../../utils/institutions';
import { CollapsibleSection } from '../common/CollapsibleSection';

const ICON_MAP = {
  Utensils,
  Home,
  Car,
  Tv,
  HeartPulse,
  GraduationCap,
  ShoppingBag,
  Landmark,
  DollarSign,
  Ticket,
  ShieldCheck,
  Dices,
  Heart,
  Tag,
  Sparkles
};

export const CreateTransactionModal = ({ isOpen, onClose, onSuccess }) => {
  const { toast } = useToast();
  const [txType, setTxType] = useState('EXPENSE'); // 'EXPENSE' ou 'INCOME'
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState('');
  const [dateStr, setDateStr] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [expandedMacroId, setExpandedMacroId] = useState(null);

  // Estado para criacao de nova subcategoria personalizada
  const [newSubName, setNewSubName] = useState('');
  const [addingSubForMacroId, setAddingSubForMacroId] = useState(null);
  const [creatingSub, setCreatingSub] = useState(false);
  
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
        // Encontrar categoria padrao
        const firstSub = catsData.find(c => c.parent_id !== null);
        const defaultCat = firstSub || catsData[0];
        setSelectedCategoryId(defaultCat.id);
        if (defaultCat.parent_id) {
          setExpandedMacroId(defaultCat.parent_id);
        } else {
          setExpandedMacroId(catsData[0]?.id || null);
        }
      }
    } catch (e) {
      console.warn("Erro ao carregar dados do formulario de transacao:", e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleCreateCustomSubcategory = async (macroCategory) => {
    if (!newSubName.trim()) {
      toast.error("Digite o nome da nova subcategoria.");
      return;
    }
    setCreatingSub(true);
    try {
      const newCat = await createCategory({
        name: newSubName.trim(),
        icon: macroCategory.icon || 'Tag',
        color: macroCategory.color || '#697565',
        parent_id: macroCategory.id
      });
      toast.success(`Subcategoria "${newCat.name}" criada com sucesso!`);
      setCategories(prev => [...prev, newCat]);
      setSelectedCategoryId(newCat.id);
      setNewSubName('');
      setAddingSubForMacroId(null);
    } catch (err) {
      toast.error("Erro ao criar subcategoria: " + err.message);
    } finally {
      setCreatingSub(false);
    }
  };

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

  // Separar categorias pai (macro) e filhas (subcategorias)
  let macroCategories = categories.filter(c => !c.parent_id);
  if (macroCategories.length === 0 && categories.length > 0) {
    macroCategories = categories;
  }

  const subCategoriesByParent = categories.reduce((acc, cat) => {
    if (cat.parent_id) {
      if (!acc[cat.parent_id]) acc[cat.parent_id] = [];
      acc[cat.parent_id].push(cat);
    }
    return acc;
  }, {});

  const selectedCategoryObj = categories.find(c => c.id === selectedCategoryId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#181C14] border border-[#3C3D37] rounded-3xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#3C3D37] p-6 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#ECDFCC]">Nova Transação Manual</h2>
            <p className="text-xs text-[#9C9589]">Cadastre despesas ou receitas com categorias personalizadas</p>
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
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
            
            {/* 1. Toggle Button Entrada vs Saida (PillToggle) */}
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

            {/* 2. Currency Input Formatado em Real R$ minimalista */}
            <div>
              <label className="text-xs text-[#9C9589] font-semibold uppercase tracking-wider block mb-1">
                Valor da Transação
              </label>
              <CurrencyInput
                value={amount}
                onChange={(val) => setAmount(val)}
                isIncome={isIncome}
              />
            </div>

            {/* 3. Descrição */}
            <div>
              <label className="text-xs text-[#9C9589] font-semibold uppercase tracking-wider block mb-1.5">
                Descrição
              </label>
              <input
                type="text"
                required
                placeholder={isIncome ? "Ex: Salário mensal, Freelance..." : "Ex: Supermercado, Aluguel, Farmácia..."}
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

            {/* 5. Forma de Pagamento / Destino */}
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

            {/* 6. Seleção de Categorias & Subcategorias (14 Macrocategorias + Criar Subcategoria) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-[#9C9589] font-semibold uppercase tracking-wider block">
                  Categoria & Subcategoria
                </label>
                {selectedCategoryObj && (
                  <span className="text-[11px] font-semibold text-[#ECDFCC] bg-[#3C3D37] px-2 py-0.5 rounded-lg border border-[#4A4B44]">
                    {selectedCategoryObj.name}
                  </span>
                )}
              </div>

              <div className="border border-[#3C3D37] rounded-2xl bg-[#181C14]/50 overflow-hidden">
                <div className="space-y-2 max-h-64 overflow-y-auto p-1.5">
                  {macroCategories.length === 0 ? (
                    <div className="text-center py-4 text-xs text-[#9C9589]">
                      Nenhuma categoria encontrada.
                    </div>
                  ) : (
                    macroCategories.map((macro) => {
                      const IconComp = ICON_MAP[macro.icon] || Tag;
                      const catColor = macro.color || '#697565';
                      const subs = subCategoriesByParent[macro.id] || [];
                      const isExpanded = expandedMacroId === macro.id;

                      const hasSelectedSub = subs.some(s => s.id === selectedCategoryId);
                      const isMacroSelected = macro.id === selectedCategoryId;

                      return (
                        <div
                          key={macro.id}
                          className={`rounded-2xl border transition-all overflow-hidden ${
                            hasSelectedSub || isMacroSelected
                              ? 'border-[#697565] bg-[#3C3D37]/30'
                              : 'border-[#3C3D37] bg-[#181C14]'
                          }`}
                        >
                          {/* Macro Category Header */}
                          <div
                            onClick={() => {
                              setExpandedMacroId(isExpanded ? null : macro.id);
                              if (subs.length === 0) {
                                setSelectedCategoryId(macro.id);
                              }
                            }}
                            className="p-3 flex items-center justify-between cursor-pointer hover:bg-[#3C3D37]/40 transition-colors select-none"
                          >
                            <div className="flex items-center gap-2.5">
                              <div 
                                className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 shadow-inner"
                                style={{ backgroundColor: `${catColor}25`, color: catColor }}
                              >
                                <IconComp className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="text-xs font-bold text-[#ECDFCC] block">{macro.name}</span>
                                <span className="text-[10px] text-[#9C9589]">
                                  {subs.length} subcategorias
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {(isMacroSelected || hasSelectedSub) && (
                                <span className="w-2 h-2 rounded-full bg-[#4CAF50]" />
                              )}
                              <ChevronDown className={`w-4 h-4 text-[#9C9589] transition-transform duration-500 ${
                                isExpanded ? 'rotate-180 text-[#ECDFCC]' : 'rotate-0'
                              }`} />
                            </div>
                          </div>

                          {/* Subcategories list & Form para criar subcategoria personalizada com animação suave de grid */}
                          <CollapsibleSection isOpen={isExpanded} className="px-3 pb-3 pt-1 space-y-2 border-t border-[#3C3D37]/60 bg-[#181C14]/90">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {subs.map((sub) => {
                                const isSubSelected = sub.id === selectedCategoryId;
                                return (
                                  <button
                                    key={sub.id}
                                    type="button"
                                    onClick={() => setSelectedCategoryId(sub.id)}
                                    className={`px-2.5 py-2 rounded-xl text-left text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                                      isSubSelected
                                        ? 'bg-[#697565] text-[#ECDFCC] font-bold shadow-md scale-[1.01]'
                                        : 'bg-[#1E2218] text-[#9C9589] hover:bg-[#3C3D37] hover:text-[#ECDFCC]'
                                    }`}
                                  >
                                    <span className="truncate">{sub.name}</span>
                                    {isSubSelected && <Check className="w-3.5 h-3.5 text-[#ECDFCC] shrink-0" />}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Campo para criar nova subcategoria */}
                            {addingSubForMacroId === macro.id ? (
                              <div className="flex items-center gap-2 pt-2 border-t border-[#3C3D37]/60">
                                <input
                                  type="text"
                                  autoFocus
                                  placeholder="Nome da subcategoria..."
                                  value={newSubName}
                                  onChange={(e) => setNewSubName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleCreateCustomSubcategory(macro);
                                    }
                                  }}
                                  className="flex-1 bg-[#3C3D37] text-xs text-[#ECDFCC] p-2 rounded-xl border border-[#4A4B44] outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleCreateCustomSubcategory(macro)}
                                  disabled={creatingSub}
                                  className="px-3 py-2 bg-[#697565] text-[#ECDFCC] text-xs font-semibold rounded-xl hover:bg-[#7A8674] cursor-pointer"
                                >
                                  {creatingSub ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Salvar'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAddingSubForMacroId(null);
                                    setNewSubName('');
                                  }}
                                  className="p-2 text-[#9C9589] hover:text-[#ECDFCC] text-xs"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setAddingSubForMacroId(macro.id);
                                  setNewSubName('');
                                }}
                                className="w-full mt-1 py-1.5 text-center text-[11px] font-semibold text-[#697565] hover:text-[#ECDFCC] bg-[#1E2218] hover:bg-[#3C3D37] rounded-xl border border-dashed border-[#697565]/40 flex items-center justify-center gap-1 transition-all cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Nova Subcategoria em {macro.name}</span>
                              </button>
                            )}
                          </CollapsibleSection>
                        </div>
                      );
                    })
                  )}
                </div>
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
