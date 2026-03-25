from app.services.storage.supabase_client import supabase
from app.services.risk.monte_carlo import run_liquidity_monte_carlo
from datetime import date, datetime
from fastapi import APIRouter, Query
from pydantic import BaseModel, Field

router = APIRouter()


class MonteCarloRequest(BaseModel):
    user_id: str
    inflow_variability: float = Field(
        default=0.15, ge=0.0, le=1.0, description="Inflow CV (std/mean), e.g. 0.2 = 20%"
    )
    expense_variability: float = Field(
        default=0.15, ge=0.0, le=1.0, description="Expense CV (std/mean)"
    )
    n_simulations: int = Field(default=8000, ge=2000, le=20000)

def _parse_due_date(due) -> date | None:
    if due is None:
        return None
    if isinstance(due, date) and not isinstance(due, datetime):
        return due
    if isinstance(due, datetime):
        return due.date()
    s = str(due)
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00")).date()
    except ValueError:
        try:
            return datetime.strptime(s[:10], "%Y-%m-%d").date()
        except ValueError:
            return None


def _urgency_from_due_date(due) -> float:
    """Higher when due sooner or overdue (payables)."""
    d = _parse_due_date(due)
    if d is None:
        return 0.0
    today = date.today()
    days = (d - today).days
    if days < 0:
        return 30.0 + float(abs(days))
    return 30.0 / float(max(1, days + 1))


DEFAULT_RELATION = 0.1
# Urgency > penalty > relation (coefficients on raw terms)
PRIORITY_WEIGHT_URGENCY = 1.0
PRIORITY_WEIGHT_PENALTY = 0.45
PRIORITY_WEIGHT_RELATION = 0.12


def _load_user_profile_row(user_id: str) -> dict | None:
    try:
        res = (
            supabase.table("user_profiles")
            .select("*")
            .eq("user_id", user_id)
            .single()
            .execute()
        )
        return getattr(res, "data", None) or None
    except Exception:
        return None


DEFAULT_AVG_CASH_INFLOW = 50000.0


def _balance_from_profile(profile: dict | None) -> float:
    if not profile:
        return 0.0
    liq = profile.get("current_liquidity")
    bal = profile.get("current_balance")
    if liq is not None:
        return float(liq)
    if bal is not None:
        return float(bal)
    return 0.0


def _current_balance_for_runway(profile: dict | None) -> float:
    """Runway numerator: current_balance first, else current_liquidity."""
    if not profile:
        return 0.0
    cb = profile.get("current_balance")
    if cb is not None:
        return float(cb)
    liq = profile.get("current_liquidity")
    if liq is not None:
        return float(liq)
    return 0.0


def _avg_cash_inflow_for_runway(profile: dict | None) -> float:
    """Runway denominator: avg_cash_inflow, else average_inflow; if missing or ≤0, default."""
    if not profile:
        return DEFAULT_AVG_CASH_INFLOW
    for key in ("avg_cash_inflow", "average_inflow"):
        v = profile.get(key)
        if v is not None:
            fv = float(v)
            if fv > 0:
                return fv
    return DEFAULT_AVG_CASH_INFLOW


def _get_current_liquidity(user_id: str) -> float:
    return _balance_from_profile(_load_user_profile_row(user_id))


def _totals_payables_receivables(user_id: str) -> tuple[float, float]:
    pay = 0.0
    rec = 0.0
    try:
        pr = (
            supabase.table("obligations")
            .select("amount")
            .eq("type", "PAYABLE")
            .eq("user_id", user_id)
            .execute()
        )
        pay = float(sum(float(r["amount"]) for r in pr.data))
    except Exception:
        liq = _get_current_liquidity(user_id)
        pay = float(liq * 0.3)

    try:
        rr = (
            supabase.table("obligations")
            .select("amount")
            .eq("type", "RECEIVABLE")
            .eq("user_id", user_id)
            .execute()
        )
        rec = float(sum(float(r["amount"]) for r in rr.data))
    except Exception:
        liq = _get_current_liquidity(user_id)
        rec = float(liq * 0.4)
    return pay, rec


