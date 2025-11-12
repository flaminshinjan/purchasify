import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import SessionLocal, PurchaseOrder
from sqlalchemy import func, extract
from datetime import datetime

def format_currency(amount):
    """Format number as currency"""
    return f"${amount:,.2f}"

def format_number(num):
    """Format number with thousand separators"""
    return f"{num:,}"

def print_summary():
    """Print a comprehensive summary of the purchase orders database"""
    db = SessionLocal()

    try:
        print("\n" + "="*70)
        print("PURCHASE ORDER DATABASE SUMMARY".center(70))
        print("="*70 + "\n")

        # Total count
        total_count = db.query(func.count(PurchaseOrder.id)).scalar()
        print(f"📊 Total Purchase Orders: {format_number(total_count)}\n")

        if total_count == 0:
            print("No purchase orders found in the database.")
            return

        # Financial summary
        print("-" * 70)
        print("💰 FINANCIAL SUMMARY")
        print("-" * 70)

        total_value = db.query(func.sum(PurchaseOrder.total_price)).scalar() or 0
        avg_order_value = db.query(func.avg(PurchaseOrder.total_price)).scalar() or 0
        min_order = db.query(func.min(PurchaseOrder.total_price)).scalar() or 0
        max_order = db.query(func.max(PurchaseOrder.total_price)).scalar() or 0

        print(f"  Total Order Value:    {format_currency(total_value)}")
        print(f"  Average Order Value:  {format_currency(avg_order_value)}")
        print(f"  Minimum Order Value:  {format_currency(min_order)}")
        print(f"  Maximum Order Value:  {format_currency(max_order)}")
        print()

        # Quantity summary
        print("-" * 70)
        print("📦 QUANTITY SUMMARY")
        print("-" * 70)

        total_items = db.query(func.sum(PurchaseOrder.quantity)).scalar() or 0
        avg_quantity = db.query(func.avg(PurchaseOrder.quantity)).scalar() or 0
        min_quantity = db.query(func.min(PurchaseOrder.quantity)).scalar() or 0
        max_quantity = db.query(func.max(PurchaseOrder.quantity)).scalar() or 0

        print(f"  Total Items Ordered:  {format_number(total_items)}")
        print(f"  Average Quantity:     {format_number(int(avg_quantity))}")
        print(f"  Minimum Quantity:     {format_number(min_quantity)}")
        print(f"  Maximum Quantity:     {format_number(max_quantity)}")
        print()

        # Top items by count
        print("-" * 70)
        print("🏆 TOP 10 ITEMS BY ORDER COUNT")
        print("-" * 70)

        top_items = db.query(
            PurchaseOrder.item_name,
            func.count(PurchaseOrder.id).label('order_count'),
            func.sum(PurchaseOrder.quantity).label('total_quantity'),
            func.sum(PurchaseOrder.total_price).label('total_value')
        ).group_by(
            PurchaseOrder.item_name
        ).order_by(
            func.count(PurchaseOrder.id).desc()
        ).limit(10).all()

        for idx, (item_name, count, qty, value) in enumerate(top_items, 1):
            print(f"  {idx:2d}. {item_name:25s} - {format_number(count):>8s} orders, "
                  f"{format_number(qty):>8s} units, {format_currency(value):>15s}")
        print()

        # Top items by revenue
        print("-" * 70)
        print("💵 TOP 10 ITEMS BY TOTAL REVENUE")
        print("-" * 70)

        top_revenue = db.query(
            PurchaseOrder.item_name,
            func.sum(PurchaseOrder.total_price).label('total_value'),
            func.count(PurchaseOrder.id).label('order_count')
        ).group_by(
            PurchaseOrder.item_name
        ).order_by(
            func.sum(PurchaseOrder.total_price).desc()
        ).limit(10).all()

        for idx, (item_name, value, count) in enumerate(top_revenue, 1):
            print(f"  {idx:2d}. {item_name:25s} - {format_currency(value):>15s} "
                  f"({format_number(count)} orders)")
        print()

        # Date range
        print("-" * 70)
        print("📅 DATE RANGE")
        print("-" * 70)

        earliest_order = db.query(func.min(PurchaseOrder.order_date)).scalar()
        latest_order = db.query(func.max(PurchaseOrder.order_date)).scalar()
        earliest_delivery = db.query(func.min(PurchaseOrder.delivery_date)).scalar()
        latest_delivery = db.query(func.max(PurchaseOrder.delivery_date)).scalar()

        print(f"  Earliest Order Date:    {earliest_order}")
        print(f"  Latest Order Date:      {latest_order}")
        print(f"  Earliest Delivery Date: {earliest_delivery}")
        print(f"  Latest Delivery Date:   {latest_delivery}")
        print()

        # Orders by year
        print("-" * 70)
        print("📈 ORDERS BY YEAR")
        print("-" * 70)

        orders_by_year = db.query(
            extract('year', PurchaseOrder.order_date).label('year'),
            func.count(PurchaseOrder.id).label('count'),
            func.sum(PurchaseOrder.total_price).label('total_value')
        ).group_by(
            extract('year', PurchaseOrder.order_date)
        ).order_by(
            extract('year', PurchaseOrder.order_date)
        ).all()

        for year, count, value in orders_by_year:
            print(f"  {int(year)}: {format_number(count):>10s} orders, "
                  f"Total: {format_currency(value):>15s}")
        print()

        # Recent orders
        print("-" * 70)
        print("🕐 LATEST 5 PURCHASE ORDERS")
        print("-" * 70)

        recent_orders = db.query(PurchaseOrder).order_by(
            PurchaseOrder.id.desc()
        ).limit(5).all()

        for order in recent_orders:
            print(f"  ID {order.id}: {order.item_name} - "
                  f"{order.quantity} units × {format_currency(order.unit_price)} = "
                  f"{format_currency(order.total_price)}")
            print(f"         Ordered: {order.order_date}, Delivery: {order.delivery_date}")
        print()

        print("="*70)
        print(f"Summary generated at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*70 + "\n")

    except Exception as e:
        print(f"\n✗ Error occurred: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    print_summary()
