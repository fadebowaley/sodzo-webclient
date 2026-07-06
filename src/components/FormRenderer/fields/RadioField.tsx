/**
 * Radio Field Component
 */

import React from 'react';
import { FormElement } from '../types';

interface RadioFieldProps {
  field: FormElement;
  value: any;
  onChange: (value: any) => void;
  error?: string | null;
  disabled?: boolean;
}

export default function RadioField({
  field,
  value,
  onChange,
  error,
  disabled = false,
}: RadioFieldProps) {
  const { properties } = field;
  const options = properties.options || [];

  if (options.length === 0) return null;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {properties.label}
        {properties.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="space-y-2">
        {options.map((option) => (
          <label
            key={option}
            className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors">
            <input
              type="radio"
              name={field.id}
              value={option}
              checked={value === option}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
              required={properties.required}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
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

