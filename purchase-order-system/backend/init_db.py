from app.db.session import SessionLocal
from app.db.models import PurchaseOrder
from datetime import date

def init_database():
    db = SessionLocal()

    # Check if data already exists
    if db.query(PurchaseOrder).count() > 0:
        print("Database already has data, skipping initialization")
        db.close()
        return

    # Sample data
    sample_orders = [
        PurchaseOrder(
            item_name="Laptop",
            order_date=date(2025, 1, 5),
            delivery_date=date(2025, 1, 15),
            quantity=10,
            unit_price=1200.00,
            total_price=12000.00
        ),
        PurchaseOrder(
            item_name="Office Chair",
            order_date=date(2025, 1, 8),
            delivery_date=date(2025, 1, 20),
            quantity=25,
            unit_price=350.00,
            total_price=8750.00
        ),
        PurchaseOrder(
            item_name="Monitor",
            order_date=date(2025, 1, 10),
            delivery_date=date(2025, 1, 18),
            quantity=20,
            unit_price=450.00,
            total_price=9000.00
        ),
        PurchaseOrder(
            item_name="Keyboard",
            order_date=date(2025, 1, 12),
            delivery_date=date(2025, 1, 22),
            quantity=50,
            unit_price=80.00,
            total_price=4000.00
        ),
        PurchaseOrder(
            item_name="Mouse",
            order_date=date(2025, 1, 12),
            delivery_date=date(2025, 1, 22),
            quantity=50,
            unit_price=35.00,
            total_price=1750.00
        ),
    ]

    db.add_all(sample_orders)
    db.commit()
    print("Database initialized with sample data")
    db.close()

if __name__ == "__main__":
    init_database()
