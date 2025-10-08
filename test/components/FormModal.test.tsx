import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FormModal from '@/components/ui/FormModal';

describe('FormModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnSubmit.mockClear();
  });

  it('renders modal when isOpen is true', () => {
    render(
      <FormModal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <div>Modal Content</div>
      </FormModal>
    );

    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal Content')).toBeInTheDocument();
  });

  it('does not render modal when isOpen is false', () => {
    render(
      <FormModal isOpen={false} onClose={mockOnClose} title="Test Modal">
        <div>Modal Content</div>
      </FormModal>
    );

    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
  });

  it('renders title', () => {
    render(
      <FormModal isOpen={true} onClose={mockOnClose} title="My Modal Title">
        <div>Content</div>
      </FormModal>
    );

    expect(screen.getByText('My Modal Title')).toBeInTheDocument();
  });

  it('renders children content', () => {
    render(
      <FormModal isOpen={true} onClose={mockOnClose} title="Modal">
        <div data-testid="custom-content">Custom Content Here</div>
      </FormModal>
    );

    expect(screen.getByTestId('custom-content')).toBeInTheDocument();
    expect(screen.getByText('Custom Content Here')).toBeInTheDocument();
  });

  it('renders submit and cancel buttons when onSubmit is provided', () => {
    render(
      <FormModal isOpen={true} onClose={mockOnClose} title="Modal" onSubmit={mockOnSubmit}>
        <div>Content</div>
      </FormModal>
    );

    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('does not render buttons when onSubmit is not provided', () => {
    render(
      <FormModal isOpen={true} onClose={mockOnClose} title="Modal">
        <div>Content</div>
      </FormModal>
    );

    expect(screen.queryByText('Save')).not.toBeInTheDocument();
    expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
  });

  it('renders custom submit label', () => {
    render(
      <FormModal
        isOpen={true}
        onClose={mockOnClose}
        title="Modal"
        onSubmit={mockOnSubmit}
        submitLabel="Create"
      >
        <div>Content</div>
      </FormModal>
    );

    expect(screen.getByText('Create')).toBeInTheDocument();
  });

  it('calls onSubmit when submit button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <FormModal isOpen={true} onClose={mockOnClose} title="Modal" onSubmit={mockOnSubmit}>
        <div>Content</div>
      </FormModal>
    );

    const submitButton = screen.getByText('Save');
    await user.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <FormModal isOpen={true} onClose={mockOnClose} title="Modal" onSubmit={mockOnSubmit}>
        <div>Content</div>
      </FormModal>
    );

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('disables submit button when submitDisabled is true', () => {
    render(
      <FormModal
        isOpen={true}
        onClose={mockOnClose}
        title="Modal"
        onSubmit={mockOnSubmit}
        submitDisabled={true}
      >
        <div>Content</div>
      </FormModal>
    );

    const submitButton = screen.getByText('Save');
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveClass('bg-gray-400', 'cursor-not-allowed');
  });

  it('enables submit button when submitDisabled is false', () => {
    render(
      <FormModal
        isOpen={true}
        onClose={mockOnClose}
        title="Modal"
        onSubmit={mockOnSubmit}
        submitDisabled={false}
      >
        <div>Content</div>
      </FormModal>
    );

    const submitButton = screen.getByText('Save');
    expect(submitButton).not.toBeDisabled();
    expect(submitButton).toHaveClass('bg-blue-600', 'hover:bg-blue-700');
  });

  it('applies medium size by default', () => {
    render(
      <FormModal isOpen={true} onClose={mockOnClose} title="Modal">
        <div>Content</div>
      </FormModal>
    );

    // Headless UI renders in portal, use document.body
    const panel = document.body.querySelector('.max-w-lg');
    expect(panel).toBeInTheDocument();
  });

  it('applies small size', () => {
    render(
      <FormModal isOpen={true} onClose={mockOnClose} title="Modal" size="sm">
        <div>Content</div>
      </FormModal>
    );

    const panel = document.body.querySelector('.max-w-md');
    expect(panel).toBeInTheDocument();
  });

  it('applies large size', () => {
    render(
      <FormModal isOpen={true} onClose={mockOnClose} title="Modal" size="lg">
        <div>Content</div>
      </FormModal>
    );

    const panel = document.body.querySelector('.max-w-2xl');
    expect(panel).toBeInTheDocument();
  });

  it('applies extra large size', () => {
    render(
      <FormModal isOpen={true} onClose={mockOnClose} title="Modal" size="xl">
        <div>Content</div>
      </FormModal>
    );

    const panel = document.body.querySelector('.max-w-4xl');
    expect(panel).toBeInTheDocument();
  });

  it('has correct styling classes', () => {
    render(
      <FormModal isOpen={true} onClose={mockOnClose} title="Modal">
        <div>Content</div>
      </FormModal>
    );

    const panel = document.body.querySelector('.rounded-2xl.bg-white.p-6');
    expect(panel).toBeInTheDocument();
  });

  it('renders backdrop overlay', () => {
    render(
      <FormModal isOpen={true} onClose={mockOnClose} title="Modal">
        <div>Content</div>
      </FormModal>
    );

    const backdrop = document.body.querySelector('.bg-gray-500.bg-opacity-25');
    expect(backdrop).toBeInTheDocument();
  });
});
