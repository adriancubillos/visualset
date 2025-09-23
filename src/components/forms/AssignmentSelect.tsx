'use client';

import React from 'react';
import { DropdownOption } from '@/hooks/useTaskFormData';

interface AssignmentSelectProps {
  id: string;
  name: string;
  label: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  noSelectionText?: string;
  className?: string;
}

export default function AssignmentSelect({
  id,
  name,
  label,
  value,
  options,
  onChange,
  required = false,
  disabled = false,
  placeholder,
  noSelectionText,
  className = '',
}: AssignmentSelectProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  const baseClassName =
    'mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500';
  const disabledClassName = disabled ? ' disabled:bg-gray-100 disabled:cursor-not-allowed' : '';
  const selectClassName = `${baseClassName}${disabledClassName} ${className}`;

  // Default texts based on assignment type
  const getDefaultNoSelectionText = () => {
    if (noSelectionText) return noSelectionText;

    const lowerLabel = label.toLowerCase();
    if (lowerLabel.includes('machine')) return 'No Machine Required';
    if (lowerLabel.includes('operator')) return 'Unassigned';
    return `No ${label}`;
  };

  const getDefaultPlaceholder = () => {
    if (placeholder) return placeholder;
    return required ? `Select a ${label}` : getDefaultNoSelectionText();
  };

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700">
        {label} {required && '*'}
      </label>
      <select
        id={id}
        name={name}
        required={required}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        className={selectClassName}>
        <option value="">{getDefaultPlaceholder()}</option>
        {options.map((option) => (
          <option
            key={option.id}
            value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </div>
  );
}
