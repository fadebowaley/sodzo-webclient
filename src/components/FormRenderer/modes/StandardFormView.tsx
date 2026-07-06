/**
 * Mode A: Standard Form View
 * Renders complete form with all fields visible at once
 */

import React, { useMemo, useState } from 'react';
import { FormElement } from '../types';
import UnifiedFieldRenderer from '../fields/UnifiedFieldRenderer';
import { useFormContext } from '../FormContext';
import { shouldShowField } from '../conditional';
import { FileText, User, Building, MapPin, Users, Mail, Phone } from 'lucide-react';

interface StandardFormViewProps {
  onScrollToError?: (fieldId: string) => void;
}

const sectionIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'Basic Information': User,
  'Personal Information': User,
  'Profile Details': User,
  'Contact Information': Mail,
  'Contact Details': Mail,
  'Address Information': MapPin,
  'Additional Information': Building,
  'Spouse': Users,
  'Next Of Kin': Users,
};

function getSectionColor(sectionName: string): string {
  const colors: Record<string, string> = {
    'Basic Information': 'text-blue-600 dark:text-blue-400',
    'Personal Information': 'text-blue-600 dark:text-blue-400',
    'Profile Details': 'text-purple-600 dark:text-purple-400',
    'Contact Information': 'text-green-600 dark:text-green-400',
    'Contact Details': 'text-green-600 dark:text-green-400',
    'Address Information': 'text-purple-600 dark:text-purple-400',
    'Additional Information': 'text-green-600 dark:text-green-400',
    'Spouse': 'text-pink-600 dark:text-pink-400',
    'Next Of Kin': 'text-orange-600 dark:text-orange-400',
  };
  return colors[sectionName] || 'text-gray-600 dark:text-gray-400';
}

function getColSpanClass(span: number): string {
  const map: Record<number, string> = {
    1: 'md:col-span-1',
    2: 'md:col-span-2',
    3: 'md:col-span-3',
    4: 'md:col-span-4',
    5: 'md:col-span-5',
    6: 'md:col-span-6',
    7: 'md:col-span-7',
    8: 'md:col-span-8',
    9: 'md:col-span-9',
    10: 'md:col-span-10',
    11: 'md:col-span-11',
    12: 'md:col-span-12',
  };
  return map[span] || 'md:col-span-12';
}

export default function StandardFormView({ onScrollToError }: StandardFormViewProps) {
  const { state, actions } = useFormContext();
  const [wizardSectionIndex, setWizardSectionIndex] = useState(0);

  if (!state.formData) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        No form data available
      </div>
    );
  }

  // Group fields by section
  const fieldsBySection: Record<string, FormElement[]> = {};
  let currentSection = 'Default';

  state.formData.elements.forEach((element) => {
    const isHeader = element.type === 'header';
    if (isHeader && !element.section && element.properties?.label) {
      currentSection = String(element.properties.label);
    }

    // Regular field - check conditional logic and add to appropriate section
    const section = element.section || currentSection;
    if (!fieldsBySection[section]) {
      fieldsBySection[section] = [];
    }
    // Only show field if conditional logic allows
    if (shouldShowField(element, state.formValues)) {
      fieldsBySection[section].push(element);
    }
  });

  // Handle field change with validation
  const handleFieldChange = (fieldId: string, value: any) => {
    actions.setFieldValue(fieldId, value);
    actions.setFieldTouched(fieldId, true);
    // Real-time validation (optional - can be disabled)
    actions.validateField(fieldId);
  };

  const sections = useMemo(
    () => Object.entries(fieldsBySection).filter(([, sectionFields]) => sectionFields.length > 0),
    [fieldsBySection]
  );
  const isWizardMode = Boolean(state.formData?.wizardMode);
  const activeWizardIndex = Math.min(
    wizardSectionIndex,
    Math.max(sections.length - 1, 0)
  );
  const visibleSections = isWizardMode
    ? [sections[activeWizardIndex]].filter(Boolean)
    : sections;

  return (
    <div className="space-y-6">
      {visibleSections.map(([sectionName, sectionFields]) => {
        const SectionIcon = sectionIcons[sectionName] || FileText;
        const sectionColor = getSectionColor(sectionName);

        return (
          <div
            key={sectionName}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div className="flex items-center">
                <SectionIcon className={`mr-2 h-5 w-5 ${sectionColor}`} />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {sectionName}
                </h3>
              </div>
              {isWizardMode && sections.length > 1 ? (
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Step {activeWizardIndex + 1} of {sections.length}
                </span>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
              {sectionFields.map((field) => {
                const value = state.formValues[field.id] ?? field.properties.defaultValue ?? '';
                const error = state.validationErrors[field.id];
                const touched = state.fieldTouched[field.id] || false;
                const configuredSpan =
                  Number(state.formData?.columnSpans?.[field.id]) ||
                  Number(field.properties?.colSpan) ||
                  12;
                const normalizedSpan = Math.max(1, Math.min(12, configuredSpan));
                const isContentBlock =
                  field.type === 'header' || field.type === 'paragraph';
                const headerLevel =
                  field.properties.headerLevel ||
                  (field.type === 'header' ? 'h3' : 'p');
                const alignment =
                  field.type === 'header'
                    ? field.properties.headerAlignment || 'left'
                    : field.properties.paragraphAlignment || 'left';
                const alignClass =
                  alignment === 'center'
                    ? 'text-center'
                    : alignment === 'right'
                      ? 'text-right'
                      : alignment === 'justify'
                        ? 'text-justify'
                        : 'text-left';
                const headerClass =
                  headerLevel === 'h1'
                    ? 'text-3xl'
                    : headerLevel === 'h2'
                      ? 'text-2xl'
                      : headerLevel === 'h4'
                        ? 'text-lg'
                        : headerLevel === 'h5'
                          ? 'text-base'
                          : headerLevel === 'h6'
                            ? 'text-sm'
                            : 'text-xl';
                const paragraphText =
                  field.properties.paragraphText ||
                  field.properties.label ||
                  field.properties.helpText ||
                  '';

                return (
                  <div
                    key={field.id}
                    id={`field-${field.id}`}
                    className={
                      isContentBlock ? 'md:col-span-12' : getColSpanClass(normalizedSpan)
                    }>
                    {field.type === 'header' ? (
                      React.createElement(
                        headerLevel,
                        {
                          className: `${headerClass} ${alignClass} font-semibold text-gray-900 dark:text-white`,
                        },
                        field.properties.label
                      )
                    ) : field.type === 'paragraph' ? (
                      <p className={`text-sm text-gray-600 dark:text-gray-300 ${alignClass}`}>
                        {paragraphText}
                      </p>
                    ) : (
                      <UnifiedFieldRenderer
                        field={field}
                        value={value}
                        onChange={(val) => handleFieldChange(field.id, val)}
                        error={error}
                        touched={touched}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {isWizardMode && sections.length > 1 ? (
              <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setWizardSectionIndex((prev) => Math.max(0, prev - 1))}
                  disabled={activeWizardIndex === 0}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:text-gray-200">
                  Back
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setWizardSectionIndex((prev) =>
                      Math.min(sections.length - 1, prev + 1)
                    )
                  }
                  disabled={activeWizardIndex >= sections.length - 1}
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40">
                  Continue
                </button>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

