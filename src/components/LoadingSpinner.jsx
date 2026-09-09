import React from 'react';

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-6">
      <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default LoadingSpinner;
