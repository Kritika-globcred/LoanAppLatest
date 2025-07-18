import { useState, useEffect, Fragment } from 'react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { Combobox, Transition } from '@headlessui/react';
import { classNames } from '@/utils/classnames';

export interface Country {
  code: string;
  name: string;
  flag?: string;
}

// List of all countries with ISO codes and names
export const countries: Country[] = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'JP', name: 'Japan' },
  { code: 'CN', name: 'China' },
  { code: 'IN', name: 'India' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'RU', name: 'Russia' },
  { code: 'ZA', name: 'South Africa' },
  // Add more countries as needed
].sort((a, b) => a.name.localeCompare(b.name));

interface CountrySelectProps {
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
  error?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  multiple?: boolean;
}

export function CountrySelect({
  selected,
  onChange,
  placeholder = 'Select countries...',
  className = '',
  error,
  label,
  required = false,
  disabled = false,
  multiple = true,
}: CountrySelectProps) {
  const [query, setQuery] = useState('');
  const [selectedCountries, setSelectedCountries] = useState<Country[]>([]);

  // Filter countries based on search query
  const filteredCountries = query === ''
    ? countries
    : countries.filter((country) => {
        return country.name.toLowerCase().includes(query.toLowerCase()) ||
               country.code.toLowerCase().includes(query.toLowerCase());
      });

  // Update selected countries when the selected prop changes
  useEffect(() => {
    const selectedItems = selected
      .map(code => countries.find(c => c.code === code))
      .filter((c): c is Country => c !== undefined);
    setSelectedCountries(selectedItems);
  }, [selected]);

  const handleChange = (values: Country[]) => {
    if (multiple) {
      onChange(values.map(c => c.code));
    } else {
      onChange(values.length > 0 ? [values[0].code] : []);
    }
  };

  // Get display value for the input
  const displayValue = () => {
    if (selectedCountries.length === 0) return '';
    if (selectedCountries.length === 1) return selectedCountries[0].name;
    return `${selectedCountries.length} countries selected`;
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <Combobox 
        as="div" 
        value={selectedCountries} 
        onChange={handleChange}
        multiple={multiple}
        disabled={disabled}
      >
        <div className="relative">
          <div className={`relative w-full cursor-default overflow-hidden rounded-md border ${
            error ? 'border-red-300' : 'border-gray-300'
          } bg-white text-left shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-300 sm:text-sm`}>
            <Combobox.Input
              className={`w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0 ${disabled ? 'bg-gray-50' : ''}`}
              displayValue={displayValue}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={selectedCountries.length === 0 ? placeholder : ''}
            />
            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon
                className="h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </Combobox.Button>
          </div>
          
          {/* Selected tags */}
          {selectedCountries.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {selectedCountries.map((country) => (
                <span
                  key={country.code}
                  className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800"
                >
                  {country.name}
                  <button
                    type="button"
                    className="ml-1.5 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-indigo-400 hover:bg-indigo-200 hover:text-indigo-500 focus:bg-indigo-500 focus:text-white focus:outline-none"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange(selected.filter(c => c !== country.code));
                    }}
                  >
                    <span className="sr-only">Remove {country.name}</span>
                    <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                      <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}
          
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            afterLeave={() => setQuery('')}
          >
            <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {filteredCountries.length === 0 && query !== '' ? (
                <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                  No countries found.
                </div>
              ) : (
                filteredCountries.map((country) => (
                  <Combobox.Option
                    key={country.code}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                        active ? 'bg-indigo-600 text-white' : 'text-gray-900'
                      }`
                    }
                    value={country}
                  >
                    {({ selected, active }) => (
                      <>
                        <span
                          className={`block truncate ${
                            selected ? 'font-medium' : 'font-normal'
                          }`}
                        >
                          {country.name}
                        </span>
                        {selected ? (
                          <span
                            className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                              active ? 'text-white' : 'text-indigo-600'
                            }`}
                          >
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Combobox.Option>
                ))
              )}
            </Combobox.Options>
          </Transition>
        </div>
      </Combobox>
      
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

// Helper function to get country name from code
export function getCountryName(code: string): string {
  return countries.find(c => c.code === code)?.name || code;
}

// Helper function to get country object from code
export function getCountry(code: string): Country | undefined {
  return countries.find(c => c.code === code);
}

// Helper function to get multiple country names from codes
export function getCountryNames(codes: string[]): string[] {
  return codes.map(code => getCountryName(code));
}
