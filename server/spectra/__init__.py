"""Spectra analytics ingestion server.

Quickstart
----------
Install the package and run the built-in CLI::

    pip install spectra-server
    spectra-server

Custom middleware / extending the server
-----------------------------------------
Use :func:`create_app` to obtain a FastAPI instance with your own middleware
injected before running it::

    # myapp.py
    from spectra import create_app
    from my_auth import APIKeyMiddleware

    app = create_app(
        middleware=[
            (APIKeyMiddleware, {"header": "X-API-Key", "keys": ["sk-..."]}),
        ]
    )

Then point uvicorn at your module::

    uvicorn myapp:app --host 0.0.0.0 --port 8000
"""

from spectra.app import create_app
from fastapi import FastAPI

app: FastAPI = create_app()

__all__ = ["app", "create_app"]
