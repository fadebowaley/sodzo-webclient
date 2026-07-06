/**
 * Chat Field Renderer - Simplified field renderer for chat interface
 * Renders fields in a more compact, chat-friendly way
 */

import React from 'react';
import { FormElement } from '../types';

interface ChatFieldRendererProps {
  field: FormElement;
  value: any;
  onChange: (value: any) => void;
  error?: string | null;
  onKeyPress?: (e: React.KeyboardEvent) => void;
  inputRef?: React.RefObject<HTMLInputElement | HTMLTextAreaElement>;
  compact?: boolean; // For bottom input bar
}

export default function ChatFieldRenderer({
  field,
  value,
  onChange,
  error,
  onKeyPress,
  inputRef,
  compact = false,
}: ChatFieldRendererProps) {
  const { properties } = field;

  const baseInputClasses = `w-full px-3 py-2 bg-white dark:bg-gray-800 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm ${
    error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
  } text-gray-900 dark:text-gray-100 ${
    compact ? 'py-2.5' : ''
  }`;

  // Text/Email/Tel inputs
  if (field.type === 'text' || field.type === 'email' || field.type === 'tel') {
    return (
      <div className="space-y-1">
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type={field.type === 'email' ? 'email' : field.type === 'tel' ? 'tel' : 'text'}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={onKeyPress}
          placeholder={
            compact
              ? properties.placeholder || `Type your answer...`
              : properties.placeholder || `Type your ${properties.label.toLowerCase()}...`
          }
          className={baseInputClasses}
        />
        {error && (
          <p className="text-xs text-red-500 dark:text-red-400 mt-1">{error}</p>
        )}
      </div>
    );
  }

  // Textarea
  if (field.type === 'textarea') {
    return (
      <div className="space-y-1">
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={onKeyPress}
          placeholder={
            compact
              ? properties.placeholder || `Type your answer...`
              : properties.placeholder || `Type your ${properties.label.toLowerCase()}...`
          }
          rows={compact ? 2 : properties.rows || 3}
          className={`${baseInputClasses} resize-none`}
        />
        {error && (
          <p className="text-xs text-red-500 dark:text-red-400 mt-1">{error}</p>
        )}
      </div>
    );
  }

  // Number
  if (field.type === 'number') {
    return (
      <div className="space-y-1">
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="number"
          value={value || ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}
          placeholder={properties.placeholder || `Enter ${properties.label.toLowerCase()}...`}
          min={properties.min}
          max={properties.max}
          step={properties.step || 1}
          className={baseInputClasses}
        />
        {error && (
          <p className="text-xs text-red-500 dark:text-red-400 mt-1">{error}</p>
        )}
      </div>
    );
  }

  // Date
  if (field.type === 'date') {
    const dateValue = value ? new Date(value).toISOString().split('T')[0] : '';
    return (
      <div className="space-y-1">
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="date"
          value={dateValue}
          onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : '')}
          className={baseInputClasses}
        />
        {error && (
          <p className="text-xs text-red-500 dark:text-red-400 mt-1">{error}</p>
        )}
      </div>
    );
  }

  // Select/Dropdown
  if (field.type === 'select') {
    const options = properties.options || [];
    return (
      <div className="space-y-1">
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className={baseInputClasses}
        >
          <option value="">Select an option...</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        {error && (
          <p className="text-xs text-red-500 dark:text-red-400 mt-1">{error}</p>
        )}
      </div>
    );
  }

  // Radio
  if (field.type === 'radio') {
    const options = properties.options || [];
    return (
      <div className="space-y-2">
        {options.map((option) => (
          <label key={option} className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name={field.id}
              value={option}
              checked={value === option}
              onChange={(e) => onChange(e.target.value)}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">{option}</span>
          </label>
        ))}
        {error && (
          <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }

  // Checkbox (single)
  if (field.type === 'checkbox' && (!properties.options || properties.options.length === 0)) {
    return (
      <div className="space-y-1">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Yes</span>
        </label>
        {error && (
          <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }

  // Multi-select / Checkbox group
  if (field.type === 'multiselect' || (field.type === 'checkbox' && properties.options && properties.options.length > 0)) {
    const options = properties.options || [];
    const selectedValues = Array.isArray(value) ? value : [];

    return (
      <div className="space-y-2">
        {options.map((option) => (
          <label key={option} className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedValues.includes(option)}
              onChange={(e) => {
                const newValues = e.target.checked
                  ? [...selectedValues, option]
                  : selectedValues.filter(v => v !== option);
                onChange(newValues);
              }}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">{option}</span>
          </label>
        ))}
        {error && (
          <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }

  // File upload
  if (field.type === 'file') {
    return (
      <div className="space-y-1">
        <label className="block">
          <input
            type="file"
            onChange={(e) => onChange(e.target.files?.[0] || null)}
            accept={properties.accept}
            className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400"
          />
        </label>
        {value && value instanceof File && (
          <p className="text-xs text-gray-600 dark:text-gray-400">Selected: {value.name}</p>
        )}
        {error && (
          <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }

  // Default fallback
  return (
    <div className="space-y-1">
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={onKeyPress}
        placeholder={properties.placeholder || `Type your answer...`}
        className={baseInputClasses}
      />
      {error && (
        <p className="text-xs text-red-500 dark:text-red-400 mt-1">{error}</p>
      )}
    </div>
  );
}

