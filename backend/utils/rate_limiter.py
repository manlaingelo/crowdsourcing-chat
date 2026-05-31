"""Retry/backoff helpers for the Gemini free tier (15 RPM / 1500 RPD).

A 429 from Google AI Studio means we hit the per-minute cap; exponential
backoff with jitter-free fixed steps is enough to ride out the window.
"""

import functools
import time
from typing import Callable, TypeVar

T = TypeVar("T")

# Error message fragments that indicate a transient, retryable rate limit.
_RETRYABLE_MARKERS = ("429", "rate limit", "resource_exhausted", "quota")


def _is_retryable(exc: Exception) -> bool:
    msg = str(exc).lower()
    return any(marker in msg for marker in _RETRYABLE_MARKERS)


def with_retry(
    max_attempts: int = 4, base_delay: float = 2.0
) -> Callable[[Callable[..., T]], Callable[..., T]]:
    """Decorator: retry a callable on transient rate-limit errors.

    Delay grows as base_delay * 2**attempt (2s, 4s, 8s ...).
    """

    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @functools.wraps(func)
        def wrapper(*args, **kwargs) -> T:
            last_exc: Exception | None = None
            for attempt in range(max_attempts):
                try:
                    return func(*args, **kwargs)
                except Exception as exc:  # noqa: BLE001 - re-raised below
                    if not _is_retryable(exc) or attempt == max_attempts - 1:
                        raise
                    last_exc = exc
                    time.sleep(base_delay * (2**attempt))
            # Unreachable, but keeps type-checkers happy.
            raise last_exc  # type: ignore[misc]

        return wrapper

    return decorator
