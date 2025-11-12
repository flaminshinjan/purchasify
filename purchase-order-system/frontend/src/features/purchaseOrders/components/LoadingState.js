import React from 'react';

const LoadingState = ({ label }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-12 text-gray-600">
    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border-4 border-blue-600 border-r-transparent animate-spin" />
    {label ? <p className="text-sm">{label}</p> : null}
  </div>
);

export default LoadingState;

