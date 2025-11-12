import React, { useCallback, useEffect, useLayoutEffect, useRef } from 'react';

import PurchaseOrderCard from './PurchaseOrderCard';

const PurchaseOrdersList = ({
  orders,
  hasMore,
  isPrefetching,
  onLoadMore,
  onDeleteRequest = () => {},
  confirmingOrderId = null,
  swipeReset = null,
  removingOrderIds = [],
  onRemovalAnimationComplete = () => {},
  onOrderSelect = () => {},
  selectedOrderId = null,
  focusedOrderId = null,
  onFocusOrder = () => {},
}) => {
  const containerRef = useRef(null);
  const sentinelRef = useRef(null);
  const positionsRef = useRef(new Map());

  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (!sentinel || !hasMore || !onLoadMore) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting && !isPrefetching) {
          onLoadMore();
        }
      },
      {
        root: null,
        rootMargin: '160px',
      },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isPrefetching, onLoadMore, orders.length]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const nodes = Array.from(
      container.querySelectorAll('[data-order-id]'),
    );

    const previousPositions = positionsRef.current;
    const currentPositions = new Map();

    nodes.forEach((node) => {
      const rect = node.getBoundingClientRect();
      const { orderId } = node.dataset;
      currentPositions.set(orderId, rect);

      const previous = previousPositions.get(orderId);
      if (!previous || typeof node.animate !== 'function') {
        if (typeof node.animate === 'function') {
          node.animate(
            [
              { opacity: 0, transform: 'scale(0.98)' },
              { opacity: 1, transform: 'scale(1)' },
            ],
            {
              duration: 200,
              easing: 'ease-out',
            },
          );
        }
        return;
      }

      const deltaX = previous.left - rect.left;
      const deltaY = previous.top - rect.top;

      if (deltaX !== 0 || deltaY !== 0) {
        node.animate(
          [
            {
              transform: `translate(${deltaX}px, ${deltaY}px)`,
            },
            {
              transform: 'translate(0, 0)',
            },
          ],
          {
            duration: 260,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          },
        );
      }
    });

    positionsRef.current = currentPositions;
  }, [orders]);

  const handleKeyDown = useCallback(
    (event) => {
      if (!orders.length) {
        return;
      }

      const currentIndex = focusedOrderId
        ? orders.findIndex((order) => order.id === focusedOrderId)
        : -1;

      let nextIndex = currentIndex;

      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        nextIndex = currentIndex < orders.length - 1 ? currentIndex + 1 : currentIndex;
        if (nextIndex === -1) {
          nextIndex = 0;
        }
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        if (currentIndex === -1) {
          nextIndex = orders.length - 1;
        } else {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : 0;
        }
      } else if (event.key === 'Home') {
        event.preventDefault();
        nextIndex = 0;
      } else if (event.key === 'End') {
        event.preventDefault();
        nextIndex = orders.length - 1;
      } else if (event.key === 'Enter') {
        if (currentIndex >= 0) {
          event.preventDefault();
          onOrderSelect(orders[currentIndex]);
        }
        return;
      } else if (event.key === 'Delete' || event.key === 'Backspace') {
        if (currentIndex >= 0) {
          event.preventDefault();
          onDeleteRequest(orders[currentIndex]);
        }
        return;
      } else {
        return;
      }

      const clampedIndex = Math.min(Math.max(nextIndex, 0), orders.length - 1);
      const nextOrder = orders[clampedIndex];
      if (nextOrder) {
        onFocusOrder(nextOrder.id);
      }
    },
    [focusedOrderId, onDeleteRequest, onFocusOrder, onOrderSelect, orders],
  );

  const handleFocus = useCallback(() => {
    if (!orders.length) {
      return;
    }
    if (focusedOrderId == null) {
      onFocusOrder(orders[0].id);
    }
  }, [focusedOrderId, onFocusOrder, orders]);

  return (
    <div
      ref={containerRef}
      className="bg-neutral-100 transition-colors duration-300 dark:bg-neutral-950"
      role="listbox"
      aria-label="Purchase orders"
      aria-activedescendant={focusedOrderId ? `purchase-order-card-${focusedOrderId}` : undefined}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
    >
      <div className="grid items-stretch gap-6 p-6 [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))] sm:p-8">
        {orders.map((order) => (
          <PurchaseOrderCard
            key={order.id}
            order={order}
            onDeleteRequest={onDeleteRequest}
            isConfirming={confirmingOrderId === order.id}
            resetSignal={
              swipeReset && swipeReset.id === order.id ? swipeReset.key : null
            }
            isRemoving={removingOrderIds.includes(order.id)}
            onRemovalAnimationComplete={onRemovalAnimationComplete}
            onSelect={onOrderSelect}
            isActive={selectedOrderId === order.id}
            isFocused={focusedOrderId === order.id}
            cardId={`purchase-order-card-${order.id}`}
          />
        ))}
      </div>
      <div
        ref={sentinelRef}
        className="flex items-center justify-center px-4 pb-6 text-sm text-neutral-500 transition-colors duration-300 dark:text-neutral-400"
      >
        {hasMore ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-neutral-300 px-3 py-1 text-xs font-medium uppercase tracking-wide text-neutral-500 transition-colors duration-200 dark:border-neutral-700 dark:text-neutral-400">
            {isPrefetching ? 'Loading more orders…' : 'Scroll to load more'}
          </span>
        ) : (
          <span className="text-xs uppercase tracking-wide text-neutral-400 dark:text-neutral-600">
            All orders loaded
          </span>
        )}
      </div>
    </div>
  );
};

export default PurchaseOrdersList;

