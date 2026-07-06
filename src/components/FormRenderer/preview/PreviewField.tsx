/**
 * Preview Field Component
 * Displays a single field in the preview panel with edit capability
 */

import React from 'react';
import { Edit2, AlertCircle } from 'lucide-react';

interface PreviewFieldProps {
  fieldId: string;
  label: string;
  value: any;
  onEdit?: (fieldId: string) => void;
}

export default function PreviewField({ fieldId, label, value, onEdit }: PreviewFieldProps) {
  const isEmpty = value === null || value === undefined || value === '';

  // Format value for display
  let displayValue: string = '';
  if (isEmpty) {
    displayValue = 'Not answered';
  } else if (Array.isArray(value)) {
    displayValue = value.join(', ');
  } else if (typeof value === 'boolean') {
    displayValue = value ? 'Yes' : 'No';
  } else if (value instanceof File) {
    displayValue = value.name;
  } else {
    displayValue = String(value);
  }

  return (
    <div className="flex items-start justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </p>
          {isEmpty && (
            <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0" />
          )}
        </div>
        <p className={`text-sm ${
          isEmpty
            ? 'text-orange-600 dark:text-orange-400 italic'
            : 'text-gray-900 dark:text-white'
        }`}>
          {displayValue}
        </p>
      </div>
      {onEdit && (
        <button
          onClick={() => onEdit(fieldId)}
          className="ml-3 p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors flex-shrink-0">
          <Edit2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}


