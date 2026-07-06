/**
 * Number Field Component
 */

import React, { useEffect, useMemo } from 'react';
import { FormElement } from '../types';
import { useFormContext } from '../FormContext';

interface NumberFieldProps {
  field: FormElement;
  value: any;
  onChange: (value: any) => void;
  error?: string | null;
  disabled?: boolean;
}

export default function NumberField({
  field,
  value,
  onChange,
  error,
  disabled = false,
}: NumberFieldProps) {
  const { properties } = field;
  const { state } = useFormContext();

  const currencySymbol = useMemo(() => {
    const currency = String(properties.currency || 'NGN').toUpperCase();
    const symbols: Record<string, string> = {
      NGN: '₦',
      USD: '$',
      EUR: '€',
      GBP: '£',
      CAD: 'C$',
      AUD: 'A$',
      JPY: '¥',
      INR: '₹',
    };
    return symbols[currency] || currency;
  }, [properties.currency]);

  useEffect(() => {
    if (
      properties.numberType !== 'calculated' ||
      !properties.formula ||
      !state.formData?.elements?.length
    ) {
      return;
    }

    const evaluateFormula = (
      formula: string,
      formValues: Record<string, any>,
      elements: FormElement[]
    ): number => {
      try {
        let expression = String(formula || '').trim();
        const sortedElements = [...elements].sort(
          (a, b) => b.id.length - a.id.length
        );

        sortedElements.forEach((element) => {
          const raw = formValues[element.id];
          const numeric =
            typeof raw === 'number'
              ? raw
              : parseFloat(String(raw).replace(/[^\d.-]/g, '')) || 0;
          const escapedId = element.id.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
          expression = expression.replace(
            new RegExp(`\\b${escapedId}\\b`, 'g'),
            String(numeric)
          );
        });

        expression = expression.replace(/sqrt\(([^)]+)\)/g, 'Math.sqrt($1)');
        expression = expression.replace(/abs\(([^)]+)\)/g, 'Math.abs($1)');
        expression = expression.replace(/\^/g, '**');
        expression = expression.replace(/\bpi\b/gi, 'Math.PI');
        expression = expression.replace(/\be\b/g, 'Math.E');

        const safePattern = /^[\d\s+\-*/.()%\^,><=!&|?:]+$/;
        if (!safePattern.test(expression.replace(/Math\.(sqrt|abs|PI|E)/g, ''))) {
          return 0;
        }
        const result = Function(`"use strict"; return (${expression})`)();
        return Number.isFinite(result) ? Number(result) : 0;
      } catch {
        return 0;
      }
    };

    const computed = evaluateFormula(
      properties.formula,
      state.formValues,
      state.formData.elements
    );
    const currentNumeric =
      typeof value === 'number'
        ? value
        : parseFloat(String(value).replace(/[^\d.-]/g, '')) || 0;
    if (computed !== currentNumeric) {
      onChange(computed);
    }
  }, [
    onChange,
    properties.formula,
    properties.numberType,
    state.formData?.elements,
    state.formValues,
    value,
  ]);

  const handleChange = (raw: string) => {
    if (properties.numberType === 'phone') {
      const cleaned = raw.replace(/[^\d+]/g, '');
      onChange(cleaned);
      return;
    }

    if (raw === '') {
      onChange('');
      return;
    }
    const numeric = Number(raw);
    onChange(Number.isNaN(numeric) ? '' : numeric);
  };

  return (
    <div className="space-y-2">
      <label
        htmlFor={field.id}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {properties.label}
        {properties.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        {(properties.numberType === 'currency' ||
          properties.numberType === 'percentage') && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400">
            {properties.numberType === 'currency' ? currencySymbol : '%'}
          </span>
        )}
        <input
          type={field.type === 'slider' ? 'range' : properties.numberType === 'phone' ? 'text' : 'number'}
          id={field.id}
          name={field.id}
          value={value || ''}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={properties.placeholder}
          disabled={
            disabled ||
            (properties.numberType === 'calculated' &&
              Boolean(properties.readOnlyCalculated ?? true))
          }
          required={properties.required}
          min={properties.min}
          max={properties.max}
          step={properties.step || 1}
          className={`w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base ${
            properties.numberType === 'currency' || properties.numberType === 'percentage'
              ? 'pl-8 pr-4'
              : 'px-4'
          } py-2 ${
            error
              ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
              : 'border-gray-300 dark:border-gray-600'
          } ${
            disabled
              ? 'bg-gray-50 dark:bg-gray-700 cursor-not-allowed opacity-60'
              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
          }`}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${field.id}-error` : undefined}
        />
      </div>
      
      {properties.helpText && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {properties.helpText}
        </p>
      )}
      
      {error && (
        <p id={`${field.id}-error`} className="text-sm text-red-500 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

