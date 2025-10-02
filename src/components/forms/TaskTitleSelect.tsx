'use client';

import { useState } from 'react';
import { Combobox } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/24/solid';

interface TaskTitleOption {
  id: string;
  name: string;
}

interface TaskTitleSelectProps {
  options: TaskTitleOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function TaskTitleSelect({ options, value, onChange, disabled }: TaskTitleSelectProps) {
  const [query, setQuery] = useState('');

  const filteredOptions =
    query === ''
      ? options
      : options.filter((option) => {
          return option.name.toLowerCase().includes(query.toLowerCase());
        });

  const handleSelection = (selection: TaskTitleOption | string | null) => {
    if (selection) {
      const newValue = typeof selection === 'string' ? selection : selection.name;
      onChange(newValue);
    }
  };

  return (
    <Combobox
      as="div"
      value={value}
      onChange={handleSelection}
      disabled={disabled}>
      <div className="relative">
        <Combobox.Input
          className={`relative w-full border-2 border-gray-300 rounded-md p-3 text-left text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 ${
            disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
          }`}
          onChange={(event) => {
            const val = event.target.value;
            setQuery(val);
            onChange(val);
          }}
          displayValue={(val: string) => val}
        />
        <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-3">
          <ChevronUpDownIcon
            className="h-5 w-5 text-gray-400"
            aria-hidden="true"
          />
        </Combobox.Button>

        {(filteredOptions.length > 0 || query.length > 0) && (
          <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            {filteredOptions.map((option) => (
              <Combobox.Option
                key={option.id}
                value={option}
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
                      <span className={`absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600`}>
                        <CheckIcon
                          className="h-5 w-5"
                          aria-hidden="true"
                        />
                      </span>
                    )}
                  </>
                )}
              </Combobox.Option>
            ))}
            {query.length > 0 && !filteredOptions.some((o) => o.name.toLowerCase() === query.toLowerCase()) && (
              <Combobox.Option
                value={query}
                className={({ active }) =>
                  `relative cursor-pointer select-none py-2 pl-3 pr-9 ${
                    active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                  }`
                }>
                Create &quot;{query}&quot;
              </Combobox.Option>
            )}
          </Combobox.Options>
        )}
      </div>
    </Combobox>
  );
}
