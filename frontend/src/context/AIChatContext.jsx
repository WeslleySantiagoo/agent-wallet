import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAIProviders, getActiveChatSession, getChatSessions, createChatSession, activateChatSession, deleteChatSession } from '../services/api';
import { useToast } from './ToastContext';

const AIChatContext = createContext(null);

export const AIChatProvider = ({ children }) => {
  const { toast } = useToast();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [sessionsList, setSessionsList] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState('Gemini');
  const [selectedModel, setSelectedModel] = useState('gemini-3.5-flash');
  const [providersData, setProvidersData] = useState({});
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    initChatState();
  }, []);

  const initChatState = async () => {
    setLoadingSession(true);
    try {
      const pData = await getAIProviders();
      setProvidersData(pData || {});

      await refreshSessionData(pData);
    } catch (e) {
      console.warn("Erro ao inicializar sessão de chat:", e);
    } finally {
      setLoadingSession(false);
    }
  };

  const refreshSessionData = async (providersMap = providersData) => {
    try {
      const activeSess = await getActiveChatSession();
      const allSess = await getChatSessions();
      setSessionsList(allSess || []);

      if (activeSess) {
        setActiveSessionId(activeSess.id);
        
        // Restore last provider and model stored in DB for this session
        if (activeSess.last_provider) setSelectedProvider(activeSess.last_provider);
        if (activeSess.last_model) setSelectedModel(activeSess.last_model);

        // Convert messages from DB format
        const formattedMsgs = (activeSess.messages || []).map(m => ({
          id: m.id,
          sender: m.sender,
          text: m.text,
          actionsExecuted: m.actions_executed,
          charts: m.charts,
          timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));

        setMessages(formattedMsgs);
      }
    } catch (e) {
      console.warn("Erro ao buscar histórico de conversas do DB:", e);
    }
  };

  const handleCreateNewSession = async () => {
    try {
      const newSess = await createChatSession('Nova Conversa');
      await refreshSessionData();
    } catch (e) {
      toast.error("Erro ao criar nova conversa: " + e.message);
    }
  };

  const handleSwitchSession = async (sessionId) => {
    try {
      await activateChatSession(sessionId);
      await refreshSessionData();
    } catch (e) {
      toast.error("Erro ao alternar conversa: " + e.message);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    try {
      await deleteChatSession(sessionId);
      await refreshSessionData();
    } catch (e) {
      toast.error("Erro ao excluir conversa: " + e.message);
    }
  };

  const toggleChat = () => setIsChatOpen(prev => !prev);
  const openChat = () => setIsChatOpen(true);
  const closeChat = () => setIsChatOpen(false);

  return (
    <AIChatContext.Provider value={{
      isChatOpen,
      toggleChat,
      openChat,
      closeChat,
      messages,
      setMessages,
      activeSessionId,
      sessionsList,
      selectedProvider,
      setSelectedProvider,
      selectedModel,
      setSelectedModel,
      providersData,
      setProvidersData,
      reloadProviders: initChatState,
      createNewSession: handleCreateNewSession,
      switchSession: handleSwitchSession,
      deleteSession: handleDeleteSession,
      refreshSessionData,
      loadingSession
    }}>
      {children}
    </AIChatContext.Provider>
  );
};

export const useAIChat = () => useContext(AIChatContext);
