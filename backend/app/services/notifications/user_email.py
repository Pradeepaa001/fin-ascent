"""Resolve a user's inbox from Supabase Auth (service role) or profile override."""
from __future__ import annotations

from app.services.storage.supabase_client import supabase


def get_user_email(user_id: str) -> str | None:
    try:
        res = (
            supabase.table("user_profiles")
            .select("notification_email")
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )
        row = (res.data or [None])[0]
        if row and row.get("notification_email"):
            return str(row["notification_email"]).strip() or None
    except Exception:
        pass

    try:
        admin = getattr(supabase.auth, "admin", None)
        if admin is None:
            return None
        out = admin.get_user_by_id(user_id)
        user = getattr(out, "user", None) or out
        if isinstance(user, dict):
            return user.get("email")
        return getattr(user, "email", None)
    except Exception:
        return None
