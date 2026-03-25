"""
Single-period liquidity Monte Carlo: shock inflows and expenses with Gaussian noise.
Interpret variability inputs as coefficients of variation (std / mean).
"""
from __future__ import annotations

import math
import random
from typing import Any


def _percentile(sorted_vals: list[float], q: float) -> float:
    if not sorted_vals:
        return 0.0
    n = len(sorted_vals)
    if n == 1:
        return sorted_vals[0]
    idx = min(n - 1, max(0, int(q * (n - 1))))
    return sorted_vals[idx]


def _histogram(values: list[float], num_bins: int = 22) -> list[dict[str, Any]]:
    if not values:
        return []
    lo, hi = min(values), max(values)
    if math.isclose(lo, hi, rel_tol=1e-9, abs_tol=1e-9):
        return [{"start": lo, "end": hi, "frequency": len(values)}]
    width = (hi - lo) / num_bins
    if width <= 0:
        return [{"start": lo, "end": hi, "frequency": len(values)}]
    bins = [0] * num_bins
    for v in values:
        i = int((v - lo) / width)
        i = min(num_bins - 1, max(0, i))
        bins[i] += 1
    return [
        {"start": lo + i * width, "end": lo + (i + 1) * width, "frequency": c}
        for i, c in enumerate(bins)
    ]


def run_liquidity_monte_carlo(
    balance: float,
    mean_inflow: float,
    mean_expense: float,
    inflow_variability: float,
    expense_variability: float,
    n_simulations: int = 8000,
    rng: random.Random | None = None,
) -> dict[str, Any]:
    """
    Args:
        balance: starting cash before period
        mean_inflow: expected cash inflow (e.g. receivables baseline)
        mean_expense: expected cash outflow (e.g. payables baseline)
        inflow_variability: CV for inflow (e.g. 0.15 = 15% σ/μ)
        expense_variability: CV for expenses
        n_simulations: number of paths

    Returns:
        probability_of_default: fraction of paths with ending balance < 0
        best_case_cash_inflow: 95th percentile of realized inflows
        worst_case_cash_inflow: 5th percentile of realized inflows
        distribution: histogram of ending liquidity (balance + inflow - expense)
    """
    rng = rng or random.Random()
    n = max(100, int(n_simulations))

    inf_cv = max(0.0, float(inflow_variability))
    exp_cv = max(0.0, float(expense_variability))

    inf_mu = max(0.0, float(mean_inflow))
    exp_mu = max(0.0, float(mean_expense))
    bal = float(balance)

    inf_sigma = max(1e-6, inf_mu * inf_cv) if inf_cv > 0 else 1e-6
    exp_sigma = max(1e-6, exp_mu * exp_cv) if exp_cv > 0 else 1e-6

    inflows: list[float] = []
    endings: list[float] = []

    for _ in range(n):
        if inf_mu > 0 and inf_cv > 0:
            raw_i = rng.gauss(inf_mu, inf_sigma)
        elif inf_mu > 0:
            raw_i = inf_mu
        else:
            raw_i = 0.0
        if exp_mu > 0 and exp_cv > 0:
            raw_e = rng.gauss(exp_mu, exp_sigma)
        elif exp_mu > 0:
            raw_e = exp_mu
        else:
            raw_e = 0.0
        inf = max(0.0, raw_i)
        exp = max(0.0, raw_e)
        inflows.append(inf)
        endings.append(bal + inf - exp)

    inflows_sorted = sorted(inflows)
    default_count = sum(1 for e in endings if e < 0)
    p_default = default_count / n

    hist = _histogram(endings, num_bins=22)
    peak = max((b["frequency"] for b in hist), default=1)
    for b in hist:
        b["relative_height"] = b["frequency"] / peak

    return {
        "probability_of_default": round(p_default, 4),
        "best_case_cash_inflow": round(_percentile(inflows_sorted, 0.95), 2),
        "worst_case_cash_inflow": round(_percentile(inflows_sorted, 0.05), 2),
        "mean_inflow_baseline": round(inf_mu, 2),
        "mean_expense_baseline": round(exp_mu, 2),
        "starting_balance": round(bal, 2),
        "n_simulations": n,
        "distribution": hist,
    }
