from datetime import date
from typing import List, Optional

from pydantic import BaseModel


class PurchaseOrderBase(BaseModel):
    item_name: str
    order_date: date
    delivery_date: date
    quantity: int
    unit_price: float


class PurchaseOrderCreate(PurchaseOrderBase):
    pass


class PurchaseOrderResponse(PurchaseOrderBase):
    id: int
    total_price: float

    class Config:
        from_attributes = True


class PurchaseOrderCursorPage(BaseModel):
    items: List[PurchaseOrderResponse]
    next_cursor: Optional[str] = None
    has_more: bool = False

