"""Spectra analytics ingestion API."""

import asyncio
import json
import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError

from spectra.bigquery_client import insert_events
from spectra.config import CORS_ORIGINS, HOST, PORT, bigquery_configured
from spectra.events import Event


app = FastAPI(
    title="Spectra JS",
    description="Event ingestion API for Spectra JS",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS if CORS_ORIGINS != ["*"] else ["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.post("/track")
async def ingest_events(request: Request) -> dict:
    """
    Ingest events and store them in BigQuery.
    Payload: { account_id?: string, events: [...] }
    account_id can be provided via X-Account-ID header or in the body.
    Accepts application/json or text/plain (for beacon requests, which avoid CORS preflight).
    Returns 200 with count of events processed.
    """
    header_account_id = (request.headers.get("X-Account-ID") or "").strip() or None
    body_bytes = await request.body()
    try:
        payload = json.loads(body_bytes)
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON: {e}") from e
    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail="Expected object with 'events' array")
    raw_events = payload.get("events")
    if not isinstance(raw_events, list):
        raise HTTPException(status_code=400, detail="Expected 'events' array")

    account_id = header_account_id or (payload.get("account_id") or "").strip() or None

    events: list[Event] = []
    for i, item in enumerate(raw_events):
        try:
            events.append(Event.model_validate(item))
        except ValidationError as e:
            raise HTTPException(status_code=400, detail={"index": i, "errors": e.errors()}) from e

    if not events:
        return {"status": "ok", "count": 0}

    if bigquery_configured() and not account_id:
        raise HTTPException(status_code=400, detail="X-Account-ID header is required")

    if not bigquery_configured():
        return {"status": "ok", "message": "BigQuery not configured; events discarded", "count": len(events)}

    def _log_insert_error(task: asyncio.Task) -> None:
        try:
            task.result()
        except Exception as e:
            logging.getLogger(__name__).exception("Background BigQuery insert failed: %s", e)

    task = asyncio.create_task(asyncio.to_thread(insert_events, events, account_id))
    task.add_done_callback(_log_insert_error)

    return {"status": "ok", "count": len(events)}


@app.get("/health")
async def health() -> dict:
    """Health check endpoint."""
    return {
        "status": "ok",
        "bigquery": "configured" if bigquery_configured() else "not_configured",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=HOST, port=PORT)
