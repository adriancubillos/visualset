import { useState, useEffect } from 'react';

/**
 * Hook that debounces a value and returns the debounced version
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook that provides debounced search functionality with immediate input value and debounced callback
 * @param onSearch - Callback function to call with debounced search value
 * @param delay - The delay in milliseconds (default: 300)
 * @param initialValue - Initial search value (default: '')
 * @returns Object with searchValue and updateSearch function
 */
export function useDebouncedSearch(onSearch: (value: string) => void, delay: number = 300, initialValue: string = '') {
  const [searchValue, setSearchValue] = useState(initialValue);
  const debouncedSearchValue = useDebounce(searchValue, delay);

  // Call the search callback when debounced value changes
  useEffect(() => {
    onSearch(debouncedSearchValue);
  }, [debouncedSearchValue, onSearch]);

  return {
    searchValue,
    updateSearch: setSearchValue,
  };
}
