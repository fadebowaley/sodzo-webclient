/**
 * Mode Switcher Component
 * Allows users to switch between Standard and Chat modes
 */

import React from 'react';
import { useFormContext } from '../FormContext';
import { LayoutList, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ModeSwitcher() {
  const { state, actions } = useFormContext();

  return (
    <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
      <button
        onClick={() => actions.switchMode('standard')}
        className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all ${
          state.currentMode === 'standard'
            ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
        }`}>
        <LayoutList className="w-4 h-4" />
        <span className="text-sm font-medium">Standard</span>
      </button>

      <button
        onClick={() => actions.switchMode('chat')}
        className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all ${
          state.currentMode === 'chat'
            ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
        }`}>
        <MessageCircle className="w-4 h-4" />
        <span className="text-sm font-medium">Chat</span>
      </button>
    </div>
  );
}


