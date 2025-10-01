'use client';

import React from 'react';
import { DropdownOption } from '@/hooks/useTaskFormData';
import Select from '@/components/ui/Select';
import { sortByName } from '@/utils/sorting';

interface AssignmentSelectProps {
  id: string;
  name: string;
  label: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string | null) => void;
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

  const handleChange = (newValue: string | null) => {
    onChange(newValue || '');
  };

  return (
    <div className={className}>
      <Select
        label={`${label}${required ? ' *' : ''}`}
        value={value || null}
        onChange={handleChange}
        options={sortByName(options)}
        placeholder={getDefaultPlaceholder()}
      />
      {/* Hidden input for form submission if needed */}
      <input type="hidden" id={id} name={name} value={value} />
    </div>
  );
}
