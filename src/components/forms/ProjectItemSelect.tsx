'use client';

import React from 'react';
import { DropdownOption, ItemOption } from '@/hooks/useTaskFormData';

interface ProjectItemSelectProps {
  projectId: string;
  itemId: string;
  projects: DropdownOption[];
  items: ItemOption[];
  onProjectChange: (projectId: string) => void;
  onItemChange: (itemId: string) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export default function ProjectItemSelect({
  projectId,
  itemId,
  projects,
  items,
  onProjectChange,
  onItemChange,
  required = false,
  disabled = false,
  className = '',
}: ProjectItemSelectProps) {
  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProjectId = e.target.value;
    onProjectChange(newProjectId);
    // Reset item when project changes
    onItemChange('');
  };

  const getFilteredItems = () => {
    return items.filter((item) => item.projectId === projectId);
  };

  const baseClassName =
    'mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500';
  const disabledClassName = disabled ? ' disabled:bg-gray-100 disabled:cursor-not-allowed' : '';
  const selectClassName = `${baseClassName}${disabledClassName} ${className}`;

  return (
    <div className="space-y-6">
      {/* Project Assignment */}
      <div>
        <label
          htmlFor="projectId"
          className="block text-sm font-medium text-gray-700">
          Project {required && '*'}
        </label>
        <select
          id="projectId"
          name="projectId"
          required={required}
          value={projectId}
          onChange={handleProjectChange}
          disabled={disabled}
          className={selectClassName}>
          <option value="">{required ? 'Select a Project' : 'No Project'}</option>
          {projects.map((project) => (
            <option
              key={project.id}
              value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      {/* Item Assignment */}
      <div>
        <label
          htmlFor="itemId"
          className="block text-sm font-medium text-gray-700">
          Item {required && '*'}
        </label>
        <select
          id="itemId"
          name="itemId"
          required={required}
          value={itemId}
          onChange={(e) => onItemChange(e.target.value)}
          disabled={disabled || !projectId}
          className={selectClassName}>
          <option value="">{required ? 'Select an Item' : 'No Item'}</option>
          {getFilteredItems().map((item) => (
            <option
              key={item.id}
              value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
