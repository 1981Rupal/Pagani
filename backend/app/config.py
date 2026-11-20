from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Pagani AI Atelier API"
    ai_provider: str = "groq"
    groq_api_key: str = ""
    groq_model: str = "openai/gpt-oss-120b"
    groq_timeout_seconds: float = 90.0
    groq_max_retries: int = 3
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.1:8b"
    frontend_origins: str = "http://localhost:3000,http://localhost:5173"
    mongodb_uri: str = ""
    mongodb_url: str = ""
    mongodb_database: str = "pagani_atelier"
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
