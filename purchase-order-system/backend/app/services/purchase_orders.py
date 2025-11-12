from typing import Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.pagination import decode_cursor, encode_cursor
from app.repositories import PurchaseOrderRepository
from app.schemas import (
    PurchaseOrderCreate,
    PurchaseOrderCursorPage,
    PurchaseOrderResponse,
)


class PurchaseOrderService:
    @staticmethod
    def list_orders(db: Session) -> list[PurchaseOrderResponse]:
        return PurchaseOrderRepository.list_all(db)

    @staticmethod
    def list_orders_with_cursor(
        db: Session,
        *,
        cursor: Optional[str],
        limit: int,
    ) -> PurchaseOrderCursorPage:
        last_id: Optional[int] = None
        if cursor:
            last_id = decode_cursor(cursor)

        records = PurchaseOrderRepository.list_orders(
            db,
            last_id=last_id,
            limit=limit,
        )

        has_more = len(records) > limit
        next_cursor = encode_cursor(records[limit].id) if has_more else None
        items = records[:limit] if has_more else records

        return PurchaseOrderCursorPage(
            items=items,
            next_cursor=next_cursor,
            has_more=has_more,
        )

    @staticmethod
    def get_order_or_404(
        db: Session,
        order_id: int,
    ) -> PurchaseOrderResponse:
        order = PurchaseOrderRepository.get_order(db, order_id)
        if not order:
            raise HTTPException(status_code=404, detail="Purchase order not found")
        return order

    @staticmethod
    def create_order(
        db: Session,
        order: PurchaseOrderCreate,
    ) -> PurchaseOrderResponse:
        return PurchaseOrderRepository.create_order(db, order)

    @staticmethod
    def delete_order(
        db: Session,
        order_id: int,
    ) -> None:
        order = PurchaseOrderRepository.get_order(db, order_id)
        if not order:
            raise HTTPException(status_code=404, detail="Purchase order not found")
        PurchaseOrderRepository.delete_order(db, order)

