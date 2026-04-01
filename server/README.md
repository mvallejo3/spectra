# spectra-server

The Spectra event ingestion server. Receives analytics events from the [Spectra tracker script](../script/README.md) and writes them to Google BigQuery.

Built with [FastAPI](https://fastapi.tiangolo.com/) and [Pydantic](https://docs.pydantic.dev/).

## Installation

```bash
pip install spectra-server
```

Requires Python 3.11+.

## Running the server

### Option A — CLI (quickest)

Set the required environment variables (see [Configuration](#configuration)), then:

```bash
spectra-server
```

Available flags:

| Flag | Default | Description |
|------|---------|-------------|
| `--host` | `0.0.0.0` | Bind host (overrides `HOST` env var) |
| `--port` | `8000` | Bind port (overrides `PORT` env var) |
| `--reload` | off | Enable auto-reload (development only) |
| `--workers` | `1` | Number of worker processes |

### Option B — uvicorn directly

```bash
uvicorn spectra:app --host 0.0.0.0 --port 8000
```

## Configuration

Copy `.env.example` to `.env` and fill in the values. The server reads configuration from environment variables (loaded via `python-dotenv`):

| Variable | Required | Description |
|----------|----------|-------------|
| `BIGQUERY_PROJECT_ID` | Yes (for storage) | GCP project ID |
| `BIGQUERY_DATASET` | Yes (for storage) | BigQuery dataset name |
| `GOOGLE_APPLICATION_CREDENTIALS` | One of the two | Path to a service account JSON file |
| `GOOGLE_APPLICATION_CREDENTIALS_JSON` | One of the two | Base64-encoded service account JSON |
| `HOST` | No | Bind host (default: `0.0.0.0`) |
| `PORT` | No | Bind port (default: `8000`) |
| `CORS_ORIGINS` | No | Comma-separated allowed origins, or `*` (default: `*`) |

If neither BigQuery variable is set the server starts successfully and discards events — useful for local development without a GCP project.

## API

### `POST /track`

Ingest one or more events.

**Headers**

| Header | Description |
|--------|-------------|
| `X-Account-ID` | Tenant / BigQuery table name. Can also be passed in the request body. |
| `Content-Type` | `application/json` or `text/plain` (plain text avoids CORS preflight for `navigator.sendBeacon`) |

**Body**

```json
{
  "account_id": "optional_if_provided_in_header",
  "events": [
    { "name": "page_view", "timestamp": "2024-01-01T00:00:00Z", "properties": {} }
  ]
}
```

**Response**

```json
{ "status": "ok", "count": 2 }
```

### `GET /health`

Returns server status and whether BigQuery is configured.

```json
{ "status": "ok", "bigquery": "configured" }
```

## Extending the server

The `create_app()` factory lets you mount your own middleware — API key validation, rate limiting, authentication, request logging, etc. — without forking the codebase.

### Adding middleware

```python
# myapp.py
from spectra import create_app
from my_auth import APIKeyMiddleware

app = create_app(
    middleware=[
        (APIKeyMiddleware, {"header": "X-API-Key", "keys": ["sk-live-..."]}),
    ]
)
```

Then run it:

```bash
uvicorn myapp:app --host 0.0.0.0 --port 8000
```

Middleware entries are `(MiddlewareClass, kwargs_dict)` tuples. The first entry in the list is the outermost layer (runs first on incoming requests).

### API key validation example

Here is a minimal Starlette middleware that validates a bearer token:

```python
# auth.py
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

class APIKeyMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, *, keys: list[str], header: str = "Authorization"):
        super().__init__(app)
        self.keys = set(keys)
        self.header = header

    async def dispatch(self, request: Request, call_next):
        if request.url.path == "/health":
            return await call_next(request)
        token = request.headers.get(self.header, "").removeprefix("Bearer ").strip()
        if token not in self.keys:
            return JSONResponse({"detail": "Unauthorized"}, status_code=401)
        return await call_next(request)
```

```python
# myapp.py
from spectra import create_app
from auth import APIKeyMiddleware

app = create_app(
    middleware=[
        (APIKeyMiddleware, {"keys": ["sk-live-abc123"], "header": "Authorization"}),
    ]
)
```

### Overriding FastAPI settings

Any keyword argument not recognised by `create_app` is forwarded to `FastAPI()`:

```python
app = create_app(
    cors_origins=["https://myapp.com"],
    docs_url=None,      # disable Swagger UI in production
    redoc_url=None,
)
```

## Local development

```bash
git clone https://github.com/mvallejo3/spectra.git
cd spectra/server

python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"

cp .env.example .env  # fill in your values

make start            # uvicorn app:app --reload
```

## License

[MIT](../LICENSE)
