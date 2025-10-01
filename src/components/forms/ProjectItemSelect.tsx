'use client';

import React from 'react';
import { DropdownOption, ItemOption } from '@/hooks/useTaskFormData';
import Select from '@/components/ui/Select';
import { sortByName } from '@/utils/sorting';

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
  const handleProjectChange = (newProjectId: string | null) => {
    onProjectChange(newProjectId || '');
    // Reset item when project changes
    onItemChange('');
  };

  const handleItemChange = (newItemId: string | null) => {
    onItemChange(newItemId || '');
  };

  const getFilteredItems = () => {
    return items.filter((item) => item.projectId === projectId);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Project Assignment */}
      <div>
        <Select
          label={`Project${required ? ' *' : ''}`}
          value={projectId || null}
          onChange={handleProjectChange}
          options={sortByName(projects)}
          placeholder={required ? 'Select a Project' : 'No Project'}
        />
        <input type="hidden" id="projectId" name="projectId" value={projectId} />
      </div>

      {/* Item Assignment */}
      <div>
        <Select
          label={`Item${required ? ' *' : ''}`}
          value={itemId || null}
          onChange={handleItemChange}
          options={sortByName(getFilteredItems())}
          placeholder={required ? 'Select an Item' : 'No Item'}
        />
        <input type="hidden" id="itemId" name="itemId" value={itemId} />
      </div>
    </div>
  );
}
