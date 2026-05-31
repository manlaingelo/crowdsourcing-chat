"""Validation/decoding helpers for uploaded product images."""

import io

from PIL import Image

ALLOWED_MIME = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_BYTES = 8 * 1024 * 1024  # 8 MB cap before sending to Gemini vision.


class ImageValidationError(ValueError):
    pass


def validate_image(data: bytes, content_type: str | None) -> str:
    """Validate raw image bytes and return a normalized mime type.

    Falls back to sniffing the format with Pillow when the client did not
    send a usable content-type.
    """
    if not data:
        raise ImageValidationError("Empty image upload.")
    if len(data) > MAX_BYTES:
        raise ImageValidationError("Image exceeds the 8 MB limit.")

    mime = (content_type or "").lower().split(";")[0].strip()
    if mime in ALLOWED_MIME:
        return mime

    # Sniff with Pillow when the header is missing or unrecognized.
    try:
        with Image.open(io.BytesIO(data)) as img:
            fmt = (img.format or "").lower()
    except Exception as exc:  # noqa: BLE001
        raise ImageValidationError("Unreadable image file.") from exc

    sniffed = {"jpeg": "image/jpeg", "png": "image/png", "webp": "image/webp", "gif": "image/gif"}.get(fmt)
    if not sniffed:
        raise ImageValidationError(f"Unsupported image format: {fmt or 'unknown'}.")
    return sniffed
