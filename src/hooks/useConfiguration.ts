import { useState, useEffect, useCallback } from 'react';
import { ConfigurationCategory } from '@prisma/client';

interface Configuration {
  id: string;
  category: ConfigurationCategory;
  value: string;
  label: string;
  createdAt: string;
  updatedAt: string;
}

interface ConfigurationOption {
  value: string;
  label: string;
}

// Hook to fetch configurations for a specific category
export const useConfiguration = (category: ConfigurationCategory) => {
  const [configurations, setConfigurations] = useState<Configuration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfigurations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/configuration?category=${category}`);

      if (response.ok) {
        const data = await response.json();
        setConfigurations(data);
      } else {
        throw new Error('Failed to fetch configurations');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching configurations:', err);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchConfigurations();
  }, [fetchConfigurations]);

  // Convert configurations to options format for dropdowns
  const options: ConfigurationOption[] = configurations.map((config) => ({
    value: config.value,
    label: config.label,
  }));

  return {
    configurations,
    options,
    loading,
    error,
    refetch: fetchConfigurations, // Now properly calls the fetch function
  };
};

// Hook to get all configurations
export const useAllConfigurations = () => {
  const [configurations, setConfigurations] = useState<Configuration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfigurations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/configuration');

      if (response.ok) {
        const data = await response.json();
        setConfigurations(data);
      } else {
        throw new Error('Failed to fetch configurations');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching configurations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfigurations();
  }, [fetchConfigurations]);

  // Get configurations by category
  const getByCategory = (category: ConfigurationCategory): ConfigurationOption[] => {
    return configurations
      .filter((config) => config.category === category)
      .map((config) => ({
        value: config.value,
        label: config.label,
      }));
  };

  return {
    configurations,
    loading,
    error,
    getByCategory,
    refetch: fetchConfigurations, // Now properly calls the fetch function
  };
};

// Specific hooks for each category for easier use
export const useAvailableSkills = () => useConfiguration('AVAILABLE_SKILLS');
export const useMachineTypes = () => useConfiguration('MACHINE_TYPES');
export const useTaskTitles = () => useConfiguration('TASK_TITLES');
export const useTaskPriority = () => useConfiguration('TASK_PRIORITY');
export const useOperatorShifts = () => useConfiguration('OPERATOR_SHIFTS');

// Helper function to get label by value
export const getConfigurationLabel = (configurations: Configuration[], value: string): string => {
  const config = configurations.find((c) => c.value === value);
  return config?.label || value;
};
