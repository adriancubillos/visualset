import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskModal from '@/components/task/TaskModal';

// Mock child components
vi.mock('@/components/forms/TimeSlotsManager', () => ({
  default: ({ timeSlots, onChange }: any) => (
    <div data-testid="time-slots-manager">
      <div>Time Slots: {timeSlots.length}</div>
      <button onClick={() => onChange([...timeSlots, { startDateTime: '2024-01-01T10:00', durationMin: 60 }])}>
        Add Slot
      </button>
    </div>
  ),
}));

vi.mock('@/components/ui/Select', () => ({
  default: ({ label, value, onChange, options, placeholder }: any) => (
    <div data-testid={`select-${label.toLowerCase()}`}>
      <label>{label}</label>
      <select value={value || ''} onChange={(e) => onChange(e.target.value || null)}>
        <option value="">{placeholder}</option>
        {options.map((opt: any) => (
          <option key={opt.id} value={opt.id}>
            {opt.name}
          </option>
        ))}
      </select>
    </div>
  ),
}));

vi.mock('@/components/forms/QuantityProgress', () => ({
  default: ({ quantity, completedQuantity, onQuantityChange, onCompletedQuantityChange }: any) => (
    <div data-testid="quantity-progress">
      <input
        type="number"
        value={quantity}
        onChange={(e) => onQuantityChange(parseInt(e.target.value))}
        data-testid="quantity-input"
      />
      <input
        type="number"
        value={completedQuantity}
        onChange={(e) => onCompletedQuantityChange(parseInt(e.target.value))}
        data-testid="completed-quantity-input"
      />
    </div>
  ),
}));

vi.mock('@/components/task/TaskStatusQuickActions', () => ({
  default: ({ currentStatus, onStatusChange }: any) => (
    <div data-testid="status-quick-actions">
      <div>Current Status: {currentStatus}</div>
      <button onClick={() => onStatusChange('IN_PROGRESS')}>Start</button>
      <button onClick={() => onStatusChange('COMPLETED')}>Complete</button>
    </div>
  ),
}));

vi.mock('@/utils/sorting', () => ({
  sortByName: (items: any[]) => items,
}));

