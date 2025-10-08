import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ImageUpload from '@/components/forms/ImageUpload';
import toast from 'react-hot-toast';

// Mock dependencies
vi.mock('next/image', () => ({
  default: ({ src, alt, fill }: any) => (
    <img src={src} alt={alt} data-fill={fill} />
  ),
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    apiError: vi.fn(),
  },
}));

// Mock FileReader
class MockFileReader {
  onloadend: (() => void) | null = null;
  result: string | null = null;

  readAsDataURL() {
    this.result = 'data:image/png;base64,mockbase64';
    if (this.onloadend) {
      this.onloadend();
    }
  }
}

global.FileReader = MockFileReader as any;

// Mock fetch
global.fetch = vi.fn();

describe('ImageUpload', () => {
  const mockOnImageUploaded = vi.fn();
  const mockOnImageRemoved = vi.fn();
  const mockOnLoadingChange = vi.fn();
  const mockOnNewUploadTracked = vi.fn();

  beforeEach(() => {
    mockOnImageUploaded.mockClear();
    mockOnImageRemoved.mockClear();
    mockOnLoadingChange.mockClear();
    mockOnNewUploadTracked.mockClear();
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
    (global.fetch as any).mockClear();
  });

  it('renders label', () => {
    render(<ImageUpload label="Upload Image" onImageUploaded={mockOnImageUploaded} />);
    
    expect(screen.getByText('Upload Image')).toBeInTheDocument();
  });

  it('shows upload area when no image', () => {
    render(<ImageUpload label="Upload Image" onImageUploaded={mockOnImageUploaded} />);
    
    expect(screen.getByText('Click to upload')).toBeInTheDocument();
    expect(screen.getByText('PNG, JPG up to 5MB')).toBeInTheDocument();
  });

  it('renders file input with correct attributes', () => {
    const { container } = render(<ImageUpload label="Upload Image" onImageUploaded={mockOnImageUploaded} />);
    
    const fileInput = container.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute('accept', 'image/*');
  });

  it('shows preview when currentImageUrl is provided', () => {
    render(
      <ImageUpload
        label="Upload Image"
        currentImageUrl="https://example.com/image.jpg"
        onImageUploaded={mockOnImageUploaded}
      />
    );
    
    const image = screen.getByAltText('Preview');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
  });

  it('shows remove button when image is present', () => {
    render(
      <ImageUpload
        label="Upload Image"
        currentImageUrl="https://example.com/image.jpg"
        onImageUploaded={mockOnImageUploaded}
      />
    );
    
    const removeButton = screen.getByTitle('Remove image');
    expect(removeButton).toBeInTheDocument();
  });

  it('hides upload area when image is present', () => {
    render(
      <ImageUpload
        label="Upload Image"
        currentImageUrl="https://example.com/image.jpg"
        onImageUploaded={mockOnImageUploaded}
      />
    );
    
    expect(screen.queryByText('Click to upload')).not.toBeInTheDocument();
  });

  it('uploads image successfully', async () => {
    const user = userEvent.setup();
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ url: 'https://blob.vercel-storage.com/uploaded.jpg' }),
    });

    const { container } = render(<ImageUpload label="Upload Image" onImageUploaded={mockOnImageUploaded} />);
    
    const file = new File(['image'], 'test.png', { type: 'image/png' });
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    
    await user.upload(fileInput, file);
    
    await waitFor(() => {
      expect(mockOnImageUploaded).toHaveBeenCalledWith('https://blob.vercel-storage.com/uploaded.jpg');
      expect(toast.success).toHaveBeenCalledWith('Image uploaded successfully');
    });
  });

  it('shows uploading state during upload', async () => {
    const user = userEvent.setup();
    (global.fetch as any).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    const { container } = render(<ImageUpload label="Upload Image" onImageUploaded={mockOnImageUploaded} />);
    
    const file = new File(['image'], 'test.png', { type: 'image/png' });
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    
    await user.upload(fileInput, file);
    
    expect(screen.getByText('Uploading...')).toBeInTheDocument();
  });

  it('validates file type', async () => {
    const { container } = render(<ImageUpload label="Upload Image" onImageUploaded={mockOnImageUploaded} />);
    
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    
    // Manually trigger the change event
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });
    fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Please select an image file');
    });
    expect(mockOnImageUploaded).not.toHaveBeenCalled();
  });

  it('validates file size', async () => {
    const user = userEvent.setup();
    const { container } = render(<ImageUpload label="Upload Image" onImageUploaded={mockOnImageUploaded} />);
    
    // Create a file larger than 5MB
    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.png', { type: 'image/png' });
    Object.defineProperty(largeFile, 'size', { value: 6 * 1024 * 1024 });
    
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, largeFile);
    
    expect(toast.error).toHaveBeenCalledWith('Image size must be less than 5MB');
    expect(mockOnImageUploaded).not.toHaveBeenCalled();
  });

  it('handles upload error', async () => {
    const user = userEvent.setup();
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
    });

    const { container } = render(<ImageUpload label="Upload Image" onImageUploaded={mockOnImageUploaded} />);
    
    const file = new File(['image'], 'test.png', { type: 'image/png' });
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    
    await user.upload(fileInput, file);
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to upload image');
    });
  });

  it('calls onImageRemoved when remove button is clicked', async () => {
    const user = userEvent.setup();
    (global.fetch as any).mockResolvedValueOnce({ ok: true });

    render(
      <ImageUpload
        label="Upload Image"
        currentImageUrl="https://example.com/image.jpg"
        onImageUploaded={mockOnImageUploaded}
        onImageRemoved={mockOnImageRemoved}
      />
    );
    
    const removeButton = screen.getByTitle('Remove image');
    await user.click(removeButton);
    
    await waitFor(() => {
      expect(mockOnImageRemoved).toHaveBeenCalled();
    });
  });

  it('deletes image from storage when removed', async () => {
    const user = userEvent.setup();
    (global.fetch as any).mockResolvedValueOnce({ ok: true });

    render(
      <ImageUpload
        label="Upload Image"
        currentImageUrl="https://example.com/image.jpg"
        onImageUploaded={mockOnImageUploaded}
      />
    );
    
    const removeButton = screen.getByTitle('Remove image');
    await user.click(removeButton);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/upload/delete'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  it('shows deleting state during removal', async () => {
    const user = userEvent.setup();
    (global.fetch as any).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(
      <ImageUpload
        label="Upload Image"
        currentImageUrl="https://example.com/image.jpg"
        onImageUploaded={mockOnImageUploaded}
      />
    );
    
    const removeButton = screen.getByTitle('Remove image');
    await user.click(removeButton);
    
    expect(screen.getByTitle('Deleting...')).toBeInTheDocument();
  });

  it('disables remove button during deletion', async () => {
    const user = userEvent.setup();
    (global.fetch as any).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(
      <ImageUpload
        label="Upload Image"
        currentImageUrl="https://example.com/image.jpg"
        onImageUploaded={mockOnImageUploaded}
      />
    );
    
    const removeButton = screen.getByTitle('Remove image');
    await user.click(removeButton);
    
    expect(removeButton).toBeDisabled();
  });

  it('calls onLoadingChange during upload', async () => {
    const user = userEvent.setup();
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ url: 'https://blob.vercel-storage.com/uploaded.jpg' }),
    });

    const { container } = render(
      <ImageUpload
        label="Upload Image"
        onImageUploaded={mockOnImageUploaded}
        onLoadingChange={mockOnLoadingChange}
      />
    );
    
    const file = new File(['image'], 'test.png', { type: 'image/png' });
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    
    await user.upload(fileInput, file);
    
    await waitFor(() => {
      expect(mockOnLoadingChange).toHaveBeenCalledWith(true);
      expect(mockOnLoadingChange).toHaveBeenCalledWith(false);
    });
  });

  it('calls onNewUploadTracked when new image is uploaded', async () => {
    const user = userEvent.setup();
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ url: 'https://blob.vercel-storage.com/uploaded.jpg' }),
    });

    const { container } = render(
      <ImageUpload
        label="Upload Image"
        onImageUploaded={mockOnImageUploaded}
        onNewUploadTracked={mockOnNewUploadTracked}
      />
    );
    
    const file = new File(['image'], 'test.png', { type: 'image/png' });
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    
    await user.upload(fileInput, file);
    
    await waitFor(() => {
      expect(mockOnNewUploadTracked).toHaveBeenCalledWith('https://blob.vercel-storage.com/uploaded.jpg');
    });
  });

  it('includes entity information in upload request', async () => {
    const user = userEvent.setup();
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ url: 'https://blob.vercel-storage.com/uploaded.jpg' }),
    });

    const { container } = render(
      <ImageUpload
        label="Upload Image"
        onImageUploaded={mockOnImageUploaded}
        entityType="project"
        entityName="My Project"
        projectName="Project Alpha"
      />
    );
    
    const file = new File(['image'], 'test.png', { type: 'image/png' });
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    
    await user.upload(fileInput, file);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('entityType=project'),
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('entityName=My+Project'),
        expect.any(Object)
      );
    });
  });

  it('clears file input after removal', async () => {
    const user = userEvent.setup();
    (global.fetch as any).mockResolvedValueOnce({ ok: true });

    const { container } = render(
      <ImageUpload
        label="Upload Image"
        currentImageUrl="https://example.com/image.jpg"
        onImageUploaded={mockOnImageUploaded}
      />
    );
    
    const removeButton = screen.getByTitle('Remove image');
    await user.click(removeButton);
    
    await waitFor(() => {
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput.value).toBe('');
    });
  });

  it('handles delete error gracefully', async () => {
    const user = userEvent.setup();
    (global.fetch as any).mockResolvedValueOnce({ ok: false });

    render(
      <ImageUpload
        label="Upload Image"
        currentImageUrl="https://example.com/image.jpg"
        onImageUploaded={mockOnImageUploaded}
      />
    );
    
    const removeButton = screen.getByTitle('Remove image');
    await user.click(removeButton);
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to delete image from storage');
    });
  });

  it('shows success message after deletion', async () => {
    const user = userEvent.setup();
    (global.fetch as any).mockResolvedValueOnce({ ok: true });

    render(
      <ImageUpload
        label="Upload Image"
        currentImageUrl="https://example.com/image.jpg"
        onImageUploaded={mockOnImageUploaded}
      />
    );
    
    const removeButton = screen.getByTitle('Remove image');
    await user.click(removeButton);
    
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Image removed from storage');
    });
  });

  it('creates preview from uploaded file', async () => {
    const user = userEvent.setup();
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ url: 'https://blob.vercel-storage.com/uploaded.jpg' }),
    });

    const { container } = render(<ImageUpload label="Upload Image" onImageUploaded={mockOnImageUploaded} />);
    
    const file = new File(['image'], 'test.png', { type: 'image/png' });
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    
    await user.upload(fileInput, file);
    
    await waitFor(() => {
      const preview = screen.getByAltText('Preview');
      expect(preview).toBeInTheDocument();
    });
  });

  it('shows uploading indicator during upload', async () => {
    const user = userEvent.setup();
    (global.fetch as any).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    const { container } = render(<ImageUpload label="Upload Image" onImageUploaded={mockOnImageUploaded} />);
    
    const file = new File(['image'], 'test.png', { type: 'image/png' });
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    
    await user.upload(fileInput, file);
    
    // Check that uploading indicator appears
    expect(screen.getByText('Uploading...')).toBeInTheDocument();
  });

  it('restores previous image on upload error', async () => {
    const user = userEvent.setup();
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    const { container } = render(
      <ImageUpload
        label="Upload Image"
        currentImageUrl="https://example.com/original.jpg"
        onImageUploaded={mockOnImageUploaded}
      />
    );
    
    // Remove the current image first
    const removeButton = screen.getByTitle('Remove image');
    (global.fetch as any).mockResolvedValueOnce({ ok: true });
    await user.click(removeButton);
    
    await waitFor(() => {
      expect(screen.queryByAltText('Preview')).not.toBeInTheDocument();
    });
    
    // Try to upload a new image (will fail)
    const file = new File(['image'], 'test.png', { type: 'image/png' });
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    
    await user.upload(fileInput, file);
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to upload image');
    });
  });

  it('tracks new uploaded URL separately from current URL', async () => {
    const user = userEvent.setup();
    
    const { container } = render(
      <ImageUpload
        label="Upload Image"
        currentImageUrl="https://example.com/original.jpg"
        onImageUploaded={mockOnImageUploaded}
        onNewUploadTracked={mockOnNewUploadTracked}
      />
    );
    
    // Remove current image
    const removeButton = screen.getByTitle('Remove image');
    (global.fetch as any).mockResolvedValueOnce({ ok: true });
    await user.click(removeButton);
    
    await waitFor(() => {
      expect(screen.queryByAltText('Preview')).not.toBeInTheDocument();
    });
    
    // Upload new image
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ url: 'https://blob.vercel-storage.com/new-upload.jpg' }),
    });
    
    const file = new File(['image'], 'test.png', { type: 'image/png' });
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    
    await user.upload(fileInput, file);
    
    await waitFor(() => {
      expect(mockOnNewUploadTracked).toHaveBeenCalledWith('https://blob.vercel-storage.com/new-upload.jpg');
    });
  });

  it('has proper styling for upload area', () => {
    const { container } = render(<ImageUpload label="Upload Image" onImageUploaded={mockOnImageUploaded} />);
    
    const uploadArea = container.querySelector('.border-dashed');
    expect(uploadArea).toHaveClass('border-gray-300');
  });

  it('has proper styling for preview container', () => {
    const { container } = render(
      <ImageUpload
        label="Upload Image"
        currentImageUrl="https://example.com/image.jpg"
        onImageUploaded={mockOnImageUploaded}
      />
    );
    
    const preview = container.querySelector('.w-48.h-48');
    expect(preview).toBeInTheDocument();
  });
});
