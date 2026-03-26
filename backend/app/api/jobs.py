"""Manual triggers for notification jobs (protected by CRON_SECRET)."""
from __future__ import annotations

import os

from app.services.notifications.daily_digest import send_daily_digests_for_all_users
from app.services.notifications.due_date_warnings import send_due_date_warnings_for_all_users
from fastapi import APIRouter, Header, HTTPException

router = APIRouter()


def _require_cron(x_cron_secret: str | None) -> None:
    expected = os.getenv("CRON_SECRET")
    if not expected:
        raise HTTPException(
            status_code=503,
            detail="CRON_SECRET is not set; refusing to run jobs remotely.",
        )
    if not x_cron_secret or x_cron_secret != expected:
        raise HTTPException(status_code=403, detail="Invalid X-Cron-Secret header")


@router.post("/due-warnings")
def trigger_due_warnings(x_cron_secret: str | None = Header(None, alias="X-Cron-Secret")):
    _require_cron(x_cron_secret)
    return send_due_date_warnings_for_all_users()


@router.post("/daily-digest")
def trigger_daily_digest(x_cron_secret: str | None = Header(None, alias="X-Cron-Secret")):
    _require_cron(x_cron_secret)
    return send_daily_digests_for_all_users()
