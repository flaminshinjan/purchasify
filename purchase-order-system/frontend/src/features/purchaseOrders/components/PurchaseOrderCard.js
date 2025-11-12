import React from 'react';

import { formatCurrency, formatDate } from '../utils/formatters';

const PurchaseOrderCard = ({ order, onDelete }) => (
  <div className="group h-full rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-md md:flex md:items-center md:justify-between">
    <div className="flex-1">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-base font-semibold text-gray-900">{order.item_name}</h3>
        <p className="text-sm font-medium text-gray-900">{formatCurrency(order.total_price)}</p>
      </div>
      <p className="mt-1 text-xs text-gray-500">
        Ordered {formatDate(order.order_date)} • Delivery {formatDate(order.delivery_date)}
      </p>
    </div>
    <div className="mt-4 flex flex-wrap items-center gap-6 text-sm text-gray-600 md:mt-0 md:pl-8">
      <div>
        <span className="block text-xs font-medium uppercase tracking-wide text-gray-400">
          Quantity
        </span>
        <span>{order.quantity}</span>
      </div>
      <div>
        <span className="block text-xs font-medium uppercase tracking-wide text-gray-400">
          Unit Price
        </span>
        <span>{formatCurrency(order.unit_price)}</span>
      </div>
      <button
        onClick={() => onDelete(order.id)}
        className="text-sm font-medium text-red-600 transition-colors duration-150 hover:text-red-700"
      >
        Delete
      </button>
    </div>
  </div>
);

export default PurchaseOrderCard;

