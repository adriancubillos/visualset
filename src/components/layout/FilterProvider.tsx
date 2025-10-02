'use client';

import { Suspense } from 'react';
import { useSimpleFilters } from '@/hooks/useSimpleFilters';

interface FilterProviderProps {
  children: (filterProps: ReturnType<typeof useSimpleFilters>) => React.ReactNode;
  defaultFilters?: Record<string, string>;
}

function FilterLogic({ children, defaultFilters }: FilterProviderProps) {
  const filterProps = useSimpleFilters({ defaultFilters });
  return <>{children(filterProps)}</>;
}

function FilterFallback() {
  return (
    <div className="animate-pulse">
      <div className="h-12 bg-gray-200 rounded mb-6"></div>
    </div>
  );
}

export default function FilterProvider({ children, defaultFilters }: FilterProviderProps) {
  return (
    <Suspense fallback={<FilterFallback />}>
      <FilterLogic defaultFilters={defaultFilters}>{children}</FilterLogic>
    </Suspense>
  );
}
