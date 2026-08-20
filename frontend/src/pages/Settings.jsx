import React, { useEffect, useState } from 'react';
import { exportDatabaseUrl, importDatabase, getAIProviders, updateAIProviders } from '../services/api';
import { Download, Upload, Cpu, Eye, EyeOff, Save, CheckCircle2, ShieldCheck, FileSpreadsheet, AlertTriangle } from 'lucide-react';
import { useAIChat } from '../context/AIChatContext';

export const Settings = () => {
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [dragError, setDragError] = useState('');
  const [showKeys, setShowKeys] = useState({});
  const [savingConfig, setSavingConfig] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const { providersData, setProvidersData, reloadProviders } = useAIChat();

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const data = await getAIProviders();
      setProvidersData(data || {});
    } catch (e) {
      console.warn("Erro ao carregar providers:", e);
    }
  };

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
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      setImportStatus('❌ Erro ao importar: ' + (err.response?.data?.detail || err.message));
    } finally {
      setImporting(false);
    }
  };

  const handleImportInputChange = (e) => {
    const file = e.target.files[0];
    processImportFile(file);
  };

  // Drag and Drop Event Handlers
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

  const handleApiKeyChange = (providerName, modelId, newKeyVal) => {
    setProvidersData(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      if (updated[providerName] && updated[providerName][modelId]) {
        updated[providerName][modelId][1] = newKeyVal ? newKeyVal : false;
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
      await reloadProviders();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      alert("Erro ao salvar configurações de IA: " + e.message);
    } finally {
      setSavingConfig(false);
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
              <p className="text-[11px] text-[#9C9589] mt-1">Baixa o arquivo financas.db atual com todas as conversas, contas e lançamentos.</p>
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

      {/* Dynamic AI Providers & Models Configuration */}
      <section className="card-glow p-6 border border-[#3C3D37] space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#697565]/20 flex items-center justify-center text-[#697565]">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#ECDFCC]">Provedores e Modelos de IA</h2>
              <p className="text-xs text-[#9C9589]">Modelado dinamicamente via arquivo local ai_providers.json</p>
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

        <div className="space-y-5">
          {Object.entries(providersData || {}).map(([providerName, modelsDict]) => (
            <div key={providerName} className="bg-[#181C14] rounded-xl border border-[#3C3D37] p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#3C3D37]/80 pb-2">
                <span className="text-sm font-bold text-[#ECDFCC]">{providerName}</span>
                <span className="text-[10px] text-[#697565] uppercase tracking-wider font-mono">{providerName}</span>
              </div>

              <div className="space-y-3">
                {Object.entries(modelsDict || {}).map(([modelId, modelData]) => {
                  const displayName = Array.isArray(modelData) ? modelData[0] : modelId;
                  const rawKey = Array.isArray(modelData) && lenCheck(modelData) ? modelData[1] : false;
                  const apiKeyVal = (typeof rawKey === 'string' && rawKey !== 'false') ? rawKey : '';
                  const uniqueKey = `${providerName}-${modelId}`;

                  return (
                    <div key={modelId} className="bg-[#3C3D37]/40 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-[#4A4B44]/40">
                      <div>
                        <p className="text-xs font-bold text-[#ECDFCC]">{displayName}</p>
                        <span className="text-[10px] text-[#9C9589] font-mono">{modelId}</span>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-80">
                        <div className="flex-1 flex items-center bg-[#181C14] border border-[#4A4B44] rounded-xl px-3 py-2 focus-within:border-[#697565]">
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
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

function lenCheck(arr) {
  return arr.length >= 2;
}
