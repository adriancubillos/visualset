'use client';

import { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { UI_CONFIG } from '@/config/workshop-properties';

interface SelectOption {
  id: string;
  name: string;
}

interface SelectProps {
  value: string | null;
  onChange: (value: string | null) => void;
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  className?: string;
}

export default function Select({ value, onChange, options, placeholder = '-- None --', label, className = '' }: SelectProps) {
  const selectedOption = options.find((opt) => opt.id === value);

  return (
    <div className={className}>
      {label && <label className="block mb-2 text-sm font-semibold text-gray-700">{label}</label>}
      <Listbox value={value} onChange={onChange}>
        <div className="relative">
          <Listbox.Button className="relative w-full border-2 border-gray-300 rounded-md p-3 text-left text-gray-900 bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 cursor-pointer">
            <span className="block truncate">{selectedOption ? selectedOption.name : placeholder}</span>
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
          </Listbox.Button>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0">
            <Listbox.Options
              className="absolute z-10 mt-1 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
              style={{ maxHeight: `${UI_CONFIG.SELECT_MAX_HEIGHT}px` }}>
              {/* None option */}
              <Listbox.Option
                value={null}
                className={({ active }) =>
                  `relative cursor-pointer select-none py-2 pl-3 pr-9 ${
                    active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                  }`
                }>
                {({ selected }) => (
                  <>
                    <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                      {placeholder}
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
              </Listbox.Option>

              {/* Regular options */}
              {options.map((option) => (
                <Listbox.Option
                  key={option.id}
                  value={option.id}
                  className={({ active }) =>
                    `relative cursor-pointer select-none py-2 pl-3 pr-9 ${
                      active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
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
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
}
