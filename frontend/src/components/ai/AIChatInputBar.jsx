import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Plus, FileText, Image as ImageIcon, X, RefreshCw } from 'lucide-react';
import { useAIChat } from '../../context/AIChatContext';
import { transcribeAudioApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export const AIChatInputBar = ({ onSend, isLoading }) => {
  const { toast } = useToast();
  const { selectedProvider, selectedModel, providersData } = useAIChat();
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Determina dinamicamente o input_type do modelo selecionado
  const modelData = providersData?.[selectedProvider]?.[selectedModel];
  let inputType = 'text';
  if (typeof modelData === 'object' && modelData !== null && !Array.isArray(modelData)) {
    inputType = modelData.input_type || 'text';
  }

  const isAudioSupported = inputType === 'audio' || inputType === 'multimodal';
  const isMultimodalSupported = inputType === 'multimodal';

  // Limpa microfone ao desmontar
  useEffect(() => {
    return () => {
      stopMicrophone();
    };
  }, []);

  const stopMicrophone = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
  };

  // Alterna o fluxo de gravação de áudio real do microfone
  const toggleSpeechRecognition = async () => {
    if (isListening) {
      // 1. Usuário clicou para PARAR de gravar -> Encerra a captura de mídia
      setIsListening(false);
      setIsTranscribing(true);

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      stopMicrophone();
      return;
    }

    // 2. Usuário clicou para INICIAR a gravação de áudio
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];

      const options = MediaRecorder.isTypeSupported('audio/webm')
        ? { mimeType: 'audio/webm' }
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? { mimeType: 'audio/mp4' }
        : {};

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

        if (audioBlob.size === 0) {
          setIsTranscribing(false);
          return;
        }

        try {
          // Envia o áudio gravado para o modelo de IA no backend para transcrição
          const res = await transcribeAudioApi(audioBlob, selectedProvider, selectedModel);
          if (res && res.text) {
            setInputText(prev => (prev ? prev + ' ' + res.text.trim() : res.text.trim()));
          }
        } catch (err) {
          console.error("Erro ao enviar áudio para transcrição via IA:", err);
          toast.error(`Erro na transcrição via IA: ${err.response?.data?.detail || err.message}`);
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorder.start();
      setIsListening(true);
    } catch (e) {
      console.error("Erro ao acessar microfone:", e);
      toast.error("Não foi possível acessar o microfone. Verifique as permissões no navegador.");
      setIsListening(false);
      setIsTranscribing(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim() && !selectedFile) return;

    let fullMessage = inputText.trim();
    if (selectedFile) {
      fullMessage = fullMessage ? `${fullMessage} [Anexo: ${selectedFile.name}]` : `[Anexo enviado: ${selectedFile.name}]`;
    }

    onSend(fullMessage);
    setInputText('');
    setSelectedFile(null);

    setIsListening(false);
    setIsTranscribing(false);
    stopMicrophone();
  };

  return (
    <form onSubmit={handleSubmit} className="p-3 border-t border-[#3C3D37] bg-[#181C14] space-y-2">
      {/* Badge de Anexo de Arquivo no formato multimodal */}
      {selectedFile && (
        <div className="flex items-center justify-between bg-[#3C3D37] px-3 py-1.5 rounded-xl border border-[#4A4B44] text-xs text-[#ECDFCC]">
          <div className="flex items-center gap-2 truncate">
            {selectedFile.type.startsWith('image/') ? (
              <ImageIcon className="w-4 h-4 text-[#697565]" />
            ) : (
              <FileText className="w-4 h-4 text-[#697565]" />
            )}
            <span className="truncate max-w-[200px] font-medium">{selectedFile.name}</span>
            <span className="text-[10px] text-[#9C9589]">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedFile(null)}
            className="text-[#9C9589] hover:text-[#E57373] p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Caixa de Entrada Principal */}
      <div className="flex items-center gap-2 bg-[#3C3D37] rounded-xl p-2 border border-[#4A4B44]">
        {/* Botão de Anexo (+) apenas para multimodal */}
        {isMultimodalSupported && (
          <>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Anexar Imagem, PDF ou documento"
              className="p-1.5 rounded-lg text-[#9C9589] hover:text-[#ECDFCC] hover:bg-[#4A4B44] transition-colors"
            >
              <Plus className="w-4.5 h-4.5 text-[#697565]" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,application/pdf,.txt,.csv"
              className="hidden"
            />
          </>
        )}

        {/* Botão Único de Microfone / Transcrição pela IA (localizado estritamente no próprio botão) */}
        {isAudioSupported && (
          <button
            type="button"
            disabled={isTranscribing}
            onClick={toggleSpeechRecognition}
            title={isTranscribing ? "Enviando áudio para o modelo de IA transcrever..." : isListening ? "Clique para encerrar a gravação de áudio" : "Iniciar gravação de voz"}
            className={`p-1.5 rounded-lg transition-all flex items-center justify-center ${
              isTranscribing
                ? 'bg-[#697565]/30 text-[#ECDFCC]'
                : isListening
                ? 'bg-[#E57373] text-white animate-pulse shadow-md shadow-[#E57373]/30'
                : 'text-[#9C9589] hover:text-[#ECDFCC] hover:bg-[#4A4B44]'
            }`}
          >
            {isTranscribing ? (
              <RefreshCw className="w-4.5 h-4.5 animate-spin text-[#697565]" />
            ) : isListening ? (
              <MicOff className="w-4.5 h-4.5 text-white" />
            ) : (
              <Mic className="w-4.5 h-4.5 text-[#697565]" />
            )}
          </button>
        )}

        {/* Input de Texto */}
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={
            isTranscribing
              ? "Enviando áudio para modelo de IA transcrever..."
              : isListening
              ? "Gravando áudio... Toque no microfone para parar"
              : isMultimodalSupported
              ? "Digite, fale ou anexe um arquivo..."
              : isAudioSupported
              ? "Digite ou toque no microfone para falar..."
              : "Digite algo ex: 'Comprei almoço por 25'"
          }
          className="flex-1 bg-transparent text-xs text-[#ECDFCC] placeholder-[#9C9589] outline-none"
        />

        {/* Botão Enviar */}
        <button
          type="submit"
          disabled={isLoading || isTranscribing || (!inputText.trim() && !selectedFile)}
          className="p-2 rounded-lg bg-[#697565] text-[#ECDFCC] hover:bg-[#7A8674] disabled:opacity-50 transition-colors shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
};
