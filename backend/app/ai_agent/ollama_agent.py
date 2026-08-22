import os
import httpx
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.ai_agent.strategy import LLMAgent, AgentResponse, ChartData
from app.ai_agent.tools import AI_TOOLS_DEFINITIONS
from app.ai_agent.executor import executeToolCall

class OllamaAgent(LLMAgent):
    def __init__(self, api_key: str = "", model_id: str = "llama3.1", base_url: str = None):
        self.model_id = model_id
        self.api_key = api_key or ""
        
        # Se a api_key informada for uma URL HTTP(S), usamos como base_url
        if self.api_key.startswith("http://") or self.api_key.startswith("https://"):
            self.base_url = self.api_key.rstrip("/")
            self.api_key = ""
        else:
            # Se uma chave de API for fornecida, o endpoint padrao e https://ollama.com (Ollama Cloud API)
            default_url = "https://ollama.com" if self.api_key else os.getenv("OLLAMA_BASE_URL", os.getenv("OLLAMA_HOST", "http://localhost:11434"))
            self.base_url = (base_url or default_url).rstrip("/")

    async def processInput(self, user_text: str, context: Dict[str, Any]) -> AgentResponse:
        db: Session = context.get("db")
        tools = [{"type": "function", "function": t} for t in AI_TOOLS_DEFINITIONS]

        payload = {
            "model": self.model_id,
            "messages": [
                {"role": "system", "content": "Você é um assistente financeiro pessoal."},
                {"role": "user", "content": user_text}
            ],
            "tools": tools,
            "stream": False
        }

        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        async with httpx.AsyncClient() as client:
            try:
                res = await client.post(
                    f"{self.base_url}/api/chat",
                    json=payload,
                    headers=headers,
                    timeout=60.0
                )
                if res.status_code != 200:
                    return AgentResponse(message=f"Erro Ollama Cloud API ({res.status_code}): {res.text}")
                
                data = res.json()
                msg = data.get("message", {})
                actions_executed = []
                charts: List[ChartData] = []
                final_message = msg.get("content", "")

                if "tool_calls" in msg and msg["tool_calls"]:
                    for tc in msg["tool_calls"]:
                        fn = tc.get("function", {})
                        fn_name = fn.get("name")
                        fn_args = fn.get("arguments", {})
                        result, chart = executeToolCall(db, fn_name, fn_args)
                        actions_executed.append(result)
                        if chart:
                            charts.append(chart)

                in_tok = data.get("prompt_eval_count", 0)
                out_tok = data.get("eval_count", 0)
                tot_tok = in_tok + out_tok

                return AgentResponse(
                    message=final_message or "Processado com sucesso via Ollama Cloud.",
                    actions_executed=actions_executed,
                    charts=charts,
                    input_tokens=in_tok,
                    output_tokens=out_tok,
                    total_tokens=tot_tok
                )
            except Exception as e:
                return AgentResponse(message=f"Não foi possível conectar à API do Ollama ({self.base_url}): {str(e)}")
