import React, { useEffect, useState } from 'react';
import { exportDatabaseUrl, importDatabase, getAIProviders, updateAIProviders, getAIUsageStats, resetDatabaseApi } from '../services/api';
import { Download, Upload, Cpu, Eye, EyeOff, Save, CheckCircle2, ShieldCheck, FileSpreadsheet, AlertTriangle, Activity, ChevronDown, ChevronUp, ArrowUpDown, ArrowUp, ArrowDown, Trash2, RefreshCw } from 'lucide-react';
import { useAIChat } from '../context/AIChatContext';
import { useToast } from '../context/ToastContext';

export const Settings = () => {
  const { toast } = useToast();
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [dragError, setDragError] = useState('');
  const [showKeys, setShowKeys] = useState({});
  const [savingConfig, setSavingConfig] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
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

  // Reset DB State & Confirmation Modal
  const [showResetModal, setShowResetModal] = useState(false);
  const [confirmResetInput, setConfirmResetInput] = useState('');
  const [resetting, setResetting] = useState(false);
  
  const { providersData, setProvidersData, reloadProviders } = useAIChat();

  useEffect(() => {
    loadConfig();
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
    window.open(exportDatabaseUrl, '_blank');
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

  const handleResetDatabase = async () => {
    if (confirmResetInput.trim().toUpperCase() !== 'RESETAR') return;
    setResetting(true);
    try {
      await resetDatabaseApi();
      toast.success("Banco de dados resetado com sucesso!");
      window.location.reload();
    } catch (err) {
      toast.error("Erro ao resetar banco de dados: " + (err.response?.data?.detail || err.message));
    } finally {
      setResetting(false);
      setShowResetModal(false);
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
              className="mt-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#3C3D37] hover:bg-[#4A4B44] text-[#ECDFCC] text-xs font-semibold border border-[#4A4B44] transition-colors"
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
              <span>{importing ? 'Importando...' : 'Selecionar ou Arrastar .db'}</span>
              <input type="file" accept=".db" onChange={handleImportInputChange} className="hidden" />
            </label>
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

      {/* AI Usage Stats (Positioned ABOVE AI Providers, with Reload Button) */}
      <section className="card-glow p-6 border border-[#3C3D37] space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#697565]/20 flex items-center justify-center text-[#697565]">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#ECDFCC]">Estatísticas de Uso da IA</h2>
              <p className="text-xs text-[#9C9589]">Métricas globais de requisições, tokens e performance</p>
            </div>
          </div>

          <button
            onClick={loadUsageStats}
            disabled={isUsageLoading}
            title="Recarregar estatísticas de uso"
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#3C3D37] hover:bg-[#4A4B44] text-[#ECDFCC] text-xs font-medium border border-[#4A4B44] transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isUsageLoading ? 'animate-spin text-[#697565]' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </button>
        </div>

        {isUsageLoading && !aiUsageStats ? (
          <div className="text-xs text-[#9C9589] animate-pulse">Carregando métricas...</div>
        ) : aiUsageStats ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#181C14] border border-[#3C3D37] p-4 rounded-xl">
                <p className="text-[10px] text-[#9C9589] font-semibold uppercase tracking-wider">Total de Tokens</p>
                <p className="text-lg font-bold text-[#ECDFCC] mt-1">{aiUsageStats.total_tokens?.toLocaleString()}</p>
              </div>
              <div className="bg-[#181C14] border border-[#3C3D37] p-4 rounded-xl">
                <p className="text-[10px] text-[#9C9589] font-semibold uppercase tracking-wider">Tokens p/ Min (TPM)</p>
                <p className="text-lg font-bold text-[#ECDFCC] mt-1">{aiUsageStats.global_tpm?.toLocaleString()}</p>
              </div>
              <div className="bg-[#181C14] border border-[#3C3D37] p-4 rounded-xl">
                <p className="text-[10px] text-[#9C9589] font-semibold uppercase tracking-wider">Reqs p/ Min (RPM)</p>
                <p className="text-lg font-bold text-[#ECDFCC] mt-1">{aiUsageStats.global_rpm}</p>
              </div>
              <div className="bg-[#181C14] border border-[#3C3D37] p-4 rounded-xl">
                <p className="text-[10px] text-[#9C9589] font-semibold uppercase tracking-wider">Reqs p/ Dia (RPD)</p>
                <p className="text-lg font-bold text-[#ECDFCC] mt-1">{aiUsageStats.global_rpd}</p>
              </div>
            </div>

            <div className="bg-[#181C14] border border-[#3C3D37] rounded-xl overflow-hidden">
              <button 
                onClick={() => setUsageExpanded(!usageExpanded)}
                className="w-full p-4 flex items-center justify-between hover:bg-[#3C3D37]/40 transition-colors"
              >
                <span className="text-xs font-bold text-[#ECDFCC]">Uso Detalhado por Modelo</span>
                {usageExpanded ? <ChevronUp className="w-4 h-4 text-[#9C9589]" /> : <ChevronDown className="w-4 h-4 text-[#9C9589]" />}
              </button>

              {usageExpanded && (
                <div className="border-t border-[#3C3D37] p-4 overflow-x-auto">
                  <table className="w-full text-left text-xs text-[#9C9589] min-w-[700px]">
                    <thead className="border-b border-[#3C3D37]">
                      <tr>
                        {[
                          { key: 'provider', label: 'Provedor' },
                          { key: 'model', label: 'Modelo' },
                          { key: 'requests', label: 'Requisições' },
                          { key: 'input_tokens', label: 'In Tokens' },
                          { key: 'output_tokens', label: 'Out Tokens' },
                          { key: 'total_tokens', label: 'Total Tokens' },
                          { key: 'rpm', label: 'RPM' },
                          { key: 'tpm', label: 'TPM' },
                          { key: 'rpd', label: 'RPD' }
                        ].map((col) => (
                          <th 
                            key={col.key} 
                            className="p-2 cursor-pointer hover:text-[#ECDFCC] transition-colors whitespace-nowrap"
                            onClick={() => handleSort(col.key)}
                          >
                            <div className="flex items-center gap-1">
                              {col.label}
                              {sortColumn === col.key ? (
                                sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-[#697565]" /> : <ArrowDown className="w-3 h-3 text-[#697565]" />
                              ) : (
                                <ArrowUpDown className="w-3 h-3 opacity-30" />
                              )}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedModels.map((m, idx) => (
                        <tr key={idx} className="border-b border-[#3C3D37]/40 hover:bg-[#3C3D37]/20 transition-colors">
                          <td className="p-2 font-semibold text-[#ECDFCC]">{m.provider}</td>
                          <td className="p-2 font-mono text-[10px]">{m.model}</td>
                          <td className="p-2">{m.requests}</td>
                          <td className="p-2 text-[#4CAF50]">{m.input_tokens?.toLocaleString()}</td>
                          <td className="p-2 text-[#2196F3]">{m.output_tokens?.toLocaleString()}</td>
                          <td className="p-2 font-semibold text-[#ECDFCC]">{m.total_tokens?.toLocaleString()}</td>
                          <td className="p-2">{m.rpm}</td>
                          <td className="p-2">{m.tpm?.toLocaleString()}</td>
                          <td className="p-2">{m.rpd}</td>
                        </tr>
                      ))}
                      {sortedModels.length === 0 && (
                        <tr>
                          <td colSpan="9" className="p-4 text-center text-xs opacity-50">Nenhum uso registrado.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-xs text-[#9C9589]">Nenhuma métrica disponível.</div>
        )}
      </section>

      {/* Dynamic AI Providers & Models Configuration (Expandable, DEFAULT COLLAPSED) */}
      <section className="card-glow p-6 border border-[#3C3D37] space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#697565]/20 flex items-center justify-center text-[#697565]">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#ECDFCC]">Provedores e Modelos de IA</h2>
              <p className="text-xs text-[#9C9589]">Clique no provedor para expandir e gerenciar suas API Keys</p>
            </div>
          </div>

          <button
            onClick={handleSaveAIConfig}
            disabled={savingConfig}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#697565] text-[#ECDFCC] text-xs font-semibold hover:bg-[#7A8674] transition-all shadow-md"
          >
            {saveSuccess ? <CheckCircle2 className="w-4 h-4 text-[#4CAF50]" /> : <Save className="w-4 h-4" />}
            <span>{savingConfig ? 'Salvando...' : saveSuccess ? 'Salvo!' : 'Salvar Configurações'}</span>
          </button>
        </div>

        <div className="space-y-3">
          {Object.entries(providersData || {}).map(([providerName, modelsDict]) => {
            // DEFAULT COLLAPSED unless explicitly toggled to true
            const isExpanded = expandedProviders[providerName] ?? false;
            const modelsCount = Object.keys(modelsDict || {}).length;

            return (
              <div key={providerName} className="bg-[#181C14] rounded-xl border border-[#3C3D37] overflow-hidden transition-all">
                {/* Clickable Header for Collapsible Provider */}
                <div
                  onClick={() => toggleProviderExpanded(providerName)}
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-[#3C3D37]/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-[#ECDFCC]">{providerName}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#3C3D37] text-[#9C9589]">
                      {modelsCount} modelo{modelsCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#697565] uppercase tracking-wider font-mono hidden sm:inline">{providerName}</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-[#9C9589]" /> : <ChevronDown className="w-4 h-4 text-[#9C9589]" />}
                  </div>
                </div>

                {/* Expandable Content */}
                {isExpanded && (
                  <div className="p-4 pt-0 border-t border-[#3C3D37]/50 space-y-3 mt-3">
                    {Object.entries(modelsDict || {}).map(([modelId, modelData]) => {
                      let displayName = modelId;
                      let inputType = 'text';
                      let rawKey = false;

                      if (typeof modelData === 'object' && modelData !== null && !Array.isArray(modelData)) {
                        displayName = modelData.name || modelId;
                        inputType = modelData.input_type || 'text';
                        rawKey = modelData.api_key;
                      } else if (Array.isArray(modelData)) {
                        displayName = modelData[0];
                        rawKey = modelData[modelData.length - 1];
                      }

                      const apiKeyVal = (typeof rawKey === 'string' && rawKey !== 'false') ? rawKey : '';
                      const uniqueKey = `${providerName}-${modelId}`;

                      return (
                        <div key={modelId} className="bg-[#3C3D37]/40 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 border border-[#4A4B44]/40">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold text-[#ECDFCC]">{displayName}</p>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#697565]/30 text-[#ECDFCC] border border-[#697565]">
                                {inputType}
                              </span>
                            </div>
                            <span className="text-[10px] text-[#9C9589] font-mono">{modelId}</span>
                          </div>

                          <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
                            {/* Input Type Selector */}
                            {typeof modelData === 'object' && !Array.isArray(modelData) && (
                              <select
                                value={inputType}
                                onChange={(e) => handleInputTypeChange(providerName, modelId, e.target.value)}
                                className="bg-[#181C14] text-[#ECDFCC] text-xs font-medium rounded-xl px-2 py-2 outline-none border border-[#4A4B44] cursor-pointer"
                              >
                                <option value="text">text</option>
                                <option value="audio">audio</option>
                                <option value="multimodal">multimodal</option>
                              </select>
                            )}

                            {/* API Key Input */}
                            <div className="flex-1 sm:w-64 flex items-center bg-[#181C14] border border-[#4A4B44] rounded-xl px-3 py-2 focus-within:border-[#697565]">
                              <input
                                type={showKeys[uniqueKey] ? 'text' : 'password'}
                                value={apiKeyVal}
                                onChange={(e) => handleApiKeyChange(providerName, modelId, e.target.value)}
                                placeholder="Insira a API Key"
                                className="w-full bg-transparent text-xs text-[#ECDFCC] outline-none placeholder-[#9C9589]"
                              />
                              <button
                                type="button"
                                onClick={() => toggleKeyVisibility(uniqueKey)}
                                className="text-[#9C9589] hover:text-[#ECDFCC] ml-2"
                              >
                                {showKeys[uniqueKey] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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
          className="w-full p-4 flex items-center justify-between text-left hover:bg-[#E57373]/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-[#E57373]" />
            <div>
              <h3 className="text-xs font-bold text-[#E57373]">Zona de Perigo (Ações Destrutivas)</h3>
              <p className="text-[11px] text-[#9C9589]">Opções avançadas de sistema e redefinição total de dados</p>
            </div>
          </div>
          {showDangerZone ? <ChevronUp className="w-4 h-4 text-[#9C9589]" /> : <ChevronDown className="w-4 h-4 text-[#9C9589]" />}
        </button>

        {showDangerZone && (
          <div className="p-4 border-t border-[#E57373]/20 bg-[#E57373]/5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#181C14] p-4 rounded-xl border border-[#E57373]/30">
              <div>
                <h4 className="text-xs font-bold text-[#ECDFCC]">Resetar Todo o Banco de Dados Local</h4>
                <p className="text-[11px] text-[#9C9589] mt-0.5">
                  Apaga de forma irreversível todas as suas contas, cartões, faturas, lançamentos e histórico de IA.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setConfirmResetInput('');
                  setShowResetModal(true);
                }}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#E57373]/20 hover:bg-[#E57373]/40 text-[#E57373] text-xs font-semibold border border-[#E57373]/50 transition-colors shrink-0"
              >
                <Trash2 className="w-4 h-4" />
                <span>Resetar Banco</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Sensitive Reset Database Modal Confirmation */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#181C14] border border-[#E57373]/50 rounded-2xl p-6 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#E57373]/20 flex items-center justify-center text-[#E57373]">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#ECDFCC]">Resetar Banco de Dados</h3>
                <p className="text-xs text-[#E57373]">Ação irreversível de alto impacto</p>
              </div>
            </div>

            <p className="text-xs text-[#9C9589] leading-relaxed">
              Esta ação irá apagar <strong>definitivamente</strong> todas as suas contas, cartões, faturas, lançamentos e históricos de conversa de IA.
            </p>

            <div className="space-y-2 bg-[#E57373]/10 p-3 rounded-xl border border-[#E57373]/20">
              <label className="text-[11px] font-semibold text-[#ECDFCC] block">
                Para confirmar, digite <span className="text-[#E57373] font-mono">RESETAR</span> abaixo:
              </label>
              <input
                type="text"
                value={confirmResetInput}
                onChange={(e) => setConfirmResetInput(e.target.value)}
                placeholder="RESETAR"
                className="w-full bg-[#181C14] border border-[#E57373]/40 rounded-xl px-3 py-2 text-xs text-[#ECDFCC] font-mono outline-none focus:border-[#E57373]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 rounded-xl bg-[#3C3D37] hover:bg-[#4A4B44] text-[#ECDFCC] text-xs font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={confirmResetInput.trim().toUpperCase() !== 'RESETAR' || resetting}
                onClick={handleResetDatabase}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#E57373] hover:bg-[#D32F2F] disabled:opacity-40 text-white text-xs font-semibold transition-colors shadow-lg"
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
