"""
FastAPI Main Application Entry Point
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.routes import router
from app.services.elexon_client import data_manager

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("wind_portal")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Warm up data caches on startup."""
    logger.info("Initializing UK Wind Day-Ahead Procurement Portal backend...")
    try:
        data_manager.get_actuals_df()
        data_manager.get_forecasts_df()
        logger.info("Data caches warmed successfully.")
    except Exception as e:
        logger.error("Warmup warning: %s", e)
    yield
    logger.info("Shutting down backend...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Evaluation of UK National Grid ESO Wind Generation Forecasts against Elexon BMRS Actuals for Day-Ahead Power Procurement.",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routes
app.include_router(router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {
        "message": "UK Wind Day-Ahead Procurement & Evaluation API is operational.",
        "docs": "/docs",
        "health": "/api/health",
        "version": settings.VERSION,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
