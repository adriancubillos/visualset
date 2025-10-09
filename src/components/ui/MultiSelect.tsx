'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, XMarkIcon } from '@heroicons/react/20/solid';

interface Option {
  id: string;
  name: string;
}

interface MultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  options: Option[];
  placeholder?: string;
  label?: string;
  maxDisplayItems?: number;
  className?: string;
}

export default function MultiSelect({
  value = [],
  onChange,
  options,
  placeholder = 'Select options...',
  label,
  maxDisplayItems = 3,
  className = '',
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOptions = options.filter((option) => value.includes(option.id));

  const toggleOption = (optionId: string) => {
    const newValue = value.includes(optionId) ? value.filter((id) => id !== optionId) : [...value, optionId];
    onChange(newValue);
  };

  const removeOption = (optionId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    onChange(value.filter((id) => id !== optionId));
  };

  const displayItems = selectedOptions.slice(0, maxDisplayItems);
  const remainingCount = selectedOptions.length - maxDisplayItems;

  return (
    <div
      className={`relative ${className}`}
      ref={dropdownRef}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}

      <div
        className="relative w-full bg-white border border-gray-300 rounded-md shadow-sm cursor-pointer focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 min-h-[38px]"
        onClick={() => setIsOpen(!isOpen)}>
        <div className="flex flex-wrap items-center gap-1 p-2 pr-8">
          {selectedOptions.length === 0 ? (
            <span className="text-gray-500 text-sm">{placeholder}</span>
          ) : (
            <>
              {displayItems.map((option) => (
                <span
                  key={option.id}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  {option.name}
                  <button
                    type="button"
                    onClick={(e) => removeOption(option.id, e)}
                    className="flex-shrink-0 ml-1 h-3 w-3 rounded-full inline-flex items-center justify-center text-blue-400 hover:bg-blue-200 hover:text-blue-500 focus:outline-none focus:bg-blue-500 focus:text-white">
                    <XMarkIcon className="h-2 w-2" />
                  </button>
                </span>
              ))}
              {remainingCount > 0 && (
                <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                  +{remainingCount} more
                </span>
              )}
            </>
          )}
        </div>

        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <ChevronDownIcon
            className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
          />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">No options available</div>
          ) : (
            <>
              {/* Clear All / Select All */}
              <div className="px-3 py-2 border-b border-gray-100">
                <div className="flex justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onChange([])}
                    className="text-xs text-gray-500 hover:text-gray-700"
                    disabled={value.length === 0}>
                    Clear All
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange(options.map((opt) => opt.id))}
                    className="text-xs text-blue-600 hover:text-blue-800"
                    disabled={value.length === options.length}>
                    Select All
                  </button>
                </div>
              </div>

              {options.map((option) => {
                const isSelected = value.includes(option.id);
                return (
                  <div
                    key={option.id}
                    className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-50 ${
                      isSelected ? 'bg-blue-50 text-blue-900' : 'text-gray-900'
                    }`}
                    onClick={() => toggleOption(option.id)}>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // Handled by parent onClick
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-3 font-normal block truncate">{option.name}</span>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
