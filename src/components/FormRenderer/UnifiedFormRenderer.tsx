/**
 * Unified Form Renderer - Main Container Component
 * Orchestrates the dual-mode form rendering system
 */

import React, { useEffect } from 'react';
import { FormProvider, useFormContext } from './FormContext';
import { FormConfiguration, FormMode } from './types';
import StandardFormView from './modes/StandardFormView';
import ValidationSummary from './ValidationSummary';
import PreviewPanel from './preview/PreviewPanel';
import ConfirmationModal from './confirmation/ConfirmationModal';
import FormFooter from './shared/FormFooter';
import { Loader2, Eye } from 'lucide-react';

interface UnifiedFormRendererProps {
  formData: FormConfiguration | null;
  onSubmit?: (values: Record<string, any>) => Promise<void>;
  initialMode?: FormMode;
  loading?: boolean;
  onCancel?: () => void;
}

function FormRendererContent({ onCancel }: { onCancel?: () => void }) {
  const { state, actions } = useFormContext();

  // Scroll to first error on validation
  useEffect(() => {
    if (Object.keys(state.validationErrors).length > 0 && state.fieldTouched) {
      const firstErrorFieldId = Object.keys(state.validationErrors)[0];
      const element = document.getElementById(`field-${firstErrorFieldId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [state.validationErrors]);

  if (!state.formData) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        No form data available
      </div>
    );
  }

  const handleEditField = (fieldId: string) => {
    // Close preview
    actions.togglePreview();
    // Scroll to field
    setTimeout(() => {
      const element = document.getElementById(`field-${fieldId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Preview Toggle */}
        <div className="flex items-center justify-end">
          <button
            onClick={() => actions.togglePreview()}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
            <Eye className="w-4 h-4" />
            <span>{state.previewMode ? 'Hide' : 'Show'} Preview</span>
          </button>
        </div>

        {/* Validation Summary */}
        <ValidationSummary />

        {/* Form Content - Always Standard Mode */}
        <StandardFormView />

        {/* Form Footer */}
        <FormFooter onCancel={onCancel} />
      </div>

      {/* Preview Panel */}
      <PreviewPanel
        onClose={() => actions.togglePreview()}
        onEditField={handleEditField}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal onClose={() => actions.cancelSubmission()} />
    </>
  );
}

export default function UnifiedFormRenderer({
  formData,
  onSubmit,
  initialMode,
  loading = false,
  onCancel,
}: UnifiedFormRendererProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <FormProvider formData={formData} onSubmit={onSubmit} initialMode={initialMode}>
      <FormRendererContent onCancel={onCancel} />
    </FormProvider>
  );
}

