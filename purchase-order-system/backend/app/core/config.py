import os


class Settings:
    def __init__(self) -> None:
        self.database_url: str = os.getenv(
            "DATABASE_URL",
            "postgresql://postgres:postgres@db:5432/purchase_orders",
        )
        self.cors_allow_origins = ["*"]
        self.cors_allow_credentials = True
        self.cors_allow_methods = ["*"]
        self.cors_allow_headers = ["*"]
        self.project_name = "Purchase Order API"


settings = Settings()

