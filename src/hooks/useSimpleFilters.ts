import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback, useEffect } from 'react';

interface UseSimpleFiltersOptions {
  defaultFilters?: Record<string, string>;
}

export function useSimpleFilters({ defaultFilters = {} }: UseSimpleFiltersOptions = {}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Check if we should restore filter state from sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && !searchParams.toString()) {
      const storedParams = sessionStorage.getItem(`filters_${pathname}`);
      if (storedParams) {
        const newUrl = `${pathname}?${storedParams}`;
        router.replace(newUrl, { scroll: false });
        return;
      }
    }
  }, [pathname, searchParams, router]);

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

      // Add all provided params
      Object.entries(newParams).forEach(([key, value]) => {
        if (value && value !== 'all' && value !== '') {
          params.set(key, value);
        }
      });

      const queryString = params.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;

      // Save current filter state to sessionStorage
      if (typeof window !== 'undefined') {
        if (queryString) {
          sessionStorage.setItem(`filters_${pathname}`, queryString);
        } else {
          sessionStorage.removeItem(`filters_${pathname}`);
        }
      }

      // Use push instead of replace to create history entries
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
    // Clear sessionStorage to prevent restoration
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(`filters_${pathname}`);
    }
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
