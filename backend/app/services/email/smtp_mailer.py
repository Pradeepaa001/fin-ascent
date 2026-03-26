"""Send email via SMTP. Disabled until SMTP_* env vars are set."""
from __future__ import annotations

import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText


def smtp_configured() -> bool:
    return bool(os.getenv("SMTP_HOST") and os.getenv("MAIL_FROM"))


def send_email(to_email: str, subject: str, text_body: str, html_body: str | None = None) -> None:
    if not to_email:
        raise ValueError("Missing recipient email")

    host = os.getenv("SMTP_HOST")
    port = int(os.getenv("SMTP_PORT", "587"))
    user = os.getenv("SMTP_USER")
    password = os.getenv("SMTP_PASSWORD")
    mail_from = os.getenv("MAIL_FROM")

    if not host or not mail_from:
        raise RuntimeError(
            "Email not configured: set SMTP_HOST, MAIL_FROM, and usually SMTP_USER/SMTP_PASSWORD"
        )

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = mail_from
    msg["To"] = to_email
    msg.attach(MIMEText(text_body, "plain", "utf-8"))
    if html_body:
        msg.attach(MIMEText(html_body, "html", "utf-8"))

    if port == 465:
        with smtplib.SMTP_SSL(host, port) as server:
            if user and password:
                server.login(user, password)
            server.sendmail(mail_from, [to_email], msg.as_string())
    else:
        with smtplib.SMTP(host, port) as server:
            server.starttls()
            if user and password:
                server.login(user, password)
            server.sendmail(mail_from, [to_email], msg.as_string())
