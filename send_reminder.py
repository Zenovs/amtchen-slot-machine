import os
import smtplib
from email.mime.text import MIMEText


def main() -> None:
    """Send a monthly reminder email using SMTP.

    This script reads SMTP configuration from environment variables, constructs a friendly
    reminder email containing a link to the Ämtchen Slot Machine, and sends it to
    the specified recipient. It is intended to be run by a GitHub Actions workflow
    on the first day of each month.

    Required environment variables:
        SMTP_HOST: The hostname of the SMTP server.
        SMTP_PORT: The port of the SMTP server (defaults to 587 if not set).
        SMTP_USER: The username for SMTP authentication.
        SMTP_PASS: The password for SMTP authentication.

    Optional environment variables:
        MAIL_FROM: The email address that appears as the sender.
        MAIL_TO: The recipient's email address.

    """
    smtp_host = os.environ.get("SMTP_HOST")
    smtp_port = int(os.environ.get("SMTP_PORT", "587"))
    smtp_user = os.environ.get("SMTP_USER")
    smtp_pass = os.environ.get("SMTP_PASS")
    mail_from = os.environ.get("MAIL_FROM", "ki@schnydaer.ch")
    mail_to = os.environ.get("MAIL_TO", "daria@schnyder-werbung.ch")

    # Validate required environment variables
    if not smtp_host or not smtp_user or not smtp_pass:
        raise ValueError(
            "SMTP_HOST, SMTP_USER, and SMTP_PASS environment variables must be set"
        )

    subject = "Monatliche Erinnerung: Ämtchen-Plan erstellen"
    link = "https://zenovs.github.io/amtchen-slot-machine/"

    # Friendly email body with emojis for a light-hearted tone
    body = (
        "Hallo,\n\n"
        "Es ist wieder soweit – der neue Monat steht vor der Tür! 🚀\n\n"
        "Klick auf den folgenden Link, um den neuen Ämtchen-Plan für unsere Agentur zu generieren:\n"
        f"{link}\n\n"
        "Viel Spaß beim Zuweisen der Aufgaben und einen erfolgreichen Monat! 😄\n\n"
        "Liebe Grüße,\n"
        "Deine Ämtchen-Slot-Machine"
    )

    # Construct email message
    msg = MIMEText(body, "plain", "utf-8")
    msg["Subject"] = subject
    msg["From"] = mail_from
    msg["To"] = mail_to

    # Send email using SMTP
    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.sendmail(mail_from, [mail_to], msg.as_string())


if __name__ == "__main__":
    main()