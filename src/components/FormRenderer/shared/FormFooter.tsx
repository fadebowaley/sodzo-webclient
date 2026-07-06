/**
 * Form Footer Component
 * Provides submit and cancel buttons
 */

import React from 'react';
import { useFormContext } from '../FormContext';
import { Loader2 } from 'lucide-react';

interface FormFooterProps {
  onCancel?: () => void;
}

export default function FormFooter({ onCancel }: FormFooterProps) {
  const { state, actions } = useFormContext();

  const handleSubmit = () => {
    // This will validate and show preview panel
    actions.submitForm();
  };

  const handleCancel = () => {
    actions.resetForm();
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-3">
        <button
          onClick={handleCancel}
          className="flex-1 px-4 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors font-medium">
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={state.isSubmitting || state.confirmationState === 'submitting'}
          className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
          {state.isSubmitting || state.confirmationState === 'submitting' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Submitting...
            </>
          ) : (
            'Submit Form'
          )}
        </button>
      </div>
    </div>
  );
}

