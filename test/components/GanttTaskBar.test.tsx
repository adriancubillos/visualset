import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import GanttTaskBar from '@/components/gantt/GanttTaskBar';

// Mock Next.js Link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('GanttTaskBar', () => {
  const mockTask = {
    id: 'task-1',
    title: 'Test Task',
    status: 'in_progress',
    startDate: new Date('2024-01-01T10:00:00'),
    endDate: new Date('2024-01-01T12:00:00'),
    durationMin: 120,
    machine: {
      id: 'machine-1',
      name: 'Machine 1',
      type: 'CNC',
    },
    operator: {
      id: 'op-1',
      name: 'John Doe',
      color: '#10B981',
    },
    project: {
      id: 'proj-1',
      name: 'Project A',
      color: '#3B82F6',
    },
  };

  it('renders task title', () => {
    render(<GanttTaskBar task={mockTask} left={100} width={200} />);
    const titles = screen.getAllByText('Test Task');
    expect(titles.length).toBeGreaterThan(0);
  });

  it('applies correct positioning', () => {
    const { container } = render(<GanttTaskBar task={mockTask} left={150} width={250} />);
    const taskBar = container.querySelector('[style*="left"]');
    
    expect(taskBar).toHaveStyle({ left: '150px', width: '250px' });
  });

  it('applies completed status color', () => {
    const completedTask = { ...mockTask, status: 'completed' };
    const { container } = render(<GanttTaskBar task={completedTask} left={100} width={200} />);
    
    expect(container.querySelector('.bg-green-500')).toBeInTheDocument();
  });

  it('applies in progress status color', () => {
    const { container } = render(<GanttTaskBar task={mockTask} left={100} width={200} />);
    expect(container.querySelector('.bg-blue-500')).toBeInTheDocument();
  });

  it('applies pending status color', () => {
    const pendingTask = { ...mockTask, status: 'pending' };
    const { container } = render(<GanttTaskBar task={pendingTask} left={100} width={200} />);
    
    expect(container.querySelector('.bg-yellow-500')).toBeInTheDocument();
  });

  it('applies cancelled status color', () => {
    const cancelledTask = { ...mockTask, status: 'cancelled' };
    const { container } = render(<GanttTaskBar task={cancelledTask} left={100} width={200} />);
    
    expect(container.querySelector('.bg-red-500')).toBeInTheDocument();
  });

  it('applies default status color for unknown status', () => {
    const unknownTask = { ...mockTask, status: 'unknown' };
    const { container } = render(<GanttTaskBar task={unknownTask} left={100} width={200} />);
    
    expect(container.querySelector('.bg-gray-500')).toBeInTheDocument();
  });

  it('formats duration in minutes', () => {
    const shortTask = { ...mockTask, durationMin: 45 };
    render(<GanttTaskBar task={shortTask} left={100} width={200} />);
    
    expect(screen.getByText(/Duration: 45m/)).toBeInTheDocument();
  });

  it('formats duration in hours', () => {
    const hourTask = { ...mockTask, durationMin: 120 };
    render(<GanttTaskBar task={hourTask} left={100} width={200} />);
    
    expect(screen.getByText(/Duration: 2h/)).toBeInTheDocument();
  });

  it('formats duration in hours and minutes', () => {
    const mixedTask = { ...mockTask, durationMin: 150 };
    render(<GanttTaskBar task={mixedTask} left={100} width={200} />);
    
    expect(screen.getByText(/Duration: 2h 30m/)).toBeInTheDocument();
  });

  it('renders machine name in tooltip', () => {
    render(<GanttTaskBar task={mockTask} left={100} width={200} />);
    expect(screen.getByText(/Machine: Machine 1/)).toBeInTheDocument();
  });

  it('renders operator name in tooltip', () => {
    render(<GanttTaskBar task={mockTask} left={100} width={200} />);
    expect(screen.getByText(/Operator: John Doe/)).toBeInTheDocument();
  });

  it('renders operator initial indicator', () => {
    render(<GanttTaskBar task={mockTask} left={100} width={200} />);
    expect(screen.getByText('J')).toBeInTheDocument();
  });

  it('links to task detail page', () => {
    render(<GanttTaskBar task={mockTask} left={100} width={200} />);
    const link = screen.getByRole('link');
    
    expect(link).toHaveAttribute('href', '/tasks/task-1');
  });

  it('handles null dates gracefully', () => {
    const taskWithNullDates = { ...mockTask, startDate: null, endDate: null };
    render(<GanttTaskBar task={taskWithNullDates} left={100} width={200} />);
    
    // Should render without crashing
    const titles = screen.getAllByText('Test Task');
    expect(titles.length).toBeGreaterThan(0);
  });

  it('handles case-insensitive status matching', () => {
    const upperCaseTask = { ...mockTask, status: 'IN PROGRESS' };
    const { container } = render(<GanttTaskBar task={upperCaseTask} left={100} width={200} />);
    
    expect(container.querySelector('.bg-blue-500')).toBeInTheDocument();
  });

  it('renders operator color indicator', () => {
    const { container } = render(<GanttTaskBar task={mockTask} left={100} width={200} />);
    const colorIndicator = container.querySelector('[style*="background-color"]');
    
    expect(colorIndicator).toBeInTheDocument();
  });
});