def _compute_credit_score_1_100(receivables: float, balance: float, payables: float) -> int:
    """
    Financial health: receivables + balance - payables, mapped to 1–100.
    Uses a symmetric linear map around a scale derived from magnitudes.
    """
    raw = ((float(receivables) + float(balance) - float(payables))/ (abs(receivables) + abs(payables) + abs(balance))) * 100
    scale = max(
        abs(receivables),
        abs(payables),
        abs(balance),
        abs(raw),
        1.0,
    )
    t = (raw + scale) / (2.0 * scale)
    t = max(0.0, min(1.0, t))
    score = int(round(1.0 + t * 99.0))
    return int(round(raw))


def _compute_priority_row(
    due_date,
    penalty_rate,
    relation: float,
) -> dict[str, float]:
    urgency = _urgency_from_due_date(due_date)
    penalty = float(penalty_rate or 0.0)
    rel = float(relation)
    priority = (
        PRIORITY_WEIGHT_URGENCY * urgency
        + PRIORITY_WEIGHT_PENALTY * penalty
        + PRIORITY_WEIGHT_RELATION * rel
    )
    return {
        "urgency": urgency,
        "penalty": penalty,
        "relation": rel,
        "engine_priority": priority,
    }


def _persist_credit_score(user_id: str, score: int) -> None:
    try:
        supabase.table("user_profiles").update({"credit_score": score}).eq(
            "user_id", user_id
        ).execute()
    except Exception:
        pass


# 1️⃣ CREDIT SCORE (computed + stored)
@router.get("/credit-score")
def get_credit_score(user_id: str = Query(...)):
    profile = _load_user_profile_row(user_id)
    balance = _balance_from_profile(profile)
    payables, receivables = _totals_payables_receivables(user_id)
    score = _compute_credit_score_1_100(receivables, balance, payables)
    _persist_credit_score(user_id, score)
    health_raw = receivables + balance - payables
    return {
        "credit_score": score,
        "receivables": receivables,
        "balance": balance,
        "payables": payables,
        "health_raw": health_raw,
    }

# 2️⃣ TOTAL PAYABLES
@router.get("/payables/summary")
def get_payables(user_id: str = Query(...)):
    try:
        res = (
            supabase.table("obligations")
            .select("amount")
            .eq("type", "PAYABLE")
            .eq("user_id", user_id)
            .execute()
        )
        total = sum([r["amount"] for r in res.data])
        return {
            "total_payables": len(res.data),
            "total_amount": float(total),
        }
    except Exception:
        liquidity = _get_current_liquidity(user_id)
        return {"total_payables": 0, "total_amount": float(liquidity * 0.3)}

# 3️⃣ TOTAL RECEIVABLES
@router.get("/receivables/summary")
def get_receivables(user_id: str = Query(...)):
    try:
        res = (
            supabase.table("obligations")
            .select("amount")
            .eq("type", "RECEIVABLE")
            .eq("user_id", user_id)
            .execute()
        )
        total = sum([r["amount"] for r in res.data])
        return {
            "total_receivables": len(res.data),
            "total_amount": float(total),
        }
    except Exception:
        liquidity = _get_current_liquidity(user_id)
        return {"total_receivables": 0, "total_amount": float(liquidity * 0.4)}

# 4️⃣ CURRENT BALANCE
@router.get("/balance")
def get_balance(user_id: str = Query(...)):
    liquidity = _get_current_liquidity(user_id)
    return {"balance": liquidity}

# 5️⃣ GANTT DATA (PAYABLES)
def _fetch_payables_with_meta(user_id: str, *, limit: int | None = None):
    """Return (rows list, spec used). Relation is not read from DB (client uses default 0.1 + overrides)."""
    qspecs = [
        "id, entity_name, amount, due_date, priority_score, penalty_rate",
        "entity_name, amount, due_date, priority_score, penalty_rate",
        "entity_name, amount, due_date, priority_score",
    ]
    last_exc: Exception | None = None
    for spec in qspecs:
        try:
            q = (
                supabase.table("obligations")
                .select(spec)
                .eq("type", "PAYABLE")
                .eq("user_id", user_id)
            )
            if limit is not None:
                q = q.order("due_date").limit(limit)
            res = q.execute()
            return res.data or [], spec
        except Exception as e:
            last_exc = e
    if last_exc:
        raise last_exc
    return [], ""


