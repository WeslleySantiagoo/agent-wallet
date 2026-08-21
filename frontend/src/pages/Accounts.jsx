import React, { useEffect, useState } from 'react';
import { getAccounts, createAccount, deleteAccount } from '../services/api';
import { Plus, Trash2, Wallet, RefreshCw, Check } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { PREDEFINED_INSTITUTIONS, getInstitutionLogo } from '../utils/institutions';

export const Accounts = () => {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedInstId, setSelectedInstId] = useState('nubank');
  const [form, setForm] = useState({ name: 'Nubank Corrente', institution: 'Nubank', balance: 0, type: 'CHECKING' });

  const load = async () => {
    setLoading(true);
    try {
      const data = await getAccounts();
      setAccounts(data);
    } catch (e) {
      console.warn("Erro ao carregar contas:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSelectInstitution = (inst) => {
    setSelectedInstId(inst.id);
    if (inst.id === 'outro') {
      setForm(prev => ({ ...prev, institution: '', name: prev.name || '' }));
    } else {
      setForm(prev => ({
        ...prev,
        institution: inst.name,
        name: prev.name === '' || PREDEFINED_INSTITUTIONS.some(i => i.defaultAccountName === prev.name)
          ? inst.defaultAccountName
          : prev.name
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createAccount({ ...form, balance: parseFloat(form.balance) || 0 });
      setShowModal(false);
      setForm({ name: 'Nubank Corrente', institution: 'Nubank', balance: 0, type: 'CHECKING' });
      setSelectedInstId('nubank');
      toast.success("Conta criada com sucesso!");
      load();
    } catch (e) {
      toast.error("Erro ao criar conta: " + e.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteAccount(id);
      toast.success("Conta excluída com sucesso.");
      load();
    } catch (e) {
      toast.error("Erro ao excluir conta.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#ECDFCC]">Contas Bancárias</h1>
          <p className="text-xs text-[#9C9589]">Gerencie suas contas correntes, poupanças e investimentos</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#697565] text-[#ECDFCC] text-xs font-semibold hover:bg-[#7A8674] transition-all cursor-pointer shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Conta</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-[#9C9589] gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-[#697565]" />
          <span>Carregando...</span>
        </div>
      ) : accounts.length === 0 ? (
        <div className="card-glow p-8 text-center border border-[#3C3D37]">
          <Wallet className="w-12 h-12 text-[#697565] mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-[#ECDFCC]">Nenhuma conta cadastrada</h3>
          <p className="text-xs text-[#9C9589] mt-1 mb-4">Cadastre sua primeira conta corrente, carteira física ou investimento.</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-xl bg-[#697565] text-[#ECDFCC] text-xs font-semibold cursor-pointer"
          >
            Cadastrar Conta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {accounts.map(acc => {
            const logoUrl = getInstitutionLogo(acc.institution || acc.name);
            return (
              <div key={acc.id} className="card-glow p-5 border border-[#3C3D37] flex flex-col justify-between h-44 hover:border-[#697565]/60 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-[#181C14] border border-[#3C3D37] p-2 flex items-center justify-center shrink-0 shadow-inner">
                      <img 
                        src={logoUrl} 
                        alt={acc.institution || acc.name} 
                        className="w-full h-full object-contain" 
                        onError={(e) => { e.target.src = '/assets/logos/logo-generic-bank.svg'; }}
                      />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#ECDFCC]">{acc.name}</h3>
                      <p className="text-[11px] text-[#9C9589] font-medium">{acc.institution || 'Instituição não informada'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(acc.id)}
                    className="p-1.5 rounded-lg text-[#E57373] hover:bg-[#E57373]/10 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <span className="text-[10px] text-[#9C9589] uppercase tracking-wider font-semibold">Saldo Atual</span>
                  <h2 className="text-xl font-bold text-[#ECDFCC]">
                    R$ {Number(acc.balance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </h2>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Nova Conta com Seleção Visual de Bancos Pré-definidos */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-[#181C14] border border-[#3C3D37] rounded-2xl p-6 w-full max-w-lg space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#3C3D37] pb-3">
              <h2 className="text-base font-bold text-[#ECDFCC]">Cadastrar Nova Conta</h2>
              <button 
                onClick={() => setShowModal(false)}
                className="text-xs text-[#9C9589] hover:text-[#ECDFCC]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Seleção de Instituição Financeira Pré-definida */}
              <div>
                <label className="text-xs text-[#9C9589] font-medium block mb-2">
                  Escolha uma Instituição Financeira / Banco
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {PREDEFINED_INSTITUTIONS.map((inst) => {
                    const isSelected = selectedInstId === inst.id;
                    return (
                      <div
                        key={inst.id}
                        onClick={() => handleSelectInstitution(inst)}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#697565]/25 border-[#697565] text-[#ECDFCC] shadow-md scale-[1.02]'
                            : 'bg-[#1E2218] border-[#3C3D37] text-[#9C9589] hover:border-[#697565]/50 hover:text-[#ECDFCC]'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-[#181C14] p-1.5 flex items-center justify-center border border-[#3C3D37]">
                          <img 
                            src={inst.logo} 
                            alt={inst.name} 
                            className="w-full h-full object-contain" 
                          />
                        </div>
                        <span className="text-[11px] font-semibold truncate max-w-full">{inst.name}</span>
                        {/* {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-[#4CAF50] text-white flex items-center justify-center">
                            <Check className="w-3 h-3" />
                          </div>
                        )} */}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Se a opção 'outro' estiver selecionada, habilita digitação da instituição */}
              {selectedInstId === 'outro' && (
                <div>
                  <label className="text-xs text-[#9C9589] block mb-1">Nome da Instituição Personalizada</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Santander, Bradesco, Caixa, C6..."
                    value={form.institution}
                    onChange={e => setForm({ ...form, institution: e.target.value })}
                    className="w-full bg-[#3C3D37] text-xs text-[#ECDFCC] p-2.5 rounded-xl border border-[#4A4B44] outline-none focus:border-[#697565]"
                  />
                </div>
              )}

              <div>
                <label className="text-xs text-[#9C9589] block mb-1">Nome Identificador da Conta</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Nubank Corrente ou Carteira Principal"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-[#3C3D37] text-xs text-[#ECDFCC] p-2.5 rounded-xl border border-[#4A4B44] outline-none focus:border-[#697565]"
                />
              </div>

              <div>
                <label className="text-xs text-[#9C9589] block mb-1">Saldo Inicial (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={form.balance}
                  onChange={e => setForm({ ...form, balance: e.target.value })}
                  className="w-full bg-[#3C3D37] text-xs text-[#ECDFCC] p-2.5 rounded-xl border border-[#4A4B44] outline-none focus:border-[#697565]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#3C3D37]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-[#9C9589] hover:bg-[#3C3D37] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#697565] text-[#ECDFCC] hover:bg-[#7A8674] cursor-pointer shadow-md"
                >
                  Salvar Conta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
