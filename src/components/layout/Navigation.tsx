'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

const navigationItems = [
  { name: 'Dashboard', href: '/', icon: '📊' },
  { name: 'Schedule', href: '/schedule', icon: '📅' },
  { name: 'Projects', href: '/projects', icon: '📁' },
  { name: 'Items', href: '/items', icon: '📦' },
  { name: 'Tasks', href: '/tasks', icon: '✅' },
  { name: 'Machines', href: '/machines', icon: '⚙️' },
  { name: 'Operators', href: '/operators', icon: '👥' },
  { name: 'Configuration', href: '/configuration', icon: '🔧' },
];

export default function Navigation() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isClient, setIsClient] = useState(false);

  // Ensure this only runs on client side to avoid hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Store current page's search params for restoration
  const currentSearchString = searchParams.toString();

  // Store filter state in sessionStorage when navigating away
  const handleNavigation = () => {
    if (isClient && currentSearchString) {
      // Store the current page's search params
      sessionStorage.setItem(`filters_${pathname}`, currentSearchString);
    }
  };

  // Get stored search params for the target page (only on client)
  const getHrefWithStoredParams = (href: string) => {
    if (!isClient) {
      // During SSR, always return the base href to avoid hydration mismatch
      return href;
    }

    const storedParams = sessionStorage.getItem(`filters_${href}`);
    if (storedParams) {
      return `${href}?${storedParams}`;
    }
    return href;
  };

  return (
    <nav className="bg-white shadow-sm border-b relative z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Visualset Manager</h1>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.name}
                    href={getHrefWithStoredParams(item.href)}
                    onClick={handleNavigation}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}>
                    <span className="mr-2">{item.icon}</span>
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex items-center mr-8">{/* Timezone status removed - using browser timezone */}</div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="sm:hidden">
        <div className="pt-2 pb-3 space-y-1">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  isActive
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                }`}>
                <span className="mr-2">{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
