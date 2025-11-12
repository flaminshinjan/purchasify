export const ORDER_STATUS = {
  DELIVERED: 'delivered',
  UPCOMING: 'upcoming',
  IN_PROCESS: 'in_process',
  SCHEDULED: 'scheduled',
};

const baseMeta = {
  [ORDER_STATUS.DELIVERED]: {
    label: 'Delivered',
    badgeClass:
      'bg-neutral-300 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200',
  },
  [ORDER_STATUS.UPCOMING]: {
    label: 'Upcoming',
    badgeClass:
      'bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300',
  },
  [ORDER_STATUS.IN_PROCESS]: {
    label: 'In Process',
    badgeClass:
      'bg-neutral-300 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200',
  },
  [ORDER_STATUS.SCHEDULED]: {
    label: 'Scheduled',
    badgeClass:
      'bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300',
  },
};

export const getOrderStatus = (order) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const orderDate = new Date(order.order_date);
  const deliveryDate = new Date(order.delivery_date);

  const hasInvalidDates =
    Number.isNaN(orderDate.getTime()) || Number.isNaN(deliveryDate.getTime());

  if (hasInvalidDates) {
    return ORDER_STATUS.SCHEDULED;
  }

  if (deliveryDate < today) {
    return ORDER_STATUS.DELIVERED;
  }

  if (orderDate > today) {
    return ORDER_STATUS.UPCOMING;
  }

  return ORDER_STATUS.IN_PROCESS;
};

export const getOrderStatusMeta = (status) => baseMeta[status] ?? baseMeta[ORDER_STATUS.SCHEDULED];
