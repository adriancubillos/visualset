import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TimeSlotsManager, { TimeSlot } from '@/components/forms/TimeSlotsManager';

describe('TimeSlotsManager', () => {
  const mockOnChange = vi.fn();

  const mockTimeSlots: TimeSlot[] = [
    {
      id: 'slot-1',
      startDateTime: '2024-12-01T10:00',
      endDateTime: '2024-12-01T12:00',
      durationMin: 120,
    },
    {
      id: 'slot-2',
      startDateTime: '2024-12-02T14:00',
      endDateTime: '2024-12-02T15:30',
      durationMin: 90,
    },
  ];

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders add time slot button', () => {
    render(<TimeSlotsManager timeSlots={[]} onChange={mockOnChange} />);
    
    expect(screen.getByText('Add Time Slot')).toBeInTheDocument();
  });

  it('shows empty state when no time slots', () => {
    render(<TimeSlotsManager timeSlots={[]} onChange={mockOnChange} />);
    
    expect(screen.getByText('No time slots scheduled')).toBeInTheDocument();
    expect(screen.getByText('Click "Add Time Slot" to schedule this task')).toBeInTheDocument();
  });

  it('calls onChange with new slot when Add Time Slot is clicked', async () => {
    const user = userEvent.setup();
    render(<TimeSlotsManager timeSlots={[]} onChange={mockOnChange} />);
    
    const addButton = screen.getByText('Add Time Slot');
    await user.click(addButton);
    
    expect(mockOnChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          startDateTime: expect.any(String),
          endDateTime: expect.any(String),
          durationMin: 60,
        }),
      ])
    );
  });

  it('renders existing time slots', () => {
    render(<TimeSlotsManager timeSlots={mockTimeSlots} onChange={mockOnChange} />);
    
    expect(screen.getByText('Time Slot 1')).toBeInTheDocument();
    expect(screen.getByText('Time Slot 2')).toBeInTheDocument();
  });

  it('renders time slot with correct date', () => {
    const { container } = render(<TimeSlotsManager timeSlots={mockTimeSlots} onChange={mockOnChange} />);
    
    const dateInputs = container.querySelectorAll('input[type="date"]');
    expect((dateInputs[0] as HTMLInputElement).value).toBe('2024-12-01');
  });

  it('renders time slot with correct time', () => {
    const { container } = render(<TimeSlotsManager timeSlots={mockTimeSlots} onChange={mockOnChange} />);
    
    const timeInputs = container.querySelectorAll('input[type="time"]');
    expect((timeInputs[0] as HTMLInputElement).value).toBe('10:00');
  });

  it('renders time slot with correct duration', () => {
    const { container } = render(<TimeSlotsManager timeSlots={mockTimeSlots} onChange={mockOnChange} />);
    
    const durationInputs = container.querySelectorAll('input[type="number"]');
    expect((durationInputs[0] as HTMLInputElement).value).toBe('120');
  });

  it('shows duration information', () => {
    render(<TimeSlotsManager timeSlots={mockTimeSlots} onChange={mockOnChange} />);
    
    expect(screen.getByText(/Duration: 120 minutes/)).toBeInTheDocument();
  });

  it('shows end time calculation', () => {
    render(<TimeSlotsManager timeSlots={mockTimeSlots} onChange={mockOnChange} />);
    
    const endsAtTexts = screen.getAllByText(/ends at/i);
    expect(endsAtTexts.length).toBeGreaterThan(0);
  });

  it('renders delete button for each slot', () => {
    render(<TimeSlotsManager timeSlots={mockTimeSlots} onChange={mockOnChange} />);
    
    const deleteButtons = screen.getAllByRole('button').filter(btn => 
      btn.querySelector('svg path[d*="M19 7l"]')
    );
    expect(deleteButtons).toHaveLength(2);
  });

  it('calls onChange when time slot is removed', async () => {
    const user = userEvent.setup();
    render(<TimeSlotsManager timeSlots={mockTimeSlots} onChange={mockOnChange} />);
    
    const deleteButtons = screen.getAllByRole('button').filter(btn => 
      btn.querySelector('svg path[d*="M19 7l"]')
    );
    await user.click(deleteButtons[0]);
    
    expect(mockOnChange).toHaveBeenCalledWith([mockTimeSlots[1]]);
  });

  it('disables delete button when only one slot remains', () => {
    render(<TimeSlotsManager timeSlots={[mockTimeSlots[0]]} onChange={mockOnChange} />);
    
    const deleteButtons = screen.getAllByRole('button').filter(btn => 
      btn.querySelector('svg path[d*="M19 7l"]')
    );
    expect(deleteButtons[0]).toBeDisabled();
  });

  it('calls onChange when date is changed', async () => {
    const user = userEvent.setup();
    const { container } = render(<TimeSlotsManager timeSlots={mockTimeSlots} onChange={mockOnChange} />);
    
    const dateInputs = container.querySelectorAll('input[type="date"]');
    await user.clear(dateInputs[0]);
    await user.type(dateInputs[0], '2024-12-15');
    
    expect(mockOnChange).toHaveBeenCalled();
  });

  it('calls onChange when time is changed', async () => {
    const user = userEvent.setup();
    const { container } = render(<TimeSlotsManager timeSlots={mockTimeSlots} onChange={mockOnChange} />);
    
    const timeInputs = container.querySelectorAll('input[type="time"]');
    await user.click(timeInputs[0]);
    await user.keyboard('{Control>}a{/Control}14:30');
    
    expect(mockOnChange).toHaveBeenCalled();
  });

  it('calls onChange when duration is changed', async () => {
    const user = userEvent.setup();
    const { container } = render(<TimeSlotsManager timeSlots={mockTimeSlots} onChange={mockOnChange} />);
    
    const durationInputs = container.querySelectorAll('input[type="number"]');
    await user.clear(durationInputs[0]);
    await user.type(durationInputs[0], '180');
    
    expect(mockOnChange).toHaveBeenCalled();
  });

  it('auto-calculates endDateTime when duration changes', async () => {
    const user = userEvent.setup();
    const { container } = render(<TimeSlotsManager timeSlots={mockTimeSlots} onChange={mockOnChange} />);
    
    const durationInputs = container.querySelectorAll('input[type="number"]');
    await user.clear(durationInputs[0]);
    await user.type(durationInputs[0], '60');
    
    expect(mockOnChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          durationMin: 60,
          endDateTime: expect.any(String),
        }),
      ])
    );
  });

  it('disables all inputs when disabled prop is true', () => {
    const { container } = render(<TimeSlotsManager timeSlots={mockTimeSlots} onChange={mockOnChange} disabled={true} />);
    
    const addButton = screen.getByText('Add Time Slot');
    expect(addButton).toBeDisabled();
    
    const dateInputs = container.querySelectorAll('input[type="date"]');
    expect(dateInputs[0]).toBeDisabled();
  });

  it('shows read-only label for disabled slots', () => {
    render(
      <TimeSlotsManager 
        timeSlots={mockTimeSlots} 
        onChange={mockOnChange} 
        selectedSlotIndex={0}
      />
    );
    
    expect(screen.getByText(/Time Slot 2 \(Read-only\)/)).toBeInTheDocument();
  });

  it('shows editing label for selected slot', () => {
    render(
      <TimeSlotsManager 
        timeSlots={mockTimeSlots} 
        onChange={mockOnChange} 
        selectedSlotIndex={0}
      />
    );
    
    expect(screen.getByText(/Time Slot 1 \(Editing\)/)).toBeInTheDocument();
  });

  it('disables inputs for non-selected slots when selectedSlotIndex is set', () => {
    const { container } = render(
      <TimeSlotsManager 
        timeSlots={mockTimeSlots} 
        onChange={mockOnChange} 
        selectedSlotIndex={0}
      />
    );
    
    const dateInputs = container.querySelectorAll('input[type="date"]');
    expect(dateInputs[0]).not.toBeDisabled(); // Selected slot
    expect(dateInputs[1]).toBeDisabled(); // Non-selected slot
  });

  it('disables delete button for non-selected slots', () => {
    render(
      <TimeSlotsManager 
        timeSlots={mockTimeSlots} 
        onChange={mockOnChange} 
        selectedSlotIndex={0}
      />
    );
    
    const deleteButtons = screen.getAllByRole('button').filter(btn => 
      btn.querySelector('svg path[d*="M19 7l"]')
    );
    expect(deleteButtons[1]).toBeDisabled();
  });

  it('shows info message about editing mode', () => {
    render(
      <TimeSlotsManager 
        timeSlots={mockTimeSlots} 
        onChange={mockOnChange} 
        selectedSlotIndex={0}
      />
    );
    
    expect(screen.getByText(/Editing Time Slot 1/)).toBeInTheDocument();
    expect(screen.getByText(/Other time slots are read-only/)).toBeInTheDocument();
  });

  it('shows info message about conflict checking when not in editing mode', () => {
    render(<TimeSlotsManager timeSlots={mockTimeSlots} onChange={mockOnChange} />);
    
    expect(screen.getByText(/All time slots/)).toBeInTheDocument();
    expect(screen.getByText(/will be checked for scheduling conflicts/)).toBeInTheDocument();
  });

  it('shows general info about time slots', () => {
    render(<TimeSlotsManager timeSlots={mockTimeSlots} onChange={mockOnChange} />);
    
    expect(screen.getByText(/Each slot has its own duration/)).toBeInTheDocument();
  });

  it('applies disabled styling to read-only slots', () => {
    const { container } = render(
      <TimeSlotsManager 
        timeSlots={mockTimeSlots} 
        onChange={mockOnChange} 
        selectedSlotIndex={0}
      />
    );
    
    const slotContainers = container.querySelectorAll('.border.rounded-lg');
    expect(slotContainers[1]).toHaveClass('bg-gray-50', 'opacity-60');
  });

  it('does not apply disabled styling to editable slots', () => {
    const { container } = render(
      <TimeSlotsManager 
        timeSlots={mockTimeSlots} 
        onChange={mockOnChange} 
        selectedSlotIndex={0}
      />
    );
    
    const slotContainers = container.querySelectorAll('.border.rounded-lg');
    expect(slotContainers[0]).toHaveClass('bg-white');
    expect(slotContainers[0]).not.toHaveClass('opacity-60');
  });

  it('handles time slot without id (new slot)', () => {
    const newSlot: TimeSlot = {
      startDateTime: '2024-12-03T09:00',
      durationMin: 60,
    };
    
    render(
      <TimeSlotsManager 
        timeSlots={[newSlot]} 
        onChange={mockOnChange} 
        selectedSlotIndex={0}
      />
    );
    
    expect(screen.getByText('Time Slot 1')).toBeInTheDocument();
  });

  it('defaults to 60 minutes when duration input is invalid', async () => {
    const user = userEvent.setup();
    const { container } = render(<TimeSlotsManager timeSlots={mockTimeSlots} onChange={mockOnChange} />);
    
    const durationInputs = container.querySelectorAll('input[type="number"]');
    await user.clear(durationInputs[0]);
    await user.type(durationInputs[0], 'abc');
    
    expect(mockOnChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          durationMin: 60,
        }),
      ])
    );
  });

  it('uses default time when startDateTime has no time component', async () => {
    const slotWithoutTime: TimeSlot = {
      startDateTime: '2024-12-01',
      durationMin: 60,
    };
    
    const { container } = render(<TimeSlotsManager timeSlots={[slotWithoutTime]} onChange={mockOnChange} />);
    
    const timeInputs = container.querySelectorAll('input[type="time"]');
    expect((timeInputs[0] as HTMLInputElement).value).toBe('09:00');
  });

  it('renders with multiple time slots', () => {
    const manySlots: TimeSlot[] = [
      { startDateTime: '2024-12-01T10:00', durationMin: 60 },
      { startDateTime: '2024-12-02T11:00', durationMin: 90 },
      { startDateTime: '2024-12-03T12:00', durationMin: 120 },
    ];
    
    render(<TimeSlotsManager timeSlots={manySlots} onChange={mockOnChange} />);
    
    expect(screen.getByText('Time Slot 1')).toBeInTheDocument();
    expect(screen.getByText('Time Slot 2')).toBeInTheDocument();
    expect(screen.getByText('Time Slot 3')).toBeInTheDocument();
  });

  it('has proper grid layout for inputs', () => {
    const { container } = render(<TimeSlotsManager timeSlots={mockTimeSlots} onChange={mockOnChange} />);
    
    const grid = container.querySelector('.grid.grid-cols-3');
    expect(grid).toBeInTheDocument();
  });

  it('has minimum value of 1 for duration input', () => {
    const { container } = render(<TimeSlotsManager timeSlots={mockTimeSlots} onChange={mockOnChange} />);
    
    const durationInputs = container.querySelectorAll('input[type="number"]');
    expect(durationInputs[0]).toHaveAttribute('min', '1');
  });
});
