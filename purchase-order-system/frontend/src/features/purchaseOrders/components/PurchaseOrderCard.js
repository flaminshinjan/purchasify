import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { formatCurrency, formatDate } from '../utils/formatters';
import { getOrderStatus, getOrderStatusMeta } from '../utils/orderStatus';

const SWIPE_THRESHOLD = 0.5;

const PurchaseOrderCard = ({
  order,
  onDeleteRequest,
  resetSignal,
  isConfirming,
  isRemoving,
  onRemovalAnimationComplete,
}) => {
  const status = useMemo(() => {
    const statusKey = getOrderStatus(order);
    return getOrderStatusMeta(statusKey);
  }, [order]);

  const cardRef = useRef(null);
  const frameRef = useRef(null);
  const pointerRef = useRef({
    pointerId: null,
    startX: 0,
    startY: 0,
    hasMoved: false,
  });

  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isActionActive, setIsActionActive] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  const clampDragX = useCallback((value) => {
    if (value > 0) {
      return value * 0.1;
    }
    return value;
  }, []);

  useEffect(() => {
    if (resetSignal == null) {
      return;
    }

    setDragX(0);
    setIsActionActive(false);
    setIsAnimatingOut(false);
  }, [resetSignal]);

  useEffect(() => {
    if (!isConfirming && isActionActive && !isAnimatingOut) {
      setIsActionActive(false);
      setDragX(0);
    }
  }, [isActionActive, isAnimatingOut, isConfirming]);

  useEffect(() => {
    if (!isRemoving || isAnimatingOut) {
      return undefined;
    }

    const width = cardRef.current?.offsetWidth || 320;
    setIsAnimatingOut(true);
    setDragX((-width || -320) - 64);

    const timeout = window.setTimeout(() => {
      onRemovalAnimationComplete(order.id);
    }, 280);

    return () => window.clearTimeout(timeout);
  }, [isAnimatingOut, isRemoving, onRemovalAnimationComplete, order.id]);

  const triggerDelete = useCallback(() => {
    const width = cardRef.current?.offsetWidth || 320;
    setIsActionActive(true);
    setDragX(-Math.min(width * 0.65, 320));
    onDeleteRequest(order);
  }, [onDeleteRequest, order]);

  const releasePointer = useCallback(
    (shouldTrigger) => {
      setIsDragging(false);
      pointerRef.current = {
        pointerId: null,
        startX: 0,
        startY: 0,
        hasMoved: false,
      };

      if (shouldTrigger) {
        triggerDelete();
      } else if (!isActionActive) {
        setDragX(0);
      } else if (!isConfirming) {
        setDragX(0);
        setIsActionActive(false);
      }
    },
    [isActionActive, isConfirming, triggerDelete],
  );

  const endDrag = useCallback(
    (event) => {
      if (!isDragging) {
        return;
      }

      const container = cardRef.current;
      if (!container) {
        releasePointer(false);
        return;
      }

      if (event.pointerId != null && frameRef.current) {
        frameRef.current.releasePointerCapture(event.pointerId);
      }

      const width = container.offsetWidth || 1;
      const threshold = width * SWIPE_THRESHOLD;
      const distance = Math.abs(dragX);

      const shouldTrigger = dragX < 0 && distance >= threshold;
      releasePointer(shouldTrigger);
    },
    [dragX, isDragging, releasePointer],
  );

  const handlePointerDown = useCallback((event) => {
    if (isAnimatingOut || isRemoving || isConfirming) {
      return;
    }

    pointerRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      hasMoved: false,
    };

    setIsDragging(true);
    setIsActionActive(false);

    frameRef.current?.setPointerCapture(event.pointerId);
  }, [isAnimatingOut, isConfirming, isRemoving]);

  const handlePointerMove = useCallback(
    (event) => {
      if (!isDragging) {
        return;
      }

      if (event.pointerId !== pointerRef.current.pointerId) {
        return;
      }

      const deltaX = event.clientX - pointerRef.current.startX;
      const deltaY = event.clientY - pointerRef.current.startY;

      if (!pointerRef.current.hasMoved) {
        if (Math.abs(deltaY) > Math.abs(deltaX)) {
          releasePointer(false);
          return;
        }
        pointerRef.current.hasMoved = true;
      }

      setDragX(clampDragX(deltaX));
    },
    [clampDragX, isDragging, releasePointer],
  );

  const handlePointerUp = useCallback(
    (event) => {
      endDrag(event);
    },
    [endDrag],
  );

  const handlePointerCancel = useCallback(
    (event) => {
      endDrag(event);
    },
    [endDrag],
  );

  const iconClass =
    'h-6 w-6 stroke-[1.5] text-red-100 transition-transform duration-300';

  return (
    <div
      ref={frameRef}
      className="relative h-full touch-pan-y select-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      role="presentation"
    >
      <div
        className={`pointer-events-none absolute inset-0 flex items-center justify-end rounded-2xl bg-gradient-to-br from-red-500 to-red-600 px-6 transition-all duration-300 ${
          dragX < 0 || isActionActive || isConfirming
            ? 'opacity-100'
            : 'opacity-0'
        }`}
        aria-hidden
      >
        <div
          className={`flex items-center gap-3 rounded-full bg-red-500/40 px-4 py-2 text-sm font-semibold uppercase tracking-wider text-red-100 shadow-sm backdrop-blur-sm transition duration-300 ${
            dragX < 0 || isActionActive || isConfirming
              ? 'translate-x-0'
              : 'translate-x-4'
          }`}
        >
          <svg
            className={iconClass}
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
          Delete
        </div>
      </div>

      <article
        ref={cardRef}
        className={`group relative flex h-full flex-col rounded-2xl border border-neutral-200 bg-white/90 p-5 shadow-sm transition-[box-shadow,transform,opacity] duration-300 dark:border-neutral-800 dark:bg-neutral-900/80 ${
          isAnimatingOut ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
        style={{
          transform: `translateX(${dragX}px)`,
          transition: isDragging
            ? 'none'
            : 'transform 340ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <header className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-neutral-400 transition-colors duration-300 dark:text-neutral-600">
              Item
            </p>
            <h3 className="text-lg font-semibold text-neutral-900 transition-colors duration-300 dark:text-neutral-50">
              {order.item_name}
            </h3>
          </div>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-colors duration-200 ${status.badgeClass}`}
          >
            {status.label}
          </span>
        </header>

        <section className="mt-4 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-400 transition-colors duration-300 dark:text-neutral-600">
                Total
              </p>
              <p className="text-xl font-semibold text-neutral-900 transition-colors duration-300 dark:text-neutral-50">
                {formatCurrency(order.total_price)}
              </p>
            </div>
            <div className="rounded-2xl border border-dashed border-neutral-200 px-3 py-2 text-right text-xs text-neutral-500 transition-colors duration-300 dark:border-neutral-700 dark:text-neutral-400">
              <p className="font-medium uppercase tracking-wide text-neutral-400 transition-colors duration-300 dark:text-neutral-500">
                Order
              </p>
              <p>{formatDate(order.order_date)}</p>
              <p className="mt-2 font-medium uppercase tracking-wide text-neutral-400 transition-colors duration-300 dark:text-neutral-500">
                Delivery
              </p>
              <p>{formatDate(order.delivery_date)}</p>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-4 text-sm text-neutral-600 transition-colors duration-300 dark:text-neutral-300">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-neutral-400 transition-colors duration-300 dark:text-neutral-500">
                Quantity
              </dt>
              <dd className="mt-1 text-base font-semibold text-neutral-900 transition-colors duration-300 dark:text-neutral-100">
                {order.quantity}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-neutral-400 transition-colors duration-300 dark:text-neutral-500">
                Unit Price
              </dt>
              <dd className="mt-1 text-base font-semibold text-neutral-900 transition-colors duration-300 dark:text-neutral-100">
                {formatCurrency(order.unit_price)}
              </dd>
            </div>
          </dl>
        </section>

        <footer className="mt-auto flex items-center justify-between pt-5">
          <span className="text-xs font-medium uppercase tracking-wide text-neutral-400 transition-colors duration-300 dark:text-neutral-500">
            Swipe Left to Delete
          </span>
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-400 transition-colors duration-300 dark:text-neutral-600">
            Hold & Drag
          </div>
        </footer>
      </article>
    </div>
  );
};

export default PurchaseOrderCard;

