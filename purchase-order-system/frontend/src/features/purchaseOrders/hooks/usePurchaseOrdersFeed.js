import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { fetchPurchaseOrdersCursor } from '../api/purchaseOrdersApi';

const INITIAL_CURSOR_KEY = '__initial__';

const usePurchaseOrdersFeed = ({ pageSize = 50 } = {}) => {
  const [items, setItems] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isPrefetching, setIsPrefetching] = useState(false);
  const [error, setError] = useState(null);

  const cacheRef = useRef(new Map());
  const inFlightRef = useRef(new Set());

  const mergeItems = useCallback((page, { append }) => {
    setItems((prev) => {
      if (!append) {
        return [...page.items];
      }

      if (page.items.length === 0) {
        return prev;
      }

      const existing = new Map(prev.map((item) => [item.id, item]));
      const combined = [...prev];

      page.items.forEach((item) => {
        if (existing.has(item.id)) {
          const idx = combined.findIndex((entry) => entry.id === item.id);
          combined[idx] = item;
        } else {
          combined.push(item);
        }
      });

      return combined;
    });

    setNextCursor(page.next_cursor ?? null);
    setHasMore(Boolean(page.has_more && page.next_cursor));
  }, []);

  const fetchPage = useCallback(
    async (cursor, { append, force = false } = {}) => {
      const cacheKey = cursor ?? INITIAL_CURSOR_KEY;
      if (!force && cacheRef.current.has(cacheKey)) {
        mergeItems(cacheRef.current.get(cacheKey), { append });
        return;
      }

      if (inFlightRef.current.has(cacheKey)) {
        return;
      }

      inFlightRef.current.add(cacheKey);
      const isInitialRequest = cacheKey === INITIAL_CURSOR_KEY && !append;
      setError(null);
      isInitialRequest ? setIsInitialLoading(true) : setIsPrefetching(true);

      try {
        const page = await fetchPurchaseOrdersCursor({
          cursor,
          limit: pageSize,
        });

        cacheRef.current.set(cacheKey, page);
        mergeItems(page, { append });
      } catch (err) {
        setError('Failed to load purchase orders.');
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.error('[usePurchaseOrdersFeed] fetch error', err);
        }
      } finally {
        inFlightRef.current.delete(cacheKey);
        isInitialRequest ? setIsInitialLoading(false) : setIsPrefetching(false);
      }
    },
    [mergeItems, pageSize],
  );

  useEffect(() => {
    fetchPage(null, { append: false, force: true });
  }, [fetchPage]);

  const prefetchNext = useCallback(() => {
    if (!hasMore || !nextCursor) {
      return;
    }
    fetchPage(nextCursor, { append: true });
  }, [fetchPage, hasMore, nextCursor]);

  const removeOrder = useCallback((id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));

    cacheRef.current = new Map(
      Array.from(cacheRef.current.entries()).map(([key, page]) => [
        key,
        page
          ? {
              ...page,
              items: page.items.filter((item) => item.id !== id),
            }
          : page,
      ]),
    );
  }, []);

  const reset = useCallback(async () => {
    cacheRef.current.clear();
    setItems([]);
    setNextCursor(null);
    setHasMore(true);
    await fetchPage(null, { append: false, force: true });
  }, [fetchPage]);

  return useMemo(
    () => ({
      items,
      isInitialLoading,
      isPrefetching,
      error,
      hasMore,
      prefetchNext,
      removeOrder,
      reset,
      setError,
    }),
    [
      items,
      isInitialLoading,
      isPrefetching,
      error,
      hasMore,
      prefetchNext,
      removeOrder,
      reset,
    ],
  );
};

export default usePurchaseOrdersFeed;

