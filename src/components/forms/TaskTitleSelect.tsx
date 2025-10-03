'use client';

import { useState, useRef, useEffect } from 'react';
import { useTaskTitles } from '@/hooks/useConfiguration';

interface TaskTitleSelectProps {
  options?: Array<{ id: string; name: string }>; // Keep for compatibility
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function TaskTitleSelect({ value, onChange, disabled }: TaskTitleSelectProps) {
  const { options: taskTitles } = useTaskTitles();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get the display value - either from taskTitles or the current value
  const getDisplayValue = () => {
    const matchedTitle = taskTitles.find((title) => title.label === value);
    return matchedTitle ? matchedTitle.label : value;
  };

  // Filter options based on search query
  const filteredOptions = searchQuery.trim()
    ? taskTitles.filter((title) => title.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : taskTitles; // Show all options when no search query

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    onChange(newValue);
    setIsOpen(true);
  };

  const handleOptionSelect = (title: string) => {
    onChange(title);
    setSearchQuery('');
    setIsOpen(false);
    // Immediately blur the input to prevent focus issues
    if (dropdownRef.current) {
      const input = dropdownRef.current.querySelector('input');
      if (input) {
        input.blur();
      }
    }
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    setSearchQuery(''); // Clear search query to show all options
  };

  const handleInputBlur = () => {
    // Longer delay to ensure option clicks work
    setTimeout(() => {
      setIsOpen(false);
      setSearchQuery('');
    }, 200);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      className="relative"
      ref={dropdownRef}>
      <div className="relative">
        <input
          type="text"
          value={isOpen ? searchQuery : getDisplayValue()}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          disabled={disabled}
          className={`relative w-full border-2 border-gray-300 rounded-md p-3 pr-10 text-left text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 ${
            disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white cursor-pointer'
          }`}
          placeholder={isOpen ? 'Type to search...' : 'Select or type a task title...'}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg
            className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-md shadow-lg max-h-60 overflow-auto ring-1 ring-black ring-opacity-5 focus:outline-none">
          {/* Current input as custom option if it doesn't match existing titles */}
          {searchQuery && !taskTitles.some((title) => title.label.toLowerCase() === searchQuery.toLowerCase()) && (
            <div
              className="px-3 py-2 text-gray-900 cursor-pointer hover:bg-blue-50"
              onMouseDown={(e) => {
                e.preventDefault();
                handleOptionSelect(searchQuery);
              }}>
              <div className="flex items-center justify-between">
                <span>Create &quot;{searchQuery}&quot;</span>
                <span className="text-sm text-gray-500">New</span>
              </div>
            </div>
          )}

          {/* Existing options */}
          {filteredOptions.map((title) => (
            <div
              key={title.value}
              className={`px-3 py-2 cursor-pointer ${
                value === title.label
                  ? 'bg-blue-100 text-blue-900 hover:bg-blue-100 hover:text-blue-900'
                  : 'text-gray-900 hover:bg-blue-50 hover:text-gray-900 hover:font-semibold'
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                handleOptionSelect(title.label);
              }}>
              <div className="flex items-center justify-between">
                <span className={value === title.label ? 'font-semibold' : ''}>{title.label}</span>
                {value === title.label && (
                  <svg
                    className="h-5 w-5 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            </div>
          ))}

          {filteredOptions.length === 0 && searchQuery && (
            <div className="px-3 py-2 text-gray-500 text-sm">
              No matching titles found. Press Enter to create &quot;{searchQuery}&quot;.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
