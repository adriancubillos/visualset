import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProgressBar from '@/components/ui/ProgressBar';

describe('ProgressBar', () => {
  it('renders progress bar with correct percentage', () => {
    render(<ProgressBar current={50} total={100} />);
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('renders progress numbers when showNumbers is true', () => {
    render(<ProgressBar current={3} total={10} showNumbers={true} />);
    expect(screen.getByText('3/10')).toBeInTheDocument();
  });

  it('hides numbers when showNumbers is false', () => {
    render(<ProgressBar current={3} total={10} showNumbers={false} />);
    expect(screen.queryByText('3/10')).not.toBeInTheDocument();
  });

  it('hides percentage when showPercentage is false', () => {
    render(<ProgressBar current={50} total={100} showPercentage={false} />);
    expect(screen.queryByText('50%')).not.toBeInTheDocument();
  });

  it('renders label when provided', () => {
    render(<ProgressBar current={5} total={10} label="Progress" />);
    expect(screen.getByText('Progress')).toBeInTheDocument();
  });

  it('calculates percentage correctly', () => {
    render(<ProgressBar current={7} total={10} />);
    expect(screen.getByText('70%')).toBeInTheDocument();
  });

  it('rounds percentage to nearest integer', () => {
    render(<ProgressBar current={1} total={3} />);
    expect(screen.getByText('33%')).toBeInTheDocument();
  });

  it('handles zero total gracefully', () => {
    render(<ProgressBar current={5} total={0} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('shows 100% when current equals total', () => {
    render(<ProgressBar current={10} total={10} />);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('applies success variant when complete', () => {
    const { container } = render(<ProgressBar current={10} total={10} variant="default" />);
    const progressBar = container.querySelector('.bg-green-600');
    expect(progressBar).toBeInTheDocument();
  });

  it('applies default variant when not complete', () => {
    const { container } = render(<ProgressBar current={5} total={10} variant="default" />);
    const progressBar = container.querySelector('.bg-blue-600');
    expect(progressBar).toBeInTheDocument();
  });

  it('applies warning variant when not complete', () => {
    const { container } = render(<ProgressBar current={5} total={10} variant="warning" />);
    const progressBar = container.querySelector('.bg-yellow-600');
    expect(progressBar).toBeInTheDocument();
  });

  it('applies error variant when not complete', () => {
    const { container } = render(<ProgressBar current={5} total={10} variant="error" />);
    const progressBar = container.querySelector('.bg-red-600');
    expect(progressBar).toBeInTheDocument();
  });

  it('applies small size class', () => {
    const { container } = render(<ProgressBar current={5} total={10} size="sm" />);
    const progressBar = container.querySelector('.h-1');
    expect(progressBar).toBeInTheDocument();
  });

  it('applies medium size class by default', () => {
    const { container } = render(<ProgressBar current={5} total={10} />);
    const progressBar = container.querySelector('.h-2');
    expect(progressBar).toBeInTheDocument();
  });

  it('applies large size class', () => {
    const { container } = render(<ProgressBar current={5} total={10} size="lg" />);
    const progressBar = container.querySelector('.h-3');
    expect(progressBar).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<ProgressBar current={5} total={10} className="custom-class" />);
    const wrapper = container.querySelector('.custom-class');
    expect(wrapper).toBeInTheDocument();
  });

  it('sets correct width style based on percentage', () => {
    const { container } = render(<ProgressBar current={75} total={100} />);
    const progressBar = container.querySelector('[style*="width"]');
    expect(progressBar).toHaveStyle({ width: '75%' });
  });

  it('caps width at 100% when current exceeds total', () => {
    const { container } = render(<ProgressBar current={150} total={100} />);
    const progressBar = container.querySelector('[style*="width"]');
    expect(progressBar).toHaveStyle({ width: '100%' });
  });

  it('hides info section when no label, percentage, or numbers', () => {
    const { container } = render(
      <ProgressBar current={5} total={10} showPercentage={false} showNumbers={false} />
    );
    const infoSection = container.querySelector('.flex.justify-between');
    expect(infoSection).not.toBeInTheDocument();
  });

  it('shows info section when label is provided', () => {
    const { container } = render(
      <ProgressBar current={5} total={10} label="Test" showPercentage={false} showNumbers={false} />
    );
    const infoSection = container.querySelector('.flex.justify-between');
    expect(infoSection).toBeInTheDocument();
  });
});
