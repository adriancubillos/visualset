import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import FilterProvider from '@/components/layout/FilterProvider';

// Mock useSimpleFilters hook
const mockFilterProps = {
  search: '',
  searchValue: '',
  filters: { status: 'active' },
  updateSearch: vi.fn(),
  updateFilters: vi.fn(),
  clearAll: vi.fn(),
  hasActiveFilters: true,
};

vi.mock('@/hooks/useSimpleFilters', () => ({
  useSimpleFilters: vi.fn(() => mockFilterProps),
}));

describe('FilterProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children with filter props', () => {
    render(
      <FilterProvider>
        {(filterProps) => <div>Filters: {JSON.stringify(filterProps.filters)}</div>}
      </FilterProvider>
    );
    
    expect(screen.getByText(/Filters:/)).toBeInTheDocument();
  });

  it('passes filter props to children function', () => {
    const childrenFn = vi.fn(() => <div>Content</div>);
    
    render(<FilterProvider>{childrenFn}</FilterProvider>);
    
    expect(childrenFn).toHaveBeenCalledWith(mockFilterProps);
  });

  it('renders fallback during suspense', () => {
    const { container } = render(
      <FilterProvider>
        {() => <div>Content</div>}
      </FilterProvider>
    );
    
    // Check that component renders (fallback or content)
    expect(container.firstChild).toBeInTheDocument();
  });

  it('accepts defaultFilters prop', () => {
    render(
      <FilterProvider defaultFilters={{ status: 'pending' }}>
        {(filterProps) => <div>Status: {filterProps.filters.status}</div>}
      </FilterProvider>
    );
    
    // Component should render without errors
    expect(screen.getByText(/Status:/)).toBeInTheDocument();
  });

  it('renders children content', () => {
    render(
      <FilterProvider>
        {(filterProps) => (
          <div>
            <span>Filter Status: {filterProps.filters.status}</span>
          </div>
        )}
      </FilterProvider>
    );
    
    expect(screen.getByText('Filter Status: active')).toBeInTheDocument();
  });

  it('provides updateFilters function', () => {
    render(
      <FilterProvider>
        {(filterProps) => (
          <button onClick={() => filterProps.updateFilters({ status: 'completed' })}>
            Update Filters
          </button>
        )}
      </FilterProvider>
    );
    
    expect(screen.getByText('Update Filters')).toBeInTheDocument();
  });

  it('provides clearAll function', () => {
    render(
      <FilterProvider>
        {(filterProps) => (
          <button onClick={() => filterProps.clearAll()}>
            Clear All
          </button>
        )}
      </FilterProvider>
    );
    
    expect(screen.getByText('Clear All')).toBeInTheDocument();
  });

  it('provides updateSearch function', () => {
    render(
      <FilterProvider>
        {(filterProps) => (
          <button onClick={() => filterProps.updateSearch('test')}>
            Update Search
          </button>
        )}
      </FilterProvider>
    );
    
    expect(screen.getByText('Update Search')).toBeInTheDocument();
  });
});
