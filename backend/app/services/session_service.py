from __future__ import annotations

from uuid import uuid4

from app.core.config import settings
from app.engine.event_picker import pick_event
from app.engine.ledger import calculate_ledger
from app.engine.report import build_report
from app.schemas.game import (
    AvailableDecisionsResponse,
    CreateSessionRequest,
    EventResult,
    GameMetrics,
    GameSession,
    LedgerEntry,
    Report,
    SimulateRequest,
    SimulateResponse,
    UpdateSessionRequest,
)
from app.services.content_service import content_service


ROLE_FAMILY_DAILY_COST = {
    "laid_off_manager": 40000,
    "county_couple": 24000,
    "returning_founder": 30000,
    "debt_franchisee": 32000,
}


class SessionService:
    def __init__(self) -> None:
        self.sessions: dict[str, GameSession] = {}
        self.ledgers: dict[str, list[LedgerEntry]] = {}
        self.decision_history: dict[str, list[str]] = {}
        self.reports: dict[str, Report] = {}

    def create_session(self, payload: CreateSessionRequest) -> GameSession:
        role = content_service.get_role(payload.roleId)
        if role is None:
            raise ValueError(f"unknown role: {payload.roleId}")

        metrics_data = dict(role["initialMetrics"])
        metrics_data.update(payload.initialOverrides)
        metrics = GameMetrics(**metrics_data)
        session = GameSession(
            id=str(uuid4()),
            contentVersion=settings.content_version,
            mode=payload.mode,
            status="active",
            phase="opening" if payload.businessTrackId else "track_select",
            day=1,
            week=1,
            roleId=payload.roleId,
            businessTrackId=payload.businessTrackId,
            openingPackageId=None,
            metrics=metrics,
            flags={"familyDailyCost": ROLE_FAMILY_DAILY_COST.get(payload.roleId, 30000)},
        )

        if payload.openingPackageId:
            session = self._apply_opening_package(session, payload.openingPackageId)

        self.sessions[session.id] = session
        self.ledgers[session.id] = []
        self.decision_history[session.id] = []
        return session

    def get_session(self, session_id: str) -> GameSession | None:
        return self.sessions.get(session_id)

    def update_session(self, session_id: str, payload: UpdateSessionRequest) -> GameSession | None:
        session = self.sessions.get(session_id)
        if session is None:
            return None

        updated = session
        if payload.businessTrackId is not None:
            updated = updated.model_copy(update={"businessTrackId": payload.businessTrackId})
        if payload.openingPackageId is not None:
            updated = self._apply_opening_package(updated, payload.openingPackageId)
        if payload.flags:
            flags = dict(updated.flags)
            flags.update(payload.flags)
            updated = updated.model_copy(update={"flags": flags})
        if payload.phase is not None:
            updated = updated.model_copy(update={"phase": payload.phase})
        elif updated.businessTrackId and updated.phase == "track_select":
            updated = updated.model_copy(update={"phase": "opening"})

        self.sessions[session_id] = updated
        return updated

    def get_available_decisions(self, session_id: str) -> AvailableDecisionsResponse | None:
        session = self.sessions.get(session_id)
        if session is None:
            return None
        if session.phase == "report":
            return AvailableDecisionsResponse(phase=session.phase, day=session.day, week=session.week, event=None, decisions=[])
        event = pick_event(session, content_service.events)
        return AvailableDecisionsResponse(
            phase=session.phase,
            day=session.day,
            week=session.week,
            event=event,
            decisions=content_service.get_decisions_by_phase(session.phase),
        )

    def simulate(self, session_id: str, payload: SimulateRequest) -> SimulateResponse | None:
        session = self.sessions.get(session_id)
        if session is None:
            return None
        track = content_service.get_business_track(session.businessTrackId)
        if track is None:
            raise ValueError("游戏局尚未选择赛道")

        decisions = content_service.get_decisions_by_ids(payload.decisionIds)
        event = content_service.get_event(payload.eventId) or pick_event(session, content_service.events)
        ledger, metrics, flags, alerts = calculate_ledger(session, track, decisions, event)
        self.ledgers[session_id].append(ledger)
        self.decision_history[session_id].extend(decision.id for decision in decisions)

        next_session = session.model_copy(update={"metrics": metrics, "flags": flags})
        next_session = self._advance_phase(next_session)
        self.sessions[session_id] = next_session

        title = event.title if event else "今日结算"
        message = self._build_event_message(ledger)
        action_logs = self._build_action_logs(decisions, event, ledger)
        return SimulateResponse(
            session=next_session,
            eventResult=EventResult(title=title, message=message),
            actionLogs=action_logs,
            ledger=ledger,
            riskAlerts=alerts,
        )

    def get_ledgers(self, session_id: str, period_type: str | None = None) -> list[LedgerEntry] | None:
        if session_id not in self.sessions:
            return None
        items = self.ledgers.get(session_id, [])
        if period_type:
            return [item for item in items if item.periodType == period_type]
        return items

    def generate_report(self, session_id: str) -> Report | None:
        session = self.sessions.get(session_id)
        if session is None:
            return None
        if session_id in self.reports:
            return self.reports[session_id]

        role = content_service.get_role(session.roleId) or {"name": session.roleId}
        track = content_service.get_business_track(session.businessTrackId) or {"name": "小店"}
        report = build_report(
            session=session,
            ledgers=self.ledgers.get(session_id, []),
            decision_ids=self.decision_history.get(session_id, []),
            role_name=role["name"],
            track_name=track["name"],
        )
        self.reports[session_id] = report
        self.sessions[session_id] = session.model_copy(update={"status": "finished", "phase": "report"})
        return report

    def get_report(self, session_id: str) -> Report | None:
        return self.reports.get(session_id)

    def _apply_opening_package(self, session: GameSession, package_id: str) -> GameSession:
        package = content_service.get_opening_package(package_id)
        if package is None or session.openingPackageId == package_id:
            return session

        effect = package["effect"]
        metrics = session.metrics.model_copy(
            update={
                "cash": session.metrics.cash + int(effect.get("cash", 0)),
                "reputation": max(0, min(100, session.metrics.reputation + int(effect.get("reputation", 0)))),
                "information": max(0, min(100, session.metrics.information + int(effect.get("information", 0)))),
                "impulse": max(0, min(100, session.metrics.impulse + int(effect.get("impulse", 0)))),
            }
        )
        flags = dict(session.flags)
        for key in ("dailyRentCostDelta", "materialRateDelta"):
            if key in effect:
                flags[key] = flags.get(key, 0) + effect[key]
        flags["openingPackageName"] = package["name"]
        return session.model_copy(
            update={
                "openingPackageId": package_id,
                "metrics": metrics,
                "flags": flags,
                "phase": "opening" if session.businessTrackId else session.phase,
            }
        )

    def _advance_phase(self, session: GameSession) -> GameSession:
        if session.flags.get("stopLoss"):
            return session.model_copy(update={"status": "finished", "phase": "report"})

        if session.mode == "quick":
            if session.day >= 7:
                return session.model_copy(update={"status": "finished", "phase": "report"})
            next_day = session.day + 1
            if next_day <= 4:
                phase = "opening"
            elif next_day <= 6:
                phase = "stable"
            else:
                phase = "crisis"
            return session.model_copy(update={"day": next_day, "phase": phase})

        if session.phase == "opening" and session.day >= 7:
            return session.model_copy(update={"phase": "stable", "week": 1})
        return session.model_copy(update={"day": session.day + 1})

    def _build_event_message(self, ledger: LedgerEntry) -> str:
        if ledger.familyNetCashFlow < 0 and ledger.revenueAmount > 0:
            return "今天店里不冷清，但忙完之后家庭后净现金流仍然是负数。"
        if ledger.operationNetCashFlow > 0 and ledger.familyNetCashFlow < 0:
            return "门店经营略有结余，但家庭固定支出和还款把现金流压了回去。"
        if ledger.familyNetCashFlow > 0:
            return "今天账上留下了钱，但还要继续观察复购和成本结构。"
        return "今天的经营数据偏弱，需要重新检查成本和客流来源。"

    def _build_action_logs(self, decisions, event, ledger: LedgerEntry) -> list[str]:
        logs: list[str] = []
        if event is not None:
            logs.append(f"突发事件：{event.title}。{event.content}")

        for decision in decisions:
            if decision.processLogs:
                logs.extend(f"选择了{decision.title}：{item}" for item in decision.processLogs)
            else:
                logs.append(f"选择了{decision.title}：{decision.insight or decision.description}")

        if ledger.revenueAmount > 0:
            logs.append(f"营业反馈：今日流水 ¥{ledger.revenueAmount / 100:,.0f}，经营净现金流 ¥{ledger.operationNetCashFlow / 100:,.0f}。")
        if ledger.familyNetCashFlow < 0:
            logs.append(f"现金流警报：扣除家庭支出和还款后，今日净流出 ¥{abs(ledger.familyNetCashFlow) / 100:,.0f}。")
        else:
            logs.append(f"现金流反馈：扣除家庭支出和还款后，今日净流入 ¥{ledger.familyNetCashFlow / 100:,.0f}。")
        return logs


session_service = SessionService()
