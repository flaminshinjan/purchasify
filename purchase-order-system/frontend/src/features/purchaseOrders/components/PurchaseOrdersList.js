import React, { useEffect, useRef } from 'react';

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
}) => {
  const containerRef = useRef(null);
  const sentinelRef = useRef(null);

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

  return (
    <div
      ref={containerRef}
      className="bg-neutral-100 transition-colors duration-300 dark:bg-neutral-950"
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

