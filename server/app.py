"""Local development entry point.

This module re-exports the default ``app`` instance from the ``spectra``
package so that the Makefile target ``uvicorn app:app`` continues to work
without modification.

For production or custom deployments, import from the package directly::

    from spectra import app           # default instance
    from spectra import create_app    # factory for custom middleware
"""

from spectra import app  # noqa: F401
from spectra.config import HOST, PORT

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=HOST, port=PORT)
