import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Select from '@/components/ui/Select';

describe('Select', () => {
  const mockOnChange = vi.fn();
  const mockOptions = [
    { id: '1', name: 'Option 1' },
    { id: '2', name: 'Option 2' },
    { id: '3', name: 'Option 3' },
  ];

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders select button with placeholder when no value selected', () => {
    render(<Select value={null} onChange={mockOnChange} options={mockOptions} />);
    expect(screen.getByText('-- None --')).toBeInTheDocument();
  });

  it('renders select button with custom placeholder', () => {
    render(<Select value={null} onChange={mockOnChange} options={mockOptions} placeholder="Select an option" />);
    expect(screen.getByText('Select an option')).toBeInTheDocument();
  });

  it('renders selected option name', () => {
    render(<Select value="2" onChange={mockOnChange} options={mockOptions} />);
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  it('renders label when provided', () => {
    render(<Select value={null} onChange={mockOnChange} options={mockOptions} label="Choose Option" />);
    expect(screen.getByText('Choose Option')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <Select value={null} onChange={mockOnChange} options={mockOptions} className="custom-class" />
    );
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('opens dropdown when button is clicked', async () => {
    const user = userEvent.setup();
    render(<Select value={null} onChange={mockOnChange} options={mockOptions} />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    // Options should be visible
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('Option 3')).toBeInTheDocument();
  });

  it('calls onChange when an option is selected', async () => {
    const user = userEvent.setup();
    render(<Select value={null} onChange={mockOnChange} options={mockOptions} />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    const option = screen.getByText('Option 2');
    await user.click(option);
    
    expect(mockOnChange).toHaveBeenCalledWith('2');
  });

  it('calls onChange with null when placeholder option is selected', async () => {
    const user = userEvent.setup();
    render(<Select value="1" onChange={mockOnChange} options={mockOptions} placeholder="Select None" />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    // Click the "Select None" option in dropdown
    const noneOptions = screen.getAllByText('Select None');
    await user.click(noneOptions[noneOptions.length - 1]); // Click the last one (in dropdown)
    
    expect(mockOnChange).toHaveBeenCalledWith(null);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Select value={null} onChange={mockOnChange} options={mockOptions} disabled={true} />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-gray-100', 'cursor-not-allowed');
  });

  it('is not disabled when disabled prop is false', () => {
    render(<Select value={null} onChange={mockOnChange} options={mockOptions} disabled={false} />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-white', 'cursor-pointer');
  });

  it('renders chevron icon', () => {
    const { container } = render(<Select value={null} onChange={mockOnChange} options={mockOptions} />);
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('renders all options in dropdown', async () => {
    const user = userEvent.setup();
    render(<Select value={null} onChange={mockOnChange} options={mockOptions} />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    mockOptions.forEach(option => {
      expect(screen.getByText(option.name)).toBeInTheDocument();
    });
  });

  it('shows checkmark for selected option', async () => {
    const user = userEvent.setup();
    const { container } = render(<Select value="2" onChange={mockOnChange} options={mockOptions} />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    // Check for checkmark SVG (there should be one for the selected option)
    const checkmarks = container.querySelectorAll('svg');
    expect(checkmarks.length).toBeGreaterThan(1); // Chevron + checkmark
  });

  it('handles empty options array', () => {
    render(<Select value={null} onChange={mockOnChange} options={[]} />);
    expect(screen.getByText('-- None --')).toBeInTheDocument();
  });

  it('handles value that does not match any option', () => {
    render(<Select value="999" onChange={mockOnChange} options={mockOptions} />);
    // Should show placeholder since no option matches
    expect(screen.getByText('-- None --')).toBeInTheDocument();
  });

  it('applies focus styles to button', () => {
    render(<Select value={null} onChange={mockOnChange} options={mockOptions} />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('focus:border-blue-500', 'focus:ring-2', 'focus:ring-blue-200');
  });

  it('renders label with correct styling', () => {
    render(<Select value={null} onChange={mockOnChange} options={mockOptions} label="Test Label" />);
    const label = screen.getByText('Test Label');
    expect(label).toHaveClass('block', 'mb-2', 'text-sm', 'font-semibold', 'text-gray-700');
  });

  it('truncates long option names', async () => {
    const user = userEvent.setup();
    const longOptions = [
      { id: '1', name: 'This is a very long option name that should be truncated' },
    ];
    const { container } = render(<Select value={null} onChange={mockOnChange} options={longOptions} />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    const truncatedSpan = container.querySelector('.truncate');
    expect(truncatedSpan).toBeInTheDocument();
  });

  it('renders with selected value and shows correct name', () => {
    render(<Select value="1" onChange={mockOnChange} options={mockOptions} />);
    expect(screen.getByText('Option 1')).toBeInTheDocument();
  });
});
