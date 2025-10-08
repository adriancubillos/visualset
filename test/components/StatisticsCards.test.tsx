import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatisticsCards from '@/components/ui/StatisticsCards';

describe('StatisticsCards', () => {
  const mockStats = [
    { label: 'Total Users', value: 1250, color: 'blue' as const },
    { label: 'Active Projects', value: 42, color: 'green' as const },
    { label: 'Pending Tasks', value: 18, color: 'yellow' as const },
  ];

  it('renders statistics cards', () => {
    render(<StatisticsCards stats={mockStats} />);
    
    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('1,250')).toBeInTheDocument();
    expect(screen.getByText('Active Projects')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('formats large numbers with commas', () => {
    const stats = [{ label: 'Revenue', value: 1234567 }];
    render(<StatisticsCards stats={stats} />);
    
    expect(screen.getByText('1,234,567')).toBeInTheDocument();
  });

  it('applies correct color classes', () => {
    const { container } = render(<StatisticsCards stats={mockStats} />);
    
    expect(container.querySelector('.text-blue-600')).toBeInTheDocument();
    expect(container.querySelector('.text-green-600')).toBeInTheDocument();
    expect(container.querySelector('.text-yellow-600')).toBeInTheDocument();
  });

  it('renders change indicators when provided', () => {
    const statsWithChange = [
      { label: 'Sales', value: 100, change: '+12%', changeType: 'increase' as const },
      { label: 'Costs', value: 50, change: '-5%', changeType: 'decrease' as const },
    ];
    render(<StatisticsCards stats={statsWithChange} />);
    
    expect(screen.getByText('+12%')).toBeInTheDocument();
    expect(screen.getByText('-5%')).toBeInTheDocument();
  });

  it('applies correct change type colors', () => {
    const statsWithChange = [
      { label: 'Increase', value: 100, change: '+12%', changeType: 'increase' as const },
      { label: 'Decrease', value: 50, change: '-5%', changeType: 'decrease' as const },
      { label: 'Neutral', value: 75, change: '0%', changeType: 'neutral' as const },
    ];
    const { container } = render(<StatisticsCards stats={statsWithChange} />);
    
    const changes = container.querySelectorAll('.text-sm');
    expect(changes[1]).toHaveClass('text-green-600'); // increase
    expect(changes[3]).toHaveClass('text-red-600'); // decrease
    expect(changes[5]).toHaveClass('text-gray-600'); // neutral
  });

  it('shows loading skeleton when loading is true', () => {
    const { container } = render(<StatisticsCards stats={mockStats} loading={true} />);
    
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons).toHaveLength(4); // Default showSkeletonCount
  });

  it('shows custom number of skeleton cards', () => {
    const { container } = render(
      <StatisticsCards stats={mockStats} loading={true} showSkeletonCount={6} />
    );
    
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons).toHaveLength(6);
  });

  it('does not render stats when loading', () => {
    render(<StatisticsCards stats={mockStats} loading={true} />);
    
    expect(screen.queryByText('Total Users')).not.toBeInTheDocument();
  });

  it('hides when all values are zero and showWhenEmpty is false', () => {
    const emptyStats = [
      { label: 'Empty 1', value: 0 },
      { label: 'Empty 2', value: 0 },
    ];
    const { container } = render(<StatisticsCards stats={emptyStats} showWhenEmpty={false} />);
    
    expect(container.firstChild).toBeNull();
  });

  it('shows when all values are zero and showWhenEmpty is true', () => {
    const emptyStats = [
      { label: 'Empty 1', value: 0 },
      { label: 'Empty 2', value: 0 },
    ];
    render(<StatisticsCards stats={emptyStats} showWhenEmpty={true} />);
    
    expect(screen.getByText('Empty 1')).toBeInTheDocument();
    expect(screen.getAllByText('0')).toHaveLength(2);
  });

  it('shows when at least one value is non-zero', () => {
    const mixedStats = [
      { label: 'Zero', value: 0 },
      { label: 'Non-zero', value: 5 },
    ];
    render(<StatisticsCards stats={mixedStats} showWhenEmpty={false} />);
    
    expect(screen.getByText('Zero')).toBeInTheDocument();
    expect(screen.getByText('Non-zero')).toBeInTheDocument();
  });

  it('applies auto grid layout for 3 items', () => {
    const { container } = render(<StatisticsCards stats={mockStats} columns="auto" />);
    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-3');
  });

  it('applies auto grid layout for 4 items', () => {
    const fourStats = [...mockStats, { label: 'Fourth', value: 10 }];
    const { container } = render(<StatisticsCards stats={fourStats} columns="auto" />);
    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-4');
  });

  it('applies auto grid layout for 5 items', () => {
    const fiveStats = [...mockStats, { label: 'Fourth', value: 10 }, { label: 'Fifth', value: 20 }];
    const { container } = render(<StatisticsCards stats={fiveStats} columns="auto" />);
    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-5');
  });

  it('applies auto grid layout for 6+ items', () => {
    const sixStats = [...mockStats, { label: '4', value: 1 }, { label: '5', value: 2 }, { label: '6', value: 3 }];
    const { container } = render(<StatisticsCards stats={sixStats} columns="auto" />);
    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-6');
  });

  it('applies fixed 2 column layout', () => {
    const { container } = render(<StatisticsCards stats={mockStats} columns={2} />);
    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-2');
  });

  it('applies fixed 3 column layout', () => {
    const { container } = render(<StatisticsCards stats={mockStats} columns={3} />);
    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-3');
  });

  it('applies fixed 4 column layout', () => {
    const { container } = render(<StatisticsCards stats={mockStats} columns={4} />);
    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-4');
  });

  it('applies default gray color when no color specified', () => {
    const stats = [{ label: 'Default', value: 100 }];
    const { container } = render(<StatisticsCards stats={stats} />);
    
    expect(container.querySelector('.text-gray-900')).toBeInTheDocument();
  });

  it('applies all available colors correctly', () => {
    const colorStats = [
      { label: 'Gray', value: 1, color: 'gray' as const },
      { label: 'Green', value: 2, color: 'green' as const },
      { label: 'Blue', value: 3, color: 'blue' as const },
      { label: 'Yellow', value: 4, color: 'yellow' as const },
      { label: 'Red', value: 5, color: 'red' as const },
      { label: 'Orange', value: 6, color: 'orange' as const },
      { label: 'Purple', value: 7, color: 'purple' as const },
      { label: 'Indigo', value: 8, color: 'indigo' as const },
    ];
    const { container } = render(<StatisticsCards stats={colorStats} />);
    
    expect(container.querySelector('.text-gray-900')).toBeInTheDocument();
    expect(container.querySelector('.text-green-600')).toBeInTheDocument();
    expect(container.querySelector('.text-blue-600')).toBeInTheDocument();
    expect(container.querySelector('.text-yellow-600')).toBeInTheDocument();
    expect(container.querySelector('.text-red-600')).toBeInTheDocument();
    expect(container.querySelector('.text-orange-600')).toBeInTheDocument();
    expect(container.querySelector('.text-purple-600')).toBeInTheDocument();
    expect(container.querySelector('.text-indigo-600')).toBeInTheDocument();
  });

  it('renders without change indicator when not provided', () => {
    const stats = [{ label: 'No Change', value: 100 }];
    const { container } = render(<StatisticsCards stats={stats} />);
    
    const changeElements = container.querySelectorAll('.text-sm');
    // Only label should be present, not change indicator
    expect(changeElements).toHaveLength(1);
  });

  it('has correct card styling', () => {
    const { container } = render(<StatisticsCards stats={mockStats} />);
    
    const cards = container.querySelectorAll('.bg-white.rounded-lg.shadow.p-4');
    expect(cards).toHaveLength(3);
  });
});
