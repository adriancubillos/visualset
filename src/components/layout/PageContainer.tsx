'use client';

import React from 'react';
import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string | React.ReactNode;
  description?: string | React.ReactNode;
  actions?: React.ReactNode;
}

interface PageContainerProps {
  children: React.ReactNode;
  header?: PageHeaderProps;
  breadcrumbs?: BreadcrumbItem[];
  variant?: 'list' | 'detail' | 'form';
  className?: string;
  maxWidth?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl' | '7xl';
  loading?: boolean;
  loadingComponent?: React.ReactNode;
}

const PageContainer: React.FC<PageContainerProps> = ({
  children,
  header,
  breadcrumbs,
  variant = 'list',
  className = '',
  maxWidth = '7xl',
  loading = false,
  loadingComponent,
}) => {
  const maxWidthClasses = {
    none: '',
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
  };

  const variantClasses = {
    list: 'space-y-6',
    detail: 'space-y-8',
    form: 'space-y-6',
  };

  const containerClass = `
    ${maxWidthClasses[maxWidth]} 
    mx-auto 
    py-6 
    px-4 
    sm:px-6 
    lg:px-8 
    ${variantClasses[variant]}
    ${className}
  `.trim();

  // Default loading component
  const defaultLoadingComponent = (
    <div className="animate-pulse">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="space-y-6">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={containerClass}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav
          className="flex mb-6"
          aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            {breadcrumbs.map((item, index) => (
              <React.Fragment key={index}>
                {index > 0 && <li><span className="text-gray-400">/</span></li>}
                <li>
                  {item.href ? (
                    <Link
                      href={item.href}
                      className="text-gray-500 hover:text-gray-700">
                      {item.label}
                    </Link>
                  ) : (
                    <span className="text-gray-900 font-medium">{item.label}</span>
                  )}
                </li>
              </React.Fragment>
            ))}
          </ol>
        </nav>
      )}

      {/* Header */}
      {header && (
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            {typeof header.title === 'string' ? (
              <h1 className="text-3xl font-bold text-gray-900 truncate">{header.title}</h1>
            ) : (
              <h1 className="text-3xl font-bold text-gray-900">{header.title}</h1>
            )}
            {header.description && (
              typeof header.description === 'string' ? (
                <p className="mt-2 text-gray-600 max-w-4xl">{header.description}</p>
              ) : (
                <div className="mt-2">{header.description}</div>
              )
            )}
          </div>
          {header.actions && <div className="flex-shrink-0 ml-4">{header.actions}</div>}
        </div>
      )}

      {/* Content or Loading */}
      {loading ? (loadingComponent || defaultLoadingComponent) : children}
    </div>
  );
};

// Export a higher-order component for easy page wrapping
export const withPageContainer = <P extends object>(
  Component: React.ComponentType<P>,
  containerProps?: Omit<PageContainerProps, 'children'>,
) => {
  const WrappedComponent = (props: P) => (
    <PageContainer {...containerProps}>
      <Component {...props} />
    </PageContainer>
  );

  WrappedComponent.displayName = `withPageContainer(${Component.displayName || Component.name || 'Component'})`;

  return WrappedComponent;
};

export default PageContainer;
