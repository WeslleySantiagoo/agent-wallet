import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { getAIProviders, getActiveChatSession, getChatSessions, createChatSession, activateChatSession, deleteChatSession } from '../services/api';
import { useToast } from './ToastContext';
import { isModelKeyConfigured } from '../components/ai/AIProviderSelector';

const AIChatContext = createContext(null);

export const AIChatProvider = ({ children }) => {
  const { toast } = useToast();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [sessionsList, setSessionsList] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState('ParseFin AI');
  const [selectedModel, setSelectedModel] = useState('parsefin-free');
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
        
        // Restore last provider and model stored in DB if valid key exists
        if (activeSess.last_provider && activeSess.last_model) {
          const mData = providersMap?.[activeSess.last_provider]?.[activeSess.last_model];
          if (isModelKeyConfigured(mData)) {
            setSelectedProvider(activeSess.last_provider);
            setSelectedModel(activeSess.last_model);
          } else {
            setSelectedProvider('ParseFin AI');
            setSelectedModel('parsefin-free');
          }
        }

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

  const hasOpenedOnce = useRef(false);

  const toggleChat = async () => {
    if (!isChatOpen && !hasOpenedOnce.current) {
      hasOpenedOnce.current = true;
      await handleCreateNewSession();
    }
    setIsChatOpen(prev => !prev);
  };
  
  const openChat = async () => {
    if (!isChatOpen && !hasOpenedOnce.current) {
      hasOpenedOnce.current = true;
      await handleCreateNewSession();
    }
    setIsChatOpen(true);
  };

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
