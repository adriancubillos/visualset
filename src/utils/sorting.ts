/**
 * Reusable sorting utilities for consistent alphabetical sorting across the app
 */

export interface SortableByName {
  name: string;
}

export interface SortableByLabel {
  label: string;
}

/**
 * Sort an array of objects by their 'name' property alphabetically
 */
export function sortByName<T extends SortableByName>(items: T[]): T[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Sort an array of objects by their 'label' property alphabetically
 */
export function sortByLabel<T extends SortableByLabel>(items: T[]): T[] {
  return [...items].sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Generic sort function for any string property
 */
export function sortByProperty<T>(items: T[], propertyName: keyof T): T[] {
  return [...items].sort((a, b) => {
    const aValue = String(a[propertyName]);
    const bValue = String(b[propertyName]);
    return aValue.localeCompare(bValue);
  });
}
