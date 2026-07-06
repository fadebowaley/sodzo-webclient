/**
 * Unified Field Renderer - Routes to appropriate field component based on type
 */

import React from 'react';
import { FormElement } from '../types';
import TextField from './TextField';
import EmailField from './EmailField';
import NumberField from './NumberField';
import DateField from './DateField';
import TextareaField from './TextareaField';
import SelectField from './SelectField';
import MultiSelectField from './MultiSelectField';
import CheckboxField from './CheckboxField';
import RadioField from './RadioField';
import FileField from './FileField';

interface UnifiedFieldRendererProps {
  field: FormElement;
  value: any;
  onChange: (value: any) => void;
  error?: string | null;
  disabled?: boolean;
  touched?: boolean;
}

export default function UnifiedFieldRenderer({
  field,
  value,
  onChange,
  error,
  disabled = false,
  touched = false,
}: UnifiedFieldRendererProps) {
  // Don't render headers (handled separately)
  if (field.type === 'header' || field.type === 'paragraph') {
    return null;
  }

  const commonProps = {
    field,
    value,
    onChange,
    error: touched && error ? error : null,
    disabled,
  };

  switch (field.type) {
    case 'text':
      return <TextField {...commonProps} />;
    
    case 'email':
      return <EmailField {...commonProps} />;

    case 'password':
      return <TextField {...commonProps} type="password" />;

    case 'url':
      return <TextField {...commonProps} type="url" />;
    
    case 'tel':
      return <TextField {...commonProps} type="tel" />;
    
    case 'number':
      return <NumberField {...commonProps} />;
    
    case 'date':
      return <DateField {...commonProps} />;

    case 'time':
      return <TextField {...commonProps} type="time" />;

    case 'datetime-local':
      return <TextField {...commonProps} type="datetime-local" />;
    
    case 'textarea':
      return <TextareaField {...commonProps} />;
    
    case 'select':
      return <SelectField {...commonProps} />;
    
    case 'multiselect':
      return <MultiSelectField {...commonProps} />;
    
    case 'checkbox':
      return <CheckboxField {...commonProps} />;
    
    case 'radio':
      return <RadioField {...commonProps} />;
    
    case 'file':
      return <FileField {...commonProps} />;

    case 'switch':
      return <CheckboxField {...commonProps} />;

    case 'rating':
      return <NumberField {...commonProps} />;

    case 'slider':
      return <NumberField {...commonProps} />;
    
    default:
      return <TextField {...commonProps} />;
  }
}

