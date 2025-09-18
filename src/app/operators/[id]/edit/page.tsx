'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AVAILABLE_SKILLS, OPERATOR_STATUS, OPERATOR_SHIFTS } from '@/config/workshop-properties';

interface Operator {
  id: string;
  name: string;
  email: string;
  skills: string[];
  status: string;
  shift: string;
  availability: any;
  createdAt: string;
  updatedAt: string;
}

export default function EditOperatorPage() {
  const params = useParams();
  const router = useRouter();
  const [operator, setOperator] = useState<Operator | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    skills: [] as string[],
    status: 'ACTIVE',
    shift: 'DAY',
    availability: {},
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const availableSkills = AVAILABLE_SKILLS;

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
          skills: operatorData.skills,
          status: operatorData.status,
          shift: operatorData.shift || 'DAY',
          availability: operatorData.availability || {},
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching operator:', error);
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
        console.error('Failed to update operator');
      }
    } catch (error) {
      console.error('Error updating operator:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSkillToggle = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="bg-white shadow rounded-lg p-6">
            <div className="space-y-6">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!operator) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">Operator not found</div>
        <Link href="/operators" className="text-blue-600 hover:text-blue-800 mt-2 inline-block">
          Back to Operators
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <nav className="flex mb-4" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <Link href="/operators" className="text-gray-500 hover:text-gray-700">
                Operators
              </Link>
            </li>
            <li>
              <span className="text-gray-400">/</span>
            </li>
            <li>
              <Link href={`/operators/${operator.id}`} className="text-gray-500 hover:text-gray-700">
                {operator.name}
              </Link>
            </li>
            <li>
              <span className="text-gray-400">/</span>
            </li>
            <li>
              <span className="text-gray-900 font-medium">Edit</span>
            </li>
          </ol>
        </nav>
        <h1 className="text-3xl font-bold text-gray-900">Edit Operator</h1>
        <p className="mt-2 text-gray-600">Update operator information</p>
      </div>

      {/* Form */}
      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
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
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
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
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Skills *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {availableSkills.map((skill) => (
                <label
                  key={skill.value}
                  className="relative flex items-center p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={formData.skills.includes(skill.value)}
                    onChange={() => handleSkillToggle(skill.value)}
                  />
                  <div className={`w-4 h-4 rounded border-2 mr-3 flex items-center justify-center ${
                    formData.skills.includes(skill.value)
                      ? 'bg-blue-600 border-blue-600'
                      : 'border-gray-300'
                  }`}>
                    {formData.skills.includes(skill.value) && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
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

          {/* Shift */}
          <div>
            <label htmlFor="shift" className="block text-sm font-medium text-gray-700">
              Default Shift
            </label>
            <select
              id="shift"
              name="shift"
              value={formData.shift}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {OPERATOR_SHIFTS.map((shift) => (
                <option key={shift.value} value={shift.value}>
                  {shift.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {OPERATOR_STATUS.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Link
              href={`/operators/${operator.id}`}
              className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving || !formData.name.trim() || !formData.email.trim() || formData.skills.length === 0}
              className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                saving || !formData.name.trim() || !formData.email.trim() || formData.skills.length === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
