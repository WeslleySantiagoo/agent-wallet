import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "ParseFin API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Database
    DATA_DIR: str = os.getenv("DATA_DIR", "data")
    DB_NAME: str = "financas.db"
    
    @property
    def DATABASE_URL(self) -> str:
        os.makedirs(self.DATA_DIR, exist_ok=True)
        return f"sqlite:///{os.path.join(self.DATA_DIR, self.DB_NAME)}"
        
    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
