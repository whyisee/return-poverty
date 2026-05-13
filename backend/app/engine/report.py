from app.schemas.game import GameSession, LedgerEntry, Report


LOSS_SOURCE_LABELS = {
    "materialCost": "原料成本",
    "laborCost": "人工成本",
    "rentCost": "房租",
    "platformFee": "平台抽成",
    "discountCost": "满减优惠",
    "marketingCost": "营销投流",
    "wasteCost": "报废损耗",
    "utilityCost": "水电杂费",
    "repairCost": "设备维修",
    "familyCost": "家庭固定支出",
    "loanPayment": "贷款还款",
}


RIGHT_DECISION_HINTS = {
    "check_ledger": "认真拆过账本",
    "stock_carefully": "保守备货降低报废",
    "cut_low_margin_sku": "砍掉低毛利 SKU",
    "member_test": "尝试用会员复购替代粗暴满减",
    "stop_loss_transfer": "及时转让止损",
}

DANGEROUS_DECISION_HINTS = {
    "opening_discount": "开业满减压薄利润",
    "local_ads": "投流过重但复购未验证",
    "borrow_to_continue": "借款续命抬高债务压力",
}


def build_report(
    session: GameSession,
    ledgers: list[LedgerEntry],
    decision_ids: list[str],
    track_name: str,
    role_name: str,
) -> Report:
    total_revenue = sum(item.revenueAmount for item in ledgers)
    total_net = sum(item.familyNetCashFlow for item in ledgers)

    loss_totals = {
        field: sum(getattr(item, field) for item in ledgers)
        for field in LOSS_SOURCE_LABELS
    }
    max_loss_sources = [
        LOSS_SOURCE_LABELS[field]
        for field, _amount in sorted(loss_totals.items(), key=lambda pair: pair[1], reverse=True)[:3]
    ]

    right_decisions = [label for key, label in RIGHT_DECISION_HINTS.items() if key in decision_ids]
    dangerous_decisions = [label for key, label in DANGEROUS_DECISION_HINTS.items() if key in decision_ids]
    if not right_decisions:
        right_decisions = ["完成了一次完整经营复盘"]
    if not dangerous_decisions:
        dangerous_decisions = ["暂无明显高危加码动作"]

    ending_type, title, summary, suggestion = decide_ending(session, total_net, decision_ids)
    share_text = (
        f"我在《中年返贫四件套》里以“{role_name}”身份开了一家{track_name}店。"
        f"模拟流水 ¥{total_revenue / 100:,.0f}，家庭后净现金流 ¥{total_net / 100:,.0f}。"
        f"最大压力来自：{'、'.join(max_loss_sources)}。系统建议：{suggestion}"
    )

    return Report(
        endingType=ending_type,
        title=title,
        summary=summary,
        totalRevenue=total_revenue,
        totalNetCashFlow=total_net,
        maxLossSources=max_loss_sources,
        rightDecisions=right_decisions[:3],
        dangerousDecisions=dangerous_decisions[:3],
        suggestion=suggestion,
        shareText=share_text,
        reportDetail={
            "roleName": role_name,
            "trackName": track_name,
            "finalCash": session.metrics.cash,
            "finalDebt": session.metrics.debt,
            "survivalDays": session.metrics.survivalDays,
            "familyPressure": session.metrics.familyPressure,
            "ledgerCount": len(ledgers),
        },
    )


def decide_ending(
    session: GameSession,
    total_net: int,
    decision_ids: list[str],
) -> tuple[str, str, str, str]:
    if "stop_loss_transfer" in decision_ids or session.flags.get("stopLoss"):
        return (
            "cautious_stop_loss",
            "谨慎止损",
            "亏了钱，但你在家庭现金流被击穿前停了下来。",
            "停止追加投入，优先回收现金并复盘真实成本结构。",
        )
    if session.metrics.cash < 0 or (session.metrics.debt > 12000000 and session.metrics.familyPressure >= 85):
        return (
            "poverty_triggered",
            "返贫触发",
            "现金断裂，债务和家庭固定支出已经无法覆盖。",
            "立刻停止扩张和投流，优先处理债务与家庭现金流。",
        )
    if "borrow_to_continue" in decision_ids and total_net < 0:
        return (
            "debt_survival",
            "借债续命",
            "靠贷款维持了经营，但模型还没有跑通。",
            "不要继续用借款掩盖亏损，先验证单店正现金流。",
        )
    if total_net < 0 and session.metrics.familyPressure >= 75:
        return (
            "family_overdraft",
            "家庭透支",
            "店还在，但家庭压力已经接近临界线。",
            "把家庭固定支出和止损线放到经营目标之前。",
        )
    if total_net < 0:
        return (
            "false_boom",
            "虚假繁荣",
            "流水看起来不错，但净现金流长期为负。",
            "减少满减和低效投流，优先修正利润结构。",
        )
    if total_net > 0 and session.metrics.survivalDays >= 45:
        return (
            "small_profit",
            "微利跑通",
            "店铺形成了小额正现金流，但仍需要谨慎扩张。",
            "继续观察复购和成本，不要过早开第二家。",
        )
    return (
        "steady_pivot",
        "稳健转型",
        "这次试错没有击穿家庭底线，你保留了调整路线的空间。",
        "保留轻资产验证，把大额投入推迟到模型更清楚之后。",
    )

