/**
 * Form Validation Utilities
 */

import { FormElement, FormConfiguration, FieldValidation } from './types';

/**
 * Validate a single field
 */
export function validateField(
  field: FormElement,
  value: any,
  allFormValues: Record<string, any>
): string | null {
  const { validation, properties } = field;

  // Content blocks are not input fields
  if (field.type === 'header' || field.type === 'paragraph') {
    return null;
  }

  // Required validation
  if (properties.required) {
    if (value === null || value === undefined || value === '') {
      return `${properties.label} is required`;
    }
    
    // For arrays (multiselect, checkbox groups), check if empty
    if (Array.isArray(value) && value.length === 0) {
      return `${properties.label} is required`;
    }
  }

  // If field is not required and empty, skip other validations
  if (!value || value === '') {
    return null;
  }

  // Use custom validation if provided
  if (validation?.custom) {
    const customError = validation.custom(value, allFormValues);
    if (customError) return customError;
  }

  // Type-specific validation
  if (field.type === 'email') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Please enter a valid email address';
    }
  }

  if (field.type === 'tel') {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const cleanedPhone = String(value).replace(/\s/g, '');
    if (!phoneRegex.test(cleanedPhone)) {
      return 'Please enter a valid phone number';
    }
  }

  // Length validation
  if (validation?.minLength && String(value).length < validation.minLength) {
    return `${properties.label} must be at least ${validation.minLength} characters`;
  }

  if (validation?.maxLength && String(value).length > validation.maxLength) {
    return `${properties.label} must be no more than ${validation.maxLength} characters`;
  }

  // Pattern validation
  if (validation?.pattern) {
    const regex = new RegExp(validation.pattern);
    if (!regex.test(value)) {
      return validation.pattern === validation.pattern
        ? 'Invalid format'
        : `${properties.label} format is invalid`;
    }
  }

  // Number range validation
  if (field.type === 'number' || field.type === 'slider' || field.type === 'rating') {
    const numValue =
      typeof value === 'number'
        ? value
        : Number(String(value).replace(/[^\d.-]/g, ''));
    if (isNaN(numValue)) {
      return `${properties.label} must be a valid number`;
    }

    if (validation?.min !== undefined && numValue < validation.min) {
      return `${properties.label} must be at least ${validation.min}`;
    }

    if (validation?.max !== undefined && numValue > validation.max) {
      return `${properties.label} must be no more than ${validation.max}`;
    }
  }

  // Date validation
  if (field.type === 'date') {
    const dateValue = new Date(value);
    if (isNaN(dateValue.getTime())) {
      return 'Please enter a valid date';
    }

    if (properties.min) {
      const minDate = new Date(properties.min);
      if (dateValue < minDate) {
        return `Date must be after ${minDate.toLocaleDateString()}`;
      }
    }

    if (properties.max) {
      const maxDate = new Date(properties.max);
      if (dateValue > maxDate) {
        return `Date must be before ${maxDate.toLocaleDateString()}`;
      }
    }
  }

  return null;
}

/**
 * Validate entire form
 */
export function validateForm(
  formData: FormConfiguration,
  formValues: Record<string, any>
): Record<string, string> {
  const errors: Record<string, string> = {};

  formData.elements.forEach((element) => {
    // Skip non-input content blocks
    if (element.type === 'header' || element.type === 'paragraph') return;

    const value = formValues[element.id];
    const error = validateField(element, value, formValues);

    if (error) {
      errors[element.id] = error;
    }
  });

  return errors;
}

