import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VisualIdentifier from '@/components/ui/VisualIdentifier';

// Mock dependencies
vi.mock('@/components/ui/ColorIndicator', () => ({
  OperatorColorIndicator: ({ operator, size }: any) => (
    <div data-testid="color-indicator" data-color={operator.color} data-pattern={operator.pattern} data-size={size}>
      Color Indicator
    </div>
  ),
}));

vi.mock('@/utils/entityColors', () => ({
  COLOR_PALETTE: [
    { hex: '#FF0000', name: 'Red' },
    { hex: '#00FF00', name: 'Green' },
    { hex: '#0000FF', name: 'Blue' },
  ],
  PatternType: {},
}));

const mockGetColorPatternAvailability = vi.fn();
const mockIsColorAvailable = vi.fn();
const mockGetAvailablePatternsForColor = vi.fn();

vi.mock('@/utils/colorValidation', () => ({
  getColorPatternAvailability: (...args: any[]) => mockGetColorPatternAvailability(...args),
  isColorAvailable: (...args: any[]) => mockIsColorAvailable(...args),
  getAvailablePatternsForColor: (...args: any[]) => mockGetAvailablePatternsForColor(...args),
}));

describe('VisualIdentifier', () => {
  const mockOnColorChange = vi.fn();
  const mockOnPatternChange = vi.fn();
  const mockOnValidationChange = vi.fn();

  const mockAvailability = {
    usedCombinations: [],
    availablePatterns: {},
    availableColors: ['#FF0000', '#00FF00', '#0000FF'],
  };

  beforeEach(() => {
    mockOnColorChange.mockClear();
    mockOnPatternChange.mockClear();
    mockOnValidationChange.mockClear();
    mockGetColorPatternAvailability.mockResolvedValue(mockAvailability);
    mockIsColorAvailable.mockReturnValue(true);
    mockGetAvailablePatternsForColor.mockReturnValue(['solid', 'diagonalLeft', 'diagonalRight']);
  });

  it('shows loading state initially', () => {
    render(
      <VisualIdentifier
        color="#FF0000"
        pattern="solid"
        onColorChange={mockOnColorChange}
        onPatternChange={mockOnPatternChange}
      />
    );
    
    expect(screen.getByText('Visual Identifier')).toBeInTheDocument();
    const loadingElement = document.querySelector('.animate-pulse');
    expect(loadingElement).toBeInTheDocument();
  });

  it('fetches availability data on mount', async () => {
    render(
      <VisualIdentifier
        color="#FF0000"
        pattern="solid"
        onColorChange={mockOnColorChange}
        onPatternChange={mockOnPatternChange}
      />
    );
    
    await waitFor(() => {
      expect(mockGetColorPatternAvailability).toHaveBeenCalledWith('operator', undefined);
    });
  });

  it('fetches availability data with entityType and entityId', async () => {
    render(
      <VisualIdentifier
        color="#FF0000"
        pattern="solid"
        onColorChange={mockOnColorChange}
        onPatternChange={mockOnPatternChange}
        entityType="machine"
        entityId="machine-1"
      />
    );
    
    await waitFor(() => {
      expect(mockGetColorPatternAvailability).toHaveBeenCalledWith('machine', 'machine-1');
    });
  });

  it('renders color palette after loading', async () => {
    render(
      <VisualIdentifier
        color="#FF0000"
        pattern="solid"
        onColorChange={mockOnColorChange}
        onPatternChange={mockOnPatternChange}
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('Visual Identifier *')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Color')).toBeInTheDocument();
  });

  it('renders pattern options after loading', async () => {
    render(
      <VisualIdentifier
        color="#FF0000"
        pattern="solid"
        onColorChange={mockOnColorChange}
        onPatternChange={mockOnPatternChange}
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('Pattern')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Solid')).toBeInTheDocument();
    expect(screen.getByText('Diagonal Left')).toBeInTheDocument();
    expect(screen.getByText('Diagonal Right')).toBeInTheDocument();
    expect(screen.getByText(/Horizontal/)).toBeInTheDocument();
    expect(screen.getByText(/Vertical/)).toBeInTheDocument();
  });

  it('renders preview section', async () => {
    render(
      <VisualIdentifier
        color="#FF0000"
        pattern="solid"
        onColorChange={mockOnColorChange}
        onPatternChange={mockOnPatternChange}
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('Preview:')).toBeInTheDocument();
    });
    
    expect(screen.getByTestId('color-indicator')).toBeInTheDocument();
  });

  it('displays custom preview name', async () => {
    render(
      <VisualIdentifier
        color="#FF0000"
        pattern="solid"
        onColorChange={mockOnColorChange}
        onPatternChange={mockOnPatternChange}
        previewName="John Doe"
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('displays default preview name', async () => {
    render(
      <VisualIdentifier
        color="#FF0000"
        pattern="solid"
        onColorChange={mockOnColorChange}
        onPatternChange={mockOnPatternChange}
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('Preview')).toBeInTheDocument();
    });
  });

  it('calls onColorChange when color is clicked', async () => {
    const user = userEvent.setup();
    render(
      <VisualIdentifier
        color="#FF0000"
        pattern="solid"
        onColorChange={mockOnColorChange}
        onPatternChange={mockOnPatternChange}
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('Color')).toBeInTheDocument();
    });
    
    const colorButtons = document.querySelectorAll('button[style*="background-color"]');
    await user.click(colorButtons[1]); // Click second color
    
    expect(mockOnColorChange).toHaveBeenCalled();
  });

  it('calls onPatternChange when pattern is clicked', async () => {
    const user = userEvent.setup();
    render(
      <VisualIdentifier
        color="#FF0000"
        pattern="solid"
        onColorChange={mockOnColorChange}
        onPatternChange={mockOnPatternChange}
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('Diagonal Left')).toBeInTheDocument();
    });
    
    const patternButton = screen.getByText('Diagonal Left');
    await user.click(patternButton);
    
    expect(mockOnPatternChange).toHaveBeenCalledWith('diagonalLeft');
  });

  it('highlights selected color', async () => {
    render(
      <VisualIdentifier
        color="#FF0000"
        pattern="solid"
        onColorChange={mockOnColorChange}
        onPatternChange={mockOnPatternChange}
      />
    );
    
    await waitFor(() => {
      const colorButtons = document.querySelectorAll('button[style*="background-color"]');
      expect(colorButtons[0]).toHaveClass('scale-110');
    });
  });

  it('highlights selected pattern', async () => {
    render(
      <VisualIdentifier
        color="#FF0000"
        pattern="solid"
        onColorChange={mockOnColorChange}
        onPatternChange={mockOnPatternChange}
      />
    );
    
    await waitFor(() => {
      const solidButton = screen.getByText('Solid');
      expect(solidButton).toHaveClass('bg-blue-50');
    });
  });

  it('disables unavailable colors', async () => {
    mockIsColorAvailable.mockImplementation((color) => color !== '#00FF00');
    
    render(
      <VisualIdentifier
        color="#FF0000"
        pattern="solid"
        onColorChange={mockOnColorChange}
        onPatternChange={mockOnPatternChange}
      />
    );
    
    await waitFor(() => {
      const colorButtons = document.querySelectorAll('button[style*="background-color"]');
      expect(colorButtons[1]).toBeDisabled();
    });
  });

  it('disables unavailable patterns', async () => {
    mockGetAvailablePatternsForColor.mockReturnValue(['solid', 'diagonalLeft']);
    
    render(
      <VisualIdentifier
        color="#FF0000"
        pattern="solid"
        onColorChange={mockOnColorChange}
        onPatternChange={mockOnPatternChange}
      />
    );
    
    await waitFor(() => {
      const horizontalButton = screen.getByText(/Horizontal/);
      expect(horizontalButton).toBeDisabled();
    });
  });

  it('shows available patterns info', async () => {
    mockGetAvailablePatternsForColor.mockReturnValue(['solid', 'diagonalLeft']);
    
    render(
      <VisualIdentifier
        color="#FF0000"
        pattern="solid"
        onColorChange={mockOnColorChange}
        onPatternChange={mockOnPatternChange}
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('Available patterns for this color:')).toBeInTheDocument();
      expect(screen.getByText(/Solid, Diagonal Left/)).toBeInTheDocument();
    });
  });

  it('shows message when no patterns available', async () => {
    mockGetAvailablePatternsForColor.mockReturnValue([]);
    
    render(
      <VisualIdentifier
        color="#FF0000"
        pattern="solid"
        onColorChange={mockOnColorChange}
        onPatternChange={mockOnPatternChange}
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText(/No patterns available for this color/)).toBeInTheDocument();
    });
  });

  it('calls onValidationChange with false when color or pattern is missing', async () => {
    render(
      <VisualIdentifier
        color=""
        pattern="solid"
        onColorChange={mockOnColorChange}
        onPatternChange={mockOnPatternChange}
        onValidationChange={mockOnValidationChange}
      />
    );
    
    await waitFor(() => {
      expect(mockOnValidationChange).toHaveBeenCalledWith(false);
    });
  });

  it('calls onValidationChange with true when combination is valid', async () => {
    render(
      <VisualIdentifier
        color="#FF0000"
        pattern="solid"
        onColorChange={mockOnColorChange}
        onPatternChange={mockOnPatternChange}
        onValidationChange={mockOnValidationChange}
      />
    );
    
    await waitFor(() => {
      expect(mockOnValidationChange).toHaveBeenCalledWith(true);
    });
  });

  it('calls onValidationChange with false when combination is used', async () => {
    mockGetColorPatternAvailability.mockResolvedValue({
      ...mockAvailability,
      usedCombinations: [{ color: '#FF0000', pattern: 'solid' }],
    });
    
    render(
      <VisualIdentifier
        color="#FF0000"
        pattern="solid"
        onColorChange={mockOnColorChange}
        onPatternChange={mockOnPatternChange}
        onValidationChange={mockOnValidationChange}
      />
    );
    
    await waitFor(() => {
      expect(mockOnValidationChange).toHaveBeenCalledWith(false);
    });
  });

  it('auto-adjusts pattern when color changes and pattern is unavailable', async () => {
    const user = userEvent.setup();
    mockGetAvailablePatternsForColor.mockImplementation((color) => {
      if (color === '#00FF00') return ['diagonalLeft'];
      return ['solid', 'diagonalLeft'];
    });
    
    render(
      <VisualIdentifier
        color="#FF0000"
        pattern="solid"
        onColorChange={mockOnColorChange}
        onPatternChange={mockOnPatternChange}
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('Color')).toBeInTheDocument();
    });
    
    const colorButtons = document.querySelectorAll('button[style*="background-color"]');
    await user.click(colorButtons[1]); // Click green
    
    await waitFor(() => {
      expect(mockOnPatternChange).toHaveBeenCalledWith('diagonalLeft');
    });
  });

  it('shows unavailable indicator on disabled colors', async () => {
    mockIsColorAvailable.mockImplementation((color) => color !== '#00FF00');
    
    render(
      <VisualIdentifier
        color="#FF0000"
        pattern="solid"
        onColorChange={mockOnColorChange}
        onPatternChange={mockOnPatternChange}
      />
    );
    
    await waitFor(() => {
      const unavailableIndicators = document.querySelectorAll('.bg-red-500');
      expect(unavailableIndicators.length).toBeGreaterThan(0);
    });
  });

  it('shows X mark on unavailable patterns', async () => {
    mockGetAvailablePatternsForColor.mockReturnValue(['solid']);
    
    render(
      <VisualIdentifier
        color="#FF0000"
        pattern="solid"
        onColorChange={mockOnColorChange}
        onPatternChange={mockOnPatternChange}
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText(/Diagonal Left ✗/)).toBeInTheDocument();
    });
  });

  it('displays entity type in tooltips and messages', async () => {
    render(
      <VisualIdentifier
        color="#FF0000"
        pattern="solid"
        onColorChange={mockOnColorChange}
        onPatternChange={mockOnPatternChange}
        entityType="machine"
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText(/conflicts with other machines/)).toBeInTheDocument();
    });
  });

  it('renders color indicator with correct props', async () => {
    render(
      <VisualIdentifier
        color="#FF0000"
        pattern="solid"
        onColorChange={mockOnColorChange}
        onPatternChange={mockOnPatternChange}
      />
    );
    
    await waitFor(() => {
      const indicator = screen.getByTestId('color-indicator');
      expect(indicator).toHaveAttribute('data-color', '#FF0000');
      expect(indicator).toHaveAttribute('data-pattern', 'solid');
      expect(indicator).toHaveAttribute('data-size', 'lg');
    });
  });
});
