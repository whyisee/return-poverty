from fastapi import APIRouter

from app.api.v1 import content, reports, sessions

api_router = APIRouter()
api_router.include_router(content.router, prefix="/content", tags=["content"])
api_router.include_router(sessions.router, prefix="/sessions", tags=["sessions"])
api_router.include_router(reports.router, prefix="/sessions", tags=["reports"])

