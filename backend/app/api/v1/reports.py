from fastapi import APIRouter, HTTPException

from app.schemas.game import Report
from app.services.session_service import session_service

router = APIRouter()


@router.post("/{session_id}/report", response_model=Report)
def generate_report(session_id: str) -> Report:
    report = session_service.generate_report(session_id)
    if report is None:
        raise HTTPException(status_code=404, detail="游戏局不存在")
    return report


@router.get("/{session_id}/report", response_model=Report)
def get_report(session_id: str) -> Report:
    report = session_service.get_report(session_id)
    if report is None:
        raise HTTPException(status_code=404, detail="报告不存在")
    return report

