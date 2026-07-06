/**
 * Form Context - Centralized State Management for Form Rendering Engine
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { FormState, FormActions, FormConfiguration, FormContextValue, FormMode } from './types';
import { validateField as validateFieldUtil, validateForm as validateFormUtil } from './validation';

// Initial state
const initialState: FormState = {
  formData: null,
  loading: false,
  error: null,
  formValues: {},
  fieldTouched: {},
  validationErrors: {},
  isValid: false,
  currentMode: 'standard', // Default to standard mode
  modeHistory: [],
  chatState: {
    currentQuestionIndex: 0,
    questions: [],
    answeredQuestions: new Set(),
    bulkMode: false,
  },
  previewMode: false,
  confirmationState: 'idle',
  isSubmitting: false,
  submissionError: null,
};

// Action types
type FormAction =
  | { type: 'SET_FORM_DATA'; payload: FormConfiguration | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_FIELD_VALUE'; payload: { fieldId: string; value: any } }
  | { type: 'SET_FIELD_TOUCHED'; payload: { fieldId: string; touched: boolean } }
  | { type: 'SET_ALL_FIELDS_TOUCHED'; payload: Record<string, boolean> }
  | { type: 'SET_VALIDATION_ERRORS'; payload: Record<string, string> }
  | { type: 'SET_IS_VALID'; payload: boolean }
  | { type: 'SWITCH_MODE'; payload: FormMode }
  | { type: 'SET_CHAT_STATE'; payload: Partial<FormState['chatState']> }
  | { type: 'TOGGLE_PREVIEW' }
  | { type: 'SET_CONFIRMATION_STATE'; payload: FormState['confirmationState'] }
  | { type: 'SET_SUBMITTING'; payload: boolean }
  | { type: 'SET_SUBMISSION_ERROR'; payload: string | null }
  | { type: 'RESET_FORM' }
  | { type: 'INITIALIZE_CHAT_STATE'; payload: FormConfiguration };

// Reducer
function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_FORM_DATA':
      return { ...state, formData: action.payload };
    
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'SET_FIELD_VALUE': {
      const { fieldId, value } = action.payload;
      const newFormValues = { ...state.formValues, [fieldId]: value };
      
      // Update answered questions in chat mode
      const newAnsweredQuestions = new Set(state.chatState.answeredQuestions);
      if (value !== null && value !== undefined && value !== '') {
        newAnsweredQuestions.add(fieldId);
      } else {
        newAnsweredQuestions.delete(fieldId);
      }
      
      return {
        ...state,
        formValues: newFormValues,
        chatState: {
          ...state.chatState,
          answeredQuestions: newAnsweredQuestions,
        },
      };
    }
    
    case 'SET_FIELD_TOUCHED':
      return {
        ...state,
        fieldTouched: { ...state.fieldTouched, [action.payload.fieldId]: action.payload.touched },
      };
    
    case 'SET_ALL_FIELDS_TOUCHED':
      return {
        ...state,
        fieldTouched: { ...state.fieldTouched, ...action.payload },
      };
    
    case 'SET_VALIDATION_ERRORS':
      return { ...state, validationErrors: action.payload };
    
    case 'SET_IS_VALID':
      return { ...state, isValid: action.payload };
    
    case 'SWITCH_MODE': {
      const newModeHistory = [...state.modeHistory, state.currentMode];
      return {
        ...state,
        currentMode: action.payload,
        modeHistory: newModeHistory,
      };
    }
    
    case 'SET_CHAT_STATE':
      return {
        ...state,
        chatState: { ...state.chatState, ...action.payload },
      };
    
    case 'TOGGLE_PREVIEW':
      return { ...state, previewMode: !state.previewMode };
    
    case 'SET_CONFIRMATION_STATE':
      return { ...state, confirmationState: action.payload };
    
    case 'SET_SUBMITTING':
      return { ...state, isSubmitting: action.payload };
    
    case 'SET_SUBMISSION_ERROR':
      return { ...state, submissionError: action.payload };
    
    case 'RESET_FORM':
      return {
        ...initialState,
        formData: state.formData,
        currentMode: state.formData?.configuration?.defaultMode || 'standard',
      };
    
    case 'INITIALIZE_CHAT_STATE': {
      // Filter out header, title, and h1-h6 elements
      const questions = action.payload.elements.filter(el => {
        const isHeader = el.type === 'header' || 
                        el.type === 'title' ||
                        el.type === 'h1' ||
                        el.type === 'h2' ||
                        el.type === 'h3' ||
                        el.type === 'h4' ||
                        el.type === 'h5' ||
                        el.type === 'h6';
        return !isHeader;
      });
      return {
        ...state,
        chatState: {
          currentQuestionIndex: 0,
          questions,
          answeredQuestions: new Set(),
          bulkMode: false,
        },
      };
    }
    
    default:
      return state;
  }
}

// Context
const FormContext = createContext<FormContextValue | undefined>(undefined);

// Provider Props
interface FormProviderProps {
  children: React.ReactNode;
  formData?: FormConfiguration | null;
  onSubmit?: (values: Record<string, any>) => Promise<void>;
  initialMode?: FormMode;
}

// Provider Component
export function FormProvider({ children, formData, onSubmit, initialMode }: FormProviderProps) {
  const [state, dispatch] = useReducer(formReducer, {
    ...initialState,
    formData: formData || null,
    currentMode: initialMode || formData?.configuration?.defaultMode || 'standard',
  });

  // Initialize form data when set (chat mode removed, only standard mode)
  useEffect(() => {
    if (formData) {
      // Standard mode initialization handled automatically
    }
  }, [formData]);

  // Actions
  const setFieldValue = useCallback((fieldId: string, value: any) => {
    dispatch({ type: 'SET_FIELD_VALUE', payload: { fieldId, value } });
  }, []);

  const setFieldTouched = useCallback((fieldId: string, touched: boolean) => {
    dispatch({ type: 'SET_FIELD_TOUCHED', payload: { fieldId, touched } });
  }, []);

  const resetForm = useCallback(() => {
    dispatch({ type: 'RESET_FORM' });
  }, []);

  const validateField = useCallback((fieldId: string) => {
    if (!state.formData) return;
    
    const field = state.formData.elements.find(el => el.id === fieldId);
    if (!field) return;
    
    const value = state.formValues[fieldId];
    const error = validateFieldUtil(field, value, state.formValues);
    
    const newErrors = { ...state.validationErrors };
    if (error) {
      newErrors[fieldId] = error;
    } else {
      delete newErrors[fieldId];
    }
    
    dispatch({ type: 'SET_VALIDATION_ERRORS', payload: newErrors });
    dispatch({ type: 'SET_IS_VALID', payload: Object.keys(newErrors).length === 0 });
  }, [state.formData, state.formValues, state.validationErrors]);

  const validateForm = useCallback((): boolean => {
    if (!state.formData) return false;
    
    const errors = validateFormUtil(state.formData, state.formValues);
    dispatch({ type: 'SET_VALIDATION_ERRORS', payload: errors });
    const isValid = Object.keys(errors).length === 0;
    dispatch({ type: 'SET_IS_VALID', payload: isValid });
    
    // Mark all fields as touched
    const touched: Record<string, boolean> = {};
    state.formData.elements.forEach(el => {
      if (el.type !== 'header' && el.type !== 'paragraph') {
        touched[el.id] = true;
      }
    });
    dispatch({ type: 'SET_ALL_FIELDS_TOUCHED', payload: touched });
    
    return isValid;
  }, [state.formData, state.formValues, setFieldTouched]);

  const clearErrors = useCallback(() => {
    dispatch({ type: 'SET_VALIDATION_ERRORS', payload: {} });
    dispatch({ type: 'SET_IS_VALID', payload: true });
  }, []);

  const switchMode = useCallback((mode: FormMode) => {
    // Only allow standard mode - chat mode removed
    if (mode === 'standard') {
      dispatch({ type: 'SWITCH_MODE', payload: mode });
    }
  }, []);

  const nextQuestion = useCallback(() => {
    const { currentQuestionIndex, questions } = state.chatState;
    if (currentQuestionIndex < questions.length - 1) {
      dispatch({
        type: 'SET_CHAT_STATE',
        payload: { currentQuestionIndex: currentQuestionIndex + 1 },
      });
    }
  }, [state.chatState]);

  const previousQuestion = useCallback(() => {
    const { currentQuestionIndex } = state.chatState;
    if (currentQuestionIndex > 0) {
      dispatch({
        type: 'SET_CHAT_STATE',
        payload: { currentQuestionIndex: currentQuestionIndex - 1 },
      });
    }
  }, [state.chatState]);

  const toggleBulkMode = useCallback(() => {
    dispatch({
      type: 'SET_CHAT_STATE',
      payload: { bulkMode: !state.chatState.bulkMode },
    });
  }, [state.chatState.bulkMode]);

  const goToQuestion = useCallback((index: number) => {
    const { questions } = state.chatState;
    if (index >= 0 && index < questions.length) {
      dispatch({
        type: 'SET_CHAT_STATE',
        payload: { currentQuestionIndex: index },
      });
    }
  }, [state.chatState]);

  const togglePreview = useCallback(() => {
    dispatch({ type: 'TOGGLE_PREVIEW' });
  }, []);

  const startConfirmation = useCallback(() => {
    dispatch({ type: 'SET_CONFIRMATION_STATE', payload: 'confirming' });
  }, []);

  const confirmSubmission = useCallback(async () => {
    if (!onSubmit) return;
    
    dispatch({ type: 'SET_CONFIRMATION_STATE', payload: 'submitting' });
    dispatch({ type: 'SET_SUBMITTING', payload: true });
    dispatch({ type: 'SET_SUBMISSION_ERROR', payload: null });
    
    try {
      await onSubmit(state.formValues);
      dispatch({ type: 'SET_CONFIRMATION_STATE', payload: 'success' });
      // Close preview panel on successful submission
      if (state.previewMode) {
        dispatch({ type: 'TOGGLE_PREVIEW' });
      }
    } catch (error: any) {
      dispatch({ type: 'SET_CONFIRMATION_STATE', payload: 'error' });
      dispatch({ type: 'SET_SUBMISSION_ERROR', payload: error.message || 'Submission failed' });
    } finally {
      dispatch({ type: 'SET_SUBMITTING', payload: false });
    }
  }, [onSubmit, state.formValues, state.previewMode]);

  const cancelSubmission = useCallback(() => {
    dispatch({ type: 'SET_CONFIRMATION_STATE', payload: 'idle' });
  }, []);

  const submitForm = useCallback(async () => {
    // Validate first
    const isValid = validateForm();
    if (!isValid) {
      return;
    }
    
    // Show preview panel instead of confirmation modal
    if (!state.previewMode) {
      dispatch({ type: 'TOGGLE_PREVIEW' });
    }
  }, [validateForm, state.previewMode]);

  const actions: FormActions = {
    setFieldValue,
    setFieldTouched,
    resetForm,
    validateField,
    validateForm,
    clearErrors,
    switchMode,
    nextQuestion,
    previousQuestion,
    toggleBulkMode,
    goToQuestion,
    togglePreview,
    startConfirmation,
    confirmSubmission,
    cancelSubmission,
    submitForm,
  };

  const value: FormContextValue = {
    state,
    actions,
  };

  return <FormContext.Provider value={value}>{children}</FormContext.Provider>;
}

// Hook to use form context
export function useFormContext(): FormContextValue {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useFormContext must be used within FormProvider');
  }
  return context;
}

