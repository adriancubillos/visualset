import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TableActions from '@/components/ui/TableActions';

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('TableActions', () => {
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    mockOnDelete.mockClear();
  });

  it('renders edit link with correct href', () => {
    render(<TableActions itemId="123" editPath="/edit/123" onDelete={mockOnDelete} />);
    const editLink = screen.getByTitle('Edit');
    expect(editLink).toHaveAttribute('href', '/edit/123');
  });

  it('renders delete button', () => {
    render(<TableActions itemId="123" editPath="/edit/123" onDelete={mockOnDelete} />);
    const deleteButton = screen.getByTitle('Delete');
    expect(deleteButton).toBeInTheDocument();
  });

  it('calls onDelete with itemId when delete button is clicked', async () => {
    const user = userEvent.setup();
    render(<TableActions itemId="123" editPath="/edit/123" onDelete={mockOnDelete} />);
    
    const deleteButton = screen.getByTitle('Delete');
    await user.click(deleteButton);
    
    expect(mockOnDelete).toHaveBeenCalledWith('123', undefined);
  });

  it('calls onDelete with itemId and itemName when provided', async () => {
    const user = userEvent.setup();
    render(
      <TableActions itemId="123" itemName="Test Item" editPath="/edit/123" onDelete={mockOnDelete} />
    );
    
    const deleteButton = screen.getByTitle('Delete');
    await user.click(deleteButton);
    
    expect(mockOnDelete).toHaveBeenCalledWith('123', 'Test Item');
  });

  it('renders extra actions when provided', () => {
    const extraActions = <button data-testid="extra-action">Extra</button>;
    render(
      <TableActions itemId="123" editPath="/edit/123" onDelete={mockOnDelete} extraActions={extraActions} />
    );
    
    expect(screen.getByTestId('extra-action')).toBeInTheDocument();
  });

  it('does not render extra actions when not provided', () => {
    render(<TableActions itemId="123" editPath="/edit/123" onDelete={mockOnDelete} />);
    expect(screen.queryByTestId('extra-action')).not.toBeInTheDocument();
  });

  it('has correct CSS classes for edit link', () => {
    render(<TableActions itemId="123" editPath="/edit/123" onDelete={mockOnDelete} />);
    const editLink = screen.getByTitle('Edit');
    expect(editLink).toHaveClass('text-blue-600', 'hover:text-blue-900', 'p-1', 'rounded', 'hover:bg-blue-50');
  });

  it('has correct CSS classes for delete button', () => {
    render(<TableActions itemId="123" editPath="/edit/123" onDelete={mockOnDelete} />);
    const deleteButton = screen.getByTitle('Delete');
    expect(deleteButton).toHaveClass('text-red-600', 'hover:text-red-900', 'p-1', 'rounded', 'hover:bg-red-50');
  });

  it('renders edit icon SVG', () => {
    const { container } = render(<TableActions itemId="123" editPath="/edit/123" onDelete={mockOnDelete} />);
    const editIcon = container.querySelector('a[title="Edit"] svg');
    expect(editIcon).toBeInTheDocument();
    expect(editIcon).toHaveClass('w-4', 'h-4');
  });

  it('renders delete icon SVG', () => {
    const { container } = render(<TableActions itemId="123" editPath="/edit/123" onDelete={mockOnDelete} />);
    const deleteIcon = container.querySelector('button[title="Delete"] svg');
    expect(deleteIcon).toBeInTheDocument();
    expect(deleteIcon).toHaveClass('w-4', 'h-4');
  });

  it('stops propagation on edit link click', async () => {
    const user = userEvent.setup();
    const mockStopPropagation = vi.fn();
    
    render(<TableActions itemId="123" editPath="/edit/123" onDelete={mockOnDelete} />);
    const editLink = screen.getByTitle('Edit');
    
    editLink.addEventListener('click', (e) => {
      mockStopPropagation();
      e.stopPropagation = mockStopPropagation;
    });
    
    await user.click(editLink);
    expect(mockStopPropagation).toHaveBeenCalled();
  });

  it('stops propagation on delete button click', async () => {
    const user = userEvent.setup();
    const parentClickHandler = vi.fn();
    
    const { container } = render(
      <div onClick={parentClickHandler}>
        <TableActions itemId="123" editPath="/edit/123" onDelete={mockOnDelete} />
      </div>
    );
    
    const deleteButton = screen.getByTitle('Delete');
    await user.click(deleteButton);
    
    expect(mockOnDelete).toHaveBeenCalled();
    expect(parentClickHandler).not.toHaveBeenCalled();
  });
});
