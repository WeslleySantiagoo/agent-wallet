from abc import ABC, abstractmethod
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class ChartData(BaseModel):
    chart_type: str  # bar, line, pie, area
    title: str
    data: List[Dict[str, Any]]
    x_key: str
    y_keys: List[str]

class AgentResponse(BaseModel):
    message: str
    actions_executed: List[Dict[str, Any]] = []
    charts: List[ChartData] = []

class LLMAgent(ABC):
    """Interface abstrata (Strategy Pattern) para agentes de IA."""

    @abstractmethod
    async def processInput(self, user_text: str, context: Dict[str, Any]) -> AgentResponse:
        """Processa a mensagem do usuário, decide as tools e retorna resposta estruturada."""
        pass

    async def transcribeAudio(self, audio_bytes: bytes, mime_type: str = "audio/webm") -> str:
        """Transcreve o áudio gravado enviando para o modelo de IA."""
        raise NotImplementedError("Transcrição de áudio não suportada por este provedor.")
