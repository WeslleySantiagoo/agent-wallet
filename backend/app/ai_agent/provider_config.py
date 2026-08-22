import json
import os
from typing import Dict, Any
from app.core.config import settings

PROVIDERS_FILE = os.path.join(settings.DATA_DIR, "ai_providers.json")

DEFAULT_CONFIG = {
  "ParseFin AI": {
    "parsefin-free": {
      "name": "ParseFin AI (Grátis)",
      "input_type": "multimodal",
      "is_system_free": True,
      "api_key": True
    }
  },
  "Gemini": {
    "gemini-3.6-flash": {
      "name": "Gemini 3.6 Flash",
      "input_type": "multimodal",
      "api_key": False
    },
    "gemini-2.5-flash": {
      "name": "Gemini 2.5 Flash",
      "input_type": "text",
      "api_key": False
    },
    "gemini-2.5-flash-lite": {
      "name": "Gemini 2.5 Flash Lite",
      "input_type": "text",
      "api_key": False
    },
    "gemini-3-flash": {
      "name": "Gemini 3 Flash",
      "input_type": "multimodal",
      "api_key": False
    },
    "gemini-3.1-flash-lite": {
      "name": "Gemini 3.1 Flash Lite",
      "input_type": "text",
      "api_key": False
    },
    "gemini-3.5-flash": {
      "name": "Gemini 3.5 Flash",
      "input_type": "multimodal",
      "api_key": False
    }
  },
  "Nvidia": {
    "nvidia/nemotron-3-ultra-550b-a55b": {
      "name": "Nvidia Nemotron 70B",
      "input_type": "text",
      "api_key": False
    },
    "z-ai/glm-5.2": {
      "name": "Z-AI GLM 5.2",
      "input_type": "multimodal",
      "api_key": False
    }
  },
  "Ollama": {
    "gemma4": {
      "name": "Gemma 4",
      "input_type": "text",
      "api_key": False
    },
    "nemotron-3-super": {
      "name": "Nemotron 3 Super",
      "input_type": "audio",
      "api_key": False
    }
  }
}

def loadProvidersConfig() -> Dict[str, Any]:
    example_paths = [
        "data/ai_providers.json.example",
        "app/data/ai_providers.json.example",
        os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "ai_providers.json.example")
    ]
    template_config = dict(DEFAULT_CONFIG)
    for p in example_paths:
        if os.path.exists(p):
            try:
                with open(p, "r", encoding="utf-8") as f:
                    template_config = json.load(f)
                break
            except Exception:
                pass

    if not os.path.exists(PROVIDERS_FILE):
        saveProvidersConfig(template_config)
        return template_config

    try:
        with open(PROVIDERS_FILE, "r", encoding="utf-8") as f:
            existing_config = json.load(f)
    except Exception:
        existing_config = {}

    # Auto-merge missing default models while keeping existing API keys intact
    updated = False
    for provider, models in template_config.items():
        if provider not in existing_config:
            existing_config[provider] = models
            updated = True
        else:
            for model_id, model_info in models.items():
                if model_id not in existing_config[provider]:
                    existing_config[provider][model_id] = model_info
                    updated = True

    if updated:
        saveProvidersConfig(existing_config)

    return existing_config

def saveProvidersConfig(config: Dict[str, Any]) -> None:
    os.makedirs(settings.DATA_DIR, exist_ok=True)
    with open(PROVIDERS_FILE, "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2, ensure_ascii=False)

def getMaskedProvidersConfig() -> Dict[str, Any]:
    config = loadProvidersConfig()
    masked = json.loads(json.dumps(config))
    for provider, models in masked.items():
        if isinstance(models, dict):
            for model_id, info in models.items():
                if isinstance(info, dict):
                    key = info.get("api_key", False)
                    if isinstance(key, str) and key and key != "false":
                        info["api_key"] = key[:4] + "..." + key[-4:] if len(key) > 8 else "********"
                elif isinstance(info, list) and len(info) >= 2:  # Fallback retrocompativel
                    key = info[-1]
                    if isinstance(key, str) and key and key != "false":
                        info[-1] = key[:4] + "..." + key[-4:] if len(key) > 8 else "********"
    return masked

def getAgent(provider_id: str = None, model_id: str = None):
    from app.ai_agent.gemini_agent import GeminiAgent
    from app.ai_agent.nvidia_agent import NvidiaAgent
    from app.ai_agent.ollama_agent import OllamaAgent

    config = loadProvidersConfig()
    if not config:
        config = DEFAULT_CONFIG

    # Match provider (case-insensitive fallback)
    matched_provider_name = None
    if provider_id:
        for p_name in config.keys():
            if p_name.lower() == provider_id.lower():
                matched_provider_name = p_name
                break
    
    if not matched_provider_name:
        matched_provider_name = list(config.keys())[0] if config else "Gemini"

    models_dict = config.get(matched_provider_name, {})
    
    # Match model
    matched_model_id = None
    if model_id and model_id in models_dict:
        matched_model_id = model_id
    elif models_dict:
        matched_model_id = list(models_dict.keys())[0]

    model_info = models_dict.get(matched_model_id, {})
    if isinstance(model_info, dict):
        raw_key = model_info.get("api_key", False)
    elif isinstance(model_info, list) and len(model_info) >= 2:
        raw_key = model_info[-1]
    else:
        raw_key = False

    def is_valid_key(k: Any) -> bool:
        return isinstance(k, str) and k and k != "false" and "..." not in k and set(k) != {'*'}

    api_key = raw_key if is_valid_key(raw_key) else ""

    # Se o modelo específico não tem chave definida, procura outra chave válida cadastrada no mesmo provedor
    if not api_key:
        for m_id, m_info in models_dict.items():
            k = m_info.get("api_key", False) if isinstance(m_info, dict) else (m_info[-1] if isinstance(m_info, list) and len(m_info) >= 2 else False)
            if is_valid_key(k):
                api_key = k
                break

    p_lower = matched_provider_name.lower()
    m_lower = (matched_model_id or "").lower()

    # IA Grátis do Sistema ("ParseFin AI"): Usa a chave de sistema configurada no ambiente do servidor
    if "parsefin" in p_lower or "parsefin" in m_lower:
        system_key = os.getenv("SYSTEM_FREE_AI_API_KEY", os.getenv("OLLAMA_API_KEY", os.getenv("OLLAMA_KEY", "")))
        return OllamaAgent(api_key=system_key, model_id="gemma4")

    if not api_key and "ollama" in p_lower:
        api_key = os.getenv("OLLAMA_API_KEY", os.getenv("OLLAMA_KEY", ""))

    if "nvidia" in p_lower:
        return NvidiaAgent(api_key=api_key, model_id=matched_model_id or "nvidia/llama-3.1-nemotron-70b-instruct")
    elif "ollama" in p_lower:
        return OllamaAgent(api_key=api_key, model_id=matched_model_id or "gemma4")
    else:
        # Fallback para a IA Grátis do Sistema se o usuário não configurou chave própria
        if not api_key and not os.getenv("GEMINI_API_KEY"):
            system_key = os.getenv("SYSTEM_FREE_AI_API_KEY", os.getenv("OLLAMA_API_KEY", os.getenv("OLLAMA_KEY", "")))
            if system_key:
                return OllamaAgent(api_key=system_key, model_id="gemma4")
        return GeminiAgent(api_key=api_key, model_id=matched_model_id or "gemini-3.5-flash")
