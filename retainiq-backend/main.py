from dotenv import load_dotenv
load_dotenv() 
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api import (
    dashboard,
    customers,
    analytics,
    reports,
    campaigns,
    settings,
    recommendations,
    segmentation,
    ai,
)

app = FastAPI(title="RetainIQ API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
    ],
    allow_origin_regex=r"https://retain-iq.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard.router, prefix="/api")
app.include_router(customers.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(campaigns.router, prefix="/api")
app.include_router(settings.router, prefix="/api")
app.include_router(recommendations.router, prefix="/api")
app.include_router(segmentation.router, prefix="/api")
app.include_router(ai.router, prefix="/api")

@app.get("/")
def home():
    return {"message": "RetainIQ Backend Running"}