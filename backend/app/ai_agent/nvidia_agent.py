import os
import httpx
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.ai_agent.strategy import LLMAgent, AgentResponse, ChartData
from app.ai_agent.tools import AI_TOOLS_DEFINITIONS
from app.ai_agent.executor import executeToolCall

class NvidiaAgent(LLMAgent):
    def __init__(self, api_key: str, model_id: str = "nvidia/llama-3.1-nemotron-70b-instruct", base_url: str = "https://integrate.api.nvidia.com/v1"):
        self.api_key = api_key or os.getenv("NVIDIA_API_KEY", "")
        self.model_id = model_id
        self.base_url = base_url

    async def processInput(self, user_text: str, context: Dict[str, Any]) -> AgentResponse:
        db: Session = context.get("db")
        if not self.api_key:
            return AgentResponse(
                message="Chave de API da Nvidia não configurada.",
                actions_executed=[]
            )

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        # Converter ferramentas para formato OpenAI compatible
        tools = [{"type": "function", "function": t} for t in AI_TOOLS_DEFINITIONS]

        payload = {
            "model": self.model_id,
            "messages": [
                {"role": "system", "content": "Você é um assistente financeiro inteligente. Use as ferramentas para registrar transações."},
                {"role": "user", "content": user_text}
            ],
            "tools": tools,
            "temperature": 0.2
        }

        async with httpx.AsyncClient() as client:
            try:
                res = await client.post(f"{self.base_url}/chat/completions", headers=headers, json=payload, timeout=30.0)
                data = res.json()

                if res.status_code != 200:
                    return AgentResponse(message=f"Erro Nvidia API ({res.status_code}): {data.get('message', res.text)}")

                choice = data["choices"][0]["message"]
                actions_executed = []
                charts: List[ChartData] = []
                final_message = choice.get("content", "")

                if "tool_calls" in choice and choice["tool_calls"]:
                    for tc in choice["tool_calls"]:
                        fn = tc["function"]
                        fn_name = fn["name"]
                        import json
                        fn_args = json.loads(fn["arguments"]) if isinstance(fn["arguments"], str) else fn["arguments"]
                        result, chart = executeToolCall(db, fn_name, fn_args)
                        actions_executed.append(result)
                        if chart:
                            charts.append(chart)

                return AgentResponse(
                    message=final_message or "Processado com sucesso.",
                    actions_executed=actions_executed,
                    charts=charts
                )
            except Exception as e:
                return AgentResponse(message=f"Erro ao comunicar com Nvidia API: {str(e)}")
