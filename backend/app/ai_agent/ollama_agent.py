import httpx
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.ai_agent.strategy import LLMAgent, AgentResponse, ChartData
from app.ai_agent.tools import AI_TOOLS_DEFINITIONS
from app.ai_agent.executor import executeToolCall

class OllamaAgent(LLMAgent):
    def __init__(self, model_id: str = "llama3.1", base_url: str = "http://localhost:11434"):
        self.model_id = model_id
        self.base_url = base_url

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

        async with httpx.AsyncClient() as client:
            try:
                res = await client.post(f"{self.base_url}/api/chat", json=payload, timeout=60.0)
                if res.status_code != 200:
                    return AgentResponse(message=f"Erro Ollama ({res.status_code}): {res.text}")
                
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

                return AgentResponse(
                    message=final_message or "Processado com sucesso via Ollama.",
                    actions_executed=actions_executed,
                    charts=charts
                )
            except Exception as e:
                return AgentResponse(message=f"Não foi possível conectar ao Ollama local: {str(e)}")
