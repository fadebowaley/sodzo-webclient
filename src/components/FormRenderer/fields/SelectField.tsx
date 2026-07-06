/**
 * Select (Dropdown) Field Component
 */

import React, { useEffect, useMemo } from 'react';
import { FormElement } from '../types';
import { useFormContext } from '../FormContext';

interface SelectFieldProps {
  field: FormElement;
  value: any;
  onChange: (value: any) => void;
  error?: string | null;
  disabled?: boolean;
}

export default function SelectField({
  field,
  value,
  onChange,
  error,
  disabled = false,
}: SelectFieldProps) {
  const { properties } = field;
  const { state } = useFormContext();
  const parentFieldId = properties.parentDropdown;
  const optionsMap = properties.optionsMap;
  const parentValue = parentFieldId ? state.formValues[parentFieldId] : undefined;

  const options = useMemo(() => {
    if (parentFieldId && optionsMap) {
      return optionsMap[String(parentValue ?? '')] || [];
    }
    return properties.options || [];
  }, [optionsMap, parentFieldId, parentValue, properties.options]);

  useEffect(() => {
    if (!value || options.length === 0) return;
    if (!options.includes(String(value))) {
      onChange('');
    }
  }, [onChange, options, value]);

  return (
    <div className="space-y-2">
      <label
        htmlFor={field.id}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {properties.label}
        {properties.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <select
        id={field.id}
        name={field.id}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required={properties.required}
        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base ${
          error
            ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
            : 'border-gray-300 dark:border-gray-600'
        } ${
          disabled
            ? 'bg-gray-50 dark:bg-gray-700 cursor-not-allowed opacity-60'
            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
        }`}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${field.id}-error` : undefined}
      >
        <option value="">Select {properties.label}...</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      
      {properties.helpText && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {properties.helpText}
        </p>
      )}
      
      {error && (
        <p id={`${field.id}-error`} className="text-sm text-red-500 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

