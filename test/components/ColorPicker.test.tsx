import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ColorPicker from '@/components/ui/ColorPicker';

describe('ColorPicker', () => {
  const mockOnColorChange = vi.fn();
  const mockUsedColors = ['#EF4444', '#F97316'];

  beforeEach(() => {
    mockOnColorChange.mockClear();
  });

  it('renders color picker label', () => {
    render(<ColorPicker selectedColor="#3B82F6" onColorChange={mockOnColorChange} usedColors={[]} />);
    expect(screen.getByText('Project Color')).toBeInTheDocument();
  });

  it('displays selected color preview', () => {
    const { container } = render(
      <ColorPicker selectedColor="#3B82F6" onColorChange={mockOnColorChange} usedColors={[]} />
    );
    const preview = container.querySelector('[style*="background-color"]');
    expect(preview).toHaveStyle({ backgroundColor: '#3B82F6' });
  });

  it('displays selected color hex value', () => {
    render(<ColorPicker selectedColor="#3B82F6" onColorChange={mockOnColorChange} usedColors={[]} />);
    expect(screen.getByText('#3B82F6')).toBeInTheDocument();
  });

  it('displays "No color selected" when no color is selected', () => {
    render(<ColorPicker selectedColor="" onColorChange={mockOnColorChange} usedColors={[]} />);
    expect(screen.getByText('No color selected')).toBeInTheDocument();
  });

  it('renders preset color palette', () => {
    const { container } = render(
      <ColorPicker selectedColor="" onColorChange={mockOnColorChange} usedColors={[]} />
    );
    const colorButtons = container.querySelectorAll('button[style*="background-color"]');
    expect(colorButtons.length).toBeGreaterThan(20); // Should have many preset colors
  });

  it('calls onColorChange when a preset color is clicked', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ColorPicker selectedColor="" onColorChange={mockOnColorChange} usedColors={[]} />
    );
    
    const colorButtons = container.querySelectorAll('button[style*="background-color"]');
    await user.click(colorButtons[0]);
    
    expect(mockOnColorChange).toHaveBeenCalled();
  });

  it('disables used colors', () => {
    const { container } = render(
      <ColorPicker selectedColor="" onColorChange={mockOnColorChange} usedColors={['#EF4444']} />
    );
    
    const disabledButtons = container.querySelectorAll('button:disabled');
    expect(disabledButtons.length).toBeGreaterThan(0);
    expect(disabledButtons[0]).toHaveClass('opacity-30', 'cursor-not-allowed');
  });

  it('shows X mark on used colors', () => {
    render(<ColorPicker selectedColor="" onColorChange={mockOnColorChange} usedColors={['#EF4444']} />);
    expect(screen.getByText('✕')).toBeInTheDocument();
  });

  it('does not call onColorChange when clicking a used color', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ColorPicker selectedColor="" onColorChange={mockOnColorChange} usedColors={['#EF4444']} />
    );
    
    const usedColorButton = container.querySelector('button[style*="#EF4444"]');
    await user.click(usedColorButton!);
    
    expect(mockOnColorChange).not.toHaveBeenCalled();
  });

  it('highlights selected color with border and scale', () => {
    const { container } = render(
      <ColorPicker selectedColor="#3B82F6" onColorChange={mockOnColorChange} usedColors={[]} />
    );
    
    const selectedButton = container.querySelector('.border-gray-800.scale-110');
    expect(selectedButton).toBeInTheDocument();
  });

  it('shows custom color picker toggle button', () => {
    render(<ColorPicker selectedColor="" onColorChange={mockOnColorChange} usedColors={[]} />);
    expect(screen.getByText('Use custom color')).toBeInTheDocument();
  });

  it('toggles custom color picker when button is clicked', async () => {
    const user = userEvent.setup();
    render(<ColorPicker selectedColor="" onColorChange={mockOnColorChange} usedColors={[]} />);
    
    const toggleButton = screen.getByText('Use custom color');
    await user.click(toggleButton);
    
    expect(screen.getByText('Hide custom color')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('#000000')).toBeInTheDocument();
  });

  it('hides custom color picker when toggle is clicked again', async () => {
    const user = userEvent.setup();
    render(<ColorPicker selectedColor="" onColorChange={mockOnColorChange} usedColors={[]} />);
    
    const toggleButton = screen.getByText('Use custom color');
    await user.click(toggleButton);
    await user.click(screen.getByText('Hide custom color'));
    
    expect(screen.queryByPlaceholderText('#000000')).not.toBeInTheDocument();
  });

  it('renders color input and text input in custom picker', async () => {
    const user = userEvent.setup();
    const { container } = render(<ColorPicker selectedColor="" onColorChange={mockOnColorChange} usedColors={[]} />);
    
    await user.click(screen.getByText('Use custom color'));
    
    const colorInput = container.querySelector('input[type="color"]');
    expect(colorInput).toBeInTheDocument();
    
    const textInput = screen.getByPlaceholderText('#000000');
    expect(textInput).toHaveAttribute('type', 'text');
  });

  it('updates custom color when text input changes', async () => {
    const user = userEvent.setup();
    render(<ColorPicker selectedColor="" onColorChange={mockOnColorChange} usedColors={[]} />);
    
    await user.click(screen.getByText('Use custom color'));
    
    const textInput = screen.getByPlaceholderText('#000000') as HTMLInputElement;
    await user.clear(textInput);
    await user.type(textInput, '#FF5733');
    
    expect(textInput.value).toBe('#FF5733');
  });

  it('calls onColorChange when Use Color button is clicked', async () => {
    const user = userEvent.setup();
    render(<ColorPicker selectedColor="" onColorChange={mockOnColorChange} usedColors={[]} />);
    
    await user.click(screen.getByText('Use custom color'));
    
    const useColorButton = screen.getByText('Use Color');
    await user.click(useColorButton);
    
    expect(mockOnColorChange).toHaveBeenCalledWith('#000000');
  });

  it('disables Use Color button when custom color is already used', async () => {
    const user = userEvent.setup();
    render(<ColorPicker selectedColor="" onColorChange={mockOnColorChange} usedColors={['#000000']} />);
    
    await user.click(screen.getByText('Use custom color'));
    
    const useColorButton = screen.getByText('Use Color');
    expect(useColorButton).toBeDisabled();
  });

  it('shows error message when custom color is already used', async () => {
    const user = userEvent.setup();
    render(<ColorPicker selectedColor="" onColorChange={mockOnColorChange} usedColors={['#000000']} />);
    
    await user.click(screen.getByText('Use custom color'));
    
    expect(screen.getByText('This color is already in use')).toBeInTheDocument();
  });

  it('hides custom picker after selecting a preset color', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ColorPicker selectedColor="" onColorChange={mockOnColorChange} usedColors={[]} />
    );
    
    await user.click(screen.getByText('Use custom color'));
    expect(screen.getByPlaceholderText('#000000')).toBeInTheDocument();
    
    const colorButtons = container.querySelectorAll('button[style*="background-color"]');
    await user.click(colorButtons[0]);
    
    expect(screen.queryByPlaceholderText('#000000')).not.toBeInTheDocument();
  });

  it('hides custom picker after using custom color', async () => {
    const user = userEvent.setup();
    render(<ColorPicker selectedColor="" onColorChange={mockOnColorChange} usedColors={[]} />);
    
    await user.click(screen.getByText('Use custom color'));
    
    const useColorButton = screen.getByText('Use Color');
    await user.click(useColorButton);
    
    expect(screen.queryByPlaceholderText('#000000')).not.toBeInTheDocument();
  });

  it('displays error message when provided', () => {
    render(
      <ColorPicker
        selectedColor=""
        onColorChange={mockOnColorChange}
        usedColors={[]}
        error="Color is required"
      />
    );
    expect(screen.getByText('Color is required')).toBeInTheDocument();
  });

  it('does not display error message when not provided', () => {
    render(<ColorPicker selectedColor="" onColorChange={mockOnColorChange} usedColors={[]} />);
    const errorMessages = screen.queryAllByText(/error/i);
    expect(errorMessages).toHaveLength(0);
  });

  it('shows hover effect on available colors', () => {
    const { container } = render(
      <ColorPicker selectedColor="" onColorChange={mockOnColorChange} usedColors={[]} />
    );
    
    const availableButtons = container.querySelectorAll('button:not([disabled])');
    expect(availableButtons[0]).toHaveClass('hover:scale-105');
  });

  it('shows title attribute on color buttons', () => {
    const { container } = render(
      <ColorPicker selectedColor="" onColorChange={mockOnColorChange} usedColors={['#EF4444']} />
    );
    
    const disabledButton = container.querySelector('button:disabled');
    expect(disabledButton).toHaveAttribute('title', 'Color already in use');
  });
});
