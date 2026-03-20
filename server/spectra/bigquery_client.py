"""BigQuery client for inserting analytics events."""
import base64
import json
import os
import re

# Adding a Pyright ignore for the unresolved import.
# The venv lacks dependencies on local (pip install failed due to SSL),
# so the linter can't resolve the package.
import google.cloud.bigquery as bigquery  # pyright: ignore[reportMissingImports]
from google.oauth2 import credentials  # pyright: ignore[reportMissingImports]
from google.oauth2 import service_account  # pyright: ignore[reportMissingImports]

from spectra.config import BIGQUERY_DATASET, BIGQUERY_PROJECT_ID
from spectra.events import Event, event_to_row


def _get_credentials():
    """Return credentials from GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_APPLICATION_CREDENTIALS_JSON."""
    if os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"):
        return None  # Let ADC use the file path
    json_b64 = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS_JSON")
    if json_b64:
        info = json.loads(base64.b64decode(json_b64).decode("utf-8"))
        if info.get("type") == "authorized_user":
            return credentials.Credentials(
                token=None,
                refresh_token=info.get("refresh_token"),
                token_uri="https://oauth2.googleapis.com/token",
                client_id=info.get("client_id"),
                client_secret=info.get("client_secret"),
            )
        return service_account.Credentials.from_service_account_info(info)
    return None


_client: bigquery.Client | None = None
_ACCOUNT_ID_RE = re.compile(r"^[A-Za-z0-9_]+$")


def get_client() -> bigquery.Client:
    """Return a cached BigQuery client (thread-safe for inserts)."""
    global _client
    if _client is None:
        creds = _get_credentials()
        kwargs: dict = {"project": BIGQUERY_PROJECT_ID or ""}
        if creds is not None:
            kwargs["credentials"] = creds
        _client = bigquery.Client(**kwargs)
    return _client


def insert_events(events: list[Event], account_id: str | None = None) -> None:
    """Insert an array of events into BigQuery. Table is determined by account_id header (required)."""
    if not events:
        return
    if not account_id:
        raise ValueError("account_id header is required")
    if not BIGQUERY_PROJECT_ID or not BIGQUERY_DATASET:
        raise ValueError("BigQuery is not configured")
    client = get_client()

    table_id = f"{BIGQUERY_PROJECT_ID}.{BIGQUERY_DATASET}.{account_id}"
    rows = [event_to_row(e.model_copy(update={"account_id": account_id})) for e in events]
    errors = client.insert_rows_json(table_id, rows)
    if errors:
        raise RuntimeError(f"BigQuery insert failed: {errors}")


def fetch_events(account_id: str, limit: int = 1000) -> list[dict]:
    """
    Fetch recent analytics events for a given account table.
    Table is resolved as BIGQUERY_PROJECT_ID.BIGQUERY_DATASET.<account_id>.
    """
    if not account_id:
        raise ValueError("account_id is required")
    if not _ACCOUNT_ID_RE.fullmatch(account_id):
        raise ValueError("account_id may only contain letters, numbers, and underscores")
    if limit <= 0:
        raise ValueError("limit must be greater than 0")
    if not BIGQUERY_PROJECT_ID or not BIGQUERY_DATASET:
        raise ValueError("BigQuery is not configured")

    client = get_client()
    table_id = f"{BIGQUERY_PROJECT_ID}.{BIGQUERY_DATASET}.{account_id}"
    query = (
        f"SELECT * FROM `{table_id}` "
        "ORDER BY event_timestamp DESC "
        "LIMIT @limit"
    )
    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter("limit", "INT64", limit),
        ]
    )
    rows = client.query(query, job_config=job_config).result()
    return [dict(row.items()) for row in rows]


def fetch_all_events(limit: int = 5000) -> list[dict]:
    """Fetch recent analytics events across all account tables in the dataset."""
    if limit <= 0:
        raise ValueError("limit must be greater than 0")
    if not BIGQUERY_PROJECT_ID or not BIGQUERY_DATASET:
        raise ValueError("BigQuery is not configured")

    client = get_client()
    wildcard_table = f"{BIGQUERY_PROJECT_ID}.{BIGQUERY_DATASET}.*"
    query = (
        f"SELECT * FROM `{wildcard_table}` "
        "ORDER BY event_timestamp DESC "
        "LIMIT @limit"
    )
    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter("limit", "INT64", limit),
        ]
    )
    rows = client.query(query, job_config=job_config).result()
    return [dict(row.items()) for row in rows]
