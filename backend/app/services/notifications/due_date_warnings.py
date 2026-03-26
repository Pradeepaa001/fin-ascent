"""Send consolidated due-date warning emails (payables due soon or overdue)."""
from __future__ import annotations

from datetime import date, timedelta
from typing import Any

from app.services.email.smtp_mailer import send_email, smtp_configured
from app.services.notifications.dedupe import already_sent_today, mark_sent
from app.services.notifications.user_email import get_user_email
from app.services.storage.supabase_client import supabase

_WARNING_DAYS = 7


def _parse_due(d: Any) -> date | None:
    if d is None:
        return None
    if isinstance(d, date):
        return d
    s = str(d).strip()[:10]
    try:
        y, m, dd = s.split("-")
        return date(int(y), int(m), int(dd))
    except Exception:
        return None


def _list_user_payables(user_id: str) -> list[dict]:
    try:
        res = (
            supabase.table("obligations")
            .select("id, entity_name, amount, due_date, type")
            .eq("user_id", user_id)
            .eq("type", "PAYABLE")
            .execute()
        )
        return list(res.data or [])
    except Exception:
        return []


def _categorize(rows: list[dict]) -> tuple[list[dict], list[dict]]:
    today = date.today()
    horizon = today + timedelta(days=_WARNING_DAYS)
    overdue: list[dict] = []
    upcoming: list[dict] = []
    for row in rows:
        d = _parse_due(row.get("due_date"))
        if d is None:
            continue
        if d < today:
            overdue.append({**row, "_due": d})
        elif today <= d <= horizon:
            upcoming.append({**row, "_due": d})
    overdue.sort(key=lambda r: r["_due"])
    upcoming.sort(key=lambda r: r["_due"])
    return overdue, upcoming


def send_due_date_warnings_for_all_users() -> dict[str, Any]:
    if not smtp_configured():
        return {"ok": False, "reason": "SMTP not configured", "sent": 0}

    user_ids: set[str] = set()
    try:
        res = (
            supabase.table("obligations")
            .select("user_id")
            .eq("type", "PAYABLE")
            .execute()
        )
        user_ids = {
            str(r["user_id"]) for r in (res.data or []) if r.get("user_id")
        }
    except Exception:
        user_ids = set()

    if not user_ids:
        try:
            prof = supabase.table("user_profiles").select("user_id").execute()
            user_ids = {
                str(r["user_id"]) for r in (prof.data or []) if r.get("user_id")
            }
        except Exception:
            user_ids = set()

    sent = 0
    skipped = 0
    errors: list[str] = []

    for uid in user_ids:
        if already_sent_today(uid, "due_date_warning"):
            skipped += 1
            continue

        rows = _list_user_payables(uid)
        overdue, upcoming = _categorize(rows)
        if not overdue and not upcoming:
            continue

        to = get_user_email(uid)
        if not to:
            errors.append(f"No email for user {uid}")
            continue

        lines = [
            "FinAscend — Payables due-date alert",
            "",
            "This is an automated notice about bills that are overdue or due soon (next "
            f"{_WARNING_DAYS} days).",
            "",
        ]
        if overdue:
            lines.append("OVERDUE")
            for r in overdue[:25]:
                lines.append(
                    f"  • {r.get('entity_name','?')} — ${float(r.get('amount') or 0):,.2f} — due {r['_due'].isoformat()}"
                )
            if len(overdue) > 25:
                lines.append(f"  … and {len(overdue) - 25} more overdue items.")
            lines.append("")
        if upcoming:
            lines.append(f"DUE WITHIN {_WARNING_DAYS} DAYS")
            for r in upcoming[:25]:
                lines.append(
                    f"  • {r.get('entity_name','?')} — ${float(r.get('amount') or 0):,.2f} — due {r['_due'].isoformat()}"
                )
            if len(upcoming) > 25:
                lines.append(f"  … and {len(upcoming) - 25} more upcoming items.")

        text = "\n".join(lines)
        html = "<pre style=\"font-family:system-ui,sans-serif\">" + "\n".join(
            [f"<div>{line}</div>" if line else "<br/>" for line in lines]
        ) + "</pre>"

        try:
            send_email(
                to,
                subject="[FinAscend] Payables due — action may be needed",
                text_body=text,
                html_body=html,
            )
            mark_sent(uid, "due_date_warning")
            sent += 1
        except Exception as e:
            errors.append(f"{uid}: {e!s}")

    return {"ok": True, "sent": sent, "skipped_dedupe": skipped, "errors": errors}
