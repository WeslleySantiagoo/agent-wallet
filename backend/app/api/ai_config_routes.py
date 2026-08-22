from fastapi import APIRouter
from typing import Dict, Any
from app.ai_agent import provider_config

router = APIRouter(prefix="/ai/providers", tags=["AI Configuration"])

@router.get("")
def getProviders():
    return provider_config.getMaskedProvidersConfig()

def is_masked_key(key: Any) -> bool:
    if not isinstance(key, str):
        return False
    return "..." in key or key == "********" or (len(key) > 0 and set(key) == {'*'})

@router.put("")
def updateProviders(new_config: Dict[str, Any]):
    current_config = provider_config.loadProvidersConfig()

    # Preserva chaves mascaradas se não forem alteradas
    for provider_name, models_dict in new_config.items():
        if isinstance(models_dict, dict):
            curr_models = current_config.get(provider_name, {})
            for model_id, model_info in models_dict.items():
                if isinstance(model_info, dict):
                    new_key = model_info.get("api_key", False)
                    curr_info = curr_models.get(model_id, {})
                    curr_key = curr_info.get("api_key", False) if isinstance(curr_info, dict) else False

                    if is_masked_key(new_key):
                        model_info["api_key"] = curr_key
                elif isinstance(model_info, list) and len(model_info) >= 2:
                    new_key = model_info[-1]
                    curr_info = curr_models.get(model_id, [None, False])
                    curr_key = curr_info[-1] if isinstance(curr_info, list) and len(curr_info) >= 2 else False

                    if is_masked_key(new_key):
                        model_info[-1] = curr_key

    provider_config.saveProvidersConfig(new_config)
    return {"status": "success", "message": "Configurações de IA atualizadas com sucesso."}

@router.get("/default")
def getDefaultProvider():
    config = provider_config.loadProvidersConfig()
    first_provider = list(config.keys())[0] if config else "Gemini"
    first_model = list(config[first_provider].keys())[0] if config and first_provider in config and config[first_provider] else "gemini-3.5-flash"
    return {
        "default_provider": first_provider,
        "default_model": first_model
    }
