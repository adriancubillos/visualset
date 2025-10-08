import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import PageContainer, { withPageContainer } from '@/components/layout/PageContainer';

// Mock Next.js Link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('PageContainer', () => {
  it('renders children', () => {
    render(
      <PageContainer>
        <div>Test Content</div>
      </PageContainer>
    );
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders header title', () => {
    render(
      <PageContainer header={{ title: 'Test Page' }}>
        <div>Content</div>
      </PageContainer>
    );
    expect(screen.getByText('Test Page')).toBeInTheDocument();
  });

  it('renders header description', () => {
    render(
      <PageContainer header={{ title: 'Test', description: 'Test description' }}>
        <div>Content</div>
      </PageContainer>
    );
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('renders header actions', () => {
    render(
      <PageContainer header={{ title: 'Test', actions: <button>Action</button> }}>
        <div>Content</div>
      </PageContainer>
    );
    expect(screen.getByText('Action')).toBeInTheDocument();
  });

  it('renders breadcrumbs', () => {
    const breadcrumbs = [
      { label: 'Home', href: '/' },
      { label: 'Projects', href: '/projects' },
      { label: 'Current' },
    ];
    render(
      <PageContainer breadcrumbs={breadcrumbs}>
        <div>Content</div>
      </PageContainer>
    );
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Current')).toBeInTheDocument();
  });

  it('renders breadcrumb separators', () => {
    const breadcrumbs = [
      { label: 'Home', href: '/' },
      { label: 'Current' },
    ];
    const { container } = render(
      <PageContainer breadcrumbs={breadcrumbs}>
        <div>Content</div>
      </PageContainer>
    );
    expect(container.textContent).toContain('/');
  });

  it('renders breadcrumb links with href', () => {
    const breadcrumbs = [{ label: 'Home', href: '/home' }];
    render(
      <PageContainer breadcrumbs={breadcrumbs}>
        <div>Content</div>
      </PageContainer>
    );
    const link = screen.getByText('Home');
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/home');
  });

  it('renders breadcrumb without link when no href', () => {
    const breadcrumbs = [{ label: 'Current' }];
    render(
      <PageContainer breadcrumbs={breadcrumbs}>
        <div>Content</div>
      </PageContainer>
    );
    const span = screen.getByText('Current');
    expect(span.tagName).toBe('SPAN');
  });

  it('applies list variant classes', () => {
    const { container } = render(
      <PageContainer variant="list">
        <div>Content</div>
      </PageContainer>
    );
    expect(container.firstChild).toHaveClass('space-y-6');
  });

  it('applies detail variant classes', () => {
    const { container } = render(
      <PageContainer variant="detail">
        <div>Content</div>
      </PageContainer>
    );
    expect(container.firstChild).toHaveClass('space-y-8');
  });

  it('applies form variant classes', () => {
    const { container } = render(
      <PageContainer variant="form">
        <div>Content</div>
      </PageContainer>
    );
    expect(container.firstChild).toHaveClass('space-y-6');
  });

  it('applies custom className', () => {
    const { container } = render(
      <PageContainer className="custom-class">
        <div>Content</div>
      </PageContainer>
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('shows loading component when loading is true', () => {
    const { container } = render(
      <PageContainer loading={true}>
        <div>Content</div>
      </PageContainer>
    );
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('shows custom loading component when provided', () => {
    render(
      <PageContainer loading={true} loadingComponent={<div>Custom Loading</div>}>
        <div>Content</div>
      </PageContainer>
    );
    expect(screen.getByText('Custom Loading')).toBeInTheDocument();
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('shows children when loading is false', () => {
    render(
      <PageContainer loading={false}>
        <div>Content</div>
      </PageContainer>
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('renders React node as title', () => {
    render(
      <PageContainer header={{ title: <span>Custom Title</span> }}>
        <div>Content</div>
      </PageContainer>
    );
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });

  it('renders React node as description', () => {
    render(
      <PageContainer header={{ title: 'Test', description: <span>Custom Description</span> }}>
        <div>Content</div>
      </PageContainer>
    );
    expect(screen.getByText('Custom Description')).toBeInTheDocument();
  });

  it('does not render breadcrumbs when array is empty', () => {
    const { container } = render(
      <PageContainer breadcrumbs={[]}>
        <div>Content</div>
      </PageContainer>
    );
    expect(container.querySelector('nav')).not.toBeInTheDocument();
  });

  it('does not render header when not provided', () => {
    const { container } = render(
      <PageContainer>
        <div>Content</div>
      </PageContainer>
    );
    expect(container.querySelector('h1')).not.toBeInTheDocument();
  });

  it('has correct container classes', () => {
    const { container } = render(
      <PageContainer>
        <div>Content</div>
      </PageContainer>
    );
    expect(container.firstChild).toHaveClass('mx-auto', 'py-6', 'px-4');
  });
});

describe('withPageContainer', () => {
  it('wraps component with PageContainer', () => {
    const TestComponent = () => <div>Test Component</div>;
    const WrappedComponent = withPageContainer(TestComponent);
    
    render(<WrappedComponent />);
    expect(screen.getByText('Test Component')).toBeInTheDocument();
  });

  it('passes container props to PageContainer', () => {
    const TestComponent = () => <div>Test Component</div>;
    const WrappedComponent = withPageContainer(TestComponent, {
      header: { title: 'Wrapped Title' },
    });
    
    render(<WrappedComponent />);
    expect(screen.getByText('Wrapped Title')).toBeInTheDocument();
  });

  it('passes props to wrapped component', () => {
    const TestComponent = ({ name }: { name: string }) => <div>Hello {name}</div>;
    const WrappedComponent = withPageContainer(TestComponent);
    
    render(<WrappedComponent name="World" />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('sets displayName correctly', () => {
    const TestComponent = () => <div>Test</div>;
    TestComponent.displayName = 'TestComponent';
    const WrappedComponent = withPageContainer(TestComponent);
    
    expect(WrappedComponent.displayName).toBe('withPageContainer(TestComponent)');
  });
});
