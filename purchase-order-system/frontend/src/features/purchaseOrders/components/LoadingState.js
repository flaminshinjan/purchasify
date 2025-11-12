import React from 'react';

const LoadingState = ({ label }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-12 text-neutral-600 transition-colors duration-300 dark:text-neutral-400">
    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border-4 border-neutral-600 border-r-transparent animate-spin transition-colors duration-300 dark:border-neutral-500" />
    {label ? <p className="text-sm">{label}</p> : null}
  </div>
);

export default LoadingState;

