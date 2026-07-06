/**
 * Conditional Field Logic Utilities
 */

import { FormElement, ConditionalRule, ConditionalOperator } from './types';

/**
 * Evaluate a conditional rule
 */
export function evaluateCondition(
  rule: ConditionalRule,
  formValues: Record<string, any>
): boolean {
  const fieldValue = formValues[rule.fieldId];

  switch (rule.operator) {
    case 'equals':
      return fieldValue === rule.value;
    
    case 'notEquals':
      return fieldValue !== rule.value;
    
    case 'contains':
      return Array.isArray(fieldValue)
        ? fieldValue.includes(rule.value)
        : String(fieldValue).includes(String(rule.value));
    
    case 'greaterThan':
      return Number(fieldValue) > Number(rule.value);
    
    case 'lessThan':
      return Number(fieldValue) < Number(rule.value);
    
    default:
      return false;
  }
}

/**
 * Check if a field should be shown based on conditional logic
 */
export function shouldShowField(
  field: FormElement,
  formValues: Record<string, any>
): boolean {
  if (!field.conditional) return true;

  const { showIf, hideIf } = field.conditional;

  // Check showIf conditions (ALL must be true - AND logic)
  if (showIf && showIf.length > 0) {
    const allShowConditionsMet = showIf.every(condition =>
      evaluateCondition(condition, formValues)
    );
    if (!allShowConditionsMet) return false;
  }

  // Check hideIf conditions (ANY must be true - OR logic)
  if (hideIf && hideIf.length > 0) {
    const anyHideConditionMet = hideIf.some(condition =>
      evaluateCondition(condition, formValues)
    );
    if (anyHideConditionMet) return false;
  }

  return true;
}

/**
 * Get visible fields based on conditional logic
 */
export function getVisibleFields(
  elements: FormElement[],
  formValues: Record<string, any>
): FormElement[] {
  return elements.filter(element => {
    // Always show content blocks
    if (element.type === 'header' || element.type === 'paragraph') return true;
    
    return shouldShowField(element, formValues);
  });
}

/**
 * Get fields that should be shown when a field value changes
 */
export function getFieldsToShow(
  changedFieldId: string,
  allElements: FormElement[],
  formValues: Record<string, any>
): FormElement[] {
  return allElements.filter(element => {
    if (element.type === 'header' || element.type === 'paragraph') return true;
    if (!element.conditional) return true;

    // Check if this field's visibility depends on the changed field
    const dependsOnChangedField =
      element.conditional.showIf?.some(rule => rule.fieldId === changedFieldId) ||
      element.conditional.hideIf?.some(rule => rule.fieldId === changedFieldId);

    if (dependsOnChangedField) {
      return shouldShowField(element, formValues);
    }

    // If it doesn't depend on the changed field, use current visibility
    return shouldShowField(element, formValues);
  });
}

