from typing import List, Optional

from sqlalchemy.orm import Session

from app.db.models import PurchaseOrder
from app.schemas import PurchaseOrderCreate


class PurchaseOrderRepository:
    @staticmethod
    def list_all(db: Session) -> List[PurchaseOrder]:
        return (
            db.query(PurchaseOrder)
            .order_by(PurchaseOrder.id.asc())
            .all()
        )

    @staticmethod
    def list_orders(
        db: Session,
        *,
        last_id: Optional[int],
        limit: int,
    ) -> List[PurchaseOrder]:
        query = db.query(PurchaseOrder).order_by(PurchaseOrder.id.asc())

        if last_id is not None:
            query = query.filter(PurchaseOrder.id > last_id)

        return query.limit(limit + 1).all()

    @staticmethod
    def get_order(db: Session, order_id: int) -> Optional[PurchaseOrder]:
        return (
            db.query(PurchaseOrder)
            .filter(PurchaseOrder.id == order_id)
            .first()
        )

    @staticmethod
    def create_order(
        db: Session,
        order: PurchaseOrderCreate,
    ) -> PurchaseOrder:
        total_price = order.quantity * order.unit_price
        db_order = PurchaseOrder(
            **order.model_dump(),
            total_price=total_price,
        )
        db.add(db_order)
        db.commit()
        db.refresh(db_order)
        return db_order

    @staticmethod
    def delete_order(db: Session, order: PurchaseOrder) -> None:
        db.delete(order)
        db.commit()

