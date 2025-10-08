import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import GanttTimeline from '@/components/gantt/GanttTimeline';

describe('GanttTimeline', () => {
  const mockDays = [
    new Date('2024-01-08'), // Monday
    new Date('2024-01-09'), // Tuesday
    new Date('2024-01-10'), // Wednesday
    new Date('2024-01-11'), // Thursday
    new Date('2024-01-12'), // Friday
  ];

  it('renders timeline header', () => {
    render(<GanttTimeline days={mockDays} dayWidth={100} />);
    expect(screen.getByText('Project / Item / Task')).toBeInTheDocument();
  });

  it('renders all days', () => {
    const { container } = render(<GanttTimeline days={mockDays} dayWidth={100} />);
    // Check that days are rendered
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();
    // Verify we have 5 day cells
    const dayCells = container.querySelectorAll('.text-sm.font-semibold');
    expect(dayCells.length).toBe(5);
  });

  it('renders day of week', () => {
    const { container } = render(<GanttTimeline days={mockDays} dayWidth={100} />);
    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Tue')).toBeInTheDocument();
    // Verify we have day of week labels
    const dayLabels = container.querySelectorAll('.text-xs.font-medium');
    expect(dayLabels.length).toBe(5);
  });

  it('applies weekend styling to Saturday and Sunday', () => {
    const weekendDays = [
      new Date('2024-01-06'), // Saturday
      new Date('2024-01-07'), // Sunday
    ];
    const { container } = render(<GanttTimeline days={weekendDays} dayWidth={100} />);
    const weekendCells = container.querySelectorAll('.bg-gray-200');
    
    // Weekend days should have bg-gray-200 styling
    expect(weekendCells.length).toBeGreaterThan(0);
  });

  it('applies weekday styling to weekdays', () => {
    render(<GanttTimeline days={mockDays} dayWidth={100} />);
    const mondayCell = screen.getByText('Mon').closest('div');
    
    // Weekdays should have bg-gray-100 or no special weekend styling
    expect(mondayCell).not.toHaveClass('bg-gray-200');
  });

  it('applies correct width to day cells', () => {
    const { container } = render(<GanttTimeline days={mockDays} dayWidth={150} />);
    const dayCells = container.querySelectorAll('[style*="width: 150px"]');
    
    expect(dayCells.length).toBeGreaterThan(0);
  });

  it('highlights today with special styling', () => {
    const today = new Date();
    const daysWithToday = [today];
    
    const { container } = render(<GanttTimeline days={daysWithToday} dayWidth={100} />);
    const todayCell = container.querySelector('.bg-blue-100');
    
    expect(todayCell).toBeInTheDocument();
  });

  it('renders fixed header with correct width', () => {
    const { container } = render(<GanttTimeline days={mockDays} dayWidth={100} />);
    const fixedHeader = screen.getByText('Project / Item / Task').closest('div');
    
    expect(fixedHeader).toHaveClass('w-80');
  });

  it('renders border styling', () => {
    const { container } = render(<GanttTimeline days={mockDays} dayWidth={100} />);
    const timeline = container.querySelector('.border-b.border-gray-300');
    
    expect(timeline).toBeInTheDocument();
  });
});
