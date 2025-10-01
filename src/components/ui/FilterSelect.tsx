'use client';

import { Fragment } from 'react';
import { Listbox, ListboxButton, ListboxOptions, ListboxOption, Transition } from '@headlessui/react';
import { UI_CONFIG } from '@/config/workshop-properties';

interface FilterOption {
  id: string;
  name: string;
}

interface FilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  allLabel?: string;
  label?: string;
  className?: string;
}

export default function FilterSelect({
  value,
  onChange,
  options,
  allLabel = 'All',
  label,
  className = '',
}: FilterSelectProps) {
  const selectedOption = value === 'all' ? null : options.find((opt) => opt.id === value);

  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>}
      <Listbox value={value} onChange={onChange}>
        <div className="relative">
          <ListboxButton className="relative w-full border-2 border-slate-200 rounded-lg p-3 text-left text-slate-700 bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors cursor-pointer">
            <span className="block truncate">{selectedOption ? selectedOption.name : allLabel}</span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <svg
                className="h-5 w-5 text-gray-400"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.2a.75.75 0 011.06.04l2.7 2.908 2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
          </ListboxButton>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0">
            <ListboxOptions
              className="absolute z-50 mt-1 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
              style={{ maxHeight: `${UI_CONFIG.SELECT_MAX_HEIGHT}px` }}>
              {/* All option */}
              <ListboxOption
                value="all"
                className={({ active }) =>
                  `relative cursor-pointer select-none py-2 pl-3 pr-9 ${
                    active ? 'bg-blue-100 text-blue-900' : 'text-slate-700'
                  }`
                }>
                {({ selected }) => (
                  <>
                    <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>{allLabel}</span>
                    {selected && (
                      <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600">
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                    )}
                  </>
                )}
              </ListboxOption>

              {/* Regular options */}
              {options.map((option) => (
                <ListboxOption
                  key={option.id}
                  value={option.id}
                  className={({ active }) =>
                    `relative cursor-pointer select-none py-2 pl-3 pr-9 ${
                      active ? 'bg-blue-100 text-blue-900' : 'text-slate-700'
                    }`
                  }>
                  {({ selected }) => (
                    <>
                      <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                        {option.name}
                      </span>
                      {selected && (
                        <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600">
                          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path
                              fillRule="evenodd"
                              d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </span>
                      )}
                    </>
                  )}
                </ListboxOption>
              ))}
            </ListboxOptions>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
}
