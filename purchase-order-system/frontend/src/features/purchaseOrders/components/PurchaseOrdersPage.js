import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  createPurchaseOrder,
  deletePurchaseOrder,
} from '../api/purchaseOrdersApi';
import usePurchaseOrdersFeed from '../hooks/usePurchaseOrdersFeed';
import { fetchPurchaseOrdersCursor } from '../api/purchaseOrdersApi';
import { formatCurrency } from '../utils/formatters';
import { getOrderStatus, ORDER_STATUS } from '../utils/orderStatus';
import CreatePurchaseOrderForm from './CreatePurchaseOrderForm';
import EmptyState from './EmptyState';
import LoadingState from './LoadingState';
import PurchaseOrdersList from './PurchaseOrdersList';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';
import Toast from './Toast';

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
  const [isHeaderCondensed, setIsHeaderCondensed] = useState(false);
  const [isWorkspaceCollapsed, setIsWorkspaceCollapsed] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [isProcessingDelete, setIsProcessingDelete] = useState(false);
  const [swipeReset, setSwipeReset] = useState(null);
  const [removingOrderIds, setRemovingOrderIds] = useState([]);
  const [toast, setToast] = useState(null);
  const scrollContainerRef = useRef(null);
  const headerSentinelRef = useRef(null);

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

  useEffect(() => {
    const sentinel = headerSentinelRef.current;
    if (!sentinel || typeof IntersectionObserver === 'undefined') {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const shouldCondense = !entry.isIntersecting;
        setIsHeaderCondensed((prev) => (prev === shouldCondense ? prev : shouldCondense));
      },
      {
        threshold: 0,
        rootMargin: '-96px 0px 0px 0px',
      },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
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

  const metrics = useMemo(() => {
    if (!orders.length) {
      return {
        totalOrders: 0,
        totalValue: 0,
        delivered: 0,
        inProcess: 0,
        upcoming: 0,
      };
    }

    let totalValue = 0;
    let delivered = 0;
    let inProcess = 0;
    let upcoming = 0;

    orders.forEach((order) => {
      totalValue += Number(order.total_price ?? 0);
      const status = getOrderStatus(order);

      if (status === ORDER_STATUS.DELIVERED) {
        delivered += 1;
      } else if (status === ORDER_STATUS.IN_PROCESS) {
        inProcess += 1;
      } else if (status === ORDER_STATUS.UPCOMING) {
        upcoming += 1;
      }
    });

    return {
      totalOrders: orders.length,
      totalValue,
      delivered,
      inProcess,
      upcoming,
    };
  }, [orders]);

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

  const handleDeleteRequest = useCallback((order) => {
    setPendingDelete(order);
  }, []);

  const handleCancelDelete = useCallback(() => {
    if (!pendingDelete) {
      return;
    }

    setSwipeReset({ id: pendingDelete.id, key: Date.now() });
    setPendingDelete(null);
  }, [pendingDelete]);

  const handleRemoveAnimationComplete = useCallback(
    async (orderId) => {
      removeOrder(orderId);
      setRemovingOrderIds((prev) => prev.filter((current) => current !== orderId));

      try {
        await reset();
      } catch (error) {
        console.error(error);
        setUiError('Failed to refresh purchase orders.');
      }
    },
    [removeOrder, reset, setUiError],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!pendingDelete) {
      return;
    }

    setUiError(null);
    setFeedError(null);
    setIsProcessingDelete(true);

    try {
      await deletePurchaseOrder(pendingDelete.id);
      setRemovingOrderIds((prev) =>
        prev.includes(pendingDelete.id) ? prev : [...prev, pendingDelete.id],
      );
      setToast({
        id: Date.now(),
        title: 'Purchase order deleted',
        description: `${pendingDelete.item_name} has been removed.`,
      });
      setPendingDelete(null);
    } catch (error) {
      console.error(error);
      setUiError('Failed to delete purchase order.');
      setSwipeReset({ id: pendingDelete.id, key: Date.now() });
      setPendingDelete(null);
    } finally {
      setIsProcessingDelete(false);
    }
  }, [pendingDelete, setFeedError]);

  const handleToggleForm = () => {
    setIsWorkspaceCollapsed(false);
    setShowForm((prev) => !prev);
  };

  const handleToggleWorkspace = () => {
    if (!isWorkspaceCollapsed && showForm) {
      setShowForm(false);
    }
    setIsWorkspaceCollapsed((prev) => !prev);
  };

  const headerCardClass = `relative overflow-hidden rounded-3xl border transition-all duration-300 ${
    isHeaderCondensed
      ? 'border-neutral-200/80 bg-white/85 shadow-lg backdrop-blur-lg dark:border-neutral-800/70 dark:bg-neutral-900/80'
      : 'border-neutral-200 bg-white/70 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/60'
  }`;

  const metricValueClass = `transition-colors duration-300 text-neutral-900 dark:text-neutral-50 ${
    isHeaderCondensed ? 'mt-0.5 text-lg font-semibold' : 'mt-2 text-2xl font-semibold'
  }`;

  return (
    <div className="bg-neutral-100 transition-colors duration-300 dark:bg-neutral-950">
      <div className="mx-auto flex min-h-screen w-full flex-col px-3 pb-8 pt-8 sm:px-5 lg:px-8 xl:px-12">
        <section
          ref={scrollContainerRef}
          className="relative flex flex-col rounded-[2.25rem] border border-neutral-200/70 bg-neutral-100/20 pb-10 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] transition-colors duration-300 dark:border-neutral-800/60 dark:bg-neutral-950/20 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
        >
          <header className="sticky top-0 z-40 bg-neutral-100/90 backdrop-blur-md transition-all duration-300 dark:bg-neutral-950/80">
            <div className={`px-5 sm:px-8 lg:px-12 xl:px-16 ${isHeaderCondensed ? 'pb-4 pt-6' : 'pb-8 pt-10'}`}>
              <div className={headerCardClass}>
                <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(0,0,0,0.05),_transparent_55%)] dark:bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.04),_transparent_55%)]" />
                <div className={`flex flex-col gap-5 ${isHeaderCondensed ? 'p-5' : 'p-7'}`}>
                  <div className={`flex flex-col ${isHeaderCondensed ? 'gap-3 lg:flex-row lg:items-center lg:justify-between' : 'gap-6 lg:flex-row lg:items-start lg:justify-between'}`}>
                    <div className="space-y-3">
                      {isHeaderCondensed ? null : (
                        <span className="inline-flex items-center rounded-full border border-neutral-300 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-neutral-500 transition-all duration-300 dark:border-neutral-700 dark:text-neutral-400">
                          Operations
                        </span>
                      )}
                      <div>
                        <h1
                          className={`font-semibold text-neutral-900 transition-colors duration-300 dark:text-neutral-50 ${
                            isHeaderCondensed ? 'text-xl' : 'text-4xl'
                          }`}
                        >
                          Purchase Orders
                        </h1>
                        {isHeaderCondensed ? null : (
                          <p className="mt-3 max-w-2xl text-sm text-neutral-600 transition-colors duration-300 dark:text-neutral-400">
                            Monitor throughput, fulfillment progress, and upcoming deliveries in a streamlined, responsive workspace.
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2 sm:gap-3">
                      <button
                        onClick={handleToggleWorkspace}
                        className={`rounded-full border border-neutral-300 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-600 transition-all duration-200 hover:border-neutral-400 hover:text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-neutral-500 dark:hover:text-neutral-100 dark:focus-visible:ring-neutral-600 dark:focus-visible:ring-offset-neutral-900 ${
                          isHeaderCondensed ? 'backdrop-blur-sm bg-white/70 dark:bg-neutral-900/60' : 'bg-transparent'
                        }`}
                      >
                        {isWorkspaceCollapsed ? 'Expand Workspace' : 'Collapse Workspace'}
                      </button>
                      <button
                        onClick={handleToggleForm}
                        className={`rounded-full uppercase tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-neutral-500 dark:focus-visible:ring-offset-neutral-900 ${
                          isHeaderCondensed
                            ? 'bg-neutral-900 px-4 py-1.5 text-[11px] font-semibold text-neutral-100 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200'
                            : 'bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-neutral-100 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200'
                        }`}
                      >
                        {showForm ? 'Cancel' : 'New Purchase Order'}
                      </button>
                    </div>
                  </div>

                  <dl
                    className={`grid transition-all duration-300 ${
                      isHeaderCondensed ? 'grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4' : 'gap-4 md:grid-cols-2 xl:grid-cols-4'
                    }`}
                  >
                    <div className="rounded-2xl border border-neutral-200 bg-white/60 p-4 transition-colors duration-300 dark:border-neutral-700 dark:bg-neutral-900/60">
                      <dt className="text-xs font-medium uppercase tracking-wide text-neutral-400 transition-colors duration-300 dark:text-neutral-500">
                        Total Orders
                      </dt>
                      <dd className={metricValueClass}>{metrics.totalOrders.toLocaleString()}</dd>
                    </div>
                    <div className="rounded-2xl border border-neutral-200 bg-white/60 p-4 transition-colors duration-300 dark:border-neutral-700 dark:bg-neutral-900/60">
                      <dt className="text-xs font-medium uppercase tracking-wide text-neutral-400 transition-colors duration-300 dark:text-neutral-500">
                        Total Value
                      </dt>
                      <dd className={metricValueClass}>{formatCurrency(metrics.totalValue)}</dd>
                    </div>
                    <div className="rounded-2xl border border-neutral-200 bg-white/60 p-4 transition-colors duration-300 dark:border-neutral-700 dark:bg-neutral-900/60">
                      <dt className="text-xs font-medium uppercase tracking-wide text-neutral-400 transition-colors duration-300 dark:text-neutral-500">
                        In Process
                      </dt>
                      <dd className={metricValueClass}>{metrics.inProcess.toLocaleString()}</dd>
                    </div>
                    <div className="rounded-2xl border border-neutral-200 bg-white/60 p-4 transition-colors duration-300 dark:border-neutral-700 dark:bg-neutral-900/60">
                      <dt className="text-xs font-medium uppercase tracking-wide text-neutral-400 transition-colors duration-300 dark:text-neutral-500">
                        Upcoming
                      </dt>
                      <dd className={metricValueClass}>
                        {metrics.upcoming.toLocaleString()}
                        <span className="ml-2 text-xs font-medium text-neutral-400 transition-colors duration-300 dark:text-neutral-500">
                          · Delivered {metrics.delivered.toLocaleString()}
                        </span>
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          </header>
          <div ref={headerSentinelRef} aria-hidden className="h-1 w-full" />

          <div className="flex-1 px-5 pt-0 sm:px-8 lg:px-12 xl:px-16">
            {activeError ? (
              <div className="mb-6 rounded-2xl border border-neutral-400 bg-neutral-200 px-4 py-3 text-sm text-neutral-800 transition-colors duration-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200">
                {activeError}
              </div>
            ) : null}

            {isWorkspaceCollapsed ? (
              <div className="flex h-full min-h-[340px] items-center justify-center rounded-3xl border border-neutral-200 bg-neutral-200/40 p-12 text-center transition-colors duration-300 dark:border-neutral-800 dark:bg-neutral-900/40">
                <div className="space-y-4 text-neutral-600 transition-colors duration-300 dark:text-neutral-300">
                  <h2 className="text-xl font-semibold text-neutral-900 transition-colors duration-300 dark:text-neutral-50">
                    Workspace Collapsed
                  </h2>
                  <p className="text-sm">
                    Expand the workspace to resume monitoring purchase orders and creating new requests.
                  </p>
                  <button
                    onClick={handleToggleWorkspace}
                    className="rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold uppercase tracking-wide text-neutral-100 transition-all duration-200 hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 dark:focus-visible:ring-neutral-500 dark:focus-visible:ring-offset-neutral-900"
                  >
                    Expand Workspace
                  </button>
                </div>
              </div>
            ) : (
              <>
                {showForm ? (
                  <div className="mb-8">
                    <CreatePurchaseOrderForm
                      formData={formData}
                      onChange={handleInputChange}
                      onSubmit={handleCreate}
                    />
                  </div>
                ) : null}

                <div className="flex-1 overflow-hidden rounded-3xl border border-neutral-200 bg-neutral-200/40 transition-colors duration-300 dark:border-neutral-800 dark:bg-neutral-900/40">
                  {isInitialLoading ? (
                    <LoadingState label="Loading purchase orders…" />
                  ) : orders.length === 0 ? (
                    <div className="space-y-4">
                      <EmptyState />
                      {process.env.NODE_ENV !== 'production' ? (
                        <pre className="mx-auto w-fit rounded bg-neutral-200 px-3 py-2 text-xs text-neutral-700 transition-colors duration-300 dark:bg-neutral-900 dark:text-neutral-300">
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
                      onDeleteRequest={handleDeleteRequest}
                      confirmingOrderId={pendingDelete?.id ?? null}
                      swipeReset={swipeReset}
                      removingOrderIds={removingOrderIds}
                      onRemovalAnimationComplete={handleRemoveAnimationComplete}
                    />
                  )}
                </div>
              </>
            )}
          </div>
        </section>
      </div>
      <DeleteConfirmationDialog
        order={pendingDelete}
        isOpen={Boolean(pendingDelete)}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        isLoading={isProcessingDelete}
      />
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
};

export default PurchaseOrdersPage;

