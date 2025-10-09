'use client';

import { useState, useEffect } from 'react';
import { logger } from '@/utils/logger';

export interface DropdownOption {
  id: string;
  name: string;
}

export interface ItemOption extends DropdownOption {
  projectId: string;
}

export interface TaskFormData {
  projects: DropdownOption[];
  items: ItemOption[];
  machines: DropdownOption[];
  operators: DropdownOption[];
  loading: boolean;
  error: string | null;
}

export function useTaskFormData() {
  const [data, setData] = useState<TaskFormData>({
    projects: [],
    items: [],
    machines: [],
    operators: [],
    loading: true,
    error: null,
  });

  // Fetch API data only once on mount
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const [projectsRes, machinesRes, operatorsRes] = await Promise.all([
          fetch('/api/projects?include=items'),
          fetch('/api/machines'),
          fetch('/api/operators'),
        ]);

        const results = await Promise.all([
          projectsRes.ok
            ? projectsRes.json()
            : Promise.reject(`Failed to fetch projects - Status: ${projectsRes.status}`),
          machinesRes.ok
            ? machinesRes.json()
            : Promise.reject(`Failed to fetch machines - Status: ${machinesRes.status}`),
          operatorsRes.ok
            ? operatorsRes.json()
            : Promise.reject(`Failed to fetch operators - Status: ${operatorsRes.status}`),
        ]);

        if (!isMounted) return;

        const [projectsData, machinesData, operatorsData] = results;

        // Extract projects
        const projects = projectsData.map((p: { id: string; name: string }) => ({
          id: p.id,
          name: p.name,
        }));

        // Extract all items from all projects
        const items = projectsData.flatMap((p: { id: string; name: string; items?: { id: string; name: string }[] }) =>
          (p.items || []).map((item: { id: string; name: string }) => ({
            ...item,
            projectId: p.id,
          })),
        );

        // Format machines and operators
        const machines = machinesData.map((m: { id: string; name: string }) => ({
          id: m.id,
          name: m.name,
        }));

        const operators = operatorsData.map((o: { id: string; name: string }) => ({
          id: o.id,
          name: o.name,
        }));

        setData((prev) => ({
          ...prev,
          projects,
          items,
          machines,
          operators,
          loading: false,
          error: null,
        }));
      } catch (error) {
        if (!isMounted) return;
        logger.error('Error fetching task form data,', error);
        setData((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch data',
        }));
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  return data;
}
