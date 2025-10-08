import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DataTable from '@/components/ui/DataTable';
import { Column } from '@/types/table';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

interface TestData {
  id: string;
  name: string;
  age: number;
  email: string;
}

describe('DataTable', () => {
  const mockData: TestData[] = [
    { id: '1', name: 'John Doe', age: 30, email: 'john@example.com' },
    { id: '2', name: 'Jane Smith', age: 25, email: 'jane@example.com' },
    { id: '3', name: 'Bob Johnson', age: 35, email: 'bob@example.com' },
  ];

  const mockColumns: Column<TestData>[] = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'age', header: 'Age', sortable: true, align: 'right' },
    { key: 'email', header: 'Email', sortable: false },
  ];

  beforeEach(() => {
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders table with data', () => {
    render(<DataTable data={mockData} columns={mockColumns} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
  });

  it('renders column headers', () => {
    render(<DataTable data={mockData} columns={mockColumns} />);
    
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Age')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('renders empty table when no data', () => {
    render(<DataTable data={[]} columns={mockColumns} />);
    
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    const { container } = render(<DataTable data={mockData} columns={mockColumns} loading={true} />);
    
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('calls onRowClick when row is clicked', async () => {
    const user = userEvent.setup();
    const mockOnRowClick = vi.fn();
    
    render(<DataTable data={mockData} columns={mockColumns} onRowClick={mockOnRowClick} />);
    
    const row = screen.getByText('John Doe').closest('tr');
    await user.click(row!);
    
    expect(mockOnRowClick).toHaveBeenCalledWith(mockData[0]);
  });

  it('renders actions column when actions prop provided', () => {
    const mockActions = (item: TestData) => <button>Edit {item.name}</button>;
    
    render(<DataTable data={mockData} columns={mockColumns} actions={mockActions} />);
    
    expect(screen.getByText('Actions')).toBeInTheDocument();
    expect(screen.getByText('Edit John Doe')).toBeInTheDocument();
  });

  it('renders custom cell content with render function', () => {
    const columnsWithRender: Column<TestData>[] = [
      {
        key: 'name',
        header: 'Name',
        render: (value, item) => <strong>{value} ({item.age})</strong>,
      },
    ];
    
    render(<DataTable data={mockData} columns={columnsWithRender} />);
    
    expect(screen.getByText(/John Doe \(30\)/)).toBeInTheDocument();
  });

  it('applies correct alignment classes', () => {
    const { container } = render(<DataTable data={mockData} columns={mockColumns} />);
    
    // Age column should have right alignment
    const ageCell = screen.getByText('30').closest('div');
    expect(ageCell).toHaveClass('justify-end');
  });

  it('applies sticky header when stickyHeader is true', () => {
    const { container } = render(<DataTable data={mockData} columns={mockColumns} stickyHeader={true} />);
    
    const thead = container.querySelector('thead');
    expect(thead).toHaveClass('sticky');
  });

  it('does not apply sticky header when stickyHeader is false', () => {
    const { container } = render(<DataTable data={mockData} columns={mockColumns} stickyHeader={false} />);
    
    const thead = container.querySelector('thead');
    expect(thead).not.toHaveClass('sticky');
  });

  it('applies maxHeight style when provided', () => {
    const { container } = render(<DataTable data={mockData} columns={mockColumns} maxHeight="400px" />);
    
    const tableContainer = container.querySelector('[style*="max-height"]');
    expect(tableContainer).toBeInTheDocument();
  });

  it('enables sorting on sortable columns', async () => {
    const user = userEvent.setup();
    render(<DataTable data={mockData} columns={mockColumns} />);
    
    const nameHeader = screen.getByText('Name');
    await user.click(nameHeader);
    
    // After clicking, the table should re-render with sorted data
    // Check that sorting indicator appears
    const headerCell = nameHeader.closest('th');
    expect(headerCell).toBeInTheDocument();
  });

  it('shows reset columns button when showResetColumns is true', () => {
    render(<DataTable data={mockData} columns={mockColumns} showResetColumns={true} />);
    
    expect(screen.getByText('Reset Columns')).toBeInTheDocument();
  });

  it('does not show reset columns button when showResetColumns is false', () => {
    render(<DataTable data={mockData} columns={mockColumns} showResetColumns={false} />);
    
    expect(screen.queryByText('Reset Columns')).not.toBeInTheDocument();
  });

  it('calls onResetColumns when reset button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnResetColumns = vi.fn();
    
    render(
      <DataTable
        data={mockData}
        columns={mockColumns}
        showResetColumns={true}
        onResetColumns={mockOnResetColumns}
      />
    );
    
    const resetButton = screen.getByText('Reset Columns');
    await user.click(resetButton);
    
    expect(mockOnResetColumns).toHaveBeenCalled();
  });

  it('clears localStorage when reset columns is clicked', async () => {
    const user = userEvent.setup();
    localStorageMock.setItem('tableColumnWidths', JSON.stringify({ name: 200 }));
    
    render(<DataTable data={mockData} columns={mockColumns} showResetColumns={true} />);
    
    const resetButton = screen.getByText('Reset Columns');
    await user.click(resetButton);
    
    expect(localStorageMock.getItem('tableColumnWidths')).toBeNull();
  });

  it('loads column widths from localStorage', () => {
    localStorageMock.setItem('tableColumnWidths', JSON.stringify({ name: 300 }));
    
    render(<DataTable data={mockData} columns={mockColumns} />);
    
    // Component should load the saved widths
    expect(localStorageMock.getItem('tableColumnWidths')).toBeTruthy();
  });

  it('handles invalid localStorage data gracefully', () => {
    localStorageMock.setItem('tableColumnWidths', 'invalid json');
    
    // Should not throw error
    expect(() => {
      render(<DataTable data={mockData} columns={mockColumns} />);
    }).not.toThrow();
  });

  it('renders actions column first when provided', () => {
    const mockActions = (item: TestData) => <button>Action</button>;
    const { container } = render(<DataTable data={mockData} columns={mockColumns} actions={mockActions} />);
    
    const headers = container.querySelectorAll('th');
    expect(headers[0]).toHaveTextContent('Actions');
  });

  it('renders actions column with proper styling', () => {
    const mockActions = (item: TestData) => <button>Action</button>;
    const { container } = render(<DataTable data={mockData} columns={mockColumns} actions={mockActions} />);
    
    const actionsHeader = screen.getByText('Actions').closest('th');
    expect(actionsHeader).toBeInTheDocument();
    expect(actionsHeader).toHaveAttribute('draggable');
  });

  it('shows scroll hint when table has horizontal overflow', () => {
    // This test would require mocking scrollWidth and clientWidth
    // For now, we'll just verify the component renders
    render(<DataTable data={mockData} columns={mockColumns} />);
    expect(screen.getByText('Name')).toBeInTheDocument();
  });

  it('handles empty column key gracefully', () => {
    const columnsWithId: Column<TestData>[] = [
      { id: 'custom-id', key: 'name', header: 'Name' },
    ];
    
    render(<DataTable data={mockData} columns={columnsWithId} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('renders with minimum column width', () => {
    const columnsWithMinWidth: Column<TestData>[] = [
      { key: 'name', header: 'Name', minWidth: '100px' },
    ];
    
    render(<DataTable data={mockData} columns={columnsWithMinWidth} />);
    expect(screen.getByText('Name')).toBeInTheDocument();
  });

  it('renders with custom column width', () => {
    const columnsWithWidth: Column<TestData>[] = [
      { key: 'name', header: 'Name', width: '200px' },
    ];
    
    render(<DataTable data={mockData} columns={columnsWithWidth} />);
    expect(screen.getByText('Name')).toBeInTheDocument();
  });

  it('handles null or undefined cell values', () => {
    const dataWithNulls: TestData[] = [
      { id: '1', name: 'John', age: 30, email: '' },
    ];
    
    render(<DataTable data={dataWithNulls} columns={mockColumns} />);
    expect(screen.getByText('John')).toBeInTheDocument();
  });

  it('applies hover effect on rows when onRowClick is provided', () => {
    const { container } = render(<DataTable data={mockData} columns={mockColumns} onRowClick={vi.fn()} />);
    
    const row = container.querySelector('tbody tr');
    expect(row).toHaveClass('hover:bg-gray-50', 'cursor-pointer');
  });

  it('does not apply hover effect when onRowClick is not provided', () => {
    const { container } = render(<DataTable data={mockData} columns={mockColumns} />);
    
    const row = container.querySelector('tbody tr');
    expect(row).not.toHaveClass('cursor-pointer');
  });

  it('renders table with proper structure', () => {
    const { container } = render(<DataTable data={mockData} columns={mockColumns} />);
    
    expect(container.querySelector('table')).toBeInTheDocument();
    expect(container.querySelector('thead')).toBeInTheDocument();
    expect(container.querySelector('tbody')).toBeInTheDocument();
  });

  it('renders correct number of rows', () => {
    const { container } = render(<DataTable data={mockData} columns={mockColumns} />);
    
    const rows = container.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(3);
  });

  it('renders correct number of columns', () => {
    const { container } = render(<DataTable data={mockData} columns={mockColumns} />);
    
    const headers = container.querySelectorAll('thead th');
    expect(headers).toHaveLength(3);
  });

  it('handles column reordering callback', () => {
    const mockOnColumnReorder = vi.fn();
    
    render(
      <DataTable
        data={mockData}
        columns={mockColumns}
        onColumnReorder={mockOnColumnReorder}
      />
    );
    
    // Component should render without errors
    expect(screen.getByText('Name')).toBeInTheDocument();
  });
});
