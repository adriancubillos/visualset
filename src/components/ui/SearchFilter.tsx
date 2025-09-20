'use client';

import { useState, useEffect } from 'react';

interface SearchFilterProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  filters?: Array<{
    key: string;
    label: string;
    options: Array<{ value: string; label: string }>;
  }>;
  onFilterChange?: (filters: Record<string, string>) => void;
}

export default function SearchFilter({
  placeholder = 'Search...',
  onSearch,
  filters = [],
  onFilterChange,
}: SearchFilterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

  // Check if current filter selections are still valid when filter options change
  // Only clear filters that have become invalid (their selected value is no longer in options)
  useEffect(() => {
    let filtersChanged = false;
    const newActiveFilters = { ...activeFilters };

    filters.forEach((filter) => {
      const currentValue = activeFilters[filter.key];
      // Only clear if there's a current value AND it's not available in the current options
      if (currentValue && filter.options.length > 0 && !filter.options.some((option) => option.value === currentValue)) {
        // Current selection is no longer available in options, clear it
        delete newActiveFilters[filter.key];
        filtersChanged = true;
      }
    });

    if (filtersChanged) {
      setActiveFilters(newActiveFilters);
      onFilterChange?.(newActiveFilters);
    }
  }, [filters, activeFilters, onFilterChange]);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    onSearch(query);
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...activeFilters, [key]: value };
    if (value === '') {
      delete newFilters[key];
    }
    setActiveFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder={placeholder}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
        </div>

        {/* Filters */}
        {filters.map((filter) => (
          <div
            key={filter.key}
            className="min-w-0 flex-1 sm:flex-none sm:w-48">
            <select
              className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              value={activeFilters[filter.key] || ''}
              onChange={(e) => handleFilterChange(filter.key, e.target.value)}>
              <option value="">{filter.label}</option>
              {filter.options.map((option) => (
                <option
                  key={option.value}
                  value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* Active Filters Display */}
      {Object.keys(activeFilters).length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(activeFilters).map(([key, value]) => {
            const filter = filters.find((f) => f.key === key);
            const option = filter?.options.find((o) => o.value === value);
            return (
              <span
                key={key}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                {filter?.label}: {option?.label}
                <button
                  type="button"
                  className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-600"
                  onClick={() => handleFilterChange(key, '')}>
                  ×
                </button>
              </span>
            );
          })}
          <button
            type="button"
            className="text-sm text-gray-500 hover:text-gray-700 underline"
            onClick={() => {
              setActiveFilters({});
              onFilterChange?.({});
            }}>
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
