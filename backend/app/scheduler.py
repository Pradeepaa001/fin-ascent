"""Background schedule: due-date warning emails and end-of-day digests (UTC)."""
from __future__ import annotations

import logging

from apscheduler.schedulers.background import BackgroundScheduler

from app.services.notifications.daily_digest import send_daily_digests_for_all_users
from app.services.notifications.due_date_warnings import send_due_date_warnings_for_all_users

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler(timezone="UTC")


def _safe_warnings() -> None:
    try:
        out = send_due_date_warnings_for_all_users()
        logger.info("due_date_warnings: %s", out)
    except Exception:
        logger.exception("due_date_warnings job failed")


def _safe_digest() -> None:
    try:
        out = send_daily_digests_for_all_users()
        logger.info("daily_digest: %s", out)
    except Exception:
        logger.exception("daily_digest job failed")


def start_scheduler() -> None:
    if scheduler.running:
        return
    scheduler.add_job(
        _safe_warnings,
        "cron",
        hour=8,
        minute=0,
        id="due_date_warnings",
        replace_existing=True,
    )
    scheduler.add_job(
        _safe_digest,
        "cron",
        hour=18,
        minute=0,
        id="daily_digest",
        replace_existing=True,
    )
    scheduler.start()
    logger.info(
        "APScheduler started: due-date warnings 08:00 UTC, daily digest 18:00 UTC"
    )


def shutdown_scheduler() -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)
