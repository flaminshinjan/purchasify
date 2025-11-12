import sys
import os
import random

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import SessionLocal, PurchaseOrder
from datetime import date, timedelta

# Sample item names for variety
ITEM_NAMES = [
    "Laptop", "Desktop Computer", "Monitor", "Keyboard", "Mouse",
    "Office Chair", "Desk", "Printer", "Scanner", "Webcam",
    "Headphones", "Microphone", "USB Cable", "HDMI Cable", "Router",
    "Switch", "Tablet", "Smartphone", "Hard Drive", "SSD",
    "RAM Module", "Graphics Card", "Motherboard", "CPU", "Power Supply",
    "Phone Case", "Screen Protector", "Charging Cable", "Adapter", "Hub",
    "Docking Station", "Ergonomic Mouse", "Mechanical Keyboard", "Speakers", "Projector",
    "Whiteboard", "Marker Set", "Notebook", "Pen Set", "Stapler",
    "Paper Ream", "File Cabinet", "Bookshelf", "Lamp", "Extension Cord",
    "Surge Protector", "Label Maker", "Calculator", "Shredder", "Coffee Maker"
]

def add_entries(total_entries, batch_size=10000):
    """
    Add dummy purchase orders to the database.
    Uses batch inserts for better performance.
    """
    db = SessionLocal()

    print(f"Starting to add {total_entries:,} dummy entries...")
    print(f"Batch size: {batch_size:,}")

    start_date = date(2020, 1, 1)
    end_date = date(2025, 12, 31)
    date_range = (end_date - start_date).days

    try:
        for i in range(0, total_entries, batch_size):
            batch = []
            current_batch_size = min(batch_size, total_entries - i)

            for j in range(current_batch_size):
                # Random order date
                order_date = start_date + timedelta(days=random.randint(0, date_range))
                # Delivery date is 5-30 days after order date
                delivery_date = order_date + timedelta(days=random.randint(5, 30))

                # Random item
                item_name = random.choice(ITEM_NAMES)

                # Random quantity (1-100)
                quantity = random.randint(1, 100)

                # Random unit price ($10-$2000)
                unit_price = round(random.uniform(10.0, 2000.0), 2)

                # Calculate total
                total_price = round(quantity * unit_price, 2)

                order = PurchaseOrder(
                    item_name=item_name,
                    order_date=order_date,
                    delivery_date=delivery_date,
                    quantity=quantity,
                    unit_price=unit_price,
                    total_price=total_price
                )
                batch.append(order)

            # Bulk insert
            db.bulk_save_objects(batch)
            db.commit()

            completed = i + current_batch_size
            progress = (completed / total_entries) * 100
            print(f"Progress: {completed:,} / {total_entries:,} ({progress:.1f}%)")

        print(f"\n✓ Successfully added {total_entries:,} entries to the database!")

    except Exception as e:
        print(f"\n✗ Error occurred: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    # You can adjust batch size if needed
    total_entries = 100000
    batch_size = 100000

    if len(sys.argv) > 1:
        try:
            batch_size = int(sys.argv[1])
        except ValueError:
            print("Invalid batch size. Using default: 10000")

    add_entries(total_entries, batch_size)
