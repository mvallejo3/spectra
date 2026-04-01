"""Factory for the Spectra FastAPI application.

Developers who want to extend the server can call :func:`create_app` and
inject their own middleware (e.g. API-key validation, rate limiting, auth):

.. code-block:: python

    from spectra import create_app
    from my_auth import APIKeyMiddleware

    app = create_app(
        middleware=[
            (APIKeyMiddleware, {"header": "X-API-Key", "keys": ["sk-..."]}),
        ]
    )

Then run with ``uvicorn mymodule:app``.
"""

from __future__ import annotations

import asyncio
import json
import logging
from typing import Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError

from spectra.bigquery_client import insert_events
from spectra.config import CORS_ORIGINS, bigquery_configured
from spectra.events import Event

_MiddlewareEntry = tuple[type[Any], dict[str, Any]]


def create_app(
    *,
    cors_origins: list[str] | None = None,
    middleware: list[_MiddlewareEntry] | None = None,
    **fastapi_kwargs: Any,
) -> FastAPI:
    """Create and return a configured Spectra FastAPI application.

    Args:
        cors_origins: List of allowed CORS origins. Defaults to the
            ``CORS_ORIGINS`` environment variable (``*`` if unset).
        middleware: Additional Starlette/FastAPI middleware to mount, each
            expressed as ``(MiddlewareClass, kwargs_dict)``. Middleware is
            applied in the order given (i.e. the first entry is the outermost
            layer). CORS middleware is always added before any custom entries.
        **fastapi_kwargs: Extra keyword arguments forwarded to
            :class:`fastapi.FastAPI` (e.g. ``title``, ``docs_url``).
    """
    fastapi_kwargs.setdefault("title", "Spectra JS")
    fastapi_kwargs.setdefault("description", "Event ingestion API for Spectra JS")

    app = FastAPI(**fastapi_kwargs)

    origins = cors_origins if cors_origins is not None else CORS_ORIGINS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins if origins != ["*"] else ["*"],
        allow_credentials=False,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["*"],
    )

    # Starlette applies middleware in reverse registration order (last added =
    # outermost). To preserve the intuitive "first entry = outermost" contract
    # we reverse the list before adding.
    for cls, kwargs in reversed(middleware or []):
        app.add_middleware(cls, **kwargs)

    @app.post("/track")
    async def ingest_events(request: Request) -> dict[str, Any]:
        """Ingest events and store them in BigQuery.

        Payload: ``{ account_id?: string, events: [...] }``

        ``account_id`` can be provided via the ``X-Account-ID`` header or in
        the request body.  Accepts ``application/json`` or ``text/plain``
        (the latter avoids a CORS preflight for ``navigator.sendBeacon``
        requests).
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
                raise HTTPException(
                    status_code=400, detail={"index": i, "errors": e.errors()}
                ) from e

        if not events:
            return {"status": "ok", "count": 0}

        if bigquery_configured() and not account_id:
            raise HTTPException(status_code=400, detail="X-Account-ID header is required")

        if not bigquery_configured():
            return {
                "status": "ok",
                "message": "BigQuery not configured; events discarded",
                "count": len(events),
            }

        def _log_insert_error(task: asyncio.Task[None]) -> None:
            try:
                task.result()
            except Exception as exc:
                logging.getLogger(__name__).exception(
                    "Background BigQuery insert failed: %s", exc
                )

        task = asyncio.create_task(asyncio.to_thread(insert_events, events, account_id))
        task.add_done_callback(_log_insert_error)

        return {"status": "ok", "count": len(events)}

    @app.get("/health")
    async def health() -> dict[str, str]:
        """Health check endpoint."""
        return {
            "status": "ok",
            "bigquery": "configured" if bigquery_configured() else "not_configured",
        }

    return app
