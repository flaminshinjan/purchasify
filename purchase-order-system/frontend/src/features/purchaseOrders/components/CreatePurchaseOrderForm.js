import React, { useMemo } from 'react';

import { formatCurrency } from '../utils/formatters';

const fieldClasses =
  'w-full rounded-2xl border border-neutral-300 bg-white/80 px-4 py-3 text-sm text-neutral-800 placeholder:text-neutral-400 transition-all duration-200 focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-500/40 dark:border-neutral-700 dark:bg-neutral-900/70 dark:text-neutral-100 dark:placeholder:text-neutral-600 dark:focus:border-neutral-500';

const labelClasses =
  'mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500 transition-colors duration-300 dark:text-neutral-400';

const CreatePurchaseOrderForm = ({ formData, onChange, onSubmit }) => {
  const totals = useMemo(() => {
    const quantity = Number(formData.quantity || 0);
    const unitPrice = Number(formData.unit_price || 0);
    const total = Number.isFinite(quantity * unitPrice) ? quantity * unitPrice : 0;

    return {
      quantity,
      unitPrice,
      total,
    };
  }, [formData.quantity, formData.unit_price]);

  return (
    <section className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white/80 p-8 shadow-sm transition-colors duration-300 dark:border-neutral-800 dark:bg-neutral-900/70">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(0,0,0,0.06),_transparent_55%)] dark:bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.04),_transparent_50%)]" />
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-neutral-900 transition-colors duration-300 dark:text-neutral-50">
            New Purchase Order
          </h2>
          <p className="mt-1 text-sm text-neutral-500 transition-colors duration-300 dark:text-neutral-400">
            Capture order details and review the estimated spend before submitting.
          </p>
        </div>
        <div className="rounded-2xl border border-neutral-200/70 bg-white/80 px-4 py-2 text-right text-xs text-neutral-500 transition-colors duration-300 dark:border-neutral-700 dark:bg-neutral-900/70 dark:text-neutral-400">
          <p className="font-semibold uppercase tracking-wide text-neutral-400 transition-colors duration-300 dark:text-neutral-500">
            Estimated Total
          </p>
          <p className="mt-1 text-lg font-semibold text-neutral-900 transition-colors duration-300 dark:text-neutral-50">
            {formatCurrency(totals.total || 0)}
          </p>
        </div>
      </header>

      <form onSubmit={onSubmit} className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClasses}>Item Name</label>
            <input
              type="text"
              name="item_name"
              value={formData.item_name}
              onChange={onChange}
              required
              placeholder="e.g. Enterprise Laptops"
              className={fieldClasses}
            />
          </div>

          <div>
            <label className={labelClasses}>Quantity</label>
            <input
              type="number"
              name="quantity"
              min="1"
              value={formData.quantity}
              onChange={onChange}
              required
              placeholder="10"
              className={fieldClasses}
            />
          </div>

          <div>
            <label className={labelClasses}>Unit Price</label>
            <input
              type="number"
              name="unit_price"
              min="0"
              step="0.01"
              value={formData.unit_price}
              onChange={onChange}
              required
              placeholder="1200.00"
              className={fieldClasses}
            />
          </div>

          <div>
            <label className={labelClasses}>Order Date</label>
            <input
              type="date"
              name="order_date"
              value={formData.order_date}
              onChange={onChange}
              required
              className={fieldClasses}
            />
          </div>

          <div>
            <label className={labelClasses}>Delivery Date</label>
            <input
              type="date"
              name="delivery_date"
              value={formData.delivery_date}
              onChange={onChange}
              required
              className={fieldClasses}
            />
          </div>
        </div>

        <aside className="flex flex-col justify-between gap-6 rounded-3xl border border-dashed border-neutral-300 bg-white/60 p-5 transition-colors duration-300 dark:border-neutral-700 dark:bg-neutral-900/50">
          <div className="space-y-4 text-sm text-neutral-500 transition-colors duration-300 dark:text-neutral-400">
            <div className="flex items-center justify-between">
              <span className="uppercase tracking-wide">Quantity</span>
              <span className="text-neutral-800 transition-colors duration-300 dark:text-neutral-100">
                {totals.quantity || '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="uppercase tracking-wide">Unit Price</span>
              <span className="text-neutral-800 transition-colors duration-300 dark:text-neutral-100">
                {formData.unit_price ? formatCurrency(totals.unitPrice || 0) : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="uppercase tracking-wide">Total</span>
              <span className="text-neutral-900 text-base font-semibold transition-colors duration-300 dark:text-neutral-50">
                {formatCurrency(totals.total || 0)}
              </span>
            </div>
          </div>
          <button
            type="submit"
            className="w-full rounded-full bg-neutral-900 px-5 py-3 text-sm font-semibold uppercase tracking-wide text-neutral-100 transition-all duration-200 hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 dark:focus-visible:ring-neutral-500 dark:focus-visible:ring-offset-neutral-900"
          >
            Create Purchase Order
          </button>
        </aside>
      </form>
    </section>
  );
};

export default CreatePurchaseOrderForm;

