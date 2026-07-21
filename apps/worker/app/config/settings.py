from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    redis_url: str = "redis://localhost:6379"
    mongo_uri: str = "mongodb://localhost:27017/ai-task-platform"
    mongo_db: str = "ai-task-platform"
    poll_interval: float = 1.0
    log_level: str = "INFO"

    model_config = {"env_file": ".env", "env_prefix": "WORKER_"}


settings = Settings()
