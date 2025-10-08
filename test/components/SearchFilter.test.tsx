import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchFilter from '@/components/ui/SearchFilter';

// Mock FilterSelect component
vi.mock('@/components/ui/FilterSelect', () => ({
  default: ({ value, onChange, options, allLabel }: any) => (
    <select
      data-testid="filter-select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={allLabel}
    >
      <option value="all">{allLabel}</option>
      {options.map((opt: any) => (
        <option key={opt.id} value={opt.id}>
          {opt.name}
        </option>
      ))}
    </select>
  ),
}));

describe('SearchFilter', () => {
  const mockOnSearch = vi.fn();
  const mockOnFilterChange = vi.fn();
  const mockClearAll = vi.fn();

  const mockFilters = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
      ],
    },
    {
      key: 'priority',
      label: 'Priority',
      options: [
        { value: 'high', label: 'High' },
        { value: 'low', label: 'Low' },
      ],
    },
  ];

  beforeEach(() => {
    mockOnSearch.mockClear();
    mockOnFilterChange.mockClear();
    mockClearAll.mockClear();
  });

  it('renders search input with default placeholder', () => {
    render(<SearchFilter onSearch={mockOnSearch} />);
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  it('renders search input with custom placeholder', () => {
    render(<SearchFilter onSearch={mockOnSearch} placeholder="Search items..." />);
    expect(screen.getByPlaceholderText('Search items...')).toBeInTheDocument();
  });

  it('displays search value', () => {
    render(<SearchFilter onSearch={mockOnSearch} searchValue="test query" />);
    const input = screen.getByPlaceholderText('Search...') as HTMLInputElement;
    expect(input.value).toBe('test query');
  });

  it('calls onSearch when typing in search input', async () => {
    const user = userEvent.setup();
    render(<SearchFilter onSearch={mockOnSearch} />);
    
    const input = screen.getByPlaceholderText('Search...');
    await user.type(input, 't');
    
    expect(mockOnSearch).toHaveBeenCalledWith('t');
  });

  it('shows clear search button when searchValue is not empty', () => {
    render(<SearchFilter onSearch={mockOnSearch} searchValue="test" />);
    const clearButton = screen.getByLabelText('Clear search');
    expect(clearButton).toBeInTheDocument();
  });

  it('does not show clear search button when searchValue is empty', () => {
    render(<SearchFilter onSearch={mockOnSearch} searchValue="" />);
    const clearButton = screen.queryByLabelText('Clear search');
    expect(clearButton).not.toBeInTheDocument();
  });

  it('clears search when clear button is clicked', async () => {
    const user = userEvent.setup();
    render(<SearchFilter onSearch={mockOnSearch} searchValue="test" />);
    
    const clearButton = screen.getByLabelText('Clear search');
    await user.click(clearButton);
    
    expect(mockOnSearch).toHaveBeenCalledWith('');
  });

  it('renders filter selects', () => {
    render(<SearchFilter onSearch={mockOnSearch} filters={mockFilters} />);
    
    expect(screen.getByLabelText('Status')).toBeInTheDocument();
    expect(screen.getByLabelText('Priority')).toBeInTheDocument();
  });

  it('calls onFilterChange when filter is changed', async () => {
    const user = userEvent.setup();
    render(
      <SearchFilter
        onSearch={mockOnSearch}
        filters={mockFilters}
        onFilterChange={mockOnFilterChange}
        filterValues={{}}
      />
    );
    
    const statusFilter = screen.getByLabelText('Status');
    await user.selectOptions(statusFilter, 'active');
    
    expect(mockOnFilterChange).toHaveBeenCalledWith({ status: 'active' });
  });

  it('clears filter when "all" is selected', async () => {
    const user = userEvent.setup();
    render(
      <SearchFilter
        onSearch={mockOnSearch}
        filters={mockFilters}
        onFilterChange={mockOnFilterChange}
        filterValues={{ status: 'active' }}
      />
    );
    
    const statusFilter = screen.getByLabelText('Status');
    await user.selectOptions(statusFilter, 'all');
    
    expect(mockOnFilterChange).toHaveBeenCalledWith({ status: '' });
  });

  it('displays active filter tags', () => {
    const { container } = render(
      <SearchFilter
        onSearch={mockOnSearch}
        filters={mockFilters}
        filterValues={{ status: 'active', priority: 'high' }}
      />
    );
    
    expect(screen.getByText('Status:')).toBeInTheDocument();
    expect(screen.getByText('Priority:')).toBeInTheDocument();
    // Check for filter tags (not select options)
    const filterTags = container.querySelectorAll('.bg-blue-100');
    expect(filterTags).toHaveLength(2);
  });

  it('does not display filter tags for empty values', () => {
    render(
      <SearchFilter
        onSearch={mockOnSearch}
        filters={mockFilters}
        filterValues={{ status: '', priority: 'all' }}
      />
    );
    
    expect(screen.queryByText('Status:')).not.toBeInTheDocument();
    expect(screen.queryByText('Priority:')).not.toBeInTheDocument();
  });

  it('removes filter tag when × button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <SearchFilter
        onSearch={mockOnSearch}
        filters={mockFilters}
        onFilterChange={mockOnFilterChange}
        filterValues={{ status: 'active' }}
      />
    );
    
    const removeButton = screen.getByLabelText('Remove Status filter');
    await user.click(removeButton);
    
    expect(mockOnFilterChange).toHaveBeenCalledWith({ status: '' });
  });

  it('shows "Clear filters" button when there are active filters', () => {
    render(
      <SearchFilter
        onSearch={mockOnSearch}
        filters={mockFilters}
        filterValues={{ status: 'active' }}
        clearAll={mockClearAll}
      />
    );
    
    expect(screen.getByText('Clear filters')).toBeInTheDocument();
  });

  it('does not show "Clear filters" button when there are no active filters', () => {
    render(
      <SearchFilter
        onSearch={mockOnSearch}
        filters={mockFilters}
        filterValues={{ status: '' }}
        clearAll={mockClearAll}
      />
    );
    
    expect(screen.queryByText('Clear filters')).not.toBeInTheDocument();
  });

  it('calls clearAll when "Clear filters" button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <SearchFilter
        onSearch={mockOnSearch}
        filters={mockFilters}
        filterValues={{ status: 'active' }}
        clearAll={mockClearAll}
      />
    );
    
    const clearButton = screen.getByText('Clear filters');
    await user.click(clearButton);
    
    expect(mockClearAll).toHaveBeenCalled();
  });

  it('does not show "Clear filters" button when clearAll is not provided', () => {
    render(
      <SearchFilter
        onSearch={mockOnSearch}
        filters={mockFilters}
        filterValues={{ status: 'active' }}
      />
    );
    
    expect(screen.queryByText('Clear filters')).not.toBeInTheDocument();
  });

  it('renders search icon', () => {
    const { container } = render(<SearchFilter onSearch={mockOnSearch} />);
    const searchIcon = container.querySelector('svg');
    expect(searchIcon).toBeInTheDocument();
  });

  it('does not call onFilterChange when it is not provided', async () => {
    const user = userEvent.setup();
    render(<SearchFilter onSearch={mockOnSearch} filters={mockFilters} />);
    
    const statusFilter = screen.getByLabelText('Status');
    await user.selectOptions(statusFilter, 'active');
    
    // Should not throw error
    expect(mockOnFilterChange).not.toHaveBeenCalled();
  });

  it('handles multiple active filters', () => {
    render(
      <SearchFilter
        onSearch={mockOnSearch}
        filters={mockFilters}
        filterValues={{ status: 'active', priority: 'high' }}
        clearAll={mockClearAll}
      />
    );
    
    const tags = screen.getAllByRole('button', { name: /Remove .* filter/ });
    expect(tags).toHaveLength(2);
    expect(screen.getByText('Clear filters')).toBeInTheDocument();
  });
});
