import type { FormElementType } from "./types";

const mapElementType = (rawType: string): FormElementType["type"] => {
  const normalized = String(rawType || "").toLowerCase();
  const mapping: Record<string, FormElementType["type"]> = {
    text: "text",
    textarea: "textarea",
    number: "number",
    email: "email",
    password: "password",
    url: "text",
    tel: "text",
    checkbox: "checkbox",
    radio: "radio",
    select: "dropdown",
    dropdown: "dropdown",
    multiselect: "checkbox",
    "multi-select": "checkbox",
    date: "datepicker",
    datepicker: "datepicker",
    "date-picker": "datepicker",
    datefield: "datepicker",
    date_field: "datepicker",
    dob: "datepicker",
    birthdate: "datepicker",
    time: "timepicker",
    timepicker: "timepicker",
    "datetime-local": "datepicker",
    datetime: "datepicker",
    file: "fileupload",
    upload: "fileupload",
    fileupload: "fileupload",
    switch: "toggle",
    toggle: "toggle",
    slider: "slider",
    range: "slider",
    rating: "rating",
    dependentdropdown: "dependentDropdown",
    dependent_dropdown: "dependentDropdown",
    apidropdown: "apidropdown",
    searchlookup: "searchLookup",
    "search-lookup": "searchLookup",
    captcha: "captcha",
    signature: "signature",
    locationpicker: "locationPicker",
    "location-picker": "locationPicker",
    header: "header",
    title: "header",
    h1: "header",
    h2: "header",
    h3: "header",
    h4: "header",
    h5: "header",
    h6: "header",
    paragraph: "paragraph",
    button: "button",
  };

  // Catch-all: anything containing "date" maps to datepicker,
  // anything containing "time" (but not datetime) maps to timepicker.
  if (!mapping[normalized]) {
    if (normalized.includes("date")) return "datepicker";
    if (normalized.includes("time") && !normalized.includes("datetime")) return "timepicker";
  }

  return mapping[normalized] || "text";
};

const resolveRawType = (element: any): string => {
  const properties = element?.properties || {};
  const baseType = String(element?.type || "").toLowerCase();
  const fieldType = String(properties?.fieldType || "").toLowerCase();
  const inputType = String(properties?.inputType || "").toLowerCase();
  const componentType = String(properties?.componentType || "").toLowerCase();
  const propertiesType = String(properties?.type || "").toLowerCase();

  // Prefer explicit subtype when the API sends a generic base type like "text".
  if (["text", "input", ""].includes(baseType)) {
    return fieldType || inputType || componentType || propertiesType || "text";
  }

  return baseType || fieldType || inputType || componentType || propertiesType || "text";
};

const normalizeOptions = (options: any): string[] | undefined => {
  if (!Array.isArray(options)) return undefined;
  return options
    .map((option) => {
      if (typeof option === "string") return option;
      if (option && typeof option === "object") {
        return String(option.label ?? option.value ?? "").trim();
      }
      return "";
    })
    .filter(Boolean);
};

const normalizeConditionalForPreview = (
  rawConditional: any,
  properties: Record<string, any>
) => {
  if (properties?.conditionalLogic?.dependsOn) {
    return {
      conditional: Boolean(properties?.conditional ?? true),
      conditionalLogic: properties.conditionalLogic,
    };
  }

  const candidate = rawConditional || properties?.conditionalLogic || properties?.conditional;
  const firstShowIf = Array.isArray(candidate?.showIf) ? candidate.showIf[0] : null;

  if (candidate?.dependsOn) {
    return {
      conditional: true,
      conditionalLogic: {
        dependsOn: candidate.dependsOn,
        showWhen: candidate.showWhen,
      },
    };
  }

  if (firstShowIf?.fieldId) {
    return {
      conditional: true,
      conditionalLogic: {
        dependsOn: firstShowIf.fieldId,
        showWhen: firstShowIf.value,
      },
    };
  }

  return {
    conditional: Boolean(
      typeof properties?.conditional === "boolean" ? properties.conditional : false
    ),
    conditionalLogic: properties?.conditionalLogic,
  };
};

export const mapApiFormToPreviewElements = (apiForm: any): FormElementType[] => {
  const rawElements = Array.isArray(apiForm?.elements) ? apiForm.elements : [];

  const mappedElements = rawElements.map((element: any) => {
    const rawType = resolveRawType(element);
    const mappedType = mapElementType(rawType);
    const normalizedType = String(rawType || "").toLowerCase();
    const properties = element?.properties || {};
    const conditional = normalizeConditionalForPreview(
      element?.conditional,
      properties
    );

    const mapped: FormElementType = {
      id: String(element?.id || element?._id || `element-${Date.now()}`),
      type: mappedType,
      label:
        properties?.label ||
        element?.label ||
        (mappedType === "paragraph" ? "Paragraph" : "Field"),
      properties: {
        ...properties,
        label: properties?.label || element?.label || "",
        options: normalizeOptions(properties?.options),
        acceptedTypes: properties?.acceptedTypes || properties?.accept,
        validation: {
          ...(properties?.validation || {}),
          required:
            properties?.validation?.required ?? Boolean(properties?.required),
        },
        conditional: conditional.conditional,
        conditionalLogic: conditional.conditionalLogic,
        headerLevel:
          properties?.headerLevel ||
          (["h1", "h2", "h3", "h4", "h5"].includes(normalizedType)
            ? (normalizedType as "h1" | "h2" | "h3" | "h4" | "h5")
            : properties?.headerLevel),
      },
    };

    return mapped;
  });

  // Skip structural/non-useful headers such as "Default" in this flow.
  const withoutDefaultHeaders = mappedElements.filter((element) => {
    if (element.type !== "header") return true;
    const text = String(
      element.properties?.label || element.label || ""
    ).trim().toLowerCase();
    return text !== "default";
  });

  // Also skip the first remaining header (builder metadata header).
  const firstHeaderIndex = withoutDefaultHeaders.findIndex(
    (element) => element.type === "header"
  );
  if (firstHeaderIndex < 0) return withoutDefaultHeaders;
  return withoutDefaultHeaders.filter((_, index) => index !== firstHeaderIndex);
};

