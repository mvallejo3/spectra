"""Server configuration from environment variables."""

import os

from dotenv import load_dotenv

load_dotenv()


def _require(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise ValueError(f"Required environment variable {name} is not set")
    return value


def _opt(name: str, default: str = "") -> str:
    return os.environ.get(name, default)


# BigQuery
BIGQUERY_PROJECT_ID = _opt("BIGQUERY_PROJECT_ID")
BIGQUERY_DATASET = _opt("BIGQUERY_DATASET")

# Server
HOST = _opt("HOST", "0.0.0.0")
PORT = int(_opt("PORT", "8000"))

# CORS (comma-separated origins, or * for all)
CORS_ORIGINS = _opt("CORS_ORIGINS", "*").split(",")


def bigquery_configured() -> bool:
    """Return True if BigQuery is fully configured."""
    return bool(BIGQUERY_PROJECT_ID and BIGQUERY_DATASET)
