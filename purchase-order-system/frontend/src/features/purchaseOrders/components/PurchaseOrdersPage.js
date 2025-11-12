import React, { useCallback, useEffect, useState } from 'react';

import {
  createPurchaseOrder,
  deletePurchaseOrder,
} from '../api/purchaseOrdersApi';
import usePurchaseOrdersFeed from '../hooks/usePurchaseOrdersFeed';
import { fetchPurchaseOrdersCursor } from '../api/purchaseOrdersApi';
import CreatePurchaseOrderForm from './CreatePurchaseOrderForm';
import EmptyState from './EmptyState';
import LoadingState from './LoadingState';
import PurchaseOrdersList from './PurchaseOrdersList';

const INITIAL_FORM_STATE = {
  item_name: '',
  order_date: '',
  delivery_date: '',
  quantity: '',
  unit_price: '',
};

const PurchaseOrdersPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [uiError, setUiError] = useState(null);
  const [debugSnapshot, setDebugSnapshot] = useState(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      fetchPurchaseOrdersCursor({ limit: 5 })
        .then((page) => {
          setDebugSnapshot({
            count: page.items.length,
            sample: page.items[0],
          });
        })
        .catch((error) => {
          setDebugSnapshot({ error: error.message });
        });
    }
  }, []);

  const {
    items: orders,
    isInitialLoading,
    isPrefetching,
    error: feedError,
    hasMore,
    prefetchNext,
    removeOrder,
    reset,
    setError: setFeedError,
  } = usePurchaseOrdersFeed({
    pageSize: 60,
  });

  const activeError = uiError || feedError;

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setUiError(null);
    setFeedError(null);

    try {
      await createPurchaseOrder({
        ...formData,
        quantity: parseInt(formData.quantity, 10),
        unit_price: parseFloat(formData.unit_price),
      });

      setFormData(INITIAL_FORM_STATE);
      setShowForm(false);
      await reset();
    } catch (error) {
      console.error(error);
      setUiError('Failed to create purchase order.');
    }
  };

  const handleDelete = useCallback(
    async (id) => {
      setUiError(null);
      setFeedError(null);

      try {
        await deletePurchaseOrder(id);
        removeOrder(id);
      } catch (error) {
        console.error(error);
        setUiError('Failed to delete purchase order.');
      }
    },
    [removeOrder, setFeedError],
  );

  const handleToggleForm = () => {
    setShowForm((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto flex h-full max-w-7xl flex-col px-4 pb-12 pt-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900">Purchase Orders</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage and track purchase orders with high-performance pagination.
          </p>
          {process.env.NODE_ENV !== 'production' ? (
            <p className="mt-1 text-xs text-gray-400">
              Debug: {orders.length} orders loaded · hasMore={String(hasMore)} · initialLoading=
              {String(isInitialLoading)}
              {debugSnapshot
                ? ` · debugFetch=${debugSnapshot.count ?? 'err'}`
                : ' · debugFetch=pending'}
            </p>
          ) : null}
        </div>

        {activeError ? (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {activeError}
          </div>
        ) : null}

        <div className="mb-6">
          <button
            onClick={handleToggleForm}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-blue-700"
          >
            {showForm ? 'Cancel' : 'New Purchase Order'}
          </button>
        </div>

        {showForm ? (
          <CreatePurchaseOrderForm
            formData={formData}
            onChange={handleInputChange}
            onSubmit={handleCreate}
          />
        ) : null}

        <div className="flex-1 overflow-hidden rounded-2xl border border-gray-100 bg-gray-100/60">
          {isInitialLoading ? (
            <LoadingState label="Loading purchase orders…" />
          ) : orders.length === 0 ? (
            <div className="space-y-4">
              <EmptyState />
              {process.env.NODE_ENV !== 'production' ? (
                <pre className="mx-auto w-fit rounded bg-gray-200 px-3 py-2 text-xs text-gray-700">
                  Debug payload: {JSON.stringify(
                    {
                      error: feedError,
                      uiError,
                      snapshot: debugSnapshot,
                    },
                    null,
                    2,
                  )}
                </pre>
              ) : null}
            </div>
          ) : (
            <PurchaseOrdersList
              orders={orders}
              hasMore={hasMore}
              isPrefetching={isPrefetching}
              onLoadMore={prefetchNext}
              onDelete={handleDelete}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrdersPage;

