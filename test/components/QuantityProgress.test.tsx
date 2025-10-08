import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuantityProgress from '@/components/forms/QuantityProgress';

describe('QuantityProgress', () => {
  const mockOnQuantityChange = vi.fn();
  const mockOnCompletedQuantityChange = vi.fn();

  beforeEach(() => {
    mockOnQuantityChange.mockClear();
    mockOnCompletedQuantityChange.mockClear();
  });

  it('renders component title', () => {
    render(
      <QuantityProgress
        quantity={10}
        completedQuantity={5}
        onQuantityChange={mockOnQuantityChange}
        onCompletedQuantityChange={mockOnCompletedQuantityChange}
      />
    );
    expect(screen.getByText('Quantity & Progress')).toBeInTheDocument();
  });

  it('renders quantity input with correct value', () => {
    render(
      <QuantityProgress
        quantity={10}
        completedQuantity={5}
        onQuantityChange={mockOnQuantityChange}
        onCompletedQuantityChange={mockOnCompletedQuantityChange}
      />
    );
    const quantityInput = screen.getByLabelText('Total Quantity Required') as HTMLInputElement;
    expect(quantityInput.value).toBe('10');
  });

  it('renders completed quantity input with correct value', () => {
    render(
      <QuantityProgress
        quantity={10}
        completedQuantity={5}
        onQuantityChange={mockOnQuantityChange}
        onCompletedQuantityChange={mockOnCompletedQuantityChange}
      />
    );
    const completedInput = screen.getByLabelText('Completed Quantity') as HTMLInputElement;
    expect(completedInput.value).toBe('5');
  });

  it('displays progress percentage', () => {
    render(
      <QuantityProgress
        quantity={10}
        completedQuantity={5}
        onQuantityChange={mockOnQuantityChange}
        onCompletedQuantityChange={mockOnCompletedQuantityChange}
      />
    );
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('displays progress fraction', () => {
    render(
      <QuantityProgress
        quantity={10}
        completedQuantity={5}
        onQuantityChange={mockOnQuantityChange}
        onCompletedQuantityChange={mockOnCompletedQuantityChange}
      />
    );
    expect(screen.getByText('5/10')).toBeInTheDocument();
  });

  it('calculates progress correctly', () => {
    render(
      <QuantityProgress
        quantity={20}
        completedQuantity={15}
        onQuantityChange={mockOnQuantityChange}
        onCompletedQuantityChange={mockOnCompletedQuantityChange}
      />
    );
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('shows 0% when quantity is 0', () => {
    render(
      <QuantityProgress
        quantity={0}
        completedQuantity={0}
        onQuantityChange={mockOnQuantityChange}
        onCompletedQuantityChange={mockOnCompletedQuantityChange}
      />
    );
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('calls onQuantityChange when quantity input changes', async () => {
    const user = userEvent.setup();
    render(
      <QuantityProgress
        quantity={10}
        completedQuantity={5}
        onQuantityChange={mockOnQuantityChange}
        onCompletedQuantityChange={mockOnCompletedQuantityChange}
      />
    );
    
    const quantityInput = screen.getByLabelText('Total Quantity Required');
    await user.clear(quantityInput);
    await user.type(quantityInput, '20');
    
    expect(mockOnQuantityChange).toHaveBeenCalled();
  });

  it('calls onCompletedQuantityChange when completed quantity input changes', async () => {
    const user = userEvent.setup();
    render(
      <QuantityProgress
        quantity={10}
        completedQuantity={5}
        onQuantityChange={mockOnQuantityChange}
        onCompletedQuantityChange={mockOnCompletedQuantityChange}
      />
    );
    
    const completedInput = screen.getByLabelText('Completed Quantity');
    await user.clear(completedInput);
    await user.type(completedInput, '8');
    
    expect(mockOnCompletedQuantityChange).toHaveBeenCalled();
  });

  it('auto-adjusts completed quantity when total quantity is reduced below it', async () => {
    const user = userEvent.setup();
    render(
      <QuantityProgress
        quantity={10}
        completedQuantity={8}
        onQuantityChange={mockOnQuantityChange}
        onCompletedQuantityChange={mockOnCompletedQuantityChange}
      />
    );
    
    const quantityInput = screen.getByLabelText('Total Quantity Required');
    await user.clear(quantityInput);
    await user.type(quantityInput, '5');
    
    // Should be called with the adjusted value
    expect(mockOnCompletedQuantityChange).toHaveBeenCalled();
  });

  it('caps completed quantity at total quantity', async () => {
    const user = userEvent.setup();
    render(
      <QuantityProgress
        quantity={10}
        completedQuantity={5}
        onQuantityChange={mockOnQuantityChange}
        onCompletedQuantityChange={mockOnCompletedQuantityChange}
      />
    );
    
    const completedInput = screen.getByLabelText('Completed Quantity');
    await user.clear(completedInput);
    await user.type(completedInput, '15');
    
    expect(mockOnCompletedQuantityChange).toHaveBeenCalledWith(10);
  });

  it('sets quantity to 1 when empty or invalid', async () => {
    const user = userEvent.setup();
    render(
      <QuantityProgress
        quantity={10}
        completedQuantity={5}
        onQuantityChange={mockOnQuantityChange}
        onCompletedQuantityChange={mockOnCompletedQuantityChange}
      />
    );
    
    const quantityInput = screen.getByLabelText('Total Quantity Required');
    await user.clear(quantityInput);
    await user.type(quantityInput, 'abc');
    
    expect(mockOnQuantityChange).toHaveBeenCalledWith(1);
  });

  it('sets completed quantity to 0 when empty or invalid', async () => {
    const user = userEvent.setup();
    render(
      <QuantityProgress
        quantity={10}
        completedQuantity={5}
        onQuantityChange={mockOnQuantityChange}
        onCompletedQuantityChange={mockOnCompletedQuantityChange}
      />
    );
    
    const completedInput = screen.getByLabelText('Completed Quantity');
    await user.clear(completedInput);
    await user.type(completedInput, 'abc');
    
    expect(mockOnCompletedQuantityChange).toHaveBeenCalledWith(0);
  });

  it('renders inputs as readonly when readOnly is true', () => {
    render(
      <QuantityProgress
        quantity={10}
        completedQuantity={5}
        onQuantityChange={mockOnQuantityChange}
        onCompletedQuantityChange={mockOnCompletedQuantityChange}
        readOnly={true}
      />
    );
    
    const quantityInput = screen.getByLabelText('Total Quantity Required');
    const completedInput = screen.getByLabelText('Completed Quantity');
    
    expect(quantityInput).toHaveAttribute('readonly');
    expect(completedInput).toHaveAttribute('readonly');
  });

  it('applies readonly styling when readOnly is true', () => {
    render(
      <QuantityProgress
        quantity={10}
        completedQuantity={5}
        onQuantityChange={mockOnQuantityChange}
        onCompletedQuantityChange={mockOnCompletedQuantityChange}
        readOnly={true}
      />
    );
    
    const quantityInput = screen.getByLabelText('Total Quantity Required');
    expect(quantityInput).toHaveClass('bg-gray-100', 'cursor-not-allowed');
  });

  it('does not apply readonly styling when readOnly is false', () => {
    render(
      <QuantityProgress
        quantity={10}
        completedQuantity={5}
        onQuantityChange={mockOnQuantityChange}
        onCompletedQuantityChange={mockOnCompletedQuantityChange}
        readOnly={false}
      />
    );
    
    const quantityInput = screen.getByLabelText('Total Quantity Required');
    expect(quantityInput).not.toHaveClass('bg-gray-100');
  });

  it('renders progress bar with correct width', () => {
    const { container } = render(
      <QuantityProgress
        quantity={10}
        completedQuantity={7}
        onQuantityChange={mockOnQuantityChange}
        onCompletedQuantityChange={mockOnCompletedQuantityChange}
      />
    );
    
    const progressBar = container.querySelector('.bg-blue-600');
    expect(progressBar).toHaveStyle({ width: '70%' });
  });

  it('renders helper texts', () => {
    render(
      <QuantityProgress
        quantity={10}
        completedQuantity={5}
        onQuantityChange={mockOnQuantityChange}
        onCompletedQuantityChange={mockOnCompletedQuantityChange}
      />
    );
    
    expect(screen.getByText('How many units need to be produced for this task')).toBeInTheDocument();
    expect(screen.getByText('How many units have been completed')).toBeInTheDocument();
    expect(screen.getByText('Task completion progress')).toBeInTheDocument();
  });

  it('has correct input attributes', () => {
    render(
      <QuantityProgress
        quantity={10}
        completedQuantity={5}
        onQuantityChange={mockOnQuantityChange}
        onCompletedQuantityChange={mockOnCompletedQuantityChange}
      />
    );
    
    const quantityInput = screen.getByLabelText('Total Quantity Required');
    const completedInput = screen.getByLabelText('Completed Quantity');
    
    expect(quantityInput).toHaveAttribute('type', 'number');
    expect(quantityInput).toHaveAttribute('min', '1');
    expect(completedInput).toHaveAttribute('type', 'number');
    expect(completedInput).toHaveAttribute('min', '0');
    expect(completedInput).toHaveAttribute('max', '10');
  });

  it('shows 100% when completed equals quantity', () => {
    render(
      <QuantityProgress
        quantity={10}
        completedQuantity={10}
        onQuantityChange={mockOnQuantityChange}
        onCompletedQuantityChange={mockOnCompletedQuantityChange}
      />
    );
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('rounds progress percentage', () => {
    render(
      <QuantityProgress
        quantity={3}
        completedQuantity={1}
        onQuantityChange={mockOnQuantityChange}
        onCompletedQuantityChange={mockOnCompletedQuantityChange}
      />
    );
    expect(screen.getByText('33%')).toBeInTheDocument();
  });
});
