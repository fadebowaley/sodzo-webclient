/**
 * Mode B: Chat-Style Interactive View
 * ChatGPT-like conversational interface with single input bar
 */

import React, { useEffect, useRef, useState } from 'react';
import { FormElement } from '../types';
import { useFormContext } from '../FormContext';
import { shouldShowField } from '../conditional';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, CheckCircle2, MessageSquare, List } from 'lucide-react';
import ChatFieldRenderer from './ChatFieldRenderer';
import UnifiedFieldRenderer from '../fields/UnifiedFieldRenderer';

interface ChatStyleViewProps {
  onScrollToError?: (fieldId: string) => void;
}

interface ChatMessage {
  id: string;
  type: 'assistant' | 'user' | 'system';
  fieldId?: string;
  content?: string;
  timestamp: Date;
  element?: FormElement;
  value?: any;
  isActive?: boolean; // For current question being answered
}

export default function ChatStyleView({ onScrollToError }: ChatStyleViewProps) {
  const { state, actions } = useFormContext();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentInput, setCurrentInput] = useState<any>('');
  const [isTyping, setIsTyping] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);

  // Get visible questions based on conditional logic, excluding headers
  const visibleQuestions = state.chatState.questions.filter(q => {
    // Double-check: filter out any header elements that might have slipped through
    const isHeader = q.type === 'header' || 
                    q.type === 'title' ||
                    q.type === 'h1' ||
                    q.type === 'h2' ||
                    q.type === 'h3' ||
                    q.type === 'h4' ||
                    q.type === 'h5' ||
                    q.type === 'h6';
    return !isHeader && shouldShowField(q, state.formValues);
  });

  const currentQuestionIndex = state.chatState.currentQuestionIndex;
  const currentQuestion = visibleQuestions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === visibleQuestions.length - 1;

  // Initialize chat with welcome message and first question
  useEffect(() => {
    if (visibleQuestions.length > 0 && messages.length === 0) {
      const firstQuestion = visibleQuestions[0];
      setMessages([
        {
          id: 'welcome',
          type: 'assistant',
          content: `Hi! I'll help you fill out this form. Let's start with your first question.`,
          timestamp: new Date(),
        },
        {
          id: `q-${firstQuestion.id}`,
          type: 'assistant',
          fieldId: firstQuestion.id,
          content: firstQuestion.properties.label,
          timestamp: new Date(),
          element: firstQuestion,
          isActive: true,
        },
      ]);
    }
  }, [visibleQuestions]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      const scrollHeight = chatContainerRef.current.scrollHeight;
      const height = chatContainerRef.current.clientHeight;
      const maxScrollTop = scrollHeight - height;
      chatContainerRef.current.scrollTop = maxScrollTop > 0 ? maxScrollTop : 0;
    }
  }, [messages]);

  // Focus input when new question appears
  useEffect(() => {
    if (currentQuestion && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [currentQuestionIndex, currentQuestion]);

  // Handle input change
  const handleInputChange = (value: any) => {
    setCurrentInput(value);
  };

  // Handle send/submit
  const handleSend = () => {
    if (!currentQuestion) return;

    // Validate required fields
    if (currentQuestion.properties.required && (!currentInput || currentInput === '')) {
      return;
    }

    // Validate field
    actions.setFieldValue(currentQuestion.id, currentInput || null);
    actions.setFieldTouched(currentQuestion.id, true);
    const error = actions.validateField(currentQuestion.id);

    if (error) {
      return; // Don't proceed if validation fails
    }

    // Format answer for display
    const answerDisplay = formatAnswerForDisplay(currentInput, currentQuestion);

    // Add user's answer as a message
    const userMessage: ChatMessage = {
      id: `a-${currentQuestion.id}-${Date.now()}`,
      type: 'user',
      fieldId: currentQuestion.id,
      content: answerDisplay,
      timestamp: new Date(),
      value: currentInput,
    };

    // Mark current question as inactive
    setMessages((prev) =>
      prev.map((msg) => (msg.isActive ? { ...msg, isActive: false } : msg))
    );

    // Add user message
    setMessages((prev) => [...prev, userMessage]);

    // Clear input
    setCurrentInput('');
    setIsTyping(true);

    // Check if there are more questions
    if (!isLastQuestion) {
      setTimeout(() => {
        setIsTyping(false);
        const nextIndex = currentQuestionIndex + 1;
        const nextQuestion = visibleQuestions[nextIndex];
        if (nextQuestion) {
          actions.nextQuestion();
          const nextQuestionMessage: ChatMessage = {
            id: `q-${nextQuestion.id}`,
            type: 'assistant',
            fieldId: nextQuestion.id,
            content: nextQuestion.properties.label,
            timestamp: new Date(),
            element: nextQuestion,
            isActive: true,
          };
          setMessages((prev) => [...prev, nextQuestionMessage]);
        }
      }, 800);
    } else {
      // All questions answered
      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: 'completion',
            type: 'assistant',
            content: 'Great! You\'ve answered all the questions. You can review your answers or submit the form.',
            timestamp: new Date(),
          },
        ]);
      }, 800);
    }
  };

  // Format answer for display
  const formatAnswerForDisplay = (value: any, element: FormElement): string => {
    if (value === null || value === undefined || value === '') return '';

    if (Array.isArray(value)) {
      return value.join(', ');
    }

    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    if (element.type === 'date' && value) {
      return new Date(value).toLocaleDateString();
    }

    if (element.type === 'file' && value instanceof File) {
      return value.name;
    }

    return String(value);
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && currentQuestion?.type !== 'textarea') {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle bulk mode submission
  const handleBulkSubmit = () => {
    // Validate all fields
    const isValid = actions.validateForm();
    if (!isValid) {
      // Show error message
      setMessages((prev) => [
        ...prev,
        {
          id: 'error-validation',
          type: 'system',
          content: 'Please fill in all required fields before submitting.',
          timestamp: new Date(),
        },
      ]);
      return;
    }
    // Trigger form submission
    actions.submitForm();
  };

  if (!state.formData || visibleQuestions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        {state.formData ? 'No questions available' : 'No form data available'}
      </div>
    );
  }

  // Calculate progress based on filled fields
  const filledFieldsCount = visibleQuestions.filter(q => {
    const value = state.formValues[q.id];
    return value !== null && value !== undefined && value !== '';
  }).length;
  const progress = visibleQuestions.length > 0
    ? (filledFieldsCount / visibleQuestions.length) * 100
    : 0;

  const currentValue = currentQuestion ? (state.formValues[currentQuestion.id] ?? currentQuestion.properties.defaultValue ?? '') : '';
  const currentError = currentQuestion ? state.validationErrors[currentQuestion.id] : null;
  const currentTouched = currentQuestion ? (state.fieldTouched[currentQuestion.id] || false) : false;

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Progress Bar and Mode Toggle */}
      <div className="px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {bulkMode ? `${visibleQuestions.length} questions` : `${currentQuestionIndex + 1} of ${visibleQuestions.length} questions`}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBulkMode(!bulkMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                bulkMode
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}>
              {bulkMode ? (
                <>
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Chat Mode</span>
                </>
              ) : (
                <>
                  <List className="w-3.5 h-3.5" />
                  <span>Bulk Mode</span>
                </>
              )}
            </button>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {Math.round(progress)}% Complete
            </span>
          </div>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
          <motion.div
            className="bg-blue-600 h-1.5 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Chat Messages Container - Only show in chat mode */}
      {!bulkMode && (
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          <AnimatePresence>
            {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={`flex items-start gap-3 ${
                message.type === 'user' ? 'flex-row-reverse' : ''
              }`}>
              {/* Avatar */}
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.type === 'user'
                    ? 'bg-blue-600'
                    : message.type === 'assistant'
                    ? 'bg-gray-300 dark:bg-gray-600'
                    : 'bg-yellow-100 dark:bg-yellow-900/30'
                }`}>
                {message.type === 'user' ? (
                  <User className="w-4 h-4 text-white" />
                ) : message.type === 'assistant' ? (
                  <Bot className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                )}
              </div>

              {/* Message Bubble */}
              <div className={`flex-1 max-w-[80%] ${message.type === 'user' ? 'flex justify-end' : ''}`}>
                <div
                  className={`rounded-2xl px-4 py-3 ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : message.type === 'assistant'
                      ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-bl-sm shadow-sm'
                      : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800'
                  }`}>
                  {/* Message Content */}
                  {message.content && (
                    <div>
                      <p
                        className={`text-sm ${
                          message.type === 'user'
                            ? 'text-white'
                            : 'text-gray-900 dark:text-white'
                        }`}>
                        {message.content}
                      </p>
                      {message.element?.properties.helpText && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">
                          {message.element.properties.helpText}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Timestamp */}
                  <p
                    className={`text-xs mt-1 ${
                      message.type === 'user'
                        ? 'text-blue-100'
                        : 'text-gray-400 dark:text-gray-500'
                    }`}>
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </div>
              <div className="flex-1 max-w-[80%]">
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-bl-sm shadow-sm px-4 py-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      )}

      {/* Bulk Mode - Show All Questions */}
      {bulkMode && (
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-3xl mx-auto space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Bot className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Bulk Mode
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    Fill out all questions below. You can submit all answers at once when ready.
                  </p>
                </div>
              </div>
            </motion.div>

            {visibleQuestions.map((question, index) => {
              const value = state.formValues[question.id] ?? question.properties.defaultValue ?? '';
              const error = state.validationErrors[question.id];
              const touched = state.fieldTouched[question.id] || false;

              return (
                <motion.div
                  key={question.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                        {question.properties.label}
                        {question.properties.required && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </label>
                      {question.properties.helpText && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          {question.properties.helpText}
                        </p>
                      )}
                    </div>
                    <UnifiedFieldRenderer
                      field={question}
                      value={value}
                      onChange={(val) => {
                        actions.setFieldValue(question.id, val);
                        actions.setFieldTouched(question.id, true);
                        actions.validateField(question.id);
                      }}
                      error={error}
                      touched={touched}
                    />
                  </div>
                </motion.div>
              );
            })}

            {/* Bulk Submit Button */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleBulkSubmit}
                disabled={state.isSubmitting || state.confirmationState === 'submitting'}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>Submit All Answers</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Input Bar (Sticky Bottom) - ChatGPT Style - Only show in chat mode */}
      {!bulkMode && currentQuestion && (
        <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <ChatFieldRenderer
                  field={currentQuestion}
                  value={currentInput !== '' ? currentInput : currentValue}
                  onChange={handleInputChange}
                  error={currentError}
                  onKeyPress={handleKeyPress}
                  inputRef={inputRef}
                  compact={true}
                />
                {currentError && currentTouched && (
                  <p className="text-xs text-red-500 dark:text-red-400 mt-1 ml-1">
                    {currentError}
                  </p>
                )}
              </div>
              <button
                onClick={handleSend}
                disabled={
                  (!currentInput || currentInput === '') && currentQuestion.properties.required ||
                  !!currentError
                }
                className="flex-shrink-0 p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center shadow-sm">
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 ml-1">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>
      )}

      {/* Completion State - All questions answered - Only show in chat mode */}
      {!bulkMode && !currentQuestion && messages.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="max-w-3xl mx-auto px-4 py-4 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              All questions answered! You can review your answers above or submit the form using the submit button.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
