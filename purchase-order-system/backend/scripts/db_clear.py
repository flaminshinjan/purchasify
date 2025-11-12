import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import SessionLocal, PurchaseOrder
from sqlalchemy import func

def clear_database():
    """
    Clear all purchase orders from the database.
    Prompts for confirmation before deletion.
    """
    db = SessionLocal()

    try:
        # Get current count
        count = db.query(func.count(PurchaseOrder.id)).scalar()

        if count == 0:
            print("\n✓ Database is already empty. No records to delete.")
            return

        print(f"\n⚠️  WARNING: This will delete ALL {count:,} purchase orders from the database!")
        print("This action cannot be undone.\n")

        # Prompt for confirmation
        confirmation = input("Type 'Y' to confirm: ")

        if confirmation != 'Y':
            print("\n✗ Operation cancelled. No records were deleted.")
            return

        # Delete all records
        print("\nDeleting records...")
        deleted_count = db.query(PurchaseOrder).delete()
        db.commit()

        print(f"\n✓ Successfully deleted {deleted_count:,} purchase orders from the database.")
        print("Database is now empty.\n")

    except Exception as e:
        print(f"\n✗ Error occurred: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    # Check for --force flag to skip confirmation
    if len(sys.argv) > 1 and sys.argv[1] == '--force':
        db = SessionLocal()
        try:
            count = db.query(func.count(PurchaseOrder.id)).scalar()
            if count > 0:
                deleted_count = db.query(PurchaseOrder).delete()
                db.commit()
                print(f"\n✓ Force deleted {deleted_count:,} purchase orders.")
            else:
                print("\n✓ Database is already empty.")
        except Exception as e:
            print(f"\n✗ Error occurred: {e}")
            db.rollback()
        finally:
            db.close()
    else:
        clear_database()
