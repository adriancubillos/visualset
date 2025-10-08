import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusBadge from '@/components/ui/StatusBadge';

describe('StatusBadge', () => {
  it('renders status text', () => {
    render(<StatusBadge status="Active" />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('applies default variant styles', () => {
    render(<StatusBadge status="Pending" />);
    const badge = screen.getByText('Pending');
    expect(badge).toHaveClass('bg-gray-100', 'text-gray-800');
  });

  it('applies success variant styles', () => {
    render(<StatusBadge status="Completed" variant="success" />);
    const badge = screen.getByText('Completed');
    expect(badge).toHaveClass('bg-green-100', 'text-green-800');
  });

  it('applies warning variant styles', () => {
    render(<StatusBadge status="Warning" variant="warning" />);
    const badge = screen.getByText('Warning');
    expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800');
  });

  it('applies error variant styles', () => {
    render(<StatusBadge status="Failed" variant="error" />);
    const badge = screen.getByText('Failed');
    expect(badge).toHaveClass('bg-red-100', 'text-red-800');
  });

  it('applies info variant styles', () => {
    render(<StatusBadge status="Info" variant="info" />);
    const badge = screen.getByText('Info');
    expect(badge).toHaveClass('bg-blue-100', 'text-blue-800');
  });

  it('applies small size styles', () => {
    render(<StatusBadge status="Small" size="sm" />);
    const badge = screen.getByText('Small');
    expect(badge).toHaveClass('px-2', 'py-1', 'text-xs');
  });

  it('applies medium size styles by default', () => {
    render(<StatusBadge status="Medium" />);
    const badge = screen.getByText('Medium');
    expect(badge).toHaveClass('px-3', 'py-1', 'text-sm');
  });

  it('applies large size styles', () => {
    render(<StatusBadge status="Large" size="lg" />);
    const badge = screen.getByText('Large');
    expect(badge).toHaveClass('px-4', 'py-2', 'text-base');
  });

  it('combines variant and size styles', () => {
    render(<StatusBadge status="Test" variant="success" size="lg" />);
    const badge = screen.getByText('Test');
    expect(badge).toHaveClass('bg-green-100', 'text-green-800', 'px-4', 'py-2', 'text-base');
  });

  it('renders as a span element', () => {
    render(<StatusBadge status="Test" />);
    const badge = screen.getByText('Test');
    expect(badge.tagName).toBe('SPAN');
  });

  it('has rounded-full and font-medium classes', () => {
    render(<StatusBadge status="Test" />);
    const badge = screen.getByText('Test');
    expect(badge).toHaveClass('rounded-full', 'font-medium');
  });
});
