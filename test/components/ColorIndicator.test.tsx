import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import ColorIndicator, {
  ProjectColorIndicator,
  OperatorColorIndicator,
  MachineColorIndicator,
} from '@/components/ui/ColorIndicator';

// Mock the entityColors utility
vi.mock('@/utils/entityColors', () => ({
  getEntityColor: vi.fn((entity, entityType) => ({
    hex: '#3b82f6',
    tailwind: 'bg-blue-500 border-blue-600',
    style: { backgroundColor: '#3b82f6' },
    patternStyle: {},
  })),
}));

describe('ColorIndicator', () => {
  const mockEntity = {
    id: '1',
    color: '#3b82f6',
    pattern: null,
  };

  it('renders color indicator', () => {
    const { container } = render(<ColorIndicator entity={mockEntity} entityType="project" />);
    const indicator = container.querySelector('div');
    expect(indicator).toBeInTheDocument();
  });

  it('applies default medium size', () => {
    const { container } = render(<ColorIndicator entity={mockEntity} entityType="project" />);
    const indicator = container.querySelector('div');
    expect(indicator).toHaveClass('w-4', 'h-4');
  });

  it('applies small size', () => {
    const { container } = render(<ColorIndicator entity={mockEntity} entityType="project" size="sm" />);
    const indicator = container.querySelector('div');
    expect(indicator).toHaveClass('w-3', 'h-3');
  });

  it('applies large size', () => {
    const { container } = render(<ColorIndicator entity={mockEntity} entityType="project" size="lg" />);
    const indicator = container.querySelector('div');
    expect(indicator).toHaveClass('w-6', 'h-6');
  });

  it('applies default circle shape', () => {
    const { container } = render(<ColorIndicator entity={mockEntity} entityType="project" />);
    const indicator = container.querySelector('div');
    expect(indicator).toHaveClass('rounded-full');
  });

  it('applies square shape', () => {
    const { container } = render(<ColorIndicator entity={mockEntity} entityType="project" shape="square" />);
    const indicator = container.querySelector('div');
    expect(indicator).toHaveClass('rounded-sm');
  });

  it('applies bar shape', () => {
    const { container } = render(<ColorIndicator entity={mockEntity} entityType="project" shape="bar" />);
    const indicator = container.querySelector('div');
    expect(indicator).toHaveClass('rounded-none', 'h-2', 'w-8');
  });

  it('applies custom className', () => {
    const { container } = render(
      <ColorIndicator entity={mockEntity} entityType="project" className="custom-class" />
    );
    const indicator = container.querySelector('div');
    expect(indicator).toHaveClass('custom-class');
  });

  it('applies tailwind classes from getEntityColor', () => {
    const { container } = render(<ColorIndicator entity={mockEntity} entityType="project" />);
    const indicator = container.querySelector('div');
    expect(indicator).toHaveClass('bg-blue-500', 'border-blue-600');
  });

  it('applies inline styles from getEntityColor', () => {
    const { container } = render(<ColorIndicator entity={mockEntity} entityType="project" />);
    const indicator = container.querySelector('div');
    expect(indicator).toHaveStyle({ backgroundColor: '#3b82f6' });
  });

  it('shows tooltip when showTooltip is true', () => {
    const { container } = render(
      <ColorIndicator entity={mockEntity} entityType="project" showTooltip={true} />
    );
    const indicator = container.querySelector('div');
    expect(indicator).toHaveAttribute('title', 'project color');
  });

  it('shows custom tooltip text', () => {
    const { container } = render(
      <ColorIndicator entity={mockEntity} entityType="project" showTooltip={true} tooltipText="Custom tooltip" />
    );
    const indicator = container.querySelector('div');
    expect(indicator).toHaveAttribute('title', 'Custom tooltip');
  });

  it('does not show tooltip when showTooltip is false', () => {
    const { container } = render(<ColorIndicator entity={mockEntity} entityType="project" showTooltip={false} />);
    const indicator = container.querySelector('div');
    expect(indicator).not.toHaveAttribute('title');
  });

  it('has base classes', () => {
    const { container } = render(<ColorIndicator entity={mockEntity} entityType="project" />);
    const indicator = container.querySelector('div');
    expect(indicator).toHaveClass('inline-block', 'border');
  });
});

describe('ProjectColorIndicator', () => {
  const mockProject = {
    id: 'p1',
    color: '#10b981',
    pattern: null,
  };

  it('renders project color indicator', () => {
    const { container } = render(<ProjectColorIndicator project={mockProject} />);
    const indicator = container.querySelector('div');
    expect(indicator).toBeInTheDocument();
  });

  it('sets default tooltip text for project', () => {
    const { container } = render(<ProjectColorIndicator project={mockProject} showTooltip={true} />);
    const indicator = container.querySelector('div');
    expect(indicator).toHaveAttribute('title', 'Project color');
  });

  it('accepts size prop', () => {
    const { container } = render(<ProjectColorIndicator project={mockProject} size="lg" />);
    const indicator = container.querySelector('div');
    expect(indicator).toHaveClass('w-6', 'h-6');
  });

  it('accepts shape prop', () => {
    const { container } = render(<ProjectColorIndicator project={mockProject} shape="square" />);
    const indicator = container.querySelector('div');
    expect(indicator).toHaveClass('rounded-sm');
  });
});

describe('OperatorColorIndicator', () => {
  const mockOperator = {
    id: 'o1',
    color: '#f59e0b',
    pattern: null,
  };

  it('renders operator color indicator', () => {
    const { container } = render(<OperatorColorIndicator operator={mockOperator} />);
    const indicator = container.querySelector('div');
    expect(indicator).toBeInTheDocument();
  });

  it('sets default tooltip text for operator', () => {
    const { container } = render(<OperatorColorIndicator operator={mockOperator} showTooltip={true} />);
    const indicator = container.querySelector('div');
    expect(indicator).toHaveAttribute('title', 'Operator color');
  });

  it('accepts size prop', () => {
    const { container } = render(<OperatorColorIndicator operator={mockOperator} size="sm" />);
    const indicator = container.querySelector('div');
    expect(indicator).toHaveClass('w-3', 'h-3');
  });
});

describe('MachineColorIndicator', () => {
  const mockMachine = {
    id: 'm1',
    color: '#8b5cf6',
    pattern: null,
  };

  it('renders machine color indicator', () => {
    const { container } = render(<MachineColorIndicator machine={mockMachine} />);
    const indicator = container.querySelector('div');
    expect(indicator).toBeInTheDocument();
  });

  it('sets default tooltip text for machine', () => {
    const { container } = render(<MachineColorIndicator machine={mockMachine} showTooltip={true} />);
    const indicator = container.querySelector('div');
    expect(indicator).toHaveAttribute('title', 'Machine color');
  });

  it('accepts className prop', () => {
    const { container } = render(<MachineColorIndicator machine={mockMachine} className="machine-custom" />);
    const indicator = container.querySelector('div');
    expect(indicator).toHaveClass('machine-custom');
  });
});
