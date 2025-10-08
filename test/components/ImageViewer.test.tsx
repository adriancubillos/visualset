import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ImageViewer from '@/components/ui/ImageViewer';

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt, className }: { src: string; alt: string; className?: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} />
  ),
}));

describe('ImageViewer', () => {
  const mockImageUrl = 'https://example.com/image.jpg';

  it('renders placeholder when imageUrl is null', () => {
    const { container } = render(<ImageViewer imageUrl={null} alt="Test" />);
    const placeholder = container.querySelector('.bg-gray-100');
    expect(placeholder).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders placeholder when imageUrl is undefined', () => {
    const { container } = render(<ImageViewer imageUrl={undefined} alt="Test" />);
    const placeholder = container.querySelector('.bg-gray-100');
    expect(placeholder).toBeInTheDocument();
  });

  it('renders image when imageUrl is provided', () => {
    render(<ImageViewer imageUrl={mockImageUrl} alt="Test Image" />);
    const image = screen.getByRole('img', { name: 'Test Image' });
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', mockImageUrl);
  });

  it('applies small size by default', () => {
    const { container } = render(<ImageViewer imageUrl={mockImageUrl} alt="Test" />);
    const wrapper = container.querySelector('.max-w-\\[64px\\]');
    expect(wrapper).toBeInTheDocument();
  });

  it('applies medium size', () => {
    const { container } = render(<ImageViewer imageUrl={mockImageUrl} alt="Test" size="medium" />);
    const wrapper = container.querySelector('.max-w-\\[128px\\]');
    expect(wrapper).toBeInTheDocument();
  });

  it('applies large size', () => {
    const { container } = render(<ImageViewer imageUrl={mockImageUrl} alt="Test" size="large" />);
    const wrapper = container.querySelector('.max-w-\\[256px\\]');
    expect(wrapper).toBeInTheDocument();
  });

  it('applies extraLarge size', () => {
    const { container } = render(<ImageViewer imageUrl={mockImageUrl} alt="Test" size="extraLarge" />);
    const wrapper = container.querySelector('.max-w-\\[512px\\]');
    expect(wrapper).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<ImageViewer imageUrl={mockImageUrl} alt="Test" className="custom-class" />);
    const wrapper = container.querySelector('.custom-class');
    expect(wrapper).toBeInTheDocument();
  });

  it('applies placeholder size classes for small', () => {
    const { container } = render(<ImageViewer imageUrl={null} alt="Test" size="small" />);
    const placeholder = container.querySelector('.w-16.h-16');
    expect(placeholder).toBeInTheDocument();
  });

  it('applies placeholder size classes for medium', () => {
    const { container } = render(<ImageViewer imageUrl={null} alt="Test" size="medium" />);
    const placeholder = container.querySelector('.w-32.h-32');
    expect(placeholder).toBeInTheDocument();
  });

  it('applies placeholder size classes for large', () => {
    const { container } = render(<ImageViewer imageUrl={null} alt="Test" size="large" />);
    const placeholder = container.querySelector('.w-64.h-64');
    expect(placeholder).toBeInTheDocument();
  });

  it('shows cursor pointer when showModal is true', () => {
    const { container } = render(<ImageViewer imageUrl={mockImageUrl} alt="Test" showModal={true} />);
    const wrapper = container.querySelector('.cursor-pointer');
    expect(wrapper).toBeInTheDocument();
  });

  it('does not show cursor pointer when showModal is false', () => {
    const { container } = render(<ImageViewer imageUrl={mockImageUrl} alt="Test" showModal={false} />);
    const wrapper = container.querySelector('.cursor-pointer');
    expect(wrapper).not.toBeInTheDocument();
  });

  it('opens modal when thumbnail is clicked and showModal is true', async () => {
    const user = userEvent.setup();
    const { container } = render(<ImageViewer imageUrl={mockImageUrl} alt="Test" showModal={true} />);
    
    const thumbnail = container.querySelector('.cursor-pointer');
    await user.click(thumbnail!);
    
    // Modal should be visible
    const modal = container.querySelector('.fixed.inset-0.z-50');
    expect(modal).toBeInTheDocument();
  });

  it('does not open modal when thumbnail is clicked and showModal is false', async () => {
    const user = userEvent.setup();
    const { container } = render(<ImageViewer imageUrl={mockImageUrl} alt="Test" showModal={false} />);
    
    const thumbnail = container.querySelector('div');
    await user.click(thumbnail!);
    
    // Modal should not be visible
    const modal = container.querySelector('.fixed.inset-0.z-50');
    expect(modal).not.toBeInTheDocument();
  });

  it('closes modal when close button is clicked', async () => {
    const user = userEvent.setup();
    const { container } = render(<ImageViewer imageUrl={mockImageUrl} alt="Test" showModal={true} />);
    
    // Open modal
    const thumbnail = container.querySelector('.cursor-pointer');
    await user.click(thumbnail!);
    
    // Close modal
    const closeButton = screen.getByTitle('Close (ESC)');
    await user.click(closeButton);
    
    // Modal should be closed
    const modal = container.querySelector('.fixed.inset-0.z-50');
    expect(modal).not.toBeInTheDocument();
  });

  it('closes modal when backdrop is clicked', async () => {
    const user = userEvent.setup();
    const { container } = render(<ImageViewer imageUrl={mockImageUrl} alt="Test" showModal={true} />);
    
    // Open modal
    const thumbnail = container.querySelector('.cursor-pointer');
    await user.click(thumbnail!);
    
    // Click backdrop
    const backdrop = container.querySelector('.fixed.inset-0.z-50');
    await user.click(backdrop!);
    
    // Modal should be closed
    const modal = container.querySelector('.fixed.inset-0.z-50');
    expect(modal).not.toBeInTheDocument();
  });

  it('does not close modal when clicking on image inside modal', async () => {
    const user = userEvent.setup();
    const { container } = render(<ImageViewer imageUrl={mockImageUrl} alt="Test" showModal={true} />);
    
    // Open modal
    const thumbnail = container.querySelector('.cursor-pointer');
    await user.click(thumbnail!);
    
    // Click on image container (not backdrop)
    const imageContainer = container.querySelector('.relative.max-w-5xl');
    await user.click(imageContainer!);
    
    // Modal should still be open
    const modal = container.querySelector('.fixed.inset-0.z-50');
    expect(modal).toBeInTheDocument();
  });

  it('renders modal with correct image', async () => {
    const user = userEvent.setup();
    const { container } = render(<ImageViewer imageUrl={mockImageUrl} alt="Test Image" showModal={true} />);
    
    // Open modal
    const thumbnail = container.querySelector('.cursor-pointer');
    await user.click(thumbnail!);
    
    // Check modal image
    const images = screen.getAllByRole('img', { name: 'Test Image' });
    expect(images).toHaveLength(2); // Thumbnail + modal
  });

  it('has hover effect on thumbnail when showModal is true', () => {
    const { container } = render(<ImageViewer imageUrl={mockImageUrl} alt="Test" showModal={true} />);
    const wrapper = container.querySelector('.hover\\:border-blue-500');
    expect(wrapper).toBeInTheDocument();
  });

  it('shows correct title on thumbnail when showModal is true', () => {
    const { container } = render(<ImageViewer imageUrl={mockImageUrl} alt="Test Alt" showModal={true} />);
    const wrapper = container.querySelector('[title="Click to view larger"]');
    expect(wrapper).toBeInTheDocument();
  });

  it('shows alt text as title when showModal is false', () => {
    const { container } = render(<ImageViewer imageUrl={mockImageUrl} alt="Test Alt" showModal={false} />);
    const wrapper = container.querySelector('[title="Test Alt"]');
    expect(wrapper).toBeInTheDocument();
  });
});
