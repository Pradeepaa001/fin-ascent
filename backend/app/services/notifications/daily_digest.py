"""End-of-day summary: due-date snapshot, payables pressure, and recent decision logs."""
from __future__ import annotations

from datetime import date, datetime, timezone
from typing import Any

from app.services.email.smtp_mailer import send_email, smtp_configured
from app.services.notifications.dedupe import already_sent_today, mark_sent
from app.services.notifications.due_date_warnings import (
    _categorize,
    _list_user_payables,
)
from app.services.notifications.user_email import get_user_email
from app.services.storage.supabase_client import supabase


def _profile_name(user_id: str) -> str:
    try:
        res = (
            supabase.table("user_profiles")
            .select("name")
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )
        row = (res.data or [None])[0]
        if row and row.get("name"):
            return str(row["name"])
    except Exception:
        pass
    return "there"


def _fetch_logs_today(user_id: str) -> list[dict]:
    start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    start_iso = start.isoformat()
    try:
        obl = (
            supabase.table("obligations")
            .select("id")
            .eq("user_id", user_id)
            .execute()
        )
        ids = [str(r["id"]) for r in (obl.data or []) if r.get("id")]
        if not ids:
            return []
        out: list[dict] = []
        batch = 40
        for i in range(0, len(ids), batch):
            chunk = ids[i : i + batch]
            res = (
                supabase.table("logs")
                .select("decision_reasoning, action_taken, created_at")
                .in_("obligation_id", chunk)
                .gte("created_at", start_iso)
                .limit(40)
                .execute()
            )
            out.extend(res.data or [])
        out.sort(key=lambda x: str(x.get("created_at") or ""), reverse=True)
        return out[:15]
    except Exception:
        return []


def send_daily_digests_for_all_users() -> dict[str, Any]:
    if not smtp_configured():
        return {"ok": False, "reason": "SMTP not configured", "sent": 0}

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
        if already_sent_today(uid, "daily_digest"):
            skipped += 1
            continue

        to = get_user_email(uid)
        if not to:
            errors.append(f"No email for user {uid}")
            continue

        payables = _list_user_payables(uid)
        overdue, upcoming = _categorize(payables)
        logs = _fetch_logs_today(uid)
        today_s = date.today().strftime("%Y-%m-%d")

        lines = [
            f"FinAscend — Daily summary ({today_s} UTC)",
            "",
            f"Hi {_profile_name(uid)},",
            "",
            "WARNINGS (payables)",
            f"  Overdue items: {len(overdue)}",
            f"  Due in the next 7 days: {len(upcoming)}",
            "",
        ]
        if overdue:
            lines.append("Overdue (top 5)")
            for r in overdue[:5]:
                lines.append(
                    f"  • {r.get('entity_name','?')} — ${float(r.get('amount') or 0):,.2f} — due {r['_due'].isoformat()}"
                )
            lines.append("")
        if upcoming:
            lines.append("Next due (top 5)")
            for r in upcoming[:5]:
                lines.append(
                    f"  • {r.get('entity_name','?')} — ${float(r.get('amount') or 0):,.2f} — due {r['_due'].isoformat()}"
                )
            lines.append("")

        lines.append("DECISIONS & ACTIONS (from your AI logs today)")
        if logs:
            for log in logs:
                reason = log.get("decision_reasoning") or ""
                action = log.get("action_taken") or ""
                lines.append(f"  • {reason[:200]}{'…' if len(reason) > 200 else ''}")
                if action:
                    lines.append(f"    Action: {action[:200]}{'…' if len(action) > 200 else ''}")
        else:
            lines.append(
                "  No new decision log rows recorded today for your obligations."
            )
            lines.append(
                "  (If you use the AI assistant, ensure the `logs` table exists and is linked to your payables.)"
            )

        lines.extend(
            [
                "",
                "---",
                "This email was sent automatically by FinAscend. Tune schedules in the backend (APScheduler, UTC).",
            ]
        )

        text = "\n".join(lines)
        html = (
            "<pre style=\"font-family:system-ui,sans-serif;white-space:pre-wrap\">"
            + "\n".join(lines)
            + "</pre>"
        )

        try:
            send_email(
                to,
                subject=f"[FinAscend] Your daily summary — {today_s}",
                text_body=text,
                html_body=html,
            )
            mark_sent(uid, "daily_digest")
            sent += 1
        except Exception as e:
            errors.append(f"{uid}: {e!s}")

    return {"ok": True, "sent": sent, "skipped_dedupe": skipped, "errors": errors}
