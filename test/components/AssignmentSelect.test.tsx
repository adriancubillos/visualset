import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AssignmentSelect from '@/components/forms/AssignmentSelect';

// Mock the Select component
vi.mock('@/components/ui/Select', () => ({
  default: ({ label, value, onChange, options, placeholder }: any) => (
    <div>
      <label>{label}</label>
      <select
        data-testid="select"
        value={value || ''}
        onChange={(e) => onChange(e.target.value || null)}
      >
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

// Mock sortByName utility
vi.mock('@/utils/sorting', () => ({
  sortByName: (items: any[]) => items,
}));

describe('AssignmentSelect', () => {
  const mockOnChange = vi.fn();
  const mockOptions = [
    { id: 'm1', name: 'Machine 1' },
    { id: 'm2', name: 'Machine 2' },
    { id: 'm3', name: 'Machine 3' },
  ];

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders label', () => {
    render(
      <AssignmentSelect
        id="machine"
        name="machineId"
        label="Machine"
        value=""
        options={mockOptions}
        onChange={mockOnChange}
      />
    );
    expect(screen.getByText('Machine')).toBeInTheDocument();
  });

  it('renders label with asterisk when required', () => {
    render(
      <AssignmentSelect
        id="machine"
        name="machineId"
        label="Machine"
        value=""
        options={mockOptions}
        onChange={mockOnChange}
        required={true}
      />
    );
    expect(screen.getByText('Machine *')).toBeInTheDocument();
  });

  it('renders label without asterisk when not required', () => {
    render(
      <AssignmentSelect
        id="machine"
        name="machineId"
        label="Machine"
        value=""
        options={mockOptions}
        onChange={mockOnChange}
        required={false}
      />
    );
    expect(screen.getByText('Machine')).toBeInTheDocument();
    expect(screen.queryByText('Machine *')).not.toBeInTheDocument();
  });

  it('uses custom placeholder when provided', () => {
    render(
      <AssignmentSelect
        id="machine"
        name="machineId"
        label="Machine"
        value=""
        options={mockOptions}
        onChange={mockOnChange}
        placeholder="Choose a machine"
      />
    );
    expect(screen.getByText('Choose a machine')).toBeInTheDocument();
  });

  it('uses default "No Machine Required" for machine label', () => {
    render(
      <AssignmentSelect
        id="machine"
        name="machineId"
        label="Machine"
        value=""
        options={mockOptions}
        onChange={mockOnChange}
      />
    );
    expect(screen.getByText('No Machine Required')).toBeInTheDocument();
  });

  it('uses default "Unassigned" for operator label', () => {
    render(
      <AssignmentSelect
        id="operator"
        name="operatorId"
        label="Operator"
        value=""
        options={mockOptions}
        onChange={mockOnChange}
      />
    );
    expect(screen.getByText('Unassigned')).toBeInTheDocument();
  });

  it('uses generic default for other labels', () => {
    render(
      <AssignmentSelect
        id="project"
        name="projectId"
        label="Project"
        value=""
        options={mockOptions}
        onChange={mockOnChange}
      />
    );
    expect(screen.getByText('No Project')).toBeInTheDocument();
  });

  it('uses custom noSelectionText when provided', () => {
    render(
      <AssignmentSelect
        id="machine"
        name="machineId"
        label="Machine"
        value=""
        options={mockOptions}
        onChange={mockOnChange}
        noSelectionText="None Selected"
      />
    );
    expect(screen.getByText('None Selected')).toBeInTheDocument();
  });

  it('uses "Select a [label]" placeholder when required', () => {
    render(
      <AssignmentSelect
        id="machine"
        name="machineId"
        label="Machine"
        value=""
        options={mockOptions}
        onChange={mockOnChange}
        required={true}
      />
    );
    expect(screen.getByText('Select a Machine')).toBeInTheDocument();
  });

  it('renders all options', () => {
    render(
      <AssignmentSelect
        id="machine"
        name="machineId"
        label="Machine"
        value=""
        options={mockOptions}
        onChange={mockOnChange}
      />
    );
    
    expect(screen.getByText('Machine 1')).toBeInTheDocument();
    expect(screen.getByText('Machine 2')).toBeInTheDocument();
    expect(screen.getByText('Machine 3')).toBeInTheDocument();
  });

  it('calls onChange when selection changes', async () => {
    const user = userEvent.setup();
    render(
      <AssignmentSelect
        id="machine"
        name="machineId"
        label="Machine"
        value=""
        options={mockOptions}
        onChange={mockOnChange}
      />
    );
    
    const select = screen.getByTestId('select');
    await user.selectOptions(select, 'm1');
    
    expect(mockOnChange).toHaveBeenCalledWith('m1');
  });

  it('calls onChange with empty string when null is selected', async () => {
    const user = userEvent.setup();
    render(
      <AssignmentSelect
        id="machine"
        name="machineId"
        label="Machine"
        value="m1"
        options={mockOptions}
        onChange={mockOnChange}
      />
    );
    
    const select = screen.getByTestId('select');
    await user.selectOptions(select, '');
    
    expect(mockOnChange).toHaveBeenCalledWith('');
  });

  it('renders hidden input with correct attributes', () => {
    const { container } = render(
      <AssignmentSelect
        id="machine"
        name="machineId"
        label="Machine"
        value="m1"
        options={mockOptions}
        onChange={mockOnChange}
      />
    );
    
    const hiddenInput = container.querySelector('input[type="hidden"]') as HTMLInputElement;
    expect(hiddenInput).toBeInTheDocument();
    expect(hiddenInput).toHaveAttribute('id', 'machine');
    expect(hiddenInput).toHaveAttribute('name', 'machineId');
    expect(hiddenInput.value).toBe('m1');
  });

  it('applies custom className', () => {
    const { container } = render(
      <AssignmentSelect
        id="machine"
        name="machineId"
        label="Machine"
        value=""
        options={mockOptions}
        onChange={mockOnChange}
        className="custom-class"
      />
    );
    
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('handles empty value correctly', () => {
    const { container } = render(
      <AssignmentSelect
        id="machine"
        name="machineId"
        label="Machine"
        value=""
        options={mockOptions}
        onChange={mockOnChange}
      />
    );
    
    const hiddenInput = container.querySelector('input[type="hidden"]') as HTMLInputElement;
    expect(hiddenInput.value).toBe('');
  });

  it('passes value to Select component', () => {
    render(
      <AssignmentSelect
        id="machine"
        name="machineId"
        label="Machine"
        value="m2"
        options={mockOptions}
        onChange={mockOnChange}
      />
    );
    
    const select = screen.getByTestId('select') as HTMLSelectElement;
    expect(select.value).toBe('m2');
  });

  it('handles case-insensitive machine label detection', () => {
    render(
      <AssignmentSelect
        id="test"
        name="testId"
        label="CNC Machine"
        value=""
        options={mockOptions}
        onChange={mockOnChange}
      />
    );
    expect(screen.getByText('No Machine Required')).toBeInTheDocument();
  });

  it('handles case-insensitive operator label detection', () => {
    render(
      <AssignmentSelect
        id="test"
        name="testId"
        label="Operator Assignment"
        value=""
        options={mockOptions}
        onChange={mockOnChange}
      />
    );
    expect(screen.getByText('Unassigned')).toBeInTheDocument();
  });
});
