'use client';

import FilterSelect from './FilterSelect';

interface SearchFilterProps {
  placeholder?: string;
  initialSearch?: string;
  initialFilters?: Record<string, string>;
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
  initialSearch = '',
  initialFilters = {},
  onSearch,
  filters = [],
  onFilterChange,
}: SearchFilterProps) {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearch(e.target.value);
  };

  const handleFilterChange = (key: string, value: string) => {
    if (!onFilterChange) return;

    const newFilters = { ...initialFilters };
    if (value === '' || value === 'all') {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }
    onFilterChange(newFilters);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 lg:flex-initial lg:min-w-0 lg:w-80">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
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
              className="block w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg text-sm leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-colors duration-200"
              placeholder={placeholder}
              value={initialSearch}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row lg:flex-wrap gap-3 lg:flex-1">
          {filters.map((filter) => (
            <div
              key={filter.key}
              className="min-w-0 flex-1 sm:flex-none sm:min-w-48 lg:min-w-52">
              <FilterSelect
                value={initialFilters[filter.key] || 'all'}
                onChange={(value) => handleFilterChange(filter.key, value)}
                options={filter.options.map((opt) => ({ id: opt.value, name: opt.label }))}
                allLabel={filter.label}
                compact={true}
              />
            </div>
          ))}
        </div>
      </div>

      {Object.keys(initialFilters).length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex flex-wrap gap-2">
            {Object.entries(initialFilters).map(([key, value]) => {
              const filter = filters.find((f) => f.key === key);
              const option = filter?.options.find((o) => o.value === value);
              if (!value || value === 'all') return null;
              return (
                <span
                  key={key}
                  className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                  <span className="font-medium">{filter?.label}:</span>
                  <span className="ml-1">{option?.label}</span>
                  <button
                    type="button"
                    className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full text-blue-600 hover:bg-blue-200 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors duration-150"
                    onClick={() => handleFilterChange(key, '')}
                    aria-label={`Remove ${filter?.label} filter`}>
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
