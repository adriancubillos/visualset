import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useDebounce } from './useDebounce';

interface UseSimpleFiltersOptions {
  defaultFilters?: Record<string, string>;
}

export function useSimpleFilters({ defaultFilters = {} }: UseSimpleFiltersOptions = {}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Local search state (not persisted in URL)
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);

  // Check if we should restore filter state from sessionStorage (filters only, not search)
  useEffect(() => {
    if (typeof window !== 'undefined' && !searchParams.toString()) {
      const storedParams = sessionStorage.getItem(`filters_${pathname}`);
      if (storedParams) {
        // Only restore filter params, not search
        const params = new URLSearchParams(storedParams);
        params.delete('search'); // Remove search if it was stored
        const filterQueryString = params.toString();
        if (filterQueryString) {
          const newUrl = `${pathname}?${filterQueryString}`;
          router.replace(newUrl, { scroll: false });
        }
        return;
      }
    }
  }, [pathname, searchParams, router]);

  // Get current filter state directly from URL (single source of truth for filters)
  const filters = Object.keys(defaultFilters).reduce((acc, key) => {
    acc[key] = searchParams.get(key) || defaultFilters[key] || '';
    return acc;
  }, {} as Record<string, string>);

  // Update URL for filters only (search is handled locally)
  const updateUrl = useCallback(
    (newFilters: Record<string, string>) => {
      const params = new URLSearchParams();

      // Add only filter params, not search
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value && value !== 'all' && value !== '') {
          params.set(key, value);
        }
      });

      const queryString = params.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;

      // Save current filter state to sessionStorage (filters only)
      if (typeof window !== 'undefined') {
        if (queryString) {
          sessionStorage.setItem(`filters_${pathname}`, queryString);
        } else {
          sessionStorage.removeItem(`filters_${pathname}`);
        }
      }

      router.replace(newUrl, { scroll: false });
    },
    [router, pathname],
  );

  const updateFilters = useCallback(
    (newFilters: Record<string, string>) => {
      updateUrl(newFilters);
    },
    [updateUrl],
  );

  const updateSearch = useCallback((newSearch: string) => {
    setSearchInput(newSearch);
  }, []);

  const clearAll = useCallback(() => {
    // Clear search state
    setSearchInput('');
    // Clear filter sessionStorage and URL
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(`filters_${pathname}`);
    }
    router.replace(pathname, { scroll: false });
  }, [router, pathname]);

  const hasActiveFilters = Object.values(filters).some((v) => v && v !== 'all');

  return {
    search: debouncedSearch, // Return debounced search for filtering
    searchValue: searchInput, // Immediate search value for input display
    filters,
    updateSearch,
    updateFilters,
    clearAll,
    hasActiveFilters,
  };
}
