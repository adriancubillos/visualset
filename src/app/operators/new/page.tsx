'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewOperatorPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    skills: [] as string[],
    status: 'ACTIVE',
    shift: 'DAY',
    availability: {},
  });
  const [loading, setLoading] = useState(false);

  const availableSkills = [
    { value: 'CNC_MILL', label: 'CNC Mill' },
    { value: 'CNC_LATHE', label: 'CNC Lathe' },
    { value: 'WELDING', label: 'Welding' },
    { value: 'GRINDER', label: 'Grinder' },
    { value: 'DRILL_PRESS', label: 'Drill Press' },
    { value: 'BANDSAW', label: 'Bandsaw' },
    { value: 'ASSEMBLY', label: 'Assembly' },
    { value: 'QUALITY_CONTROL', label: 'Quality Control' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/operators', {
        method: 'POST',
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
        router.push('/operators');
      } else {
        console.error('Failed to create operator');
      }
    } catch (error) {
      console.error('Error creating operator:', error);
    } finally {
      setLoading(false);
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

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Add New Operator</h1>
        <p className="mt-2 text-gray-600">Register a new operator in the workshop</p>
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
              <option value="DAY">Day Shift</option>
              <option value="EVENING">Evening Shift</option>
              <option value="NIGHT">Night Shift</option>
            </select>
          </div>

          {/* Initial Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Initial Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name.trim() || !formData.email.trim() || formData.skills.length === 0}
              className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                loading || !formData.name.trim() || !formData.email.trim() || formData.skills.length === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? 'Adding...' : 'Add Operator'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
