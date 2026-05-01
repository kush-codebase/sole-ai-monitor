import threading
import time
from typing import Any, Callable

_cache: dict[str, tuple[Any, float]] = {}
_lock  = threading.Lock()

DEFAULT_TTL = 300  # 5 minutes


def get_or_compute(key: str, fn: Callable, ttl: int = DEFAULT_TTL) -> Any:
    """Return cached value if still fresh; otherwise recompute and store."""
    with _lock:
        if key in _cache:
            value, expires_at = _cache[key]
            if time.monotonic() < expires_at:
                return value
        value = fn()
        _cache[key] = (value, time.monotonic() + ttl)
        return value


def invalidate(key: str = None) -> None:
    """Evict one key or flush the entire cache."""
    with _lock:
        if key:
            _cache.pop(key, None)
        else:
            _cache.clear()


def stats() -> dict:
    with _lock:
        now = time.monotonic()
        return {
            "entries":    len(_cache),
            "live":       sum(1 for _, exp in _cache.values() if now < exp),
            "expired":    sum(1 for _, exp in _cache.values() if now >= exp),
        }
