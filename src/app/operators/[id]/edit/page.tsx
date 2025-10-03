'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import PageContainer from '@/components/layout/PageContainer';
import { OPERATOR_STATUS } from '@/config/workshop-properties';
import { useAvailableSkills, useOperatorShifts } from '@/hooks/useConfiguration';
import VisualIdentifier from '@/components/ui/VisualIdentifier';
import { PatternType } from '@/utils/entityColors';
import { logger } from '@/utils/logger';

interface Operator {
  id: string;
  name: string;
  email: string;
  skills: string[];
  status: string;
  shift: string;
  availability: Record<string, string>;
  color?: string;
  pattern?: string;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  name: string;
  email: string;
  skills: string[];
  shift: string;
  availability: Record<string, string>;
  status: string;
  color: string;
  pattern: string;
}

export default function EditOperatorPage() {
  const params = useParams();
  const router = useRouter();
  const { options: availableSkills } = useAvailableSkills();
  const { options: operatorShifts } = useOperatorShifts();
  const [operator, setOperator] = useState<Operator | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    skills: [],
    shift: 'DAY',
    availability: {},
    status: 'ACTIVE',
    color: '#ef4444', // Red - first color in palette
    pattern: 'solid',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isColorPatternValid, setIsColorPatternValid] = useState(true);

  useEffect(() => {
    const fetchOperator = async () => {
      try {
        const response = await fetch(`/api/operators/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch operator');
        }
        const operatorData = await response.json();
        setOperator(operatorData);
        setFormData({
          name: operatorData.name,
          email: operatorData.email || '',
          skills: operatorData.skills || [],
          status: operatorData.status || 'ACTIVE',
          shift: operatorData.shift || 'DAY',
          availability: operatorData.availability || {},
          color: operatorData.color || '#3B82F6',
          pattern: operatorData.pattern || 'solid',
        });
        setLoading(false);
      } catch (error) {
        logger.error('Error fetching operator,', error);
        setLoading(false);
      }
    };

    fetchOperator();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/operators/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          email: formData.email || null,
          shift: formData.shift || null,
        }),
      });

      if (response.ok) {
        router.push(`/operators/${params.id}`);
      } else {
        logger.error('Failed to update operator');
      }
    } catch (error) {
      logger.error('Error updating operator,', error);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSkillToggle = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill) ? prev.skills.filter((s) => s !== skill) : [...prev.skills, skill],
    }));
  };

  const handleColorChange = (color: string) => {
    setFormData((prev) => ({ ...prev, color }));
  };

  const handlePatternChange = (pattern: string) => {
    setFormData((prev) => ({ ...prev, pattern }));
  };

  if (!operator && !loading) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">Operator not found</div>
        <Link
          href="/operators"
          className="text-blue-600 hover:text-blue-800 mt-2 inline-block">
          Back to Operators
        </Link>
      </div>
    );
  }

  return (
    <PageContainer
      variant="form"
      maxWidth="2xl"
      header={{
        title: 'Edit Operator',
        description: 'Update operator information',
      }}
      loading={loading}
      breadcrumbs={
        operator
          ? [
              { label: 'Operators', href: '/operators' },
              { label: operator.name, href: `/operators/${operator.id}` },
              { label: 'Edit' },
            ]
          : undefined
      }>
      {operator && (
        <div className="bg-white shadow rounded-lg">
          <form
            onSubmit={handleSubmit}
            className="space-y-6 p-6">
            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700">
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter operator's full name"
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="operator@workshop.com"
              />
            </div>

            {/* Skills */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Skills *</label>
              <div className="grid grid-cols-2 gap-3">
                {availableSkills.map((skill) => (
                  <label
                    key={skill.value}
                    className="relative flex items-center p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={formData.skills.includes(skill.value)}
                      onChange={() => handleSkillToggle(skill.value)}
                    />
                    <div
                      className={`w-4 h-4 rounded border-2 mr-3 flex items-center justify-center ${
                        formData.skills.includes(skill.value) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                      }`}>
                      {formData.skills.includes(skill.value) && (
                        <svg
                          className="w-3 h-3 text-white"
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
                    <span className="text-sm font-medium text-gray-700">{skill.label}</span>
                  </label>
                ))}
              </div>
              {formData.skills.length === 0 && (
                <p className="mt-2 text-sm text-red-600">Please select at least one skill</p>
              )}
            </div>

            {/* Visual Identifier */}
            <VisualIdentifier
              color={formData.color}
              pattern={formData.pattern as PatternType}
              onColorChange={handleColorChange}
              onPatternChange={(pattern) => handlePatternChange(pattern)}
              previewName={formData.name || 'Operator Preview'}
              entityType="operator"
              entityId={params.id as string}
              onValidationChange={setIsColorPatternValid}
            />

            {/* Shift */}
            <div>
              <label
                htmlFor="shift"
                className="block text-sm font-medium text-gray-700">
                Default Shift
              </label>
              <select
                id="shift"
                name="shift"
                value={formData.shift}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                {operatorShifts.map((shift) => (
                  <option
                    key={shift.value}
                    value={shift.value}>
                    {shift.label}
                  </option>
                ))}
              </select>
            </div>

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
                {OPERATOR_STATUS.map((status) => (
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
                href={`/operators/${operator.id}`}
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={
                  saving ||
                  !formData.name.trim() ||
                  !formData.email.trim() ||
                  formData.skills.length === 0 ||
                  !isColorPatternValid
                }
                className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  saving ||
                  !formData.name.trim() ||
                  !formData.email.trim() ||
                  formData.skills.length === 0 ||
                  !isColorPatternValid
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
