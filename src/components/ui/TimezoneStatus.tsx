'use client';

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { getTimezoneDebugInfo, getBrowserTimezoneName } from '@/utils/timezone';

export default function TimezoneStatus() {
  const [useBrowserTimezone, setUseBrowserTimezone] = useState<boolean>(true);
  const [timezoneInfo, setTimezoneInfo] = useState<ReturnType<typeof getTimezoneDebugInfo> | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const savedSetting = localStorage.getItem('useBrowserTimezone');
    if (savedSetting !== null) {
      setUseBrowserTimezone(JSON.parse(savedSetting));
    }
    setTimezoneInfo(getTimezoneDebugInfo());
  }, []);

  const handleTimezoneChange = (useBrowser: boolean) => {
    setUseBrowserTimezone(useBrowser);
    localStorage.setItem('useBrowserTimezone', JSON.stringify(useBrowser));
    setTimezoneInfo(getTimezoneDebugInfo());
    window.location.reload();
  };

  const openDropdown = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
    }
    setIsOpen(true);
  };

  if (!timezoneInfo) return null;

  const currentTimezoneName = useBrowserTimezone ? getBrowserTimezoneName() : 'GMT-5';
  const currentOffset = useBrowserTimezone ? timezoneInfo.browserOffset : -5;
  const offsetString = currentOffset >= 0 ? `+${currentOffset}` : `${currentOffset}`;

  return (
    <div className="relative z-50">
      <button
        ref={buttonRef}
        onClick={openDropdown}
        className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        title="Click to change timezone settings">
        <span className="text-lg">🌍</span>
        <span className="font-medium">{currentTimezoneName}</span>
        <span className="text-xs text-gray-400">(GMT{offsetString})</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen &&
        createPortal(
          <div
            className="fixed w-56 bg-white rounded-lg shadow-xl border border-gray-200 p-3 z-[9999]"
            style={{
              top: dropdownPosition.top,
              right: dropdownPosition.right,
            }}>
            <div className="space-y-3">
              <div>
                <h3 className="text-xs font-semibold text-gray-900 mb-2">Timezone Settings</h3>
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={useBrowserTimezone}
                    onChange={() => handleTimezoneChange(true)}
                    className="w-3 h-3 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="text-xs font-medium text-gray-900">Browser Timezone</div>
                    <div className="text-xs text-gray-500">{timezoneInfo.browserTimezone}</div>
                  </div>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={!useBrowserTimezone}
                    onChange={() => handleTimezoneChange(false)}
                    className="w-3 h-3 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="text-xs font-medium text-gray-900">Fixed GMT-5</div>
                    <div className="text-xs text-gray-500">Eastern Standard Time</div>
                  </div>
                </label>
              </div>

              <div className="pt-1 border-t border-gray-100">
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors">
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {isOpen && (
        <div
          className="fixed inset-0 bg-transparent z-[9998]"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
