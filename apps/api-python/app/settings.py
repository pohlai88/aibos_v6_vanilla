from pydantic_settings import BaseSettings
from pydantic import AnyUrl

class Settings(BaseSettings):
    ENV: str
    DATABASE_URL: AnyUrl

    class Config:
        env_file = ".env.development"
        case_sensitive = True

settings = Settings()

# Usage:
# from .settings import settings
# print(settings.DATABASE_URL)
# If parsing fails, the service should exit at startup with a clear error.
