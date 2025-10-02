'use client';

import { Suspense } from 'react';

interface FilteredPageWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

function DefaultFallback() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded mb-4"></div>
      <div className="h-32 bg-gray-200 rounded mb-4"></div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}

export default function FilteredPageWrapper({ children, fallback }: FilteredPageWrapperProps) {
  return <Suspense fallback={fallback || <DefaultFallback />}>{children}</Suspense>;
}
