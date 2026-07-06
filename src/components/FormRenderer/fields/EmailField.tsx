/**
 * Email Field Component
 */

import React from 'react';
import TextField from './TextField';
import { FormElement } from '../types';

interface EmailFieldProps {
  field: FormElement;
  value: any;
  onChange: (value: any) => void;
  error?: string | null;
  disabled?: boolean;
}

export default function EmailField(props: EmailFieldProps) {
  return <TextField {...props} type="text" />;
}

