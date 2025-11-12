import apiClient from '../../../api/client';

export const fetchPurchaseOrdersCursor = async ({ cursor, limit, signal }) => {
  const params = { limit };
  if (cursor) {
    params.cursor = cursor;
  }

  const response = await apiClient.get('/api/purchase-orders/cursor', {
    params,
    signal,
  });
  return response.data;
};

export const createPurchaseOrder = async (payload) => {
  const response = await apiClient.post('/api/purchase-orders', payload);
  return response.data;
};

export const deletePurchaseOrder = async (id) => {
  await apiClient.delete(`/api/purchase-orders/${id}`);
};

