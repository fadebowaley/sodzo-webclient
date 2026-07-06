/**
 * Text Field Component
 */

import React from 'react';
import { FormElement } from '../types';

interface TextFieldProps {
  field: FormElement;
  value: any;
  onChange: (value: any) => void;
  error?: string | null;
  disabled?: boolean;
  type?: 'text' | 'tel' | 'password' | 'url' | 'time' | 'datetime-local';
}

export default function TextField({
  field,
  value,
  onChange,
  error,
  disabled = false,
  type = 'text',
}: TextFieldProps) {
  const { properties } = field;

  return (
    <div className="space-y-2">
      <label
        htmlFor={field.id}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {properties.label}
        {properties.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <input
        type={type}
        id={field.id}
        name={field.id}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={properties.placeholder}
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
      />
      
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

