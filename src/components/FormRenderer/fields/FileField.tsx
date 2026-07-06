/**
 * File Upload Field Component
 */

import React from 'react';
import { FormElement } from '../types';
import { Upload } from 'lucide-react';

interface FileFieldProps {
  field: FormElement;
  value: any;
  onChange: (value: any) => void;
  error?: string | null;
  disabled?: boolean;
}

export default function FileField({
  field,
  value,
  onChange,
  error,
  disabled = false,
}: FileFieldProps) {
  const { properties } = field;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onChange(file);
  };

  return (
    <div className="space-y-2">
      <label
        htmlFor={field.id}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {properties.label}
        {properties.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          error
            ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        } ${
          disabled
            ? 'cursor-not-allowed opacity-60'
            : 'cursor-pointer'
        }`}>
        <input
          type="file"
          id={field.id}
          name={field.id}
          onChange={handleFileChange}
          disabled={disabled}
          required={properties.required}
          accept={properties.accept}
          className="hidden"
        />
        <label
          htmlFor={field.id}
          className={`cursor-pointer flex flex-col items-center ${
            disabled ? 'cursor-not-allowed' : ''
          }`}>
          <Upload className={`w-8 h-8 mb-2 ${
            error
              ? 'text-red-500'
              : 'text-gray-400 dark:text-gray-500'
          }`} />
          {value && value.name ? (
            <div className="mt-2">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {value.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Click to change file
              </p>
            </div>
          ) : (
            <div className="mt-2">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Click to upload or drag and drop
              </p>
              {properties.accept && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Accepted: {properties.accept}
                </p>
              )}
            </div>
          )}
        </label>
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

