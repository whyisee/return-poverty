from __future__ import annotations


def clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


def add_effects(*effects: dict[str, int | float] | None) -> dict[str, int | float]:
    result: dict[str, int | float] = {}
    for effect in effects:
        if not effect:
            continue
        for key, value in effect.items():
            result[key] = result.get(key, 0) + value
    return result


def survival_days(cash: int, latest_family_net_cash_flow: int, minimum_gap: int) -> int:
    if cash <= 0:
        return 0
    gap = abs(latest_family_net_cash_flow) if latest_family_net_cash_flow < 0 else minimum_gap
    gap = max(gap, 1)
    return int(cash / gap)

