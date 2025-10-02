import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback } from 'react';

interface UseSimpleFiltersOptions {
  defaultFilters?: Record<string, string>;
}

export function useSimpleFilters({ defaultFilters = {} }: UseSimpleFiltersOptions = {}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Get current state directly from URL (single source of truth)
  const search = searchParams.get('search') || '';
  const filters = Object.keys(defaultFilters).reduce((acc, key) => {
    acc[key] = searchParams.get(key) || defaultFilters[key] || '';
    return acc;
  }, {} as Record<string, string>);

  // Update URL (which automatically updates component)
  const updateUrl = useCallback(
    (newParams: Record<string, string>) => {
      const params = new URLSearchParams();

      Object.entries(newParams).forEach(([key, value]) => {
        if (value && value !== 'all' && value !== '') {
          params.set(key, value);
        }
      });

      const queryString = params.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
      router.replace(newUrl, { scroll: false });
    },
    [router, pathname],
  );

  const updateSearch = useCallback(
    (newSearch: string) => {
      updateUrl({ ...filters, search: newSearch });
    },
    [filters, updateUrl],
  );

  const updateFilters = useCallback(
    (newFilters: Record<string, string>) => {
      updateUrl({ search, ...newFilters });
    },
    [search, updateUrl],
  );

  const clearAll = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [router, pathname]);

  const hasActiveFilters = Object.values(filters).some((v) => v && v !== 'all') || Boolean(search);

  return {
    search,
    filters,
    updateSearch,
    updateFilters,
    clearAll,
    hasActiveFilters,
  };
}
