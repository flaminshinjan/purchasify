from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas import (
    PurchaseOrderCreate,
    PurchaseOrderCursorPage,
    PurchaseOrderResponse,
)
from app.services import PurchaseOrderService

router = APIRouter()


@router.get("", response_model=List[PurchaseOrderResponse])
def list_purchase_orders(
    db: Session = Depends(get_db),
) -> List[PurchaseOrderResponse]:
    return PurchaseOrderService.list_orders(db)


@router.get("/cursor", response_model=PurchaseOrderCursorPage)
def list_purchase_orders_with_cursor(
    cursor: Optional[str] = Query(None, description="Opaque cursor for pagination"),
    limit: int = Query(50, ge=1, le=200, description="Number of records to return"),
    db: Session = Depends(get_db),
) -> PurchaseOrderCursorPage:
    return PurchaseOrderService.list_orders_with_cursor(
        db,
        cursor=cursor,
        limit=limit,
    )


@router.get("/{order_id}", response_model=PurchaseOrderResponse)
def get_purchase_order(
    order_id: int,
    db: Session = Depends(get_db),
) -> PurchaseOrderResponse:
    return PurchaseOrderService.get_order_or_404(db, order_id)


@router.post("", response_model=PurchaseOrderResponse, status_code=201)
def create_purchase_order(
    order: PurchaseOrderCreate,
    db: Session = Depends(get_db),
) -> PurchaseOrderResponse:
    return PurchaseOrderService.create_order(db, order)


@router.delete("/{order_id}", status_code=204)
def delete_purchase_order(
    order_id: int,
    db: Session = Depends(get_db),
) -> None:
    PurchaseOrderService.delete_order(db, order_id)
    return None

