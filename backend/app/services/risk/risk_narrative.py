"""
Deterministic insight generation from Monte Carlo outputs: no LLM.
Maps simulated frequencies to plain-language insights, actions, CoT steps,
and devil's-advocate counters using fixed thresholds.
"""
from __future__ import annotations

from typing import Any


def _pct_display(x: float) -> str:
    return f"{round(x * 100)}%"


def build_deterministic_narrative(mc: dict[str, Any]) -> dict[str, Any]:
    """
    Expects keys from run_liquidity_monte_carlo including:
    probability_of_default, probability_receivables_heavy_loss,
    probability_receivables_material_shortfall, probability_expense_spike,
    mean_inflow_baseline, mean_expense_baseline, starting_balance,
    inflow_variability, expense_variability, n_simulations
    """
    p_def = float(mc.get("probability_of_default") or 0)
    p_70 = float(mc.get("probability_receivables_heavy_loss") or 0)
    p_50 = float(mc.get("probability_receivables_material_shortfall") or 0)
    p_exp = float(mc.get("probability_expense_spike") or 0)
    inf_mu = float(mc.get("mean_inflow_baseline") or 0)
    exp_mu = float(mc.get("mean_expense_baseline") or 0)
    bal = float(mc.get("starting_balance") or 0)
    inf_cv = float(mc.get("inflow_variability") or 0)
    exp_cv = float(mc.get("expense_variability") or 0)
    n = int(mc.get("n_simulations") or 0)

    insights: list[dict[str, Any]] = []
    primary_actions: list[str] = []
    cot_master: list[str] = []
    devil_chunks: list[str] = []

    # ---- Master CoT (always deterministic backbone)
    cot_master.append(
        "Start from your dashboard baselines: starting cash, total receivables as "
        "expected inflow, and total payables as expected outflow for one period."
    )
    cot_master.append(
        f"Apply Gaussian shocks with coefficient of variation {round(inf_cv * 100)}% on "
        f"inflows and {round(exp_cv * 100)}% on expenses ({n:,} independent draws)."
    )
    cot_master.append(
        "Classify each path: ending liquidity = cash + realized inflow − realized expense; "
        "default if ending < 0. Receivable stress flags when realized inflow is far below baseline."
    )

    # ---- Insight: heavy receivable loss (~70% not obtained proxy: inflow ≤ 30% of baseline)
    if inf_mu > 0 and p_70 >= 0.15:
        headline = (
            f"There is a substantial chance ({_pct_display(p_70)}) that collections arrive "
            "far below plan—as if a large share of receivables did not convert in that period."
        )
        action = (
            "Tighten collections: call top aging balances this week, confirm pay dates in writing, "
            "and sequence follow-ups by amount and age. Only offer discounts if the math still clears your margin."
        )
        cot_steps = [
            f"Baseline expected inflow is {inf_mu:,.0f} (from receivables).",
            "We count paths where realized inflow is at or below 30% of that baseline.",
            f"That occurred in {_pct_display(p_70)} of simulations, so collection risk is material.",
            "Therefore the action focuses on speeding and securing cash already owed—not new sales.",
        ]
        devil = (
            "Devil's advocate: pressing every debtor at once can signal distress and slow payments "
            "further; some customers always pay late but reliably pay. Balance urgency with "
            "relationship risk, and avoid margin-killing discounts unless runway truly requires it."
        )
        insights.append(
            {
                "id": "receivables_heavy_loss",
                "headline": headline,
                "action": action,
                "chain_of_thought": cot_steps,
                "devils_advocate": devil,
            }
        )
        primary_actions.append(action)
        devil_chunks.append(devil)

    # ---- Insight: material shortfall (50% line)
    elif inf_mu > 0 and p_50 >= 0.35:
        headline = (
            f"In about {_pct_display(p_50)} of scenarios, inflow was at or below half of your "
            "receivables baseline—still a serious planning gap."
        )
        action = (
            "Split receivables into 'must collect this period' vs 'stretch'; escalate the must-collect "
            "list weekly and match payables timing to realistic inflow, not the headline receivables total."
        )
        cot_steps = [
            f"With mean inflow baseline {inf_mu:,.0f}, the 50%-of-baseline threshold separates stressed paths.",
            f"{_pct_display(p_50)} of paths fell on or below that line.",
            "That pattern says dependency on full collection is optimistic—cash timing needs slack or acceleration.",
        ]
        devil = (
            "Devil's advocate: bifurcating receivables can underweight strategic vendors you want to "
            "keep sweet; ensure escalation does not starve critical partners you rely on for the next quarter."
        )
        insights.append(
            {
                "id": "receivables_material",
                "headline": headline,
                "action": action,
                "chain_of_thought": cot_steps,
                "devils_advocate": devil,
            }
        )
        if action not in primary_actions:
            primary_actions.append(action)
        devil_chunks.append(devil)

    # ---- Liquidity default / tail
    if p_def >= 0.08:
        headline = (
            f"In {_pct_display(p_def)} of runs, cash ended below zero after this period—liquidity tail risk is elevated."
        )
        action = (
            "Build a short bridge: delay non-critical payables where contract allows, accelerate "
            "the largest inflows, and freeze discretionary outflows until the next rolling 13-week cash view is green."
        )
        cot_steps = [
            f"Default rate in simulation is {_pct_display(p_def)} (ending cash < 0).",
            f"Starting balance {bal:,.0f} vs mean inflow {inf_mu:,.0f} and mean expense {exp_mu:,.0f} frames how thin margins are.",
            "When negative outcomes are frequent, the priority is survival sequencing—payables triage and inflow acceleration.",
        ]
        devil = (
            "Devil's advocate: delaying payables can trigger penalties or legal exposure; confirm terms. "
            "Freezing spend can harm growth—if the business is intentionally investing through a thin patch, "
            "this model may overstate downside because it treats all expenses as equally rigid."
        )
        insights.append(
            {
                "id": "liquidity_tail",
                "headline": headline,
                "action": action,
                "chain_of_thought": cot_steps,
                "devils_advocate": devil,
            }
        )
        if p_def >= 0.15 and action not in primary_actions:
            primary_actions.insert(0, action)
        elif action not in primary_actions:
            primary_actions.append(action)
        devil_chunks.append(devil)

    # ---- Expense spike
    if exp_mu > 0 and p_exp >= 0.22:
        headline = (
            f"About {_pct_display(p_exp)} of paths saw expenses at least 20% above your payables baseline—cost shocks matter here."
        )
        action = (
            "Pre-negotiate payment timing with top vendors, lock variable costs where possible, and keep "
            "one month of payables in an explicit 'shock' buffer so surprise bills do not eat runway in one hit."
        )
        cot_steps = [
            f"Mean expense baseline is {exp_mu:,.0f}.",
            "We flag paths with realized expense ≥ 120% of that baseline.",
            f"{_pct_display(p_exp)} crossing that line means variable or lumpy payables dominate risk.",
        ]
        devil = (
            "Devil's advocate: over-buffering cash idle in checking has opportunity cost; negotiation may not "
            "always succeed if suppliers are tight on credit. Calibrate buffer size to actual vendor behavior, not only the model."
        )
        insights.append(
            {
                "id": "expense_spike",
                "headline": headline,
                "action": action,
                "chain_of_thought": cot_steps,
                "devils_advocate": devil,
            }
        )
        if action not in primary_actions:
            primary_actions.append(action)
        devil_chunks.append(devil)

    # ---- General actions (always appended, low specificity)
    general = [
        "Reconcile this simulation to reality: replace modeled baselines with your actual expected receipts and payroll dates.",
        "Set calendar reminders 5 business days before each large payable; pair each with an expected inflow source.",
        "Re-run the sliders after any big change in receivables, payables, or cash balance.",
    ]
    for g in general:
        if g not in primary_actions:
            primary_actions.append(g)

    if not insights:
        insights.append(
            {
                "id": "no_threshold_breach",
                "headline": (
                    "Under these sliders, no pre-set risk threshold fired—modeled stress looks "
                    "moderate relative to our fixed alert rules (not a guarantee of safety)."
                ),
                "action": (
                    "Still do one pass on real payables due this month vs. expected deposits; "
                    "the model is simplified and can miss lumpiness."
                ),
                "chain_of_thought": [
                    "Alert rules only fire above minimum simulated frequencies (e.g., heavy receivable loss, liquidity tail, expense spike).",
                    "Your current draw did not cross those bars, so no red-flag insight was emitted.",
                    "Quiet runs still deserve a calendar sanity check on large real-world line items.",
                ],
                "devils_advocate": (
                    "Devil's advocate: absence of alerts can breed complacency. Thresholds are arbitrary; "
                    "raise inflow/expense variability to see how fragile the picture becomes."
                ),
            }
        )

    cot_master.append(
        "Synthesis: insights fire when simulated frequencies cross fixed, pre-declared thresholds; "
        "this keeps recommendations repeatable and auditable (same numbers → same text)."
    )

    devil_overall = (
        "Overall devil's advocate: this is a single-period, Gaussian toy model. It ignores seasonality, "
        "lumpiness, new contracts, and financing options. Use it to rank attention (collections vs. expenses vs. timing), "
        "not as a literal forecast. If primary actions conflict (e.g., delay payables vs. protect relationships), "
        "resolve with contracts and customer criticality—not the model alone."
    )
    if devil_chunks:
        devil_overall = (
            devil_overall
            + " Counter-themes from the strongest triggered risks: "
            + " ".join(devil_chunks[:2])
        )

    return {
        "insights": insights,
        "primary_actions": primary_actions,
        "master_chain_of_thought": cot_master,
        "devils_advocate_overall": devil_overall,
    }
