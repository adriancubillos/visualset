'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { logger } from '@/utils/logger';
import Link from 'next/link';
import PageContainer from '@/components/layout/PageContainer';
import VisualIdentifier from '@/components/ui/VisualIdentifier';
import { PatternType } from '@/utils/entityColors';
import { MACHINE_TYPES, MACHINE_STATUS } from '@/config/workshop-properties';

interface Machine {
  id: string;
  name: string;
  type: string;
  status: string;
  location: string;
  color?: string | null;
  pattern?: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function EditMachinePage() {
  const params = useParams();
  const router = useRouter();
  const [machine, setMachine] = useState<Machine | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: MACHINE_TYPES[0].value,
    status: 'AVAILABLE',
    location: '',
    color: '#ef4444', // Red - first color in palette
    pattern: 'solid' as PatternType,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isColorPatternValid, setIsColorPatternValid] = useState(true);

  useEffect(() => {
    const fetchMachine = async () => {
      try {
        const response = await fetch(`/api/machines/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch machine');
        }
        const machineData = await response.json();
        setMachine(machineData);
        setFormData({
          name: machineData.name || '',
          type: machineData.type || MACHINE_TYPES[0].value,
          status: machineData.status || 'AVAILABLE',
          location: machineData.location || '',
          color: machineData.color || '#3B82F6',
          pattern: (machineData.pattern as PatternType) || 'solid',
        });
        setLoading(false);
      } catch (error) {
        logger.error('Error fetching machine', error);
        setLoading(false);
      }
    };

    fetchMachine();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/machines/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push(`/machines/${params.id}`);
      } else {
        logger.apiError('Update machine', `/api/machines/${params.id}`, 'Failed to update');
      }
    } catch (error) {
      logger.error('Error updating machine', error);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleColorChange = (color: string) => {
    setFormData((prev) => ({ ...prev, color }));
  };

  const handlePatternChange = (pattern: PatternType) => {
    setFormData((prev) => ({ ...prev, pattern }));
  };

  if (!machine && !loading) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">Machine not found</div>
        <Link
          href="/machines"
          className="text-blue-600 hover:text-blue-800 mt-2 inline-block">
          Back to Machines
        </Link>
      </div>
    );
  }

  return (
    <PageContainer
      header={{
        title: 'Edit Machine',
        description: 'Update machine information',
      }}
      variant="form"
      loading={loading}
      breadcrumbs={machine ? [
        { label: 'Machines', href: '/machines' },
        { label: machine.name, href: `/machines/${machine.id}` },
        { label: 'Edit' },
      ] : undefined}>

      {machine && (
      <div className="bg-white shadow rounded-lg">
        <form
          onSubmit={handleSubmit}
          className="space-y-6 p-6">
          {/* Machine Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700">
              Machine Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., CNC-001, DRILL-002"
            />
          </div>

          {/* Machine Type */}
          <div>
            <label
              htmlFor="type"
              className="block text-sm font-medium text-gray-700">
              Machine Type *
            </label>
            <select
              id="type"
              name="type"
              required
              value={formData.type}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
              {MACHINE_TYPES.map((type) => (
                <option
                  key={type.value}
                  value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div>
            <label
              htmlFor="location"
              className="block text-sm font-medium text-gray-700">
              Location *
            </label>
            <input
              type="text"
              id="location"
              name="location"
              required
              value={formData.location}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Workshop A, Bay 3"
            />
          </div>

          {/* Visual Identifier */}
          <VisualIdentifier
            color={formData.color}
            pattern={formData.pattern}
            onColorChange={handleColorChange}
            onPatternChange={handlePatternChange}
            previewName={formData.name || 'Machine Preview'}
            entityType="machine"
            entityId={params.id as string}
            onValidationChange={setIsColorPatternValid}
          />

          {/* Status */}
          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
              {MACHINE_STATUS.map((status) => (
                <option
                  key={status.value}
                  value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Link
              href={`/machines/${machine.id}`}
              className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving || !formData.name.trim() || !formData.location?.trim() || !isColorPatternValid}
              className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                saving || !formData.name.trim() || !formData.location?.trim() || !isColorPatternValid
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
      )}
    </PageContainer>
  );
}
