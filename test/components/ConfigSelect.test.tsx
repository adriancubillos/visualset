import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfigSelect from '@/components/ui/ConfigSelect';

describe('ConfigSelect', () => {
  const mockOnChange = vi.fn();
  const mockOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
  ] as const;

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders with selected option label', () => {
    render(<ConfigSelect value="pending" onChange={mockOnChange} options={mockOptions} />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('renders "Select..." when no option matches value', () => {
    render(<ConfigSelect value="unknown" onChange={mockOnChange} options={mockOptions} />);
    expect(screen.getByText('Select...')).toBeInTheDocument();
  });

  it('renders label when provided', () => {
    render(<ConfigSelect value="pending" onChange={mockOnChange} options={mockOptions} label="Status" />);
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('shows asterisk when required is true', () => {
    render(<ConfigSelect value="pending" onChange={mockOnChange} options={mockOptions} label="Status" required={true} />);
    expect(screen.getByText('Status *')).toBeInTheDocument();
  });

  it('does not show asterisk when required is false', () => {
    render(<ConfigSelect value="pending" onChange={mockOnChange} options={mockOptions} label="Status" required={false} />);
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.queryByText('Status *')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <ConfigSelect value="pending" onChange={mockOnChange} options={mockOptions} className="custom-class" />
    );
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('opens dropdown when button is clicked', async () => {
    const user = userEvent.setup();
    render(<ConfigSelect value="pending" onChange={mockOnChange} options={mockOptions} />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    // All options should be visible
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('calls onChange when an option is selected', async () => {
    const user = userEvent.setup();
    render(<ConfigSelect value="pending" onChange={mockOnChange} options={mockOptions} />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    const option = screen.getByText('In Progress');
    await user.click(option);
    
    expect(mockOnChange).toHaveBeenCalledWith('in_progress');
  });

  it('renders all options in dropdown', async () => {
    const user = userEvent.setup();
    render(<ConfigSelect value="pending" onChange={mockOnChange} options={mockOptions} />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    // Check that all options are visible (Pending will appear twice: in button and dropdown)
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('shows checkmark for selected option', async () => {
    const user = userEvent.setup();
    const { container } = render(<ConfigSelect value="in_progress" onChange={mockOnChange} options={mockOptions} />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    // Check for checkmark SVG
    const checkmarks = container.querySelectorAll('svg');
    expect(checkmarks.length).toBeGreaterThan(1); // Chevron + checkmark
  });

  it('renders chevron icon', () => {
    const { container } = render(<ConfigSelect value="pending" onChange={mockOnChange} options={mockOptions} />);
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('applies focus styles to button', () => {
    render(<ConfigSelect value="pending" onChange={mockOnChange} options={mockOptions} />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('focus:ring-blue-500', 'focus:border-blue-500');
  });

  it('has cursor pointer class', () => {
    render(<ConfigSelect value="pending" onChange={mockOnChange} options={mockOptions} />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('cursor-pointer');
  });

  it('truncates long option labels', async () => {
    const user = userEvent.setup();
    const longOptions = [
      { value: '1', label: 'This is a very long option label that should be truncated' },
    ] as const;
    const { container } = render(<ConfigSelect value="1" onChange={mockOnChange} options={longOptions} />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    const truncatedSpan = container.querySelector('.truncate');
    expect(truncatedSpan).toBeInTheDocument();
  });

  it('renders label with correct styling', () => {
    render(<ConfigSelect value="pending" onChange={mockOnChange} options={mockOptions} label="Test Label" />);
    const label = screen.getByText('Test Label');
    expect(label).toHaveClass('block', 'text-sm', 'font-medium', 'text-gray-700', 'mb-2');
  });

  it('handles empty options array', () => {
    render(<ConfigSelect value="" onChange={mockOnChange} options={[]} />);
    expect(screen.getByText('Select...')).toBeInTheDocument();
  });

  it('applies selected font weight to selected option', async () => {
    const user = userEvent.setup();
    const { container } = render(<ConfigSelect value="pending" onChange={mockOnChange} options={mockOptions} />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    // Find the selected option's span
    const options = container.querySelectorAll('.font-semibold');
    expect(options.length).toBeGreaterThan(0);
  });

  it('applies normal font weight to non-selected options', async () => {
    const user = userEvent.setup();
    const { container } = render(<ConfigSelect value="pending" onChange={mockOnChange} options={mockOptions} />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    // Find non-selected options
    const normalOptions = container.querySelectorAll('.font-normal');
    expect(normalOptions.length).toBeGreaterThan(0);
  });

  it('has white background', () => {
    render(<ConfigSelect value="pending" onChange={mockOnChange} options={mockOptions} />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-white');
  });

  it('has border and shadow styling', () => {
    render(<ConfigSelect value="pending" onChange={mockOnChange} options={mockOptions} />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('border', 'border-gray-300', 'rounded-md', 'shadow-sm');
  });
});
