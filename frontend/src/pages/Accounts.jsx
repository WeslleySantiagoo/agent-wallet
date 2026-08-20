import React, { useEffect, useState } from 'react';
import { getAccounts, createAccount, deleteAccount } from '../services/api';
import { Plus, Trash2, Wallet, Building, RefreshCw } from 'lucide-react';

export const Accounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', institution: '', balance: 0, type: 'CHECKING' });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createAccount({ ...form, balance: parseFloat(form.balance) });
      setShowModal(false);
      setForm({ name: '', institution: '', balance: 0, type: 'CHECKING' });
      load();
    } catch (e) {
      alert("Erro ao criar conta: " + e.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Tem certeza que deseja excluir esta conta? Isso removerá suas transações (CASCADE).")) return;
    try {
      await deleteAccount(id);
      load();
    } catch (e) {
      alert("Erro ao excluir conta.");
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
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#697565] text-[#ECDFCC] text-xs font-semibold hover:bg-[#7A8674] transition-all"
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
          <p className="text-xs text-[#9C9589] mt-1 mb-4">Cadastre sua primeira conta corrente ou investimento.</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-xl bg-[#697565] text-[#ECDFCC] text-xs font-semibold"
          >
            Cadastrar Conta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {accounts.map(acc => (
            <div key={acc.id} className="card-glow p-5 border border-[#3C3D37] flex flex-col justify-between h-40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#697565]/20 flex items-center justify-center text-[#697565]">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#ECDFCC]">{acc.name}</h3>
                    <p className="text-[11px] text-[#9C9589]">{acc.institution || 'Instituição não informada'}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(acc.id)}
                  className="p-1.5 rounded-lg text-[#E57373] hover:bg-[#E57373]/10"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div>
                <span className="text-[10px] text-[#9C9589] uppercase">Saldo Atual</span>
                <h2 className="text-xl font-bold text-[#ECDFCC]">
                  R$ {Number(acc.balance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h2>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Nova Conta */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E2218] border border-[#3C3D37] rounded-2xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-base font-bold text-[#ECDFCC]">Cadastrar Nova Conta</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-[#9C9589] block mb-1">Nome da Conta</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Itaú Corrente"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-[#3C3D37] text-xs text-[#ECDFCC] p-2.5 rounded-xl border border-[#4A4B44] outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-[#9C9589] block mb-1">Instituição Financeira</label>
                <input
                  type="text"
                  placeholder="Ex: Itaú Unibanco"
                  value={form.institution}
                  onChange={e => setForm({ ...form, institution: e.target.value })}
                  className="w-full bg-[#3C3D37] text-xs text-[#ECDFCC] p-2.5 rounded-xl border border-[#4A4B44] outline-none"
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
                  className="w-full bg-[#3C3D37] text-xs text-[#ECDFCC] p-2.5 rounded-xl border border-[#4A4B44] outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-[#9C9589] hover:bg-[#3C3D37]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#697565] text-[#ECDFCC]"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
