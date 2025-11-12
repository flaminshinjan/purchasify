import React, { useEffect } from 'react';

const Toast = ({ toast, onDismiss = () => {}, duration = 3200 }) => {
  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      onDismiss();
    }, duration);

    return () => window.clearTimeout(timeout);
  }, [duration, onDismiss, toast]);

  if (!toast) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-8 z-[70] flex justify-center px-4 sm:inset-x-auto sm:right-8 sm:justify-end">
      <div className="pointer-events-auto flex w-full max-w-sm items-start gap-4 rounded-2xl border border-neutral-200 bg-white/95 p-4 shadow-xl shadow-neutral-900/10 backdrop-blur-md transition-all duration-300 dark:border-neutral-800 dark:bg-neutral-900/80">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10 text-green-600 dark:bg-green-400/15 dark:text-green-300">
          <svg
            className="h-5 w-5 stroke-[1.6]"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 12.5l4.5 4L19 7.5"
            />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
            {toast.title}
          </p>
          {toast.description ? (
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
              {toast.description}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 transition-colors duration-200 hover:bg-neutral-200/60 hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:text-neutral-500 dark:hover:bg-neutral-800/60 dark:hover:text-neutral-200 dark:focus-visible:ring-neutral-600 dark:focus-visible:ring-offset-neutral-900"
        >
          <span className="sr-only">Dismiss notification</span>
          <svg
            className="h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M7 7l10 10m0-10L7 17"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Toast;

