"""
Application Configuration
Defines environment settings, default market parameters, and filesystem paths.
"""

import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "UK Wind Day-Ahead Procurement & Evaluation Portal"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Base directory of the backend app
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    DATA_DIR: str = os.path.join(BASE_DIR, "data")
    
    # Cached dataset paths
    FUELHH_PATH: str = os.path.join(DATA_DIR, "fuelhh_jan2026.json")
    WINDFOR_PATH: str = os.path.join(DATA_DIR, "windfor_jan2026.json")
    
    # UK Power Market Day-Ahead defaults
    # EPEX SPOT GB Day-Ahead gate closure is 11:00 / 12:00 UTC on D-1
    DEFAULT_CUTOFF_HOUR: int = 12
    DEFAULT_START_DATE: str = "2026-01-01"
    DEFAULT_END_DATE: str = "2026-01-31"
    
    # CORS origins
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "*"
    ]

    class Config:
        case_sensitive = True


settings = Settings()
