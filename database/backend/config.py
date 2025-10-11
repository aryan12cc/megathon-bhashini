from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Database
    POSTGRES_URL: str = "postgresql://vaidya_admin:vaidya_secure_pass_123@localhost:5432/vaidyavaani"
    MONGODB_URL: str = "mongodb://vaidya_admin:vaidya_secure_pass_123@localhost:27017/vaidyavaani?authSource=admin"
    
    # JWT
    JWT_SECRET_KEY: str = "vaidya_jwt_secret_key_change_in_production_123456"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # API
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    ENVIRONMENT: str = "development"
    
    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:8080"
    
    @property
    def origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
