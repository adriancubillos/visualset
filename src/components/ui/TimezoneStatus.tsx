'use client';

import { useEffect, useState } from 'react';
import { getTimezoneDebugInfo, getBrowserTimezoneName } from '@/utils/timezone';

export default function TimezoneStatus() {
  const [useBrowserTimezone, setUseBrowserTimezone] = useState<boolean>(true);
  const [timezoneInfo, setTimezoneInfo] = useState<ReturnType<typeof getTimezoneDebugInfo> | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const savedSetting = localStorage.getItem('useBrowserTimezone');
    if (savedSetting !== null) {
      setUseBrowserTimezone(JSON.parse(savedSetting));
    }
    setTimezoneInfo(getTimezoneDebugInfo());
  }, []);

  const handleToggle = () => {
    const newSetting = !useBrowserTimezone;
    setUseBrowserTimezone(newSetting);
    localStorage.setItem('useBrowserTimezone', JSON.stringify(newSetting));
    setTimezoneInfo(getTimezoneDebugInfo());
    window.location.reload();
  };

  if (!timezoneInfo) return null;

  const currentTimezoneName = useBrowserTimezone ? getBrowserTimezoneName() : 'GMT-5';
  const currentOffset = useBrowserTimezone ? timezoneInfo.browserOffset : -5;
  const offsetString = currentOffset >= 0 ? `+${currentOffset}` : `${currentOffset}`;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        title="Click to change timezone settings"
      >
        <span className="text-lg">🌍</span>
        <span className="font-medium">{currentTimezoneName}</span>
        <span className="text-xs text-gray-400">(GMT{offsetString})</span>
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Timezone Settings</h3>
              <p className="text-xs text-gray-600 mb-3">
                Choose how dates and times are displayed throughout the application.
              </p>
            </div>

            <div className="space-y-3">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="radio"
                  checked={useBrowserTimezone}
                  onChange={() => handleToggle()}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">Browser Timezone</div>
                  <div className="text-xs text-gray-600">
                    Use your browser&apos;s timezone: <strong>{timezoneInfo.browserTimezone}</strong> (GMT{timezoneInfo.browserOffset >= 0 ? '+' : ''}{timezoneInfo.browserOffset})
                  </div>
                </div>
              </label>

              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="radio"
                  checked={!useBrowserTimezone}
                  onChange={() => handleToggle()}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">Fixed GMT-5</div>
                  <div className="text-xs text-gray-600">
                    Use Eastern Standard Time (GMT-5) for all displays
                  </div>
                </div>
              </label>
            </div>

            <div className="pt-2 border-t border-gray-100">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
