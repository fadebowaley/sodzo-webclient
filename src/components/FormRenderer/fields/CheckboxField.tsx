/**
 * Checkbox Field Component
 */

import React from 'react';
import { FormElement } from '../types';

interface CheckboxFieldProps {
  field: FormElement;
  value: any;
  onChange: (value: any) => void;
  error?: string | null;
  disabled?: boolean;
}

export default function CheckboxField({
  field,
  value,
  onChange,
  error,
  disabled = false,
}: CheckboxFieldProps) {
  const { properties } = field;

  // If options provided, render multiple checkboxes
  if (properties.options && properties.options.length > 0) {
    const selectedValues = Array.isArray(value) ? value : [];

    const handleOptionToggle = (optionValue: string) => {
      const newValues = selectedValues.includes(optionValue)
        ? selectedValues.filter(v => v !== optionValue)
        : [...selectedValues, optionValue];
      onChange(newValues);
    };

    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {properties.label}
          {properties.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        <div className="space-y-2">
          {properties.options.map((option) => (
            <label
              key={option}
              className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors">
              <input
                type="checkbox"
                checked={selectedValues.includes(option)}
                onChange={() => handleOptionToggle(option)}
                disabled={disabled}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700 dark:text-gray-300">{option}</span>
            </label>
          ))}
        </div>
        
        {properties.helpText && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {properties.helpText}
          </p>
        )}
        
        {error && (
          <p className="text-sm text-red-500 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  // Single checkbox
  return (
    <div className="space-y-2">
      <label className="flex items-center space-x-2 cursor-pointer">
        <input
          type="checkbox"
          id={field.id}
          name={field.id}
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          required={properties.required}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {properties.label}
          {properties.required && <span className="text-red-500 ml-1">*</span>}
        </span>
      </label>
      
      {properties.helpText && (
        <p className="text-xs text-gray-500 dark:text-gray-400 ml-6">
          {properties.helpText}
        </p>
      )}
      
      {error && (
        <p className="text-sm text-red-500 dark:text-red-400 ml-6" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

