"""RetainIQ FastAPI application entry point."""

import logging
import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
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
        "http://localhost:5173,http://127.0.0.1:5173",
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
    """Return a health check including dataset and model readiness."""
    from data_processing.dataset_loader import get_customers
    from services.ai_client import is_configured
    from services.churn_model import get_metrics

    try:
        customer_count = len(get_customers())
        dataset_ok = True
    except Exception as exc:
        customer_count = 0
        dataset_ok = False
        logging.error("Dataset unavailable: %s", exc)

    return {
        "status": "ok" if dataset_ok else "degraded",
        "datasetLoaded": dataset_ok,
        "customerCount": customer_count,
        "aiConfigured": is_configured(),
        "modelMetrics": get_metrics(),
    }