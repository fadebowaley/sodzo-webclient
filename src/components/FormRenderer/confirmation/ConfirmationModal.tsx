/**
 * Confirmation Modal Component
 * Shows confirmation dialog before form submission
 */

import React from 'react';
import { useFormContext } from '../FormContext';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, X, Loader2 } from 'lucide-react';
import { useDeviceDetection } from '../../../hooks/useDeviceDetection';

interface ConfirmationModalProps {
  onClose: () => void;
}

export default function ConfirmationModal({ onClose }: ConfirmationModalProps) {
  const { state, actions } = useFormContext();
  const { isMobile } = useDeviceDetection();

  const handleConfirm = async () => {
    await actions.confirmSubmission();
  };

  const handleCancel = () => {
    actions.cancelSubmission();
    onClose();
  };

  const modalContent = (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Confirm Submission
          </h3>
          {state.confirmationState !== 'submitting' && (
            <button
              onClick={handleCancel}
              className="p-1 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-4">
        {state.confirmationState === 'confirming' && (
          <div className="space-y-4">
            <div className="text-center py-4">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Are you sure you want to submit this form?
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors font-medium">
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium">
                Confirm
              </button>
            </div>
          </div>
        )}

        {state.confirmationState === 'submitting' && (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Submitting your form...
            </p>
          </div>
        )}

        {state.confirmationState === 'success' && (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Submission Successful!
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Your form has been submitted successfully.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium">
              Close
            </button>
          </div>
        )}

        {state.confirmationState === 'error' && (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Submission Failed
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {state.submissionError || 'An error occurred while submitting your form.'}
            </p>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors font-medium">
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium">
                Retry
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (state.confirmationState === 'idle') return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}>
          {modalContent}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}


