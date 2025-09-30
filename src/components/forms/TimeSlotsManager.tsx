'use client';

import { useState } from 'react';
import { formatDateTimeGMTMinus5, getCurrentDisplayTimezoneDate } from '@/utils/timezone';

export interface TimeSlot {
  id?: string;
  startDateTime: string;
  endDateTime?: string;
  durationMin: number;
  isPrimary: boolean;
}

interface TimeSlotsManagerProps {
  timeSlots: TimeSlot[];
  onChange: (timeSlots: TimeSlot[]) => void;
  disabled?: boolean;
}

export default function TimeSlotsManager({ timeSlots, onChange, disabled = false }: TimeSlotsManagerProps) {
  const [dateWarnings, setDateWarnings] = useState<{ [key: number]: string }>({});

  const addTimeSlot = () => {
    const currentUTCDate = new Date();
    const { date: currentDateStr, time: currentTimeStr } = formatDateTimeGMTMinus5(currentUTCDate);
    const defaultDateTime = `${currentDateStr}T${currentTimeStr}`;
    const defaultDuration = 60;

    // Calculate endDateTime
    const endDateTime = new Date(new Date(defaultDateTime).getTime() + defaultDuration * 60000).toISOString();

    const newSlot: TimeSlot = {
      startDateTime: defaultDateTime,
      endDateTime: endDateTime,
      durationMin: defaultDuration,
      isPrimary: timeSlots.length === 0, // First slot is primary
    };

    onChange([...timeSlots, newSlot]);
  };

  const removeTimeSlot = (index: number) => {
    const newSlots = timeSlots.filter((_, i) => i !== index);

    // If we removed the primary slot and there are other slots, make the first one primary
    if (timeSlots[index].isPrimary && newSlots.length > 0) {
      newSlots[0].isPrimary = true;
    }

    onChange(newSlots);
  };

  const updateTimeSlot = (index: number, updates: Partial<TimeSlot>) => {
    const newSlots = timeSlots.map((slot, i) => {
      if (i === index) {
        const updatedSlot = { ...slot, ...updates };

        // Auto-calculate endDateTime when startDateTime or durationMin changes
        if (updates.startDateTime || updates.durationMin) {
          const startDateTime = updates.startDateTime || slot.startDateTime;
          const durationMin = updates.durationMin !== undefined ? updates.durationMin : slot.durationMin;

          if (startDateTime && durationMin > 0) {
            const endDateTime = new Date(new Date(startDateTime).getTime() + durationMin * 60000).toISOString();
            updatedSlot.endDateTime = endDateTime;
          }
        }

        // If this slot is being marked as primary, unmark others
        if (updates.isPrimary) {
          timeSlots.forEach((_, otherIndex) => {
            if (otherIndex !== index) {
              newSlots[otherIndex] = { ...newSlots[otherIndex], isPrimary: false };
            }
          });
        }

        return updatedSlot;
      }
      return slot;
    });

    onChange(newSlots);
  };

  const handleDateTimeChange = (index: number, dateTime: string) => {
    updateTimeSlot(index, { startDateTime: dateTime });

    // Check if date is in the past and show warning
    if (dateTime) {
      const selectedDateTime = new Date(dateTime);
      const now = getCurrentDisplayTimezoneDate();

      if (selectedDateTime < now) {
        setDateWarnings((prev) => ({
          ...prev,
          [index]: 'Warning: This date and time is in the past.',
        }));
      } else {
        setDateWarnings((prev) => {
          const newWarnings = { ...prev };
          delete newWarnings[index];
          return newWarnings;
        });
      }
    }
  };

  const setPrimarySlot = (index: number) => {
    updateTimeSlot(index, { isPrimary: true });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Schedule Time Slots</h3>
        <button
          type="button"
          onClick={addTimeSlot}
          disabled={disabled}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Time Slot
        </button>
      </div>

      {timeSlots.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="mt-2">No time slots scheduled</p>
          <p className="text-sm">Click &quot;Add Time Slot&quot; to schedule this task</p>
        </div>
      ) : (
        <div className="space-y-3">
          {timeSlots.map((slot, index) => (
            <div
              key={index}
              className={`border rounded-lg p-4 ${
                slot.isPrimary ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'
              }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">Time Slot {index + 1}</span>
                  {slot.isPrimary && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      Primary
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {!slot.isPrimary && (
                    <button
                      type="button"
                      onClick={() => setPrimarySlot(index)}
                      disabled={disabled}
                      className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50">
                      Make Primary
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeTimeSlot(index)}
                    disabled={disabled || timeSlots.length === 1}
                    className="text-red-600 hover:text-red-800 disabled:opacity-50">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={slot.startDateTime ? slot.startDateTime.split('T')[0] : ''}
                    onChange={(e) => {
                      const date = e.target.value;
                      const time = slot.startDateTime ? slot.startDateTime.split('T')[1] : '09:00';
                      handleDateTimeChange(index, date ? `${date}T${time}` : '');
                    }}
                    disabled={disabled}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={slot.startDateTime ? slot.startDateTime.split('T')[1] || '09:00' : '09:00'}
                    onChange={(e) => {
                      const time = e.target.value;
                      const date = slot.startDateTime
                        ? slot.startDateTime.split('T')[0]
                        : new Date().toISOString().split('T')[0];
                      handleDateTimeChange(index, date ? `${date}T${time}` : '');
                    }}
                    disabled={disabled}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Duration (min)</label>
                  <input
                    type="number"
                    min="1"
                    value={slot.durationMin}
                    onChange={(e) => {
                      const durationMin = parseInt(e.target.value) || 60;
                      updateTimeSlot(index, { durationMin });
                    }}
                    disabled={disabled}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  />
                </div>
              </div>

              {/* Duration Info */}
              {slot.startDateTime && (
                <div className="mt-2 text-xs text-gray-600">
                  Duration: {slot.durationMin} minutes
                  {slot.durationMin > 0 && slot.startDateTime && (
                    <span className="ml-2">
                      (ends at{' '}
                      {new Date(new Date(slot.startDateTime).getTime() + slot.durationMin * 60000).toLocaleTimeString(
                        [],
                        {
                          hour: '2-digit',
                          minute: '2-digit',
                        },
                      )}
                      )
                    </span>
                  )}
                </div>
              )}

              {/* Date Warning */}
              {dateWarnings[index] && <div className="mt-2 text-xs text-yellow-600">{dateWarnings[index]}</div>}
            </div>
          ))}
        </div>
      )}

      {timeSlots.length > 0 && (
        <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-md">
          <p className="flex items-center">
            <svg
              className="w-4 h-4 mr-1 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <strong>All time slots</strong> will be checked for scheduling conflicts.
          </p>
          <p className="mt-1">
            The <strong>primary slot</strong> is used for main scheduling display. Each slot has its own duration.
          </p>
        </div>
      )}
    </div>
  );
}
