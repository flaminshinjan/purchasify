import base64
from fastapi import HTTPException


def encode_cursor(order_id: int) -> str:
    raw = str(order_id).encode("utf-8")
    encoded = base64.urlsafe_b64encode(raw).decode("utf-8")
    return encoded.rstrip("=")


def decode_cursor(cursor: str) -> int:
    padding = "=" * (-len(cursor) % 4)
    try:
        decoded = base64.urlsafe_b64decode(f"{cursor}{padding}").decode("utf-8")
        order_id = int(decoded)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="Invalid cursor")

    if order_id < 0:
        raise HTTPException(status_code=400, detail="Invalid cursor")

    return order_id

