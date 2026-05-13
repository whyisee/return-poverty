from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = "development"
    content_version: str = "v0.1"
    database_url: str = "mysql+pymysql://root:password@127.0.0.1:3306/return_poverty?charset=utf8mb4"
    cors_origins: list[str] = ["http://localhost:3101", "http://127.0.0.1:3101"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
