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
import PurchaseOrderDetailsPanel from './PurchaseOrderDetailsPanel';
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

const SORT_OPTIONS = [
  { value: 'order_date_desc', label: 'Order Date · Newest' },
  { value: 'order_date_asc', label: 'Order Date · Oldest' },
  { value: 'delivery_date_asc', label: 'Delivery Date · Soonest' },
  { value: 'total_price_desc', label: 'Total Value · High' },
  { value: 'total_price_asc', label: 'Total Value · Low' },
  { value: 'status', label: 'Status' },
];

const STATUS_FILTER_OPTIONS = ['all', ORDER_STATUS.DELIVERED, ORDER_STATUS.IN_PROCESS, ORDER_STATUS.UPCOMING];

const STATUS_SORT_PRIORITY = {
  [ORDER_STATUS.IN_PROCESS]: 0,
  [ORDER_STATUS.UPCOMING]: 1,
  [ORDER_STATUS.DELIVERED]: 2,
  [ORDER_STATUS.SCHEDULED]: 3,
};

const STATUS_LABELS = {
  all: 'All statuses',
  [ORDER_STATUS.DELIVERED]: 'Delivered',
  [ORDER_STATUS.IN_PROCESS]: 'In Process',
  [ORDER_STATUS.UPCOMING]: 'Upcoming',
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
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOption, setSortOption] = useState(SORT_OPTIONS[0].value);
  const [focusedOrderId, setFocusedOrderId] = useState(null);
  const scrollContainerRef = useRef(null);
  const headerSentinelRef = useRef(null);
  const closeDetailsTimeoutRef = useRef(null);
  const optimisticRemovalsRef = useRef(new Map());

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
    const timeout = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 260);

    return () => window.clearTimeout(timeout);
  }, [searchTerm]);

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
    upsertOrder,
    setError: setFeedError,
  } = usePurchaseOrdersFeed({
    pageSize: 60,
  });

  const activeError = uiError || feedError;
  const isFiltering = debouncedSearchTerm.length > 0 || statusFilter !== 'all';

  const filteredOrders = useMemo(() => {
    if (orders.length === 0) {
      return orders;
    }

    const query = debouncedSearchTerm.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesQuery =
        query.length === 0 ||
        String(order.item_name ?? '')
          .toLowerCase()
          .includes(query) ||
        String(order.id ?? '')
          .toLowerCase()
          .includes(query);

      if (!matchesQuery) {
        return false;
      }

      if (statusFilter === 'all') {
        return true;
      }

      return getOrderStatus(order) === statusFilter;
    });
  }, [debouncedSearchTerm, orders, statusFilter]);

  const displayOrders = useMemo(() => {
    if (filteredOrders.length <= 1) {
      return filteredOrders;
    }

    const toTimestamp = (value) => {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? 0 : date.getTime();
    };

    const next = [...filteredOrders];

    next.sort((a, b) => {
      switch (sortOption) {
        case 'order_date_asc':
          return toTimestamp(a.order_date) - toTimestamp(b.order_date);
        case 'order_date_desc':
          return toTimestamp(b.order_date) - toTimestamp(a.order_date);
        case 'delivery_date_asc':
          return toTimestamp(a.delivery_date) - toTimestamp(b.delivery_date);
        case 'total_price_asc':
          return Number(a.total_price ?? 0) - Number(b.total_price ?? 0);
        case 'total_price_desc':
          return Number(b.total_price ?? 0) - Number(a.total_price ?? 0);
        case 'status':
          return (
            (STATUS_SORT_PRIORITY[getOrderStatus(a)] ?? 0) -
            (STATUS_SORT_PRIORITY[getOrderStatus(b)] ?? 0)
          );
        default:
          return 0;
      }
    });

    return next;
  }, [filteredOrders, sortOption]);

  const metrics = useMemo(() => {
    if (!filteredOrders.length) {
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

    filteredOrders.forEach((order) => {
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
  }, [filteredOrders]);

  const isDefaultSort = sortOption === SORT_OPTIONS[0].value;
  const shouldShowResetView = isFiltering || !isDefaultSort;

  useEffect(() => {
    if (!displayOrders.length) {
      setFocusedOrderId(null);
      return;
    }

    setFocusedOrderId((previous) => {
      if (previous && displayOrders.some((order) => order.id === previous)) {
        return previous;
      }
      return displayOrders[0].id;
    });
  }, [displayOrders]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSearchChange = useCallback((event) => {
    setSearchTerm(event.target.value);
  }, []);

  const handleStatusFilterChange = useCallback((event) => {
    setStatusFilter(event.target.value);
    setFocusedOrderId(null);
  }, []);

  const handleSortChange = useCallback((event) => {
    setSortOption(event.target.value);
  }, []);

  const handleResetFilters = useCallback(() => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setStatusFilter('all');
    setSortOption(SORT_OPTIONS[0].value);
    setFocusedOrderId(null);
  }, []);

  const handleCreate = async (event) => {
    event.preventDefault();
    setUiError(null);
    setFeedError(null);

    const quantity = Number.parseInt(formData.quantity, 10) || 0;
    const unitPrice = Number.parseFloat(formData.unit_price) || 0;
    const optimisticId = `temp-${Date.now()}`;
    const optimisticOrder = {
      id: optimisticId,
      item_name: formData.item_name || 'New purchase order',
      order_date: formData.order_date || new Date().toISOString(),
      delivery_date: formData.delivery_date || formData.order_date || new Date().toISOString(),
      quantity,
      unit_price: unitPrice,
      total_price: quantity * unitPrice,
      __optimistic: true,
    };

    upsertOrder(optimisticOrder, { position: 'start' });
    setFocusedOrderId(optimisticId);

    try {
      const createdOrder = await createPurchaseOrder({
        ...formData,
        quantity,
        unit_price: unitPrice,
      });

      removeOrder(optimisticId);
      upsertOrder(createdOrder, { position: 'start' });
      setFocusedOrderId(createdOrder.id);
      setFormData(INITIAL_FORM_STATE);
      setShowForm(false);
    } catch (error) {
      console.error(error);
      removeOrder(optimisticId);
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
    (orderId) => {
      removeOrder(orderId);
      optimisticRemovalsRef.current.delete(orderId);
      setRemovingOrderIds((prev) => prev.filter((current) => current !== orderId));
      setFocusedOrderId((prev) => (prev === orderId ? null : prev));
    },
    [removeOrder],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!pendingDelete) {
      return;
    }

    setUiError(null);
    setFeedError(null);
    setIsProcessingDelete(true);

    const orderToDelete = pendingDelete;
    setPendingDelete(null);
    optimisticRemovalsRef.current.set(orderToDelete.id, orderToDelete);

    setRemovingOrderIds((prev) =>
      prev.includes(orderToDelete.id) ? prev : [...prev, orderToDelete.id],
    );

    try {
      await deletePurchaseOrder(orderToDelete.id);
      setToast({
        id: Date.now(),
        title: 'Purchase order deleted',
        description: `${orderToDelete.item_name} has been removed.`,
      });
      optimisticRemovalsRef.current.delete(orderToDelete.id);
    } catch (error) {
      console.error(error);
      const original = optimisticRemovalsRef.current.get(orderToDelete.id);
      if (original) {
        upsertOrder(original, { position: 'start' });
        optimisticRemovalsRef.current.delete(orderToDelete.id);
      }
      setRemovingOrderIds((prev) =>
        prev.filter((current) => current !== orderToDelete.id),
      );
      setSwipeReset({ id: orderToDelete.id, key: Date.now() });
      setUiError('Failed to delete purchase order.');
      setFocusedOrderId(orderToDelete.id);
    } finally {
      setIsProcessingDelete(false);
    }
  }, [pendingDelete, setFeedError, upsertOrder]);

  const handleToggleForm = () => {
    setIsWorkspaceCollapsed(false);
    setShowForm((prev) => !prev);
    setIsDetailsOpen(false);
  };

  const handleToggleWorkspace = () => {
    if (!isWorkspaceCollapsed && showForm) {
      setShowForm(false);
    }
    setIsDetailsOpen(false);
    setIsWorkspaceCollapsed((prev) => !prev);
  };

  const handleOrderSelect = useCallback(
    (order) => {
      if (!order) {
        return;
      }

      setShowForm(false);
      setIsWorkspaceCollapsed(false);
      setSelectedOrder(order);
      setIsDetailsOpen(true);
      setFocusedOrderId(order.id);
    },
    [],
  );

  const handleCloseDetails = useCallback(() => {
    setIsDetailsOpen(false);
  }, []);

  useEffect(() => {
    if (!isDetailsOpen) {
      return undefined;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isDetailsOpen]);

  useEffect(() => {
    if (!selectedOrder) {
      return undefined;
    }

    const updatedOrder = orders.find((entry) => entry.id === selectedOrder.id);
    if (updatedOrder && updatedOrder !== selectedOrder) {
      setSelectedOrder(updatedOrder);
    }
  }, [orders, selectedOrder]);

  useEffect(() => {
    if (isDetailsOpen || !selectedOrder) {
      if (closeDetailsTimeoutRef.current) {
        window.clearTimeout(closeDetailsTimeoutRef.current);
        closeDetailsTimeoutRef.current = null;
      }
      return undefined;
    }

    closeDetailsTimeoutRef.current = window.setTimeout(() => {
      closeDetailsTimeoutRef.current = null;
      setSelectedOrder(null);
    }, 340);

    return () => {
      if (closeDetailsTimeoutRef.current) {
        window.clearTimeout(closeDetailsTimeoutRef.current);
        closeDetailsTimeoutRef.current = null;
      }
    };
  }, [isDetailsOpen, selectedOrder]);

  useEffect(() => {
    if (!selectedOrder) {
      return undefined;
    }

    const stillExists = orders.some((entry) => entry.id === selectedOrder.id);
    if (!stillExists) {
      setIsDetailsOpen(false);
      setSelectedOrder(null);
    }
  }, [orders, selectedOrder]);

  useEffect(
    () => () => {
      if (closeDetailsTimeoutRef.current) {
        window.clearTimeout(closeDetailsTimeoutRef.current);
      }
    },
    [],
  );

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

                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <label className="relative flex items-center sm:col-span-2 lg:col-span-1">
                      <span className="sr-only">Search purchase orders</span>
                      <svg
                        className="pointer-events-none absolute left-4 h-4 w-4 text-neutral-400 dark:text-neutral-500"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M21 21l-4.35-4.35m1.35-4.65a6 6 0 11-12 0 6 6 0 0112 0z"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                        />
                      </svg>
                      <input
                        type="search"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        placeholder="Search by item or ID"
                        aria-label="Search purchase orders"
                        className="w-full rounded-2xl border border-neutral-200 bg-white/80 py-2.5 pl-11 pr-4 text-sm text-neutral-700 shadow-sm transition-all duration-200 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400/40 dark:border-neutral-700 dark:bg-neutral-900/70 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-neutral-500 dark:focus:ring-neutral-500/40"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400 transition-colors duration-200 dark:text-neutral-500">
                        Status
                      </span>
                      <select
                        value={statusFilter}
                        onChange={handleStatusFilterChange}
                        className="rounded-2xl border border-neutral-200 bg-white/80 px-3 py-2 text-sm text-neutral-700 shadow-sm transition-all duration-200 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400/40 dark:border-neutral-700 dark:bg-neutral-900/70 dark:text-neutral-100 dark:focus:border-neutral-500 dark:focus:ring-neutral-500/40"
                      >
                        {STATUS_FILTER_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {STATUS_LABELS[option]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400 transition-colors duration-200 dark:text-neutral-500">
                        Sort
                      </span>
                      <select
                        value={sortOption}
                        onChange={handleSortChange}
                        className="rounded-2xl border border-neutral-200 bg-white/80 px-3 py-2 text-sm text-neutral-700 shadow-sm transition-all duration-200 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400/40 dark:border-neutral-700 dark:bg-neutral-900/70 dark:text-neutral-100 dark:focus:border-neutral-500 dark:focus:ring-neutral-500/40"
                      >
                        {SORT_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  {shouldShowResetView ? (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="inline-flex items-center justify-center rounded-full border border-neutral-300 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 transition-all duration-200 hover:border-neutral-400 hover:text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-neutral-500 dark:hover:text-neutral-100 dark:focus-visible:ring-neutral-600 dark:focus-visible:ring-offset-neutral-900"
                    >
                      Reset view
                    </button>
                  ) : null}
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
                  ) : displayOrders.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 py-12 text-center text-neutral-500 transition-colors duration-300 dark:text-neutral-400">
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">
                          No purchase orders found
                        </h3>
                        <p className="text-sm">
                          Adjust your search or filters to see matching purchase orders.
                        </p>
                      </div>
                      {shouldShowResetView ? (
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="inline-flex items-center justify-center rounded-full border border-neutral-300 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 transition-all duration-200 hover:border-neutral-400 hover:text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-neutral-500 dark:hover:text-neutral-100 dark:focus-visible:ring-neutral-600 dark:focus-visible:ring-offset-neutral-900"
                        >
                          Clear filters
                        </button>
                      ) : null}
                    </div>
                  ) : (
                    <PurchaseOrdersList
                      orders={displayOrders}
                      hasMore={hasMore}
                      isPrefetching={isPrefetching}
                      onLoadMore={prefetchNext}
                      onDeleteRequest={handleDeleteRequest}
                      confirmingOrderId={pendingDelete?.id ?? null}
                      swipeReset={swipeReset}
                      removingOrderIds={removingOrderIds}
                      onRemovalAnimationComplete={handleRemoveAnimationComplete}
                      onOrderSelect={handleOrderSelect}
                      selectedOrderId={selectedOrder?.id ?? null}
                      focusedOrderId={focusedOrderId}
                      onFocusOrder={setFocusedOrderId}
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
      <PurchaseOrderDetailsPanel
        order={selectedOrder}
        isOpen={isDetailsOpen}
        onClose={handleCloseDetails}
      />
    </div>
  );
};

export default PurchaseOrdersPage;

