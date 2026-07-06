/**
 * Validation Summary Component
 * Shows all validation errors in a collapsible panel
 */

import React, { useState } from 'react';
import { useFormContext } from './FormContext';
import { AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ValidationSummary() {
  const { state, actions } = useFormContext();
  const [isExpanded, setIsExpanded] = useState(false);

  const errorCount = Object.keys(state.validationErrors).length;

  if (errorCount === 0) return null;

  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <span className="text-sm font-medium text-red-900 dark:text-red-200">
            {errorCount} {errorCount === 1 ? 'error' : 'errors'} found
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-red-600 dark:text-red-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-red-600 dark:text-red-400" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-4 space-y-2 overflow-hidden">
            {state.formData?.elements
              .filter((el) => el.type !== 'header' && state.validationErrors[el.id])
              .map((element) => (
                <div
                  key={element.id}
                  className="flex items-start space-x-2 text-sm">
                  <span className="text-red-600 dark:text-red-400">•</span>
                  <div>
                    <span className="font-medium text-red-900 dark:text-red-200">
                      {element.properties.label}:
                    </span>
                    <span className="ml-2 text-red-700 dark:text-red-300">
                      {state.validationErrors[element.id]}
                    </span>
                  </div>
                </div>
              ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