@router.get("/payables/timeline")
def timeline(user_id: str = Query(...)):
    try:
        rows_raw, _spec = _fetch_payables_with_meta(user_id, limit=None)
        rows = []
        for r in rows_raw:
            comp = _compute_priority_row(
                r.get("due_date"),
                r.get("penalty_rate"),
                DEFAULT_RELATION,
            )
            eng = comp["engine_priority"]
            oid = r.get("id")
            rows.append(
                {
                    "obligation_id": str(oid) if oid is not None else None,
                    "entity": r["entity_name"],
                    "amount": float(r["amount"]),
                    "due_date": r["due_date"],
                    "priority": eng,
                    "legacy_priority_score": r.get("priority_score"),
                    "urgency": comp["urgency"],
                    "penalty": comp["penalty"],
                    "relation": DEFAULT_RELATION,
                    "color": "red" if eng >= 22 else "green",
                }
            )
        return rows
    except Exception:
        return []

# 6️⃣ TOP 10 DUE RECORDS
@router.get("/payables/top10")
def top10(user_id: str = Query(...)):
    try:
        rows_raw, _ = _fetch_payables_with_meta(user_id, limit=10)
        out = []
        for r in rows_raw:
            comp = _compute_priority_row(
                r.get("due_date"),
                r.get("penalty_rate"),
                DEFAULT_RELATION,
            )
            oid = r.get("id")
            out.append(
                {
                    "obligation_id": str(oid) if oid is not None else None,
                    "due_date": r["due_date"],
                    "company": r["entity_name"],
                    "amount": float(r["amount"]),
                    "engine_priority": comp["engine_priority"],
                    "urgency": comp["urgency"],
                    "penalty": comp["penalty"],
                    "relation": DEFAULT_RELATION,
                }
            )
        return out
    except Exception:
        return []


@router.get("/zero-day")
def zero_day(user_id: str = Query(...)):
    """
    Runway (days of cover): current_balance / avg_cash_inflow.
    If inflow is missing or non-positive, avg_cash_inflow defaults to 50,000.
    """
    profile = _load_user_profile_row(user_id)
    if not profile:
        return {"zero_day": None, "detail": "no_profile"}
    balance = _current_balance_for_runway(profile)
    avg_in = _avg_cash_inflow_for_runway(profile)
    runway = float(balance) / avg_in
    return {
        "zero_day": runway,
        "runway_days": runway,
        "current_balance": balance,
        "avg_cash_inflow": avg_in,
        "balance": balance,
        "average_inflow": avg_in,
    }


def _monte_carlo_baselines(user_id: str) -> tuple[float, float, float]:
    profile = _load_user_profile_row(user_id)
    balance = _balance_from_profile(profile)
    mean_inflow = balance * 0.4
    mean_expense = balance * 0.3
    if profile:
        ai = profile.get("average_inflow")
        ao = profile.get("average_outflow")
        if ai is not None and float(ai) > 0:
            mean_inflow = float(ai)
        if ao is not None and float(ao) > 0:
            mean_expense = float(ao)
    try:
        pay_res = (
            supabase.table("obligations")
            .select("amount")
            .eq("type", "PAYABLE")
            .eq("user_id", user_id)
            .execute()
        )
        if pay_res.data and (not profile or profile.get("average_outflow") in (None, 0)):
            mean_expense = float(sum(r["amount"] for r in pay_res.data))
    except Exception:
        pass
    try:
        rec_res = (
            supabase.table("obligations")
            .select("amount")
            .eq("type", "RECEIVABLE")
            .eq("user_id", user_id)
            .execute()
        )
        if rec_res.data and (not profile or profile.get("average_inflow") in (None, 0)):
            mean_inflow = float(sum(r["amount"] for r in rec_res.data))
    except Exception:
        pass
    return balance, mean_inflow, mean_expense


@router.post("/risk/monte-carlo")
def monte_carlo_risk(req: MonteCarloRequest):
    balance, mean_inflow, mean_expense = _monte_carlo_baselines(req.user_id)
    result = run_liquidity_monte_carlo(
        balance=balance,
        mean_inflow=mean_inflow,
        mean_expense=mean_expense,
        inflow_variability=req.inflow_variability,
        expense_variability=req.expense_variability,
        n_simulations=req.n_simulations,
    )
    return result