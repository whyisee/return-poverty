from __future__ import annotations

import json
from functools import cached_property
from pathlib import Path
from typing import Any

from app.core.config import settings
from app.schemas.game import DecisionCard, EventCard


class ContentService:
    def __init__(self) -> None:
        self.seed_dir = Path(__file__).resolve().parents[1] / "seed"

    def get_bootstrap(self) -> dict[str, Any]:
        return {
            "contentVersion": settings.content_version,
            "roles": self.roles,
            "businessTracks": self.business_tracks,
            "openingPackages": self.opening_packages,
            "phases": [
                {"id": "opening", "name": "开业冲刺"},
                {"id": "stable", "name": "稳定经营"},
                {"id": "crisis", "name": "危机与诱惑"},
                {"id": "report", "name": "结局复盘"},
            ],
        }

    @cached_property
    def roles(self) -> list[dict[str, Any]]:
        return self._load("roles.json")

    @cached_property
    def business_tracks(self) -> list[dict[str, Any]]:
        return self._load("business_tracks.json")

    @cached_property
    def opening_packages(self) -> list[dict[str, Any]]:
        return self._load("opening_packages.json")

    @cached_property
    def decisions(self) -> list[DecisionCard]:
        return [DecisionCard(**item) for item in self._load("decisions.json")]

    @cached_property
    def events(self) -> list[EventCard]:
        return [EventCard(**item) for item in self._load("events.json")]

    def get_role(self, role_id: str) -> dict[str, Any] | None:
        return next((item for item in self.roles if item["id"] == role_id), None)

    def get_business_track(self, track_id: str | None) -> dict[str, Any] | None:
        if track_id is None:
            return None
        return next((item for item in self.business_tracks if item["id"] == track_id), None)

    def get_opening_package(self, package_id: str | None) -> dict[str, Any] | None:
        if package_id is None:
            return None
        return next((item for item in self.opening_packages if item["id"] == package_id), None)

    def get_decisions_by_phase(self, phase: str) -> list[DecisionCard]:
        return [decision for decision in self.decisions if decision.phase == phase]

    def get_decisions_by_ids(self, decision_ids: list[str]) -> list[DecisionCard]:
        decision_map = {decision.id: decision for decision in self.decisions}
        return [decision_map[item] for item in decision_ids if item in decision_map]

    def get_event(self, event_id: str | None) -> EventCard | None:
        if event_id is None:
            return None
        return next((event for event in self.events if event.id == event_id), None)

    def _load(self, filename: str) -> list[dict[str, Any]]:
        with (self.seed_dir / filename).open(encoding="utf-8") as file:
            return json.load(file)


content_service = ContentService()

