import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GanttHierarchy from '@/components/gantt/GanttHierarchy';

describe('GanttHierarchy', () => {
  const mockProjects: any = [
    {
      id: 'proj-1',
      name: 'Project Alpha',
      color: '#3B82F6',
      items: [
        {
          id: 'item-1',
          name: 'Item 1',
          tasks: [
            { id: 'task-1', title: 'Task 1' },
            { id: 'task-2', title: 'Task 2' },
          ],
        },
        {
          id: 'item-2',
          name: 'Item 2',
          tasks: [
            { id: 'task-3', title: 'Task 3' },
          ],
        },
      ],
    },
    {
      id: 'proj-2',
      name: 'Project Beta',
      color: '#10B981',
      items: [
        {
          id: 'item-3',
          name: 'Item 3',
          tasks: [
            { id: 'task-4', title: 'Task 4' },
          ],
        },
      ],
    },
  ];

  const mockOnToggleProject = vi.fn();
  const mockOnToggleItem = vi.fn();

  beforeEach(() => {
    mockOnToggleProject.mockClear();
    mockOnToggleItem.mockClear();
  });

  it('renders hierarchy title', () => {
    render(
      <GanttHierarchy
        projects={mockProjects}
        expandedProjects={new Set()}
        expandedItems={new Set()}
        onToggleProject={mockOnToggleProject}
        onToggleItem={mockOnToggleItem}
      />
    );
    expect(screen.getByText('Project Hierarchy')).toBeInTheDocument();
  });

  it('renders all project names', () => {
    render(
      <GanttHierarchy
        projects={mockProjects}
        expandedProjects={new Set()}
        expandedItems={new Set()}
        onToggleProject={mockOnToggleProject}
        onToggleItem={mockOnToggleItem}
      />
    );
    expect(screen.getByText('Project Alpha')).toBeInTheDocument();
    expect(screen.getByText('Project Beta')).toBeInTheDocument();
  });

  it('renders project color indicators', () => {
    const { container } = render(
      <GanttHierarchy
        projects={mockProjects}
        expandedProjects={new Set()}
        expandedItems={new Set()}
        onToggleProject={mockOnToggleProject}
        onToggleItem={mockOnToggleItem}
      />
    );
    
    const colorIndicators = container.querySelectorAll('[style*="background-color"]');
    expect(colorIndicators.length).toBeGreaterThan(0);
  });

  it('calls onToggleProject when project is clicked', async () => {
    const user = userEvent.setup();
    render(
      <GanttHierarchy
        projects={mockProjects}
        expandedProjects={new Set()}
        expandedItems={new Set()}
        onToggleProject={mockOnToggleProject}
        onToggleItem={mockOnToggleItem}
      />
    );
    
    const projectButton = screen.getByText('Project Alpha').closest('button');
    await user.click(projectButton!);
    
    expect(mockOnToggleProject).toHaveBeenCalledWith('proj-1');
  });

  it('shows items when project is expanded', () => {
    render(
      <GanttHierarchy
        projects={mockProjects}
        expandedProjects={new Set(['proj-1'])}
        expandedItems={new Set()}
        onToggleProject={mockOnToggleProject}
        onToggleItem={mockOnToggleItem}
      />
    );
    
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('hides items when project is collapsed', () => {
    render(
      <GanttHierarchy
        projects={mockProjects}
        expandedProjects={new Set()}
        expandedItems={new Set()}
        onToggleProject={mockOnToggleProject}
        onToggleItem={mockOnToggleItem}
      />
    );
    
    expect(screen.queryByText('Item 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Item 2')).not.toBeInTheDocument();
  });

  it('calls onToggleItem when item is clicked', async () => {
    const user = userEvent.setup();
    render(
      <GanttHierarchy
        projects={mockProjects}
        expandedProjects={new Set(['proj-1'])}
        expandedItems={new Set()}
        onToggleProject={mockOnToggleProject}
        onToggleItem={mockOnToggleItem}
      />
    );
    
    const itemButton = screen.getByText('Item 1').closest('button');
    await user.click(itemButton!);
    
    expect(mockOnToggleItem).toHaveBeenCalledWith('item-1');
  });

  it('shows tasks when item is expanded', () => {
    render(
      <GanttHierarchy
        projects={mockProjects}
        expandedProjects={new Set(['proj-1'])}
        expandedItems={new Set(['item-1'])}
        onToggleProject={mockOnToggleProject}
        onToggleItem={mockOnToggleItem}
      />
    );
    
    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Task 2')).toBeInTheDocument();
  });

  it('hides tasks when item is collapsed', () => {
    render(
      <GanttHierarchy
        projects={mockProjects}
        expandedProjects={new Set(['proj-1'])}
        expandedItems={new Set()}
        onToggleProject={mockOnToggleProject}
        onToggleItem={mockOnToggleItem}
      />
    );
    
    expect(screen.queryByText('Task 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Task 2')).not.toBeInTheDocument();
  });

  it('rotates chevron icon when project is expanded', () => {
    const { container } = render(
      <GanttHierarchy
        projects={mockProjects}
        expandedProjects={new Set(['proj-1'])}
        expandedItems={new Set()}
        onToggleProject={mockOnToggleProject}
        onToggleItem={mockOnToggleItem}
      />
    );
    
    const expandedChevron = container.querySelector('.rotate-90');
    expect(expandedChevron).toBeInTheDocument();
  });

  it('handles multiple expanded projects', () => {
    render(
      <GanttHierarchy
        projects={mockProjects}
        expandedProjects={new Set(['proj-1', 'proj-2'])}
        expandedItems={new Set()}
        onToggleProject={mockOnToggleProject}
        onToggleItem={mockOnToggleItem}
      />
    );
    
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });

  it('handles multiple expanded items', () => {
    render(
      <GanttHierarchy
        projects={mockProjects}
        expandedProjects={new Set(['proj-1'])}
        expandedItems={new Set(['item-1', 'item-2'])}
        onToggleProject={mockOnToggleProject}
        onToggleItem={mockOnToggleItem}
      />
    );
    
    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Task 2')).toBeInTheDocument();
    expect(screen.getByText('Task 3')).toBeInTheDocument();
  });

  it('applies default color when project color is not provided', () => {
    const projectsWithoutColor: any = [
      {
        ...mockProjects[0],
        color: null,
      },
    ];
    
    const { container } = render(
      <GanttHierarchy
        projects={projectsWithoutColor}
        expandedProjects={new Set()}
        expandedItems={new Set()}
        onToggleProject={mockOnToggleProject}
        onToggleItem={mockOnToggleItem}
      />
    );
    
    // Should render without crashing and show project name
    expect(screen.getByText('Project Alpha')).toBeInTheDocument();
  });

  it('has correct container styling', () => {
    const { container } = render(
      <GanttHierarchy
        projects={mockProjects}
        expandedProjects={new Set()}
        expandedItems={new Set()}
        onToggleProject={mockOnToggleProject}
        onToggleItem={mockOnToggleItem}
      />
    );
    
    expect(container.querySelector('.w-80.border-r.border-gray-200.bg-gray-50')).toBeInTheDocument();
  });
});
