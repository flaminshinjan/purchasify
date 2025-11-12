import React from 'react';

const EmptyState = () => (
  <div className="flex h-full flex-col items-center justify-center gap-3 py-24 text-center text-gray-500">
    <p className="text-base font-medium">No purchase orders yet.</p>
    <p className="text-sm">Create a new purchase order to get started.</p>
  </div>
);

export default EmptyState;

