'use client';

import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

interface PageContainerProps {
  children: React.ReactNode;
  header?: PageHeaderProps;
  variant?: 'list' | 'detail' | 'form';
  className?: string;
  maxWidth?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl' | '7xl';
}

const PageContainer: React.FC<PageContainerProps> = ({
  children,
  header,
  variant = 'list',
  className = '',
  maxWidth = '7xl',
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

  return (
    <div className={containerClass}>
      {header && (
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-gray-900 truncate">{header.title}</h1>
            {header.description && <p className="mt-2 text-gray-600 max-w-4xl">{header.description}</p>}
          </div>
          {header.actions && <div className="flex-shrink-0 ml-4">{header.actions}</div>}
        </div>
      )}
      {children}
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
