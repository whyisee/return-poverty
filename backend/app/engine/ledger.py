from __future__ import annotations

from app.engine.formulas import add_effects, clamp, survival_days
from app.schemas.game import DecisionCard, EventCard, GameMetrics, GameSession, LedgerEntry, RiskAlert


def calculate_ledger(
    session: GameSession,
    track: dict,
    decisions: list[DecisionCard],
    event: EventCard | None,
) -> tuple[LedgerEntry, GameMetrics, dict[str, bool | int | float | str], list[RiskAlert]]:
    params = dict(track["baseParams"])
    flags = dict(session.flags)

    params["dailyRentCost"] += int(flags.get("dailyRentCostDelta", 0))
    params["materialRate"] += float(flags.get("materialRateDelta", 0))

    decision_effect = add_effects(*(decision.effect for decision in decisions))
    decision_cost = add_effects(*(decision.cost for decision in decisions))
    event_effect = event.effect if event else {}
    effect = add_effects(decision_effect, event_effect)

    traffic_rate = 1 + float(effect.get("trafficRate", 0))
    reputation_factor = clamp(1 + (session.metrics.reputation - 50) / 240, 0.72, 1.28)
    repeat_factor = clamp(1 + session.metrics.repeatRate, 0.9, 1.22)
    impulse_drag = 1 - max(session.metrics.impulse - 65, 0) / 500

    traffic = max(
        0,
        int(params["baseTraffic"] * traffic_rate * reputation_factor * repeat_factor * impulse_drag),
    )
    conversion_rate = clamp(float(params["conversionRate"]) + float(effect.get("conversionRate", 0)), 0.08, 0.85)
    average_ticket = int(params["averageTicketAmount"] * (1 + float(effect.get("ticketRate", 0))))
    revenue = int(traffic * conversion_rate * average_ticket)

    material_rate = clamp(float(params["materialRate"]) + float(effect.get("materialRate", 0)), 0.12, 0.72)
    delivery_rate = clamp(float(params["deliveryRate"]) + float(effect.get("deliveryRate", 0)), 0, 0.95)
    platform_rate = clamp(float(params["platformRate"]) + float(effect.get("platformRate", 0)), 0, 0.3)
    discount_rate = clamp(float(params["discountRate"]) + float(effect.get("discountRate", 0)), 0, 0.45)
    waste_rate = clamp(float(params["wasteRate"]) + float(effect.get("wasteRate", 0)), 0, 0.35)

    material_cost = int(revenue * material_rate)
    platform_fee = int(revenue * delivery_rate * platform_rate)
    discount_cost = int(revenue * discount_rate)
    waste_cost = int(revenue * waste_rate)
    marketing_cost = int(decision_cost.get("cash", 0))
    labor_cost = max(0, int(params["dailyLaborCost"] + effect.get("laborCost", 0)))
    rent_cost = max(0, int(params["dailyRentCost"] + effect.get("dailyRentCostDelta", 0)))
    utility_cost = max(0, int(params["dailyUtilityCost"] + effect.get("utilityCost", 0)))
    repair_cost = max(0, int(effect.get("repairCost", 0)))

    operation_net = (
        revenue
        - material_cost
        - platform_fee
        - discount_cost
        - waste_cost
        - marketing_cost
        - labor_cost
        - rent_cost
        - utility_cost
        - repair_cost
    )

    family_cost = int(flags.get("familyDailyCost", 30000))
    debt_after_effect = max(0, session.metrics.debt + int(effect.get("debt", 0)))
    loan_payment = int(debt_after_effect * 0.001)
    family_net = operation_net - family_cost - loan_payment
    direct_cash_effect = int(effect.get("cash", 0))

    new_cash = session.metrics.cash + family_net + direct_cash_effect
    new_debt = debt_after_effect
    family_pressure_delta = int(effect.get("familyPressure", 0))
    if family_net < 0:
        family_pressure_delta += min(6, int(abs(family_net) / 200000) + 1)
    if new_cash < family_cost * 14:
        family_pressure_delta += 4

    energy_cost = int(decision_cost.get("energy", 0))
    energy_delta = int(effect.get("energy", 0)) - energy_cost
    new_metrics = session.metrics.model_copy(
        update={
            "cash": int(new_cash),
            "debt": int(new_debt),
            "dailyNetCashFlow": int(family_net),
            "weeklyNetCashFlow": int(family_net * 7),
            "survivalDays": survival_days(
                int(new_cash),
                int(family_net),
                max(family_cost + loan_payment + rent_cost, 1),
            ),
            "familyPressure": int(clamp(session.metrics.familyPressure + family_pressure_delta, 0, 100)),
            "energy": int(clamp(session.metrics.energy + energy_delta, 0, 100)),
            "reputation": int(clamp(session.metrics.reputation + int(effect.get("reputation", 0)), 0, 100)),
            "repeatRate": float(clamp(session.metrics.repeatRate + float(effect.get("repeatRate", 0)), 0, 0.6)),
            "information": int(clamp(session.metrics.information + int(effect.get("information", 0)), 0, 100)),
            "impulse": int(clamp(session.metrics.impulse + int(effect.get("impulse", 0)), 0, 100)),
        }
    )

    if int(effect.get("stopLoss", 0)):
        flags["stopLoss"] = 1

    ledger = LedgerEntry(
        periodType="day",
        periodIndex=session.day,
        revenueAmount=revenue,
        materialCost=material_cost,
        laborCost=labor_cost,
        rentCost=rent_cost,
        platformFee=platform_fee,
        discountCost=discount_cost,
        marketingCost=marketing_cost,
        wasteCost=waste_cost,
        utilityCost=utility_cost,
        repairCost=repair_cost,
        operationNetCashFlow=operation_net,
        familyCost=family_cost,
        loanPayment=loan_payment,
        familyNetCashFlow=family_net,
        detail={
            "traffic": traffic,
            "conversionRate": round(conversion_rate, 4),
            "averageTicketAmount": average_ticket,
            "materialRate": round(material_rate, 4),
            "discountRate": round(discount_rate, 4),
            "wasteRate": round(waste_rate, 4),
            "decisionTitles": [decision.title for decision in decisions],
            "eventTitle": event.title if event else "",
        },
    )

    alerts = build_risk_alerts(new_metrics, ledger)
    return ledger, new_metrics, flags, alerts


def build_risk_alerts(metrics: GameMetrics, ledger: LedgerEntry) -> list[RiskAlert]:
    alerts: list[RiskAlert] = []
    if ledger.revenueAmount > 0 and ledger.familyNetCashFlow < 0:
        alerts.append(RiskAlert(level="warning", message="今天有流水，但家庭后净现金流仍为负。"))
    if ledger.discountCost + ledger.marketingCost > ledger.revenueAmount * 0.18:
        alerts.append(RiskAlert(level="warning", message="满减和投流正在吞掉利润。"))
    if metrics.survivalDays <= 14:
        alerts.append(RiskAlert(level="danger", message="现金安全垫低于 14 天，需要立刻设置止损线。"))
    elif metrics.survivalDays <= 30:
        alerts.append(RiskAlert(level="warning", message="现金可撑天数低于 30 天，继续加码会很危险。"))
    if metrics.familyPressure >= 85:
        alerts.append(RiskAlert(level="danger", message="家庭压力接近临界值，经营决策需要优先保护现金流底线。"))
    if not alerts:
        alerts.append(RiskAlert(level="info", message="当前最重要的是继续观察复购和净现金流。"))
    return alerts

