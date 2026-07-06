/**
 * Preview Panel Component
 * Shows a review of all filled fields before submission
 */

import React from 'react';
import { useFormContext } from '../FormContext';
import PreviewField from './PreviewField';
import { X, ChevronRight, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDeviceDetection } from '../../../hooks/useDeviceDetection';

interface PreviewPanelProps {
  onClose: () => void;
  onEditField?: (fieldId: string) => void;
}

export default function PreviewPanel({ onClose, onEditField }: PreviewPanelProps) {
  const { state, actions } = useFormContext();
  const { isMobile } = useDeviceDetection();

  if (!state.formData) return null;

  // Group fields by section for preview
  const fieldsBySection: Record<string, Array<{ id: string; label: string; value: any }>> = {};
  let currentSection = 'Default';

  state.formData.elements.forEach((element) => {
    if (element.type === 'header') {
      currentSection = element.properties?.label || 'Default';
      if (!fieldsBySection[currentSection]) {
        fieldsBySection[currentSection] = [];
      }
    } else {
      const section = element.section || currentSection;
      if (!fieldsBySection[section]) {
        fieldsBySection[section] = [];
      }

      const value = state.formValues[element.id];
      // Show all fields that have been filled (have values)
      // This includes empty strings, arrays, booleans, files, etc.
      if (value !== null && value !== undefined) {
        // Check if it's a meaningful value (not just empty string or empty array)
        const hasValue = 
          (typeof value === 'string' && value.trim() !== '') ||
          (typeof value === 'number') ||
          (typeof value === 'boolean') ||
          (Array.isArray(value) && value.length > 0) ||
          (value instanceof File) ||
          (typeof value === 'object' && Object.keys(value).length > 0);
        
        if (hasValue) {
          fieldsBySection[section].push({
            id: element.id,
            label: element.properties.label,
            value,
          });
        }
      }
    }
  });

  const content = (
    <div className="flex flex-col h-full relative">
      {/* Center Edge Close Button */}
      <button
        onClick={onClose}
        className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 flex items-center justify-center group"
        title="Close Preview">
        <ChevronRight className="w-6 h-6 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
      </button>

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Review Your Answers
        </h3>
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {Object.entries(fieldsBySection).map(([sectionName, fields]) => {
          if (fields.length === 0) return null;

          return (
            <div key={sectionName} className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                {sectionName}
              </h4>
              <div className="space-y-3">
                {fields.map((field) => (
                  <PreviewField
                    key={field.id}
                    fieldId={field.id}
                    label={field.label}
                    value={field.value}
                    onEdit={onEditField}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer with Submit Button */}
      <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-900/50">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium">
            Back to Edit
          </button>
          <button
            onClick={() => {
              actions.startConfirmation();
            }}
            disabled={state.isSubmitting || state.confirmationState === 'submitting'}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {state.isSubmitting || state.confirmationState === 'submitting' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Confirm & Submit
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    // Mobile: Full screen modal
    return (
      <AnimatePresence>
        {state.previewMode && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
              onClick={onClose}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 rounded-t-3xl shadow-2xl max-h-[90vh]">
              {content}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  // Desktop: Side panel
  return (
    <AnimatePresence>
      {state.previewMode && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-[700px] max-w-[90vw] z-50 bg-white dark:bg-gray-800 shadow-2xl flex flex-col">
            {content}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

