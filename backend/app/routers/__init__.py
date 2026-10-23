"""WindLens routers package."""

from .accuracy import router as accuracy_router
from .data import router as data_router
from .docs_ui import router as docs_router
from .forecast import router as forecast_router
from .meta import router as meta_router
from .ramps import router as ramps_router
from .system import router as system_router
from .trading import router as trading_router

__all__ = [
    "accuracy_router",
    "data_router",
    "docs_router",
    "forecast_router",
    "meta_router",
    "ramps_router",
    "system_router",
    "trading_router",
]

