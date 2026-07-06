/**
 * Form Rendering Engine - Type Definitions
 */

export type FormMode = 'standard' | 'chat';
export type FieldType =
  | 'text'
  | 'email'
  | 'password'
  | 'url'
  | 'tel'
  | 'number'
  | 'date'
  | 'time'
  | 'datetime-local'
  | 'textarea'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'radio'
  | 'file'
  | 'rating'
  | 'slider'
  | 'switch'
  | 'header'
  | 'paragraph';

export type ConditionalOperator = 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan';
export type ConfirmationState = 'idle' | 'confirming' | 'submitting' | 'success' | 'error';

/**
 * Form Configuration Structure
 */
export interface FormConfiguration {
  id: string;
  projectId: string;
  style?: string;
  wizardMode?: boolean;
  columnSpans?: Record<string, number>;
  configuration: {
    projectName: string;
    description?: string;
    category?: string;
    defaultMode?: FormMode;
  };
  elements: FormElement[];
  validation?: ValidationRules;
  conditionalLogic?: ConditionalRule[];
}

/**
 * Form Element (Field Definition)
 */
export interface FormElement {
  id: string;
  type: FieldType;
  properties: FieldProperties;
  conditional?: ConditionalConfig;
  validation?: FieldValidation;
  section?: string;
}

/**
 * Field Properties
 */
export interface FieldProperties {
  label: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: any;
  options?: string[]; // For select, radio, checkbox, multiselect
  rows?: number; // For textarea
  accept?: string; // For file upload
  min?: number; // For number, date
  max?: number; // For number, date
  step?: number; // For number
  pattern?: string; // Regex pattern
  helpText?: string;
  description?: string;
  colSpan?: number;
  // Advanced frontend parity properties
  numberType?: 'basic' | 'currency' | 'phone' | 'percentage' | 'calculated';
  formula?: string;
  readOnlyCalculated?: boolean;
  currency?: string;
  currencyDecimalPlaces?: number;
  currencyPosition?: 'before' | 'after';
  showCountrySelector?: boolean;
  defaultCountry?: string;
  internationalFormat?: boolean;
  parentDropdown?: string;
  optionsMap?: Record<string, string[]>;
  ratingType?: 'star' | 'emoji';
  maxRating?: number;
  headerLevel?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  headerAlignment?: 'left' | 'center' | 'right';
  paragraphText?: string;
  paragraphAlignment?: 'left' | 'center' | 'right' | 'justify';
}

/**
 * Conditional Field Configuration
 */
export interface ConditionalConfig {
  showIf?: ConditionalRule[];
  hideIf?: ConditionalRule[];
}

/**
 * Conditional Rule
 */
export interface ConditionalRule {
  fieldId: string;
  operator: ConditionalOperator;
  value: any;
}

/**
 * Validation Rules
 */
export interface ValidationRules {
  [fieldId: string]: FieldValidation;
}

/**
 * Field Validation Configuration
 */
export interface FieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  min?: number;
  max?: number;
  custom?: (value: any, formValues: Record<string, any>) => string | null;
  email?: boolean;
  phone?: boolean;
}

/**
 * Form State
 */
export interface FormState {
  // Form Configuration
  formData: FormConfiguration | null;
  loading: boolean;
  error: string | null;

  // User Input
  formValues: Record<string, any>;
  fieldTouched: Record<string, boolean>;

  // Validation
  validationErrors: Record<string, string>;
  isValid: boolean;

  // Mode Management
  currentMode: FormMode;
  modeHistory: FormMode[];

  // Chat Mode State (Mode B)
  chatState: {
    currentQuestionIndex: number;
    questions: FormElement[];
    answeredQuestions: Set<string>;
    bulkMode: boolean;
  };

  // Preview & Confirmation
  previewMode: boolean;
  confirmationState: ConfirmationState;

  // Submission
  isSubmitting: boolean;
  submissionError: string | null;
}

/**
 * Form Actions
 */
export interface FormActions {
  // Value Management
  setFieldValue: (fieldId: string, value: any) => void;
  setFieldTouched: (fieldId: string, touched: boolean) => void;
  resetForm: () => void;

  // Validation
  validateField: (fieldId: string) => void;
  validateForm: () => boolean;
  clearErrors: () => void;

  // Mode Management
  switchMode: (mode: FormMode) => void;

  // Chat Mode
  nextQuestion: () => void;
  previousQuestion: () => void;
  toggleBulkMode: () => void;
  goToQuestion: (index: number) => void;

  // Preview & Confirmation
  togglePreview: () => void;
  startConfirmation: () => void;
  confirmSubmission: () => Promise<void>;
  cancelSubmission: () => void;

  // Submission
  submitForm: () => Promise<void>;
}

/**
 * Form Context Value
 */
export interface FormContextValue {
  state: FormState;
  actions: FormActions;
}

