from fastapi import APIRouter

from app.services.content_service import content_service

router = APIRouter()


@router.get("/bootstrap")
def get_bootstrap() -> dict:
    return content_service.get_bootstrap()

