from fastapi import APIRouter

from app.api.routes.purchase_orders import router as purchase_orders_router

api_router = APIRouter()
api_router.include_router(purchase_orders_router, prefix="/purchase-orders", tags=["purchase-orders"])

