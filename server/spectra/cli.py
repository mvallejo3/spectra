"""Command-line entry point for the Spectra server.

Installed as the ``spectra-server`` script via ``[project.scripts]``.

Usage::

    spectra-server
    spectra-server --host 0.0.0.0 --port 8080
    spectra-server --reload
"""

from __future__ import annotations

import argparse
import sys

from spectra.config import HOST, PORT


def main() -> None:
    """Parse arguments and start the uvicorn server."""
    parser = argparse.ArgumentParser(
        prog="spectra-server",
        description="Run the Spectra event ingestion server.",
    )
    parser.add_argument(
        "--host",
        default=HOST,
        help=f"Bind host (default: {HOST}, override with HOST env var)",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=PORT,
        help=f"Bind port (default: {PORT}, override with PORT env var)",
    )
    parser.add_argument(
        "--reload",
        action="store_true",
        default=False,
        help="Enable auto-reload (development only)",
    )
    parser.add_argument(
        "--workers",
        type=int,
        default=1,
        help="Number of worker processes (default: 1, incompatible with --reload)",
    )
    args = parser.parse_args()

    try:
        import uvicorn
    except ImportError:
        print("uvicorn is required. Install it with: pip install uvicorn[standard]", file=sys.stderr)
        sys.exit(1)

    uvicorn.run(
        "spectra:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
        workers=args.workers if not args.reload else 1,
    )


if __name__ == "__main__":
    main()
