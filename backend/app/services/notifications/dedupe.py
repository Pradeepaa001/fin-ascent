"""Optional deduplication via Supabase table email_notification_log."""
from __future__ import annotations

from datetime import date

from app.services.storage.supabase_client import supabase


def _today_key() -> str:
    return date.today().isoformat()


def already_sent_today(user_id: str, notification_type: str) -> bool:
    day_key = _today_key()
    try:
        res = (
            supabase.table("email_notification_log")
            .select("id")
            .eq("user_id", user_id)
            .eq("notification_type", notification_type)
            .eq("day_key", day_key)
            .limit(1)
            .execute()
        )
        return bool(res.data)
    except Exception:
        return False


def mark_sent(user_id: str, notification_type: str) -> None:
    day_key = _today_key()
    try:
        supabase.table("email_notification_log").insert(
            {
                "user_id": user_id,
                "notification_type": notification_type,
                "day_key": day_key,
            }
        ).execute()
    except Exception:
        pass
