import { exportDatabaseUrl, importDatabase } from '../services/api';

const DB_BACKUP_KEY = 'parsefin_db_backup';
const DB_BACKUP_TIME_KEY = 'parsefin_db_backup_time';

/**
 * Baixa o arquivo SQLite (.db) do backend, converte para Base64 e salva no localStorage.
 */
export const saveDatabaseToLocalStorage = async () => {
  try {
    const response = await fetch(exportDatabaseUrl, { credentials: 'omit' });
    if (!response.ok) throw new Error('Não foi possível exportar o banco do backend');

    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        try {
          const base64data = reader.result;
          localStorage.setItem(DB_BACKUP_KEY, base64data);
          const nowStr = new Date().toLocaleString('pt-BR');
          localStorage.setItem(DB_BACKUP_TIME_KEY, nowStr);
          resolve({ success: true, timestamp: nowStr });
        } catch (e) {
          console.warn("Quota excedida no localStorage ao salvar backup:", e);
          reject(e);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error("Erro ao salvar backup no localStorage:", err);
    throw err;
  }
};

/**
 * Retorna informações sobre o backup atualmente armazenado no localStorage.
 */
export const getLocalStorageBackupInfo = () => {
  const data = localStorage.getItem(DB_BACKUP_KEY);
  const timestamp = localStorage.getItem(DB_BACKUP_TIME_KEY);

  if (!data) {
    return { hasBackup: false, timestamp: null, sizeKB: 0 };
  }

  // Estimativa de tamanho em KB
  const sizeKB = Math.round((data.length * (3 / 4)) / 1024);
  return {
    hasBackup: true,
    timestamp: timestamp || 'Data desconhecida',
    sizeKB: sizeKB > 0 ? sizeKB : 1
  };
};

/**
 * Lê o backup em Base64 do localStorage, recria um arquivo File e envia para a API /import do backend.
 */
export const restoreDatabaseFromLocalStorage = async () => {
  const base64data = localStorage.getItem(DB_BACKUP_KEY);
  if (!base64data) {
    throw new Error("Nenhum backup encontrado no Local Storage.");
  }

  // Converte dataURL para Blob
  const res = await fetch(base64data);
  const blob = await res.blob();
  const file = new File([blob], "financas_backup_local.db", { type: "application/octet-stream" });

  return await importDatabase(file);
};
