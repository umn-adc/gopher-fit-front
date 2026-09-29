"""Loopback-only integration fixture. Always creates a disposable migrated database.
Run from ../gopher-fit-back: uv run python ../gopher-fit-front/tests/serve_backend.py
No production routes/contracts are modified. Mail remains in this process's memory.
"""

import sys
import tempfile
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[2] / "gopher-fit-back"
sys.path.insert(0, str(BACKEND))

import uvicorn
from alembic import command
from alembic.config import Config
from pydantic import SecretStr
from app.core.config import Settings
from app.main import create_app


def main():
    with tempfile.TemporaryDirectory(prefix="gopher-front-test-") as directory:
        database_url = f"sqlite:///{directory}/test.db"
        config = Config(str(BACKEND / "alembic.ini"))
        config.set_main_option("script_location", str(BACKEND / "migrations"))
        config.attributes["database_url"] = database_url
        command.upgrade(config, "head")
        settings = Settings(
            database_url=database_url,
            jwt_secret=SecretStr(
                "disposable-frontend-test-secret-not-for-production-use"
            ),
            jwt_ttl_seconds=3,
            auth_rate_limit=10000,
            recovery_rate_limit=10000,
            search_rate_limit=10000,
            cors_origins=["http://localhost:8081", "http://127.0.0.1:8081"],
            recovery_enabled=True,
            recovery_frontend_url="https://frontend.example/recovery",
            smtp_host="smtp.example",
            smtp_from="accounts@example.com",
        )
        app = create_app(settings)

        class Mailbox:
            def __init__(self):
                self.messages = []

            def send(self, delivery):
                self.messages.append(delivery)
                return True

        mailbox = Mailbox()
        app.state.mailer = mailbox

        @app.get("/__test__/fixture")
        def fixture():
            return {"disposable": True}

        @app.get("/__test__/mail")
        def mail():
            return [
                {"recipient": d.recipient, "purpose": d.purpose, "token": d.token}
                for d in mailbox.messages
            ]

        @app.put("/__test__/recovery/{enabled}")
        def recovery(enabled: bool):
            settings.recovery_enabled = enabled
            return {"enabled": enabled}

        uvicorn.run(
            app, host="127.0.0.1", port=3000, access_log=False, log_level="warning"
        )


if __name__ == "__main__":
    main()
