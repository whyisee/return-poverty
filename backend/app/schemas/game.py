from typing import Literal

from pydantic import BaseModel, Field

GameMode = Literal["quick", "full"]
GamePhase = Literal[
    "motivation",
    "precheck",
    "track_select",
    "preparation",
    "opening",
    "stable",
    "crisis",
    "report",
]
SessionStatus = Literal["active", "finished", "abandoned"]


class GameMetrics(BaseModel):
    cash: int
    debt: int = 0
    dailyNetCashFlow: int = 0
    weeklyNetCashFlow: int = 0
    survivalDays: int = 0
    familyPressure: int = 0
    energy: int = 80
    reputation: int = 50
    repeatRate: float = 0.1
    information: int = 20
    impulse: int = 50


class GameSession(BaseModel):
    id: str
    contentVersion: str
    mode: GameMode
    status: SessionStatus
    phase: GamePhase
    day: int
    week: int
    roleId: str
    businessTrackId: str | None = None
    openingPackageId: str | None = None
    metrics: GameMetrics
    flags: dict[str, bool | int | float | str] = Field(default_factory=dict)


class CreateSessionRequest(BaseModel):
    mode: GameMode = "quick"
    roleId: str
    businessTrackId: str | None = None
    openingPackageId: str | None = None
    initialOverrides: dict[str, int | float | str] = Field(default_factory=dict)


class UpdateSessionRequest(BaseModel):
    phase: GamePhase | None = None
    businessTrackId: str | None = None
    openingPackageId: str | None = None
    flags: dict[str, bool | int | float | str] | None = None


class DecisionCard(BaseModel):
    id: str
    title: str
    phase: GamePhase
    description: str
    cost: dict[str, int | float] = Field(default_factory=dict)
    effect: dict[str, int | float] = Field(default_factory=dict)
    risk: list[str] = Field(default_factory=list)
    processLogs: list[str] = Field(default_factory=list)
    insight: str = ""


class EventCard(BaseModel):
    id: str
    phase: GamePhase
    category: str
    title: str
    content: str
    effect: dict[str, int | float] = Field(default_factory=dict)
    weight: int = 100


class AvailableDecisionsResponse(BaseModel):
    phase: GamePhase
    day: int
    week: int
    event: EventCard | None = None
    decisions: list[DecisionCard]


class SimulateRequest(BaseModel):
    decisionIds: list[str]
    eventId: str | None = None


class LedgerEntry(BaseModel):
    periodType: Literal["day", "week"]
    periodIndex: int
    revenueAmount: int = 0
    materialCost: int = 0
    laborCost: int = 0
    rentCost: int = 0
    platformFee: int = 0
    discountCost: int = 0
    marketingCost: int = 0
    wasteCost: int = 0
    utilityCost: int = 0
    repairCost: int = 0
    operationNetCashFlow: int = 0
    familyCost: int = 0
    loanPayment: int = 0
    familyNetCashFlow: int = 0
    detail: dict[str, int | float | str | list[str]] = Field(default_factory=dict)


class RiskAlert(BaseModel):
    level: Literal["info", "warning", "danger"]
    message: str


class EventResult(BaseModel):
    title: str
    message: str


class SimulateResponse(BaseModel):
    session: GameSession
    eventResult: EventResult
    actionLogs: list[str]
    ledger: LedgerEntry
    riskAlerts: list[RiskAlert]


class Report(BaseModel):
    endingType: str
    title: str
    summary: str
    totalRevenue: int
    totalNetCashFlow: int
    maxLossSources: list[str]
    rightDecisions: list[str]
    dangerousDecisions: list[str]
    suggestion: str
    shareText: str
    reportDetail: dict[str, int | float | str | list[str]]
