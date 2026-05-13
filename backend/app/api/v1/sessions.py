from fastapi import APIRouter, HTTPException

from app.schemas.game import (
    AvailableDecisionsResponse,
    CreateSessionRequest,
    GameSession,
    LedgerEntry,
    SimulateRequest,
    SimulateResponse,
    UpdateSessionRequest,
)
from app.services.session_service import session_service

router = APIRouter()


@router.post("", response_model=GameSession)
def create_session(payload: CreateSessionRequest) -> GameSession:
    return session_service.create_session(payload)


@router.get("/{session_id}", response_model=GameSession)
def get_session(session_id: str) -> GameSession:
    session = session_service.get_session(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="游戏局不存在")
    return session


@router.patch("/{session_id}", response_model=GameSession)
def update_session(session_id: str, payload: UpdateSessionRequest) -> GameSession:
    session = session_service.update_session(session_id, payload)
    if session is None:
        raise HTTPException(status_code=404, detail="游戏局不存在")
    return session


@router.get("/{session_id}/available-decisions", response_model=AvailableDecisionsResponse)
def get_available_decisions(session_id: str) -> AvailableDecisionsResponse:
    result = session_service.get_available_decisions(session_id)
    if result is None:
        raise HTTPException(status_code=404, detail="游戏局不存在")
    return result


@router.post("/{session_id}/simulate", response_model=SimulateResponse)
def simulate(session_id: str, payload: SimulateRequest) -> SimulateResponse:
    result = session_service.simulate(session_id, payload)
    if result is None:
        raise HTTPException(status_code=404, detail="游戏局不存在")
    return result


@router.get("/{session_id}/ledgers", response_model=list[LedgerEntry])
def get_ledgers(session_id: str, period_type: str | None = None) -> list[LedgerEntry]:
    result = session_service.get_ledgers(session_id, period_type)
    if result is None:
        raise HTTPException(status_code=404, detail="游戏局不存在")
    return result

