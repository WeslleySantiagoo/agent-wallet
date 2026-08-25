import React, { useEffect, useState } from 'react';
import { exportDatabaseUrl, importDatabase, getAIProviders, updateAIProviders, getAIUsageStats, resetDatabaseApi } from '../services/api';
import { saveDatabaseToLocalStorage, getLocalStorageBackupInfo, restoreDatabaseFromLocalStorage } from '../utils/dbStorage';
import { Download, Upload, Cpu, Eye, EyeOff, Save, CheckCircle2, ShieldCheck, FileSpreadsheet, AlertTriangle, Activity, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown, Trash2, RefreshCw, HardDrive } from 'lucide-react';
import { useAIChat } from '../context/AIChatContext';
import { useToast } from '../context/ToastContext';
import { CustomSelect } from '../components/common/CustomSelect';

// Componente Helper de Transição de Altura Suave via CSS Grid
const CollapsibleSection = ({ isOpen, children, className = '' }) => {
  return (
    <div className={`grid transition-all duration-500 ease-in-out ${
      isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'
    }`}>
      <div className="overflow-hidden">
        <div className={className}>
          {children}
        </div>
      </div>
    </div>
  );
};

const RESET_TARGET_OPTIONS = [
  { id: 'transactions', label: 'Transações e Extrato', desc: 'Histórico completo de despesas, receitas e lançamentos', icon: '💸' },
  { id: 'credit_cards', label: 'Cartões de Crédito e Faturas', desc: 'Cartões cadastrados, limites e faturas associadas', icon: '💳' },
  { id: 'accounts', label: 'Contas Bancárias e Carteiras', desc: 'Contas de cheques, poupanças e investimentos', icon: '🏦' },
  { id: 'categories', label: 'Categorias e Subcategorias', desc: 'Personalizações de categorias (recria as categorias padrão)', icon: '🏷️' },
  { id: 'chat_history', label: 'Histórico de Conversas da IA', desc: 'Mensagens e conversas salvas no assistente de IA', icon: '🤖' },
];

