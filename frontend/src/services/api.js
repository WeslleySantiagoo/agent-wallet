import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getDashboardSummary = () => api.get('/transactions/summary/dashboard').then(res => res.data);
export const getAccounts = () => api.get('/accounts').then(res => res.data);
export const createAccount = (data) => api.post('/accounts', data).then(res => res.data);
export const deleteAccount = (id) => api.delete(`/accounts/${id}`);

export const getCreditCards = () => api.get('/credit-cards').then(res => res.data);
export const createCreditCard = (data) => api.post('/credit-cards', data).then(res => res.data);
export const getCardInvoices = (cardId) => api.get(`/credit-cards/${cardId}/invoices`).then(res => res.data);
export const payInvoice = (cardId, invoiceId, accountId) => api.post(`/credit-cards/${cardId}/invoices/${invoiceId}/pay`, { account_id: accountId }).then(res => res.data);

export const getTransactions = (limit = 100, offset = 0) => api.get(`/transactions?limit=${limit}&offset=${offset}`).then(res => res.data);
export const createTransaction = (data) => api.post('/transactions', data).then(res => res.data);
export const updateTransaction = (id, data) => api.put(`/transactions/${id}`, data).then(res => res.data);
export const deleteTransaction = (id) => api.delete(`/transactions/${id}`);

export const getCategories = () => api.get('/categories').then(res => res.data);
export const createCategory = (data) => api.post('/categories', data).then(res => res.data);

export const getAIProviders = () => api.get('/ai/providers').then(res => res.data);
export const updateAIProviders = (config) => api.put('/ai/providers', config).then(res => res.data);
export const getDefaultAIProvider = () => api.get('/ai/providers/default').then(res => res.data);

export const getChatSessions = () => api.get('/ai/sessions').then(res => res.data);
export const getActiveChatSession = () => api.get('/ai/sessions/active').then(res => res.data);
export const createChatSession = (title = 'Nova Conversa') => api.post('/ai/sessions', null, { params: { title } }).then(res => res.data);
export const activateChatSession = (sessionId) => api.post(`/ai/sessions/${sessionId}/activate`).then(res => res.data);
export const deleteChatSession = (sessionId) => api.delete(`/ai/sessions/${sessionId}`);

export const sendAIChat = (message, providerId, modelId, sessionId) => api.post('/ai/chat', { message, provider_id: providerId, model_id: modelId, session_id: sessionId }).then(res => res.data);
export const getAIUsageStats = () => api.get('/ai/usage').then(res => res.data);

export const transcribeAudioApi = (audioBlob, providerId, modelId) => {
  const formData = new FormData();
  formData.append('file', audioBlob, 'audio_recording.webm');
  if (providerId) formData.append('provider_id', providerId);
  if (modelId) formData.append('model_id', modelId);

  return api.post('/ai/transcribe', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => res.data);
};

export const exportDatabaseUrl = `${API_BASE_URL}/export`;
export const importDatabase = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => res.data);
};
export const resetDatabaseApi = (options = { reset_all: true, targets: [] }) => 
  api.post('/reset', options).then(res => res.data);

export default api;
