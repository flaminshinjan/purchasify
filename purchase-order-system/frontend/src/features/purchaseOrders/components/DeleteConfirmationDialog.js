import React, { useEffect, useMemo, useState } from 'react';

import { formatCurrency, formatDate } from '../utils/formatters';
import { getOrderStatus, getOrderStatusMeta } from '../utils/orderStatus';

const DeleteConfirmationDialog = ({
  order,
  isOpen,
  onCancel,
  onConfirm,
  isLoading = false,
}) => {
  const [shouldRender, setShouldRender] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
    } else {
      const timeout = window.setTimeout(() => setShouldRender(false), 220);
      return () => window.clearTimeout(timeout);
    }
    return undefined;
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  const statusMeta = useMemo(() => {
    if (!order) {
      return null;
    }

    const key = getOrderStatus(order);
    return getOrderStatusMeta(key);
  }, [order]);

  if (!shouldRender) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-[60] flex items-center justify-center px-4 transition-opacity duration-200 ${
        isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      }`}
      aria-hidden={!isOpen}
    >
      <div
        className={`absolute inset-0 bg-neutral-950/50 backdrop-blur-md transition-opacity duration-200 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <div
        className={`relative z-10 w-full max-w-lg transform-gpu rounded-3xl border border-neutral-200/50 bg-white/90 p-8 shadow-2xl shadow-neutral-900/10 transition-all duration-300 dark:border-neutral-800/50 dark:bg-neutral-950/80 ${
          isOpen ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-400 dark:text-neutral-500">
              Confirm Removal
            </p>
            <h2
              id="delete-dialog-title"
              className="mt-3 text-2xl font-semibold text-neutral-900 dark:text-neutral-50"
            >
              Delete purchase order?
            </h2>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400">
            <svg
              className="h-6 w-6 stroke-[1.4]"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 6l-.72 10.08a2 2 0 0 1-2 1.92h-2.56a2 2 0 0 1-2-1.92L8 6m2 0V4.8A1.8 1.8 0 0 1 11.8 3h0.4A1.8 1.8 0 0 1 14 4.8V6m-6 0h8m-5 4v4m2-4v4"
              />
            </svg>
          </div>
        </div>

        <p
          id="delete-dialog-description"
          className="mt-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300"
        >
          This action is permanent. The purchase order will be removed from the workspace and the activity log.
        </p>

        {order ? (
          <div className="mt-6 grid gap-4 rounded-2xl border border-neutral-200 bg-white/80 p-5 text-sm transition-colors duration-300 dark:border-neutral-800 dark:bg-neutral-900/60">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
                  Item
                </p>
                <p className="mt-1 text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                  {order.item_name}
                </p>
              </div>
              {statusMeta ? (
                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusMeta.badgeClass}`}>
                  {statusMeta.label}
                </span>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
                  Total Value
                </p>
                <p className="mt-1 text-base font-semibold text-neutral-900 dark:text-neutral-100">
                  {formatCurrency(order.total_price)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
                  Quantity
                </p>
                <p className="mt-1 text-base font-semibold text-neutral-900 dark:text-neutral-100">
                  {order.quantity}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
                  Order Date
                </p>
                <p className="mt-1 text-base font-semibold text-neutral-900 dark:text-neutral-100">
                  {formatDate(order.order_date)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
                  Delivery Date
                </p>
                <p className="mt-1 text-base font-semibold text-neutral-900 dark:text-neutral-100">
                  {formatDate(order.delivery_date)}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="inline-flex items-center justify-center rounded-full border border-neutral-300 px-5 py-2 text-sm font-semibold uppercase tracking-wide text-neutral-600 transition-all duration-200 hover:border-neutral-400 hover:text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-neutral-500 dark:hover:text-neutral-100 dark:focus-visible:ring-neutral-600 dark:focus-visible:ring-offset-neutral-900"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="inline-flex items-center justify-center rounded-full bg-red-600 px-6 py-2 text-sm font-semibold uppercase tracking-wide text-white shadow transition-all duration-200 hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:bg-red-500/60 dark:bg-red-500 dark:hover:bg-red-400 dark:focus-visible:ring-red-300 dark:focus-visible:ring-offset-neutral-900"
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Deleting…
              </span>
            ) : (
              'Delete'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationDialog;

