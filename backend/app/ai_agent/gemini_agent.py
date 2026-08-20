import os
from typing import Dict, Any, List
from google import genai
from google.genai import types
from sqlalchemy.orm import Session
from app.ai_agent.strategy import LLMAgent, AgentResponse, ChartData
from app.ai_agent.tools import AI_TOOLS_DEFINITIONS
from app.ai_agent.executor import executeToolCall

class GeminiAgent(LLMAgent):
    def __init__(self, api_key: str, model_id: str = "gemini-2.5-flash"):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY", "")
        self.model_id = model_id
        if self.api_key:
            self.client = genai.Client(api_key=self.api_key)
        else:
            self.client = None

    async def transcribeAudio(self, audio_bytes: bytes, mime_type: str = "audio/webm") -> str:
        if not self.client:
            raise Exception("Chave de API do Gemini não configurada em Configurações.")

        try:
            audio_part = types.Part.from_bytes(
                data=audio_bytes,
                mime_type=mime_type or "audio/webm"
            )
            prompt = (
                "Transcreva este áudio com alta precisão em português (pt-BR). "
                "Retorne APENAS a transcrição exata do que foi dito, sem comentários, sem explicações e sem aspas."
            )
            response = self.client.models.generate_content(
                model=self.model_id,
                contents=[prompt, audio_part]
            )
            return response.text.strip() if response.text else ""
        except Exception as e:
            raise Exception(f"Erro na transcrição via Gemini ({self.model_id}): {str(e)}")

    async def processInput(self, user_text: str, context: Dict[str, Any]) -> AgentResponse:
        db: Session = context.get("db")
        if not self.client:
            return AgentResponse(
                message="Chave de API do Gemini não configurada. Configure a GEMINI_API_KEY em Configurações.",
                actions_executed=[]
            )

        # Formata ferramentas para o SDK do Gemini
        function_declarations = []
        for tool in AI_TOOLS_DEFINITIONS:
            function_declarations.append(
                types.FunctionDeclaration(
                    name=tool["name"],
                    description=tool["description"],
                    parameters=tool["parameters"]
                )
            )

        config = types.GenerateContentConfig(
            system_instruction="Você é um assistente financeiro pessoal inteligente e amigável. "
                               "Analise as solicitações do usuário e decida autonomamente quais ferramentas executar para registrar finanças ou gerar gráficos. "
                               "Sempre responda de forma clara e objetiva em português (pt-BR).",
            tools=[types.Tool(function_declarations=function_declarations)],
            temperature=0.2
        )

        try:
            response = self.client.models.generate_content(
                model=self.model_id,
                contents=user_text,
                config=config
            )

            actions_executed = []
            charts: List[ChartData] = []

            # 1. Processa chamadas de função (function calling)
            if response.function_calls:
                for fc in response.function_calls:
                    fn_name = fc.name
                    fn_args = fc.args
                    res, chart = executeToolCall(db, fn_name, fn_args)
                    actions_executed.append(res)
                    if chart:
                        charts.append(chart)

            # 2. Extrai partes de texto com segurança sem estourar exceção em respostas com function_call
            final_text_parts = []
            if response.candidates and len(response.candidates) > 0:
                cand = response.candidates[0]
                if cand.content and cand.content.parts:
                    for part in cand.content.parts:
                        if getattr(part, "text", None):
                            final_text_parts.append(part.text)

            final_message = "\n".join(final_text_parts).strip()

            if not final_message and actions_executed:
                final_message = f"Entendido! {actions_executed[0].get('message', 'Ação registrada com sucesso.')}"

            return AgentResponse(
                message=final_message or "Ação concluída com sucesso.",
                actions_executed=actions_executed,
                charts=charts
            )

        except Exception as e:
            return AgentResponse(
                message=f"Erro ao processar com Gemini ({self.model_id}): {str(e)}",
                actions_executed=[]
            )
