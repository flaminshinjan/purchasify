import React, { useCallback, useMemo } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList as List } from 'react-window';

import PurchaseOrderCard from './PurchaseOrderCard';

const ROW_HEIGHT = 132;
const PREFETCH_THRESHOLD = 12;

const FooterRow = ({ style, isPrefetching, hasMore }) => (
  <div style={style} className="px-4 py-3">
    <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white/60">
      {isPrefetching && hasMore ? (
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border-2 border-blue-500 border-r-transparent animate-spin" />
          <span>Loading more orders…</span>
        </div>
      ) : hasMore ? (
        <span className="text-sm text-gray-500">Scroll to load more orders</span>
      ) : (
        <span className="text-sm text-gray-400">You&apos;ve reached the end</span>
      )}
    </div>
  </div>
);

const Row = ({ index, style, data }) => {
  const { orders, onDelete, hasMore, isPrefetching } = data;

  if (index >= orders.length) {
    return <FooterRow style={style} isPrefetching={isPrefetching} hasMore={hasMore} />;
  }

  const order = orders[index];

  return (
    <div style={style} className="px-3 py-2">
      <PurchaseOrderCard order={order} onDelete={onDelete} />
    </div>
  );
};

const PurchaseOrdersList = ({
  orders,
  hasMore,
  isPrefetching,
  onLoadMore,
  onDelete = () => {},
  height = '65vh',
  minHeight = 420,
}) => {
  const handleItemsRendered = useCallback(
    ({ visibleStopIndex }) => {
      if (!hasMore || orders.length === 0) {
        return;
      }

      if (visibleStopIndex >= orders.length - PREFETCH_THRESHOLD) {
        onLoadMore?.();
      }
    },
    [hasMore, orders.length, onLoadMore],
  );

  const itemData = useMemo(
    () => ({
      orders,
      onDelete,
      hasMore,
      isPrefetching,
    }),
    [orders, onDelete, hasMore, isPrefetching],
  );

  return (
    <div className="bg-gray-50" style={{ height, minHeight }}>
      <AutoSizer>
        {(size) => {
          const listHeight = Reflect.get(size, 'height');
          const listWidth = Reflect.get(size, 'width');
          const HEIGHT_PROP = 'height';
          const WIDTH_PROP = 'width';
          const listDimensions = {
            [HEIGHT_PROP]: listHeight,
            [WIDTH_PROP]: listWidth,
          };
          return (
            <List
              {...listDimensions}
              itemCount={orders.length + (hasMore ? 1 : 0)}
              itemSize={ROW_HEIGHT}
              onItemsRendered={handleItemsRendered}
              overscanCount={8}
              itemData={itemData}
            >
              {Row}
            </List>
          );
        }}
      </AutoSizer>
    </div>
  );
};

export default PurchaseOrdersList;

