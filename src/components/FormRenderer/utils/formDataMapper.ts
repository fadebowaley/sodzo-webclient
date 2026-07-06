/**
 * Utility to map API form data to FormConfiguration
 */

import { FormConfiguration, FormElement, FieldType } from '../types';

function normalizeOptions(rawOptions: any): string[] | undefined {
  if (!Array.isArray(rawOptions)) return undefined;
  return rawOptions
    .map((option) => {
      if (typeof option === 'string') return option;
      if (option && typeof option === 'object') {
        return String(option.label ?? option.value ?? '').trim();
      }
      return '';
    })
    .filter(Boolean);
}

function normalizeConditional(rawConditional: any): FormElement['conditional'] {
  if (!rawConditional) return undefined;

  if (rawConditional.showIf || rawConditional.hideIf) {
    return rawConditional;
  }

  const legacy = rawConditional.conditionalLogic || rawConditional;
  if (legacy.dependsOn) {
    return {
      showIf: [
        {
          fieldId: legacy.dependsOn,
          operator: 'equals',
          value: legacy.showWhen,
        },
      ],
    };
  }

  return undefined;
}

/**
 * Map API form response to FormConfiguration
 */
export function mapApiFormToConfiguration(apiForm: any): FormConfiguration {
  console.log('🔍 [Form Data Mapper] Full API Form Payload:', JSON.stringify(apiForm, null, 2));
  
  const elements: FormElement[] = [];

  if (apiForm.elements && Array.isArray(apiForm.elements)) {
    console.log('📋 [Form Data Mapper] Processing elements:', apiForm.elements.length);
    
    apiForm.elements.forEach((element: any, index: number) => {
      console.log(`🔎 [Form Data Mapper] Element ${index}:`, {
        id: element.id,
        type: element.type,
        elementType: element.elementType,
        properties: element.properties,
      });
      
      // Map field type
      const fieldType = mapFieldType(element.type);
      
      console.log(`✅ [Form Data Mapper] Adding form field: ${element.id} (${fieldType})`);
      
      elements.push({
        id: element.id,
        type: fieldType,
        properties: {
          label: element.properties?.label || element.label || '',
          placeholder: element.properties?.placeholder,
          required: element.properties?.required || false,
          defaultValue: element.properties?.defaultValue,
          options: normalizeOptions(element.properties?.options),
          rows: element.properties?.rows,
          accept: element.properties?.accept || element.properties?.acceptedTypes,
          min: element.properties?.min,
          max: element.properties?.max,
          step: element.properties?.step,
          pattern: element.properties?.pattern,
          helpText: element.properties?.helpText,
          description: element.properties?.description,
          colSpan: element.properties?.colSpan,
          numberType: element.properties?.numberType,
          formula: element.properties?.formula,
          readOnlyCalculated: element.properties?.readOnlyCalculated,
          currency: element.properties?.currency,
          currencyDecimalPlaces: element.properties?.currencyDecimalPlaces,
          currencyPosition: element.properties?.currencyPosition,
          showCountrySelector: element.properties?.showCountrySelector,
          defaultCountry: element.properties?.defaultCountry,
          internationalFormat: element.properties?.internationalFormat,
          parentDropdown: element.properties?.parentDropdown,
          optionsMap: element.properties?.optionsMap,
          ratingType: element.properties?.ratingType,
          maxRating: element.properties?.maxRating,
          headerLevel:
            element.properties?.headerLevel ||
            (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(
              String(element.type || '').toLowerCase()
            )
              ? String(element.type).toLowerCase()
              : undefined),
          headerAlignment: element.properties?.headerAlignment,
          paragraphText: element.properties?.paragraphText,
          paragraphAlignment: element.properties?.paragraphAlignment,
        },
        section: element.section,
        validation: element.validation,
        conditional: normalizeConditional(
          element.conditional || element.properties?.conditionalLogic
        ),
      });
    });
    
    console.log(`✨ [Form Data Mapper] Mapped ${elements.length} renderer elements`);
  }

  return {
    id: apiForm.projectId || apiForm.id || '',
    projectId: apiForm.projectId || apiForm.id || '',
    style: apiForm.style || 'default',
    wizardMode: Boolean(apiForm.wizardMode),
    columnSpans: apiForm.columnSpans || {},
    configuration: {
      projectName: apiForm.configuration?.projectName || apiForm.name || 'Untitled Form',
      description: apiForm.configuration?.description || apiForm.description,
      category: apiForm.configuration?.category || apiForm.category,
      defaultMode: apiForm.configuration?.defaultMode || 'standard',
    },
    elements,
    validation: apiForm.validation,
    conditionalLogic: apiForm.conditionalLogic,
  };
}

/**
 * Map API field type to our FieldType
 */
function mapFieldType(apiType: string): FieldType {
  const normalized = String(apiType || '').toLowerCase();
  const typeMap: Record<string, FieldType> = {
    text: 'text',
    email: 'email',
    password: 'password',
    url: 'url',
    tel: 'tel',
    phone: 'tel',
    number: 'number',
    date: 'date',
    time: 'time',
    datetime: 'datetime-local',
    'datetime-local': 'datetime-local',
    textarea: 'textarea',
    select: 'select',
    dependentdropdown: 'select',
    dependent_dropdown: 'select',
    apidropdown: 'select',
    'searchlookup': 'select',
    'search-lookup': 'select',
    dropdown: 'select',
    multiselect: 'multiselect',
    'multi-select': 'multiselect',
    checkbox: 'checkbox',
    radio: 'radio',
    file: 'file',
    upload: 'file',
    rating: 'rating',
    slider: 'slider',
    range: 'slider',
    switch: 'switch',
    toggle: 'switch',
    header: 'header',
    title: 'header',
    h1: 'header',
    h2: 'header',
    h3: 'header',
    h4: 'header',
    h5: 'header',
    h6: 'header',
    paragraph: 'paragraph',
  };

  return typeMap[normalized] || 'text';
}