export const Settings = () => {
  const { toast } = useToast();
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [dragError, setDragError] = useState('');
  const [showKeys, setShowKeys] = useState({});
  const [savingConfig, setSavingConfig] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // LocalStorage Backup State
  const [localBackupInfo, setLocalBackupInfo] = useState({ hasBackup: false, timestamp: null, sizeKB: 0 });
  const [savingLocalBackup, setSavingLocalBackup] = useState(false);
  const [restoringLocalBackup, setRestoringLocalBackup] = useState(false);

  // AI Usage State
  const [aiUsageStats, setAiUsageStats] = useState(null);
  const [isUsageLoading, setIsUsageLoading] = useState(false);
  const [usageExpanded, setUsageExpanded] = useState(false);
  const [sortColumn, setSortColumn] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');

  // Expandable Providers State (default collapsed)
  const [expandedProviders, setExpandedProviders] = useState({});

  // Danger Zone State
  const [showDangerZone, setShowDangerZone] = useState(false);

  // Reset DB State & Selective Reset Target Selection
  const [showResetModal, setShowResetModal] = useState(false);
  const [confirmResetInput, setConfirmResetInput] = useState('');
  const [resetting, setResetting] = useState(false);
  const [selectedResetTargets, setSelectedResetTargets] = useState([
    'transactions', 'credit_cards', 'accounts', 'categories', 'chat_history'
  ]);

  const { providersData, setProvidersData, reloadProviders } = useAIChat();

  const refreshLocalBackupInfo = () => {
    setLocalBackupInfo(getLocalStorageBackupInfo());
  };

  useEffect(() => {
    loadConfig();
    refreshLocalBackupInfo();
    // Tenta salvar auto-backup no LocalStorage ao carregar a página para garantia de persistência
    saveDatabaseToLocalStorage().then(() => refreshLocalBackupInfo()).catch(() => {});
  }, []);

  const loadUsageStats = async () => {
    setIsUsageLoading(true);
    try {
      const usage = await getAIUsageStats();
      setAiUsageStats(usage);
    } catch (e) {
      console.warn("Erro ao carregar uso da IA:", e);
      toast.error("Erro ao carregar estatísticas de uso da IA");
    } finally {
      setIsUsageLoading(false);
    }
  };

  const loadConfig = async () => {
    try {
      const data = await getAIProviders();
      setProvidersData(data || {});
    } catch (e) {
      console.warn("Erro ao carregar providers:", e);
    }
    
    await loadUsageStats();
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedModels = React.useMemo(() => {
    if (!aiUsageStats?.models) return [];
    const models = [...aiUsageStats.models];
    if (sortColumn) {
      models.sort((a, b) => {
        let valA = a[sortColumn];
        let valB = b[sortColumn];
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        
        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return models;
  }, [aiUsageStats, sortColumn, sortDirection]);

  const handleExport = () => {
    const link = document.createElement('a');
    link.href = exportDatabaseUrl;
    link.setAttribute('download', 'financas.db');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveLocalBackup = async () => {
    setSavingLocalBackup(true);
    try {
      const info = await saveDatabaseToLocalStorage();
      refreshLocalBackupInfo();
      toast.success(`Backup do banco salvo no Local Storage (${info.timestamp})!`);
    } catch (err) {
      toast.error("Erro ao salvar backup no Local Storage.");
    } finally {
      setSavingLocalBackup(false);
    }
  };

  const handleRestoreLocalBackup = async () => {
    setRestoringLocalBackup(true);
    try {
      await restoreDatabaseFromLocalStorage();
      toast.success("Banco de dados restaurado com sucesso a partir do Local Storage!");
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      toast.error("Erro ao restaurar backup do Local Storage: " + err.message);
    } finally {
      setRestoringLocalBackup(false);
    }
  };

  const processImportFile = async (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.db')) {
      setDragError('Formato inválido! O arquivo deve ter a extensão .db (ex: financas.db).');
      return;
    }

    setDragError('');
    setImporting(true);
    setImportStatus('');

    try {
      const res = await importDatabase(file);
      setImportStatus('✅ ' + (res.message || 'Banco de dados importado com sucesso! Recarregando...'));
      toast.success('Banco de dados importado com sucesso!');
      await saveDatabaseToLocalStorage().catch(() => {});
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      const errDetail = err.response?.data?.detail || err.message;
      setImportStatus('❌ Erro ao importar: ' + errDetail);
      toast.error('Erro ao importar banco: ' + errDetail);
    } finally {
      setImporting(false);
    }
  };

  const handleImportInputChange = (e) => {
    const file = e.target.files[0];
    processImportFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      processImportFile(droppedFile);
      e.dataTransfer.clearData();
    }
  };

  const toggleKeyVisibility = (modelKey) => {
    setShowKeys(prev => ({ ...prev, [modelKey]: !prev[modelKey] }));
  };

  const toggleProviderExpanded = (providerName) => {
    setExpandedProviders(prev => ({
      ...prev,
      [providerName]: prev[providerName] === undefined ? true : !prev[providerName]
    }));
  };

  const handleApiKeyChange = (providerName, modelId, newKeyVal) => {
    setProvidersData(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      if (updated[providerName] && updated[providerName][modelId]) {
        const item = updated[providerName][modelId];
        if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
          item.api_key = newKeyVal ? newKeyVal : false;
        } else if (Array.isArray(item)) {
          item[item.length - 1] = newKeyVal ? newKeyVal : false;
        }
      }
      return updated;
    });
  };

  const handleInputTypeChange = (providerName, modelId, newTypeVal) => {
    setProvidersData(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      if (updated[providerName] && updated[providerName][modelId]) {
        const item = updated[providerName][modelId];
        if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
          item.input_type = newTypeVal;
        }
      }
      return updated;
    });
  };

  const handleSaveAIConfig = async () => {
    setSavingConfig(true);
    setSaveSuccess(false);
    try {
      await updateAIProviders(providersData);
      setSaveSuccess(true);
      toast.success("Configurações de IA salvas com sucesso!");
      await reloadProviders();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      toast.error("Erro ao salvar configurações de IA: " + e.message);
    } finally {
      setSavingConfig(false);
    }
  };

  const handleToggleResetTarget = (targetId) => {
    setSelectedResetTargets(prev => {
      if (prev.includes(targetId)) {
        return prev.filter(id => id !== targetId);
      } else {
        return [...prev, targetId];
      }
    });
  };

  const handleToggleAllResetTargets = () => {
    if (selectedResetTargets.length === RESET_TARGET_OPTIONS.length) {
      setSelectedResetTargets([]);
    } else {
      setSelectedResetTargets(RESET_TARGET_OPTIONS.map(o => o.id));
    }
  };

  const handleResetDatabase = async () => {
    if (confirmResetInput.trim().toUpperCase() !== 'RESETAR') return;
    if (selectedResetTargets.length === 0) {
      toast.error("Selecione pelo menos um módulo para resetar.");
      return;
    }

    setResetting(true);
    try {
      const isAll = selectedResetTargets.length === RESET_TARGET_OPTIONS.length;
      await resetDatabaseApi({
        reset_all: isAll,
        targets: selectedResetTargets
      });
      toast.success("Reset concluído com sucesso!");
      setShowResetModal(false);
      await saveDatabaseToLocalStorage().catch(() => {});
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      toast.error("Erro ao resetar banco de dados: " + (err.response?.data?.detail || err.message));
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-[#ECDFCC]">Configurações</h1>
        <p className="text-xs text-[#9C9589]">Gerencie o backup local do seu SQLite e provedores de Inteligência Artificial</p>
      </div>

      {/* Persistence / Local-First DB Management */}
      <section className="card-glow p-6 border border-[#3C3D37] space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#697565]/20 flex items-center justify-center text-[#697565]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#ECDFCC]">Banco de Dados SQLite (Local-First)</h2>
            <p className="text-xs text-[#9C9589]">Sem banco em nuvem comercial. Histórico, sessões e configurações salvos no seu .db</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Export Card */}
          <div className="bg-[#181C14] p-5 rounded-xl border border-[#3C3D37] flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-semibold text-[#ECDFCC]">Exportar Banco de Dados</h3>
              <p className="text-[11px] text-[#9C9589] mt-1">Baixa o arquivo financas.db atual com todas as conversas e lançamentos.</p>
            </div>
            <button
              onClick={handleExport}
              className="mt-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#3C3D37] hover:bg-[#4A4B44] text-[#ECDFCC] text-xs font-semibold border border-[#4A4B44] transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Exportar .db</span>
            </button>
          </div>

          {/* Import Card with Drag and Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`p-5 rounded-xl border transition-all flex flex-col justify-between ${
              isDragging
                ? 'bg-[#697565]/20 border-[#697565] scale-[1.02] shadow-lg'
                : 'bg-[#181C14] border-[#3C3D37]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-[#ECDFCC]">Importar Banco de Dados (.db)</h3>
                <FileSpreadsheet className={`w-4 h-4 ${isDragging ? 'text-[#697565] animate-bounce' : 'text-[#9C9589]'}`} />
              </div>
              <p className="text-[11px] text-[#9C9589] mt-1">
                {isDragging ? 'Solte o arquivo .db aqui para importar!' : 'Clique abaixo ou arraste um arquivo .db para esta área.'}
              </p>
            </div>

            <label className="mt-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#697565] hover:bg-[#7A8674] text-[#ECDFCC] text-xs font-semibold cursor-pointer transition-colors shadow-md">
              <Upload className="w-4 h-4" />
              <span>
                {importing 
                  ? 'Importando...' 
                  : <><span className="md:hidden">Selecionar .db</span><span className="hidden md:inline">Selecionar ou Arrastar .db</span></>
                }
              </span>
              <input type="file" accept=".db" onChange={handleImportInputChange} className="hidden" />
            </label>
          </div>

          {/* Local Storage Backup Card */}
          <div className="bg-[#181C14] p-5 rounded-xl border border-[#3C3D37] flex flex-col justify-between col-span-1 sm:col-span-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-semibold text-[#ECDFCC]">Backup Automático no Navegador (Local Storage)</h3>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-[#697565]/20 text-[#697565] border border-[#697565]/30">
                    Segurança Local
                  </span>
                </div>
                <p className="text-[11px] text-[#9C9589] mt-1">
                  Guarda uma cópia de segurança do arquivo .db no Local Storage para recuperação sem perda de dados.
                </p>
                {localBackupInfo.hasBackup && (
                  <p className="text-[10px] text-[#697565] font-mono mt-1">
                    Último backup no navegador: {localBackupInfo.timestamp} ({localBackupInfo.sizeKB} KB)
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleSaveLocalBackup}
                  disabled={savingLocalBackup}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#3C3D37] hover:bg-[#4A4B44] text-[#ECDFCC] text-xs font-semibold border border-[#4A4B44] transition-colors cursor-pointer disabled:opacity-50"
                >
                  {savingLocalBackup ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Salvar Agora</span>
                </button>

                <button
                  type="button"
                  onClick={handleRestoreLocalBackup}
                  disabled={!localBackupInfo.hasBackup || restoringLocalBackup}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#697565] hover:bg-[#7A8674] disabled:opacity-40 text-[#ECDFCC] text-xs font-semibold transition-colors cursor-pointer shadow-md"
                >
                  {restoringLocalBackup ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <HardDrive className="w-3.5 h-3.5" />}
                  <span>Restaurar do Local Storage</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {dragError && (
          <div className="flex items-center gap-2 bg-[#E57373]/10 border border-[#E57373]/30 text-[#E57373] p-3 rounded-xl text-xs font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{dragError}</span>
          </div>
        )}

        {importStatus && (
          <p className="text-xs font-semibold text-center mt-2">{importStatus}</p>
        )}
      </section>

      {/* Consumo de Tokens & Custo Estimado da IA */}
      <section className="card-glow p-6 border border-[#3C3D37] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#697565]/20 flex items-center justify-center text-[#697565]">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#ECDFCC]">Consumo de Tokens & Custos de IA</h2>
              <p className="text-xs text-[#9C9589]">Estatísticas de chamadas e estimativa de gastos por modelo</p>
            </div>
          </div>

          <button
            onClick={loadUsageStats}
            disabled={isUsageLoading}
            className="p-2 rounded-xl bg-[#181C14] hover:bg-[#3C3D37] text-[#9C9589] hover:text-[#ECDFCC] border border-[#3C3D37] transition-colors cursor-pointer"
            title="Atualizar estatísticas"
          >
            <RefreshCw className={`w-4 h-4 ${isUsageLoading ? 'animate-spin text-[#697565]' : ''}`} />
          </button>
        </div>

        {/* Resumo em Cards Minimalistas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#181C14] p-3.5 rounded-xl border border-[#3C3D37]">
            <span className="text-[10px] text-[#9C9589] font-semibold uppercase tracking-wider block">Total Chamadas</span>
            <p className="text-lg font-bold text-[#ECDFCC] mt-0.5">{aiUsageStats?.total_calls || 0}</p>
          </div>
          <div className="bg-[#181C14] p-3.5 rounded-xl border border-[#3C3D37]">
            <span className="text-[10px] text-[#9C9589] font-semibold uppercase tracking-wider block">Tokens Entrada</span>
            <p className="text-lg font-bold text-[#ECDFCC] mt-0.5">{(aiUsageStats?.total_input_tokens || 0).toLocaleString('pt-BR')}</p>
          </div>
          <div className="bg-[#181C14] p-3.5 rounded-xl border border-[#3C3D37]">
            <span className="text-[10px] text-[#9C9589] font-semibold uppercase tracking-wider block">Tokens Saída</span>
            <p className="text-lg font-bold text-[#ECDFCC] mt-0.5">{(aiUsageStats?.total_output_tokens || 0).toLocaleString('pt-BR')}</p>
          </div>
          <div className="bg-[#181C14] p-3.5 rounded-xl border border-[#3C3D37]">
            <span className="text-[10px] text-[#9C9589] font-semibold uppercase tracking-wider block">Custo Total (USD)</span>
            <p className="text-lg font-bold text-[#4CAF50] mt-0.5">
              ${(Number(aiUsageStats?.total_estimated_cost_usd) || 0).toFixed(4)}
            </p>
          </div>
        </div>

        {/* Detalhamento Expansível por Modelo com Ordenação de Colunas */}
        <div className="border border-[#3C3D37] rounded-xl bg-[#181C14] overflow-hidden">
          <button
            type="button"
            onClick={() => setUsageExpanded(!usageExpanded)}
            className="w-full p-3.5 flex items-center justify-between text-left hover:bg-[#3C3D37]/30 transition-colors cursor-pointer"
          >
            <span className="text-xs font-semibold text-[#ECDFCC]">Detalhamento por Modelo de IA</span>
            <div className="flex items-center gap-2 text-[#9C9589]">
              <span className="text-[10px]">{sortedModels.length} modelos utilizados</span>
              <ChevronDown 
                className={`w-4 h-4 transition-transform duration-500 ${usageExpanded ? 'rotate-180 text-[#ECDFCC]' : 'rotate-0'}`} 
              />
            </div>
          </button>

          <CollapsibleSection isOpen={usageExpanded} className="border-t border-[#3C3D37]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#1E2218] text-[#9C9589] font-mono text-[10px] uppercase border-b border-[#3C3D37]">
                    <th onClick={() => handleSort('model_name')} className="py-2.5 px-3.5 cursor-pointer select-none hover:text-[#ECDFCC]">
                      <div className="flex items-center gap-1">
                        <span>Modelo</span>
                        {sortColumn === 'model_name' ? (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-[#697565]" /> : <ArrowDown className="w-3 h-3 text-[#697565]" />) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                      </div>
                    </th>
                    <th onClick={() => handleSort('calls')} className="py-2.5 px-3.5 text-right cursor-pointer select-none hover:text-[#ECDFCC]">
                      <div className="flex items-center justify-end gap-1">
                        <span>Chamadas</span>
                        {sortColumn === 'calls' ? (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-[#697565]" /> : <ArrowDown className="w-3 h-3 text-[#697565]" />) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                      </div>
                    </th>
                    <th onClick={() => handleSort('input_tokens')} className="py-2.5 px-3.5 text-right cursor-pointer select-none hover:text-[#ECDFCC]">
                      <div className="flex items-center justify-end gap-1">
                        <span>Input Tokens</span>
                        {sortColumn === 'input_tokens' ? (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-[#697565]" /> : <ArrowDown className="w-3 h-3 text-[#697565]" />) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                      </div>
                    </th>
                    <th onClick={() => handleSort('output_tokens')} className="py-2.5 px-3.5 text-right cursor-pointer select-none hover:text-[#ECDFCC]">
                      <div className="flex items-center justify-end gap-1">
                        <span>Output Tokens</span>
                        {sortColumn === 'output_tokens' ? (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-[#697565]" /> : <ArrowDown className="w-3 h-3 text-[#697565]" />) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                      </div>
                    </th>
                    <th onClick={() => handleSort('estimated_cost_usd')} className="py-2.5 px-3.5 text-right cursor-pointer select-none hover:text-[#ECDFCC]">
                      <div className="flex items-center justify-end gap-1">
                        <span>Custo USD</span>
                        {sortColumn === 'estimated_cost_usd' ? (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-[#697565]" /> : <ArrowDown className="w-3 h-3 text-[#697565]" />) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3C3D37]">
                  {sortedModels.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-4 text-center text-[11px] text-[#9C9589]">
                        Nenhum registro de chamada até o momento.
                      </td>
                    </tr>
                  ) : (
                    sortedModels.map((m, idx) => (
                      <tr key={idx} className="hover:bg-[#3C3D37]/20">
                        <td className="py-2.5 px-3.5 font-medium text-[#ECDFCC] font-mono text-[11px]">
                          {m.model_name}
                          <span className="block text-[9px] text-[#9C9589] font-sans">{m.provider}</span>
                        </td>
                        <td className="py-2.5 px-3.5 text-right text-[#ECDFCC] font-mono">{(m.calls || 0).toLocaleString('pt-BR')}</td>
                        <td className="py-2.5 px-3.5 text-right text-[#9C9589] font-mono">{(m.input_tokens || 0).toLocaleString('pt-BR')}</td>
                        <td className="py-2.5 px-3.5 text-right text-[#9C9589] font-mono">{(m.output_tokens || 0).toLocaleString('pt-BR')}</td>
                        <td className="py-2.5 px-3.5 text-right font-mono font-bold text-[#4CAF50]">
                          ${(Number(m.estimated_cost_usd) || 0).toFixed(4)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CollapsibleSection>
        </div>
      </section>

      {/* AI Providers Section with Collapsible Provider Accordions */}
      <section className="card-glow p-6 border border-[#3C3D37] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#697565]/20 flex items-center justify-center text-[#697565]">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#ECDFCC]">Provedores & Modelos de IA</h2>
              <p className="text-xs text-[#9C9589]">Insira suas API Keys locais. Elas ficam armazenadas exclusivamente no seu SQLite</p>
            </div>
          </div>

          <button
            onClick={handleSaveAIConfig}
            disabled={savingConfig}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#697565] hover:bg-[#7A8674] text-[#ECDFCC] text-xs font-bold transition-all shadow-md cursor-pointer shrink-0"
          >
            {savingConfig ? <RefreshCw className="w-4 h-4 animate-spin" /> : saveSuccess ? <CheckCircle2 className="w-4 h-4 text-[#4CAF50]" /> : <Save className="w-4 h-4" />}
            <span>{savingConfig ? 'Salvando...' : saveSuccess ? 'Salvo!' : 'Salvar Alterações'}</span>
          </button>
        </div>

        {/* Dynamic Accordions by AI Provider */}
        <div className="space-y-4">
          {Object.entries(providersData).map(([providerName, modelsDict]) => {
            const isExpanded = expandedProviders[providerName] || false;
            const modelsCount = Object.keys(modelsDict || {}).length;

            return (
              <div key={providerName} className="border border-[#3C3D37] rounded-xl bg-[#181C14] overflow-hidden">
                {/* Header do Accordion do Provedor */}
                <button
                  type="button"
                  onClick={() => toggleProviderExpanded(providerName)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-[#3C3D37]/30 transition-colors cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-[#ECDFCC]">{providerName}</span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-[#3C3D37] text-[#9C9589]">
                      {modelsCount} {modelsCount === 1 ? 'modelo' : 'modelos'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[#9C9589]">
                    <span className="text-[10px] hidden sm:inline">{isExpanded ? 'Ocultar modelos' : 'Ver modelos'}</span>
                    <ChevronDown 
                      className={`w-4 h-4 transition-transform duration-500 ${isExpanded ? 'rotate-180 text-[#ECDFCC]' : 'rotate-0'}`} 
                    />
                  </div>
                </button>

                {/* Conteúdo Expansível com Animação Suave */}
                <CollapsibleSection isOpen={isExpanded} className="p-4 border-t border-[#3C3D37] space-y-4 bg-[#1E2218]/40">
                  {Object.entries(modelsDict).map(([modelId, mData]) => {
                    let displayName = modelId;
                    let inputTypeVal = 'text';
                    let apiKeyVal = '';
                    let isSystemFree = false;

                    if (typeof mData === 'object' && mData !== null && !Array.isArray(mData)) {
                      displayName = mData.name || modelId;
                      inputTypeVal = mData.input_type || 'text';
                      apiKeyVal = typeof mData.api_key === 'string' ? mData.api_key : '';
                      isSystemFree = mData.is_system_free || false;
                    } else if (Array.isArray(mData)) {
                      displayName = mData[0];
                      apiKeyVal = typeof mData[mData.length - 1] === 'string' ? mData[mData.length - 1] : '';
                    }

                    const modelKeyStr = `${providerName}-${modelId}`;
                    const isVisible = showKeys[modelKeyStr];

                    return (
                      <div key={modelId} className="bg-[#181C14] p-4 rounded-xl border border-[#3C3D37] space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#ECDFCC]">{displayName}</span>
                            <span className="text-[10px] font-mono text-[#9C9589]">({modelId})</span>
                            {isSystemFree && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-[#697565]/20 text-[#697565] border border-[#697565]/30">
                                Grátis do Sistema
                              </span>
                            )}
                          </div>

                          {/* Seletor Customizado de Formato de Input (Texto, Áudio, Multimodal) */}
                          <div className="w-full sm:w-44">
                            <CustomSelect
                              value={inputTypeVal}
                              onChange={(val) => handleInputTypeChange(providerName, modelId, val)}
                              options={[
                                { value: 'text', label: 'Texto' },
                                { value: 'audio', label: 'Áudio (Voz)' },
                                { value: 'multimodal', label: 'Multimodal' }
                              ]}
                            />
                          </div>
                        </div>

                        {/* Input da API Key */}
                        <div>
                          <label className="text-[10px] text-[#9C9589] font-medium block mb-1 uppercase tracking-wider">
                            API Key
                          </label>
                          <div className="relative flex items-center">
                            <input
                              type={isVisible ? "text" : "password"}
                              placeholder={isSystemFree ? "Chave gerenciada pelo sistema (Gratuito)" : "Ex: AIzaSy... (deixe em branco se não possui)"}
                              value={apiKeyVal}
                              disabled={isSystemFree}
                              onChange={(e) => handleApiKeyChange(providerName, modelId, e.target.value)}
                              className="w-full bg-[#1E2218] text-xs text-[#ECDFCC] px-3 py-2 pr-10 rounded-xl border border-[#3C3D37] outline-none focus:border-[#697565] transition-all font-mono disabled:opacity-60"
                            />
                            {!isSystemFree && (
                              <button
                                type="button"
                                onClick={() => toggleKeyVisibility(modelKeyStr)}
                                className="absolute right-3 text-[#9C9589] hover:text-[#ECDFCC] transition-colors"
                              >
                                {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CollapsibleSection>
              </div>
            );
          })}
        </div>
      </section>

      {/* Discrete Danger Zone Collapsible Area at Bottom of Page */}
      <section className="bg-[#181C14] border border-[#E57373]/20 rounded-2xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowDangerZone(!showDangerZone)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-[#E57373]/5 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-[#E57373]" />
            <div>
              <h3 className="text-xs font-bold text-[#E57373]">Zona de Perigo (Ações Destrutivas)</h3>
              <p className="text-[11px] text-[#9C9589]">Opções avançadas de redefinição seletiva ou total de dados</p>
            </div>
          </div>
          <ChevronDown 
            className={`w-4 h-4 text-[#9C9589] transition-transform duration-500 ${showDangerZone ? 'rotate-180 text-[#E57373]' : 'rotate-0'}`} 
          />
        </button>

        <CollapsibleSection isOpen={showDangerZone} className="p-4 border-t border-[#E57373]/20 bg-[#E57373]/5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#181C14] p-4 rounded-xl border border-[#E57373]/30 mt-3">
            <div>
              <h4 className="text-xs font-bold text-[#ECDFCC]">Resetar Dados do Sistema</h4>
              <p className="text-[11px] text-[#9C9589] mt-0.5">
                Escolha e apague seletivamente ou totalmente suas contas, cartões, faturas, lançamentos e conversas de IA.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setConfirmResetInput('');
                setSelectedResetTargets(['transactions', 'credit_cards', 'accounts', 'categories', 'chat_history']);
                setShowResetModal(true);
              }}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#E57373]/20 hover:bg-[#E57373]/40 text-[#E57373] text-xs font-semibold border border-[#E57373]/50 transition-colors shrink-0 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Resetar Banco</span>
            </button>
          </div>
        </CollapsibleSection>
      </section>

      {/* Sensitive Reset Database Modal Confirmation com Escolha Seletiva */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#181C14] border border-[#E57373]/50 rounded-2xl p-6 max-w-lg w-full space-y-5 shadow-2xl transition-all duration-300 transform scale-100 max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#3C3D37] pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#E57373]/20 flex items-center justify-center text-[#E57373] shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#ECDFCC]">Resetar Banco de Dados</h3>
                  <p className="text-xs text-[#E57373]">Selecione quais informações deseja apagar</p>
                </div>
              </div>
            </div>

            <div className="overflow-y-auto space-y-4 pr-1 flex-1">
              <p className="text-xs text-[#9C9589] leading-relaxed">
                Marque abaixo as informações em alto nível que você deseja remover do seu sistema.
              </p>

              {/* Lista Seletiva de Entidades */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1 pb-1 border-b border-[#3C3D37]/60 text-xs text-[#9C9589]">
                  <span className="font-semibold text-[11px] uppercase tracking-wider">Informações Salvas</span>
                  <button
                    type="button"
                    onClick={handleToggleAllResetTargets}
                    className="text-[11px] text-[#697565] hover:text-[#ECDFCC] font-semibold cursor-pointer"
                  >
                    {selectedResetTargets.length === RESET_TARGET_OPTIONS.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                  </button>
                </div>

                {RESET_TARGET_OPTIONS.map(opt => {
                  const isChecked = selectedResetTargets.includes(opt.id);
                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleToggleResetTarget(opt.id)}
                      className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-[#E57373]/10 border-[#E57373]/50 text-[#ECDFCC]'
                          : 'bg-[#181C14] border-[#3C3D37] text-[#9C9589] hover:border-[#697565]/40'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-0.5 accent-[#E57373] w-4 h-4 cursor-pointer"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{opt.icon}</span>
                          <span className="text-xs font-bold text-[#ECDFCC]">{opt.label}</span>
                        </div>
                        <p className="text-[11px] text-[#9C9589] mt-0.5">{opt.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2 bg-[#E57373]/10 p-3 rounded-xl border border-[#E57373]/20">
                <label className="text-[11px] font-semibold text-[#ECDFCC] block">
                  Para confirmar o reset dos itens selecionados, digite <span className="text-[#E57373] font-mono">RESETAR</span> abaixo:
                </label>
                <input
                  type="text"
                  value={confirmResetInput}
                  onChange={(e) => setConfirmResetInput(e.target.value)}
                  placeholder="RESETAR"
                  className="w-full bg-[#181C14] border border-[#E57373]/40 rounded-xl px-3 py-2 text-xs text-[#ECDFCC] font-mono outline-none focus:border-[#E57373]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#3C3D37] shrink-0">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 rounded-xl bg-[#3C3D37] hover:bg-[#4A4B44] text-[#ECDFCC] text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={confirmResetInput.trim().toUpperCase() !== 'RESETAR' || selectedResetTargets.length === 0 || resetting}
                onClick={handleResetDatabase}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#E57373] hover:bg-[#D32F2F] disabled:opacity-40 text-white text-xs font-semibold transition-colors shadow-lg cursor-pointer"
              >
                {resetting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>{resetting ? 'Resetando...' : 'Confirmar Reset'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
