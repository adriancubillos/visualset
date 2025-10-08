import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FilterSelect from '@/components/ui/FilterSelect';

describe('FilterSelect', () => {
  const mockOnChange = vi.fn();
  const mockOptions = [
    { id: 'active', name: 'Active' },
    { id: 'inactive', name: 'Inactive' },
    { id: 'pending', name: 'Pending' },
  ];

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders with default "All" label when value is "all"', () => {
    render(<FilterSelect value="all" onChange={mockOnChange} options={mockOptions} />);
    expect(screen.getByText('All')).toBeInTheDocument();
  });

  it('renders with custom allLabel', () => {
    render(<FilterSelect value="all" onChange={mockOnChange} options={mockOptions} allLabel="Show All" />);
    expect(screen.getByText('Show All')).toBeInTheDocument();
  });

  it('renders selected option name', () => {
    render(<FilterSelect value="active" onChange={mockOnChange} options={mockOptions} />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders label when provided and not compact', () => {
    render(<FilterSelect value="all" onChange={mockOnChange} options={mockOptions} label="Status Filter" />);
    expect(screen.getByText('Status Filter')).toBeInTheDocument();
  });

  it('does not render label when compact is true', () => {
    render(
      <FilterSelect value="all" onChange={mockOnChange} options={mockOptions} label="Status Filter" compact={true} />
    );
    expect(screen.queryByText('Status Filter')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <FilterSelect value="all" onChange={mockOnChange} options={mockOptions} className="custom-class" />
    );
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('applies compact styling when compact is true', () => {
    render(<FilterSelect value="all" onChange={mockOnChange} options={mockOptions} compact={true} />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-gray-50', 'border-gray-200');
  });

  it('applies non-compact styling when compact is false', () => {
    render(<FilterSelect value="all" onChange={mockOnChange} options={mockOptions} compact={false} />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-white', 'border-slate-200');
  });

  it('opens dropdown when button is clicked', async () => {
    const user = userEvent.setup();
    render(<FilterSelect value="all" onChange={mockOnChange} options={mockOptions} />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    // Options should be visible
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('calls onChange when an option is selected', async () => {
    const user = userEvent.setup();
    render(<FilterSelect value="all" onChange={mockOnChange} options={mockOptions} />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    const option = screen.getByText('Active');
    await user.click(option);
    
    expect(mockOnChange).toHaveBeenCalledWith('active');
  });

  it('calls onChange with "all" when All option is selected', async () => {
    const user = userEvent.setup();
    render(<FilterSelect value="active" onChange={mockOnChange} options={mockOptions} />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    // Click the "All" option (there will be 2: one in button if selected, one in dropdown)
    const allOptions = screen.getAllByText('All');
    await user.click(allOptions[allOptions.length - 1]); // Click the one in dropdown
    
    expect(mockOnChange).toHaveBeenCalledWith('all');
  });

  it('renders chevron icon', () => {
    const { container } = render(<FilterSelect value="all" onChange={mockOnChange} options={mockOptions} />);
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('renders all options in dropdown', async () => {
    const user = userEvent.setup();
    render(<FilterSelect value="all" onChange={mockOnChange} options={mockOptions} />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    mockOptions.forEach(option => {
      expect(screen.getByText(option.name)).toBeInTheDocument();
    });
  });

  it('shows checkmark for selected option', async () => {
    const user = userEvent.setup();
    const { container } = render(<FilterSelect value="active" onChange={mockOnChange} options={mockOptions} />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    // Check for checkmark SVG (there should be one for the selected option)
    const checkmarks = container.querySelectorAll('svg');
    expect(checkmarks.length).toBeGreaterThan(1); // Chevron + checkmark
  });

  it('handles empty options array', () => {
    render(<FilterSelect value="all" onChange={mockOnChange} options={[]} />);
    expect(screen.getByText('All')).toBeInTheDocument();
  });

  it('shows "All" label when value does not match any option', () => {
    render(<FilterSelect value="nonexistent" onChange={mockOnChange} options={mockOptions} />);
    // Should show allLabel since no option matches
    expect(screen.getByText('All')).toBeInTheDocument();
  });

  it('applies focus styles to button', () => {
    render(<FilterSelect value="all" onChange={mockOnChange} options={mockOptions} />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('focus:border-blue-500', 'focus:ring-2', 'focus:ring-blue-200');
  });

  it('truncates long option names', async () => {
    const user = userEvent.setup();
    const longOptions = [
      { id: '1', name: 'This is a very long filter option name that should be truncated' },
    ];
    const { container } = render(<FilterSelect value="all" onChange={mockOnChange} options={longOptions} />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    const truncatedSpan = container.querySelector('.truncate');
    expect(truncatedSpan).toBeInTheDocument();
  });

  it('renders with selected value and shows correct name', () => {
    render(<FilterSelect value="inactive" onChange={mockOnChange} options={mockOptions} />);
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('has cursor pointer class', () => {
    render(<FilterSelect value="all" onChange={mockOnChange} options={mockOptions} />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('cursor-pointer');
  });

  it('renders label with correct styling when not compact', () => {
    render(<FilterSelect value="all" onChange={mockOnChange} options={mockOptions} label="Test Label" compact={false} />);
    const label = screen.getByText('Test Label');
    expect(label).toHaveClass('block', 'text-sm', 'font-medium', 'text-slate-700', 'mb-2');
  });

  it('renders "All" option in dropdown', async () => {
    const user = userEvent.setup();
    render(<FilterSelect value="active" onChange={mockOnChange} options={mockOptions} allLabel="All Items" />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    // Should see "All Items" in the dropdown
    const allOptions = screen.getAllByText('All Items');
    expect(allOptions.length).toBeGreaterThan(0);
  });
});
