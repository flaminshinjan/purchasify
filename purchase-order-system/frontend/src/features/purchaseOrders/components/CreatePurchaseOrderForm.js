import React from 'react';

const CreatePurchaseOrderForm = ({ formData, onChange, onSubmit }) => (
  <div className="mb-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
    <h2 className="mb-4 text-xl font-semibold text-gray-900">Create Purchase Order</h2>
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Item Name</label>
        <input
          type="text"
          name="item_name"
          value={formData.item_name}
          onChange={onChange}
          required
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Quantity</label>
        <input
          type="number"
          name="quantity"
          min="1"
          value={formData.quantity}
          onChange={onChange}
          required
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Unit Price</label>
        <input
          type="number"
          name="unit_price"
          min="0"
          step="0.01"
          value={formData.unit_price}
          onChange={onChange}
          required
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Order Date</label>
        <input
          type="date"
          name="order_date"
          value={formData.order_date}
          onChange={onChange}
          required
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Delivery Date</label>
        <input
          type="date"
          name="delivery_date"
          value={formData.delivery_date}
          onChange={onChange}
          required
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="md:col-span-2">
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-blue-700"
        >
          Create Order
        </button>
      </div>
    </form>
  </div>
);

export default CreatePurchaseOrderForm;