describe('TaskModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();

  const mockTask = {
    id: 'task-1',
    title: 'Test Task',
    project: { id: 'proj-1', name: 'Project Alpha' },
    item: { id: 'item-1', name: 'Item 1' },
    machine: { id: 'machine-1', name: 'Machine 1' },
    operator: { id: 'op-1', name: 'John Doe' },
    quantity: 10,
    completed_quantity: 5,
    status: 'IN_PROGRESS',
    timeSlots: [
      {
        id: 'slot-1',
        startDateTime: '2024-01-01T10:00:00Z',
        endDateTime: '2024-01-01T12:00:00Z',
        durationMin: 120,
      },
    ],
  };

  const mockMachines = [
    { id: 'machine-1', name: 'Machine 1' },
    { id: 'machine-2', name: 'Machine 2' },
  ];

  const mockOperators = [
    { id: 'op-1', name: 'John Doe' },
    { id: 'op-2', name: 'Jane Smith' },
  ];

  const mockItems = [
    { id: 'item-1', name: 'Item 1', project: { name: 'Project Alpha' } },
    { id: 'item-2', name: 'Item 2', project: { name: 'Project Beta' } },
  ];

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnSave.mockClear();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <TaskModal
        isOpen={false}
        onClose={mockOnClose}
        task={mockTask}
        onSave={mockOnSave}
        machines={mockMachines}
        operators={mockOperators}
        items={mockItems}
      />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('does not render when task is null', () => {
    const { container } = render(
      <TaskModal
        isOpen={true}
        onClose={mockOnClose}
        task={null}
        onSave={mockOnSave}
        machines={mockMachines}
        operators={mockOperators}
        items={mockItems}
      />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('renders modal when isOpen is true and task is provided', () => {
    render(
      <TaskModal
        isOpen={true}
        onClose={mockOnClose}
        task={mockTask}
        onSave={mockOnSave}
        machines={mockMachines}
        operators={mockOperators}
        items={mockItems}
      />
    );
    
    expect(screen.getByText('Update Task')).toBeInTheDocument();
  });

  it('displays task title in header', () => {
    render(
      <TaskModal
        isOpen={true}
        onClose={mockOnClose}
        task={mockTask}
        onSave={mockOnSave}
        machines={mockMachines}
        operators={mockOperators}
        items={mockItems}
      />
    );
    
    expect(screen.getByText(/Test Task/)).toBeInTheDocument();
  });

  it('displays project name', () => {
    render(
      <TaskModal
        isOpen={true}
        onClose={mockOnClose}
        task={mockTask}
        onSave={mockOnSave}
        machines={mockMachines}
        operators={mockOperators}
        items={mockItems}
      />
    );
    
    expect(screen.getByText('Project Alpha')).toBeInTheDocument();
  });

  it('displays item name', () => {
    render(
      <TaskModal
        isOpen={true}
        onClose={mockOnClose}
        task={mockTask}
        onSave={mockOnSave}
        machines={mockMachines}
        operators={mockOperators}
        items={mockItems}
      />
    );
    
    expect(screen.getByText('Item 1')).toBeInTheDocument();
  });

  it('displays "No Project" when project is not set', () => {
    const taskWithoutProject = { ...mockTask, project: null };
    render(
      <TaskModal
        isOpen={true}
        onClose={mockOnClose}
        task={taskWithoutProject}
        onSave={mockOnSave}
        machines={mockMachines}
        operators={mockOperators}
        items={mockItems}
      />
    );
    
    expect(screen.getByText('No Project')).toBeInTheDocument();
  });

  it('displays "No Item" when item is not set', () => {
    const taskWithoutItem = { ...mockTask, item: null };
    render(
      <TaskModal
        isOpen={true}
        onClose={mockOnClose}
        task={taskWithoutItem}
        onSave={mockOnSave}
        machines={mockMachines}
        operators={mockOperators}
        items={mockItems}
      />
    );
    
    expect(screen.getByText('No Item')).toBeInTheDocument();
  });

  it('renders operator select', () => {
    render(
      <TaskModal
        isOpen={true}
        onClose={mockOnClose}
        task={mockTask}
        onSave={mockOnSave}
        machines={mockMachines}
        operators={mockOperators}
        items={mockItems}
      />
    );
    
    expect(screen.getByTestId('select-operator')).toBeInTheDocument();
  });

  it('renders machine select', () => {
    render(
      <TaskModal
        isOpen={true}
        onClose={mockOnClose}
        task={mockTask}
        onSave={mockOnSave}
        machines={mockMachines}
        operators={mockOperators}
        items={mockItems}
      />
    );
    
    expect(screen.getByTestId('select-machine')).toBeInTheDocument();
  });

  it('renders status quick actions', () => {
    render(
      <TaskModal
        isOpen={true}
        onClose={mockOnClose}
        task={mockTask}
        onSave={mockOnSave}
        machines={mockMachines}
        operators={mockOperators}
        items={mockItems}
      />
    );
    
    expect(screen.getByTestId('status-quick-actions')).toBeInTheDocument();
  });

  it('renders quantity progress component', () => {
    render(
      <TaskModal
        isOpen={true}
        onClose={mockOnClose}
        task={mockTask}
        onSave={mockOnSave}
        machines={mockMachines}
        operators={mockOperators}
        items={mockItems}
      />
    );
    
    expect(screen.getByTestId('quantity-progress')).toBeInTheDocument();
  });

  it('renders time slots toggle button', () => {
    render(
      <TaskModal
        isOpen={true}
        onClose={mockOnClose}
        task={mockTask}
        onSave={mockOnSave}
        machines={mockMachines}
        operators={mockOperators}
        items={mockItems}
      />
    );
    
    expect(screen.getByText('Schedule Time Slots')).toBeInTheDocument();
  });

  it('expands time slots section when toggle is clicked', async () => {
    const user = userEvent.setup();
    render(
      <TaskModal
        isOpen={true}
        onClose={mockOnClose}
        task={mockTask}
        onSave={mockOnSave}
        machines={mockMachines}
        operators={mockOperators}
        items={mockItems}
      />
    );
    
    const toggleButton = screen.getByText('Schedule Time Slots');
    await user.click(toggleButton);
    
    expect(screen.getByTestId('time-slots-manager')).toBeInTheDocument();
  });

  it('renders Cancel button', () => {
    render(
      <TaskModal
        isOpen={true}
        onClose={mockOnClose}
        task={mockTask}
        onSave={mockOnSave}
        machines={mockMachines}
        operators={mockOperators}
        items={mockItems}
      />
    );
    
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('renders Save button', () => {
    render(
      <TaskModal
        isOpen={true}
        onClose={mockOnClose}
        task={mockTask}
        onSave={mockOnSave}
        machines={mockMachines}
        operators={mockOperators}
        items={mockItems}
      />
    );
    
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('calls onClose when Cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <TaskModal
        isOpen={true}
        onClose={mockOnClose}
        task={mockTask}
        onSave={mockOnSave}
        machines={mockMachines}
        operators={mockOperators}
        items={mockItems}
      />
    );
    
    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onClose when close button (X) is clicked', async () => {
    const user = userEvent.setup();
    render(
      <TaskModal
        isOpen={true}
        onClose={mockOnClose}
        task={mockTask}
        onSave={mockOnSave}
        machines={mockMachines}
        operators={mockOperators}
        items={mockItems}
      />
    );
    
    const closeButton = screen.getByLabelText('Close');
    await user.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onSave with correct data when Save button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <TaskModal
        isOpen={true}
        onClose={mockOnClose}
        task={mockTask}
        onSave={mockOnSave}
        machines={mockMachines}
        operators={mockOperators}
        items={mockItems}
      />
    );
    
    const saveButton = screen.getByText('Save');
    await user.click(saveButton);
    
    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        machineId: 'machine-1',
        operatorId: 'op-1',
        quantity: 10,
        completed_quantity: 5,
        status: 'IN_PROGRESS',
      })
    );
  });

  it('initializes with task values', () => {
    render(
      <TaskModal
        isOpen={true}
        onClose={mockOnClose}
        task={mockTask}
        onSave={mockOnSave}
        machines={mockMachines}
        operators={mockOperators}
        items={mockItems}
      />
    );
    
    const quantityInput = screen.getByTestId('quantity-input') as HTMLInputElement;
    expect(quantityInput.value).toBe('10');
  });

  it('creates default time slot when task has no time slots', () => {
    const taskWithoutSlots = { ...mockTask, timeSlots: [] };
    render(
      <TaskModal
        isOpen={true}
        onClose={mockOnClose}
        task={taskWithoutSlots}
        onSave={mockOnSave}
        machines={mockMachines}
        operators={mockOperators}
        items={mockItems}
      />
    );
    
    // Component should render without errors
    expect(screen.getByText('Update Task')).toBeInTheDocument();
  });

  it('handles task without machine', () => {
    const taskWithoutMachine = { ...mockTask, machine: null };
    render(
      <TaskModal
        isOpen={true}
        onClose={mockOnClose}
        task={taskWithoutMachine}
        onSave={mockOnSave}
        machines={mockMachines}
        operators={mockOperators}
        items={mockItems}
      />
    );
    
    expect(screen.getByTestId('select-machine')).toBeInTheDocument();
  });

  it('handles task without operator', () => {
    const taskWithoutOperator = { ...mockTask, operator: null };
    render(
      <TaskModal
        isOpen={true}
        onClose={mockOnClose}
        task={taskWithoutOperator}
        onSave={mockOnSave}
        machines={mockMachines}
        operators={mockOperators}
        items={mockItems}
      />
    );
    
    expect(screen.getByTestId('select-operator')).toBeInTheDocument();
  });

  it('updates quantity when changed', async () => {
    const user = userEvent.setup();
    render(
      <TaskModal
        isOpen={true}
        onClose={mockOnClose}
        task={mockTask}
        onSave={mockOnSave}
        machines={mockMachines}
        operators={mockOperators}
        items={mockItems}
      />
    );
    
    const quantityInput = screen.getByTestId('quantity-input');
    await user.clear(quantityInput);
    await user.type(quantityInput, '20');
    
    const saveButton = screen.getByText('Save');
    await user.click(saveButton);
    
    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        quantity: 20,
      })
    );
  });

  it('updates completed quantity when changed', async () => {
    const user = userEvent.setup();
    render(
      <TaskModal
        isOpen={true}
        onClose={mockOnClose}
        task={mockTask}
        onSave={mockOnSave}
        machines={mockMachines}
        operators={mockOperators}
        items={mockItems}
      />
    );
    
    const completedInput = screen.getByTestId('completed-quantity-input');
    await user.clear(completedInput);
    await user.type(completedInput, '8');
    
    const saveButton = screen.getByText('Save');
    await user.click(saveButton);
    
    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        completed_quantity: 8,
      })
    );
  });

  it('updates status when changed', async () => {
    const user = userEvent.setup();
    render(
      <TaskModal
        isOpen={true}
        onClose={mockOnClose}
        task={mockTask}
        onSave={mockOnSave}
        machines={mockMachines}
        operators={mockOperators}
        items={mockItems}
      />
    );
    
    const completeButton = screen.getByText('Complete');
    await user.click(completeButton);
    
    const saveButton = screen.getByText('Save');
    await user.click(saveButton);
    
    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'COMPLETED',
      })
    );
  });

  it('has proper modal styling', () => {
    const { container } = render(
      <TaskModal
        isOpen={true}
        onClose={mockOnClose}
        task={mockTask}
        onSave={mockOnSave}
        machines={mockMachines}
        operators={mockOperators}
        items={mockItems}
      />
    );
    
    const modal = container.querySelector('.fixed.inset-0');
    expect(modal).toBeInTheDocument();
  });

  it('renders with max height constraint', () => {
    const { container } = render(
      <TaskModal
        isOpen={true}
        onClose={mockOnClose}
        task={mockTask}
        onSave={mockOnSave}
        machines={mockMachines}
        operators={mockOperators}
        items={mockItems}
      />
    );
    
    const modalContent = container.querySelector('.max-h-\\[90vh\\]');
    expect(modalContent).toBeInTheDocument();
  });

  it('handles selectedSlotIndex prop', () => {
    render(
      <TaskModal
        isOpen={true}
        onClose={mockOnClose}
        task={mockTask}
        selectedSlotIndex={0}
        onSave={mockOnSave}
        machines={mockMachines}
        operators={mockOperators}
        items={mockItems}
      />
    );
    
    expect(screen.getByText('Update Task')).toBeInTheDocument();
  });
});
