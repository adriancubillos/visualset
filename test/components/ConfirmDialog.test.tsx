import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { showConfirmDialog } from '@/components/ui/ConfirmDialog';
import toast from 'react-hot-toast';
import React from 'react';

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: vi.fn(),
}));

describe('ConfirmDialog', () => {
  const mockOnConfirm = vi.fn();
  const mockToast = toast as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnConfirm.mockClear();
    mockToast.mockClear();
  });

  it('calls toast with correct parameters', () => {
    showConfirmDialog({
      title: 'Delete Item',
      message: 'Are you sure?',
      onConfirm: mockOnConfirm,
    });

    expect(mockToast).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        duration: Infinity,
        position: 'top-center',
        style: expect.objectContaining({
          background: '#fff',
          color: '#000',
        }),
      })
    );
  });

  it('renders dialog with title and message', () => {
    let dialogContent: React.ReactElement | null = null;
    mockToast.mockImplementation((content) => {
      dialogContent = content({ id: 'test-id', visible: true } as never);
      return 'test-id';
    });

    showConfirmDialog({
      title: 'Delete Item',
      message: 'Are you sure you want to delete this item?',
      onConfirm: mockOnConfirm,
    });

    const { container } = render(<div>{dialogContent}</div>);
    expect(container).toHaveTextContent('Delete Item');
    expect(container).toHaveTextContent('Are you sure you want to delete this item?');
  });

  it('renders default confirm and cancel labels', () => {
    let dialogContent: React.ReactElement | null = null;
    mockToast.mockImplementation((content) => {
      dialogContent = content({ id: 'test-id', visible: true } as never);
      return 'test-id';
    });

    showConfirmDialog({
      title: 'Confirm',
      message: 'Proceed?',
      onConfirm: mockOnConfirm,
    });

    const { container } = render(<div>{dialogContent}</div>);
    expect(container).toHaveTextContent('Confirm');
    expect(container).toHaveTextContent('Cancel');
  });

  it('renders custom confirm and cancel labels', () => {
    let dialogContent: React.ReactElement | null = null;
    mockToast.mockImplementation((content) => {
      dialogContent = content({ id: 'test-id', visible: true } as never);
      return 'test-id';
    });

    showConfirmDialog({
      title: 'Delete',
      message: 'Delete this?',
      confirmLabel: 'Yes, Delete',
      cancelLabel: 'No, Keep',
      onConfirm: mockOnConfirm,
    });

    const { container } = render(<div>{dialogContent}</div>);
    expect(container).toHaveTextContent('Yes, Delete');
    expect(container).toHaveTextContent('No, Keep');
  });

  it('applies danger variant styles by default', () => {
    let dialogContent: React.ReactElement | null = null;
    mockToast.mockImplementation((content) => {
      dialogContent = content({ id: 'test-id', visible: true } as never);
      return 'test-id';
    });

    showConfirmDialog({
      title: 'Delete',
      message: 'Delete this?',
      onConfirm: mockOnConfirm,
    });

    const { container } = render(<div>{dialogContent}</div>);
    const confirmButton = container.querySelector('button.bg-red-600');
    expect(confirmButton).toBeInTheDocument();
  });

  it('applies warning variant styles', () => {
    let dialogContent: React.ReactElement | null = null;
    mockToast.mockImplementation((content) => {
      dialogContent = content({ id: 'test-id', visible: true } as never);
      return 'test-id';
    });

    showConfirmDialog({
      title: 'Warning',
      message: 'This is a warning',
      onConfirm: mockOnConfirm,
      variant: 'warning',
    });

    const { container } = render(<div>{dialogContent}</div>);
    const confirmButton = container.querySelector('button.bg-yellow-600');
    expect(confirmButton).toBeInTheDocument();
  });

  it('applies info variant styles', () => {
    let dialogContent: React.ReactElement | null = null;
    mockToast.mockImplementation((content) => {
      dialogContent = content({ id: 'test-id', visible: true } as never);
      return 'test-id';
    });

    showConfirmDialog({
      title: 'Info',
      message: 'This is info',
      onConfirm: mockOnConfirm,
      variant: 'info',
    });

    const { container } = render(<div>{dialogContent}</div>);
    const confirmButton = container.querySelector('button.bg-blue-600');
    expect(confirmButton).toBeInTheDocument();
  });

  it('renders danger icon for danger variant', () => {
    let dialogContent: React.ReactElement | null = null;
    mockToast.mockImplementation((content) => {
      dialogContent = content({ id: 'test-id', visible: true } as never);
      return 'test-id';
    });

    showConfirmDialog({
      title: 'Delete',
      message: 'Delete?',
      onConfirm: mockOnConfirm,
      variant: 'danger',
    });

    const { container } = render(<div>{dialogContent}</div>);
    const icon = container.querySelector('svg.text-red-600');
    expect(icon).toBeInTheDocument();
  });

  it('renders warning icon for warning variant', () => {
    let dialogContent: React.ReactElement | null = null;
    mockToast.mockImplementation((content) => {
      dialogContent = content({ id: 'test-id', visible: true } as never);
      return 'test-id';
    });

    showConfirmDialog({
      title: 'Warning',
      message: 'Warning?',
      onConfirm: mockOnConfirm,
      variant: 'warning',
    });

    const { container } = render(<div>{dialogContent}</div>);
    const icon = container.querySelector('svg.text-yellow-600');
    expect(icon).toBeInTheDocument();
  });

  it('renders info icon for info variant', () => {
    let dialogContent: React.ReactElement | null = null;
    mockToast.mockImplementation((content) => {
      dialogContent = content({ id: 'test-id', visible: true } as never);
      return 'test-id';
    });

    showConfirmDialog({
      title: 'Info',
      message: 'Info?',
      onConfirm: mockOnConfirm,
      variant: 'info',
    });

    const { container } = render(<div>{dialogContent}</div>);
    const icon = container.querySelector('svg.text-blue-600');
    expect(icon).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', async () => {
    const user = userEvent.setup();
    let dialogContent: React.ReactElement | null = null;
    const mockDismiss = vi.fn();
    
    // Create a mock toast object with dismiss method
    const mockToastWithDismiss = Object.assign(mockToast, { dismiss: mockDismiss });
    vi.mocked(toast).dismiss = mockDismiss;
    
    mockToast.mockImplementation((content) => {
      dialogContent = content({ id: 'test-id', visible: true } as never);
      return 'test-id';
    });

    showConfirmDialog({
      title: 'Confirm Action',
      message: 'Proceed?',
      onConfirm: mockOnConfirm,
    });

    const { container } = render(<div>{dialogContent}</div>);
    const confirmButton = screen.getByRole('button', { name: 'Confirm' });
    
    await user.click(confirmButton);
    
    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalled();
      expect(mockDismiss).toHaveBeenCalledWith('test-id');
    });
  });

  it('dismisses toast when cancel button is clicked', async () => {
    const user = userEvent.setup();
    let dialogContent: React.ReactElement | null = null;
    const mockDismiss = vi.fn();
    
    vi.mocked(toast).dismiss = mockDismiss;
    
    mockToast.mockImplementation((content) => {
      dialogContent = content({ id: 'test-id', visible: true } as never);
      return 'test-id';
    });

    showConfirmDialog({
      title: 'Confirm',
      message: 'Proceed?',
      onConfirm: mockOnConfirm,
    });

    const { container } = render(<div>{dialogContent}</div>);
    const cancelButton = screen.getByText('Cancel');
    
    await user.click(cancelButton);
    
    expect(mockDismiss).toHaveBeenCalledWith('test-id');
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it('handles async onConfirm', async () => {
    const user = userEvent.setup();
    const asyncOnConfirm = vi.fn().mockResolvedValue(undefined);
    let dialogContent: React.ReactElement | null = null;
    const mockDismiss = vi.fn();
    
    vi.mocked(toast).dismiss = mockDismiss;
    
    mockToast.mockImplementation((content) => {
      dialogContent = content({ id: 'test-id', visible: true } as never);
      return 'test-id';
    });

    showConfirmDialog({
      title: 'Confirm Action',
      message: 'Proceed?',
      onConfirm: asyncOnConfirm,
    });

    const { container } = render(<div>{dialogContent}</div>);
    const confirmButton = screen.getByRole('button', { name: 'Confirm' });
    
    await user.click(confirmButton);
    
    await waitFor(() => {
      expect(asyncOnConfirm).toHaveBeenCalled();
      expect(mockDismiss).toHaveBeenCalledWith('test-id');
    });
  });
});
