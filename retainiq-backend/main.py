"""RetainIQ FastAPI application entry point."""

import logging
import os
from pathlib import Path

from dotenv import load_dotenv

# Load .env relative to this file, not the current working directory, so the
# server behaves identically whether started from the repo root or from
# retainiq-backend/. Must run before any module that reads os.environ at import.
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

from fastapi import FastAPI  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)

logger = logging.getLogger(__name__)

if not os.getenv("GROQ_API_KEY"):
    logger.warning(
        "GROQ_API_KEY not found after loading..."
    )

from api import (  # noqa: E402  (import after load_dotenv)
    ai,
    analytics,
    campaigns,
    customers,
    dashboard,
    recommendations,
    reports,
    segmentation,
    settings,
)

app = FastAPI(
    title="RetainIQ API",
    description="Customer retention analytics and AI recommendations.",
    version="1.0.0",
)

ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get(
        "CORS_ORIGINS",
        "https://retainiq-frontend-u2vh.onrender.com,http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for router in (
    dashboard.router,
    customers.router,
    analytics.router,
    reports.router,
    segmentation.router,
    recommendations.router,
    campaigns.router,
    settings.router,
    ai.router,
):
    app.include_router(router, prefix="/api")


@app.get("/")
def root():
    """Return basic service metadata."""
    return {"service": "RetainIQ API", "status": "ok", "docs": "/docs"}


@app.get("/api/health")
def health():
    """Return a health check including dataset, model, and AI readiness."""
    from data_processing.dataset_loader import get_customers
    from services.ai_client import ai_status
    from services.churn_model import get_metrics

    try:
        customer_count = len(get_customers())
        dataset_ok = True
    except Exception as exc:
        customer_count = 0
        dataset_ok = False
        logger.error("Dataset unavailable: %s", exc)

    status = ai_status()

    return {
        "status": "ok" if dataset_ok else "degraded",
        "datasetLoaded": dataset_ok,
        "customerCount": customer_count,
        "aiConfigured": status["available"],
        "aiState": status["state"],
        "aiMessage": status["message"],
        "envPath": str(BASE_DIR / ".env"),
        "envFileFound": (BASE_DIR / ".env").exists(),
        "modelMetrics": get_metrics(),
    }