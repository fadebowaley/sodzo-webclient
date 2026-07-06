import { useMemo } from "react";
import type { FormElementType, PreviewFormData } from "./types";

interface LocalFormPreviewProps {
  elements: FormElementType[];
  onSave?: () => void;
  columnSpans?: Record<string, 1 | 2 | 3 | 4>;
  formStyle?: {
    background?: string;
    inputBackground?: string;
    inputBorder?: string;
    inputFocus?: string;
    borderRadius?: string;
    padding?: string;
    inputText?: string;
    labelText?: string;
  };
  wizardMode?: boolean;
  formData?: PreviewFormData;
  onInputChange?: (id: string, value: any) => void;
}

const baseInputClass =
  "w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

export default function LocalFormPreview({
  elements,
  columnSpans = {},
  formStyle,
  formData = {},
  onInputChange,
}: LocalFormPreviewProps) {
  const visibleElements = useMemo(
    () =>
      elements.filter((element) => {
        const logic = element.properties?.conditionalLogic;
        if (!logic?.dependsOn) return true;
        return formData[logic.dependsOn] === logic.showWhen;
      }),
    [elements, formData]
  );

  const onChange = (id: string, value: any) => {
    if (onInputChange) onInputChange(id, value);
  };

  const spanClass = (id: string) => {
    const span = columnSpans[id] || 1;
    return `col-span-${Math.min(4, Math.max(1, span))}`;
  };

  const renderField = (element: FormElementType) => {
    const id = element.id;
    const type = String(element.type || "text").toLowerCase();
    const props = element.properties || {};
    const label = props.label || element.label || "Field";
    const required = Boolean(props.validation?.required);
    const options = Array.isArray(props.options) ? props.options : [];
    const value = formData[id] ?? "";

    if (type === "button") return null;

    if (type === "header") {
      return <h3 className="text-lg font-semibold">{label}</h3>;
    }

    if (type === "paragraph") {
      return <p className="text-sm text-gray-600 dark:text-gray-300">{props.paragraphText || label}</p>;
    }

    if (type === "textarea") {
      return (
        <textarea
          id={id}
          className={baseInputClass}
          placeholder={props.placeholder || ""}
          value={String(value)}
          required={required}
          onChange={(e) => onChange(id, e.target.value)}
        />
      );
    }

    if (type === "dropdown" || type === "apidropdown" || type === "dependentdropdown") {
      return (
        <select
          id={id}
          className={baseInputClass}
          value={String(value)}
          required={required}
          onChange={(e) => onChange(id, e.target.value)}
        >
          <option value="">{props.placeholder || "Select option"}</option>
          {options.map((option: string, index: number) => (
            <option key={`${id}-${index}`} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }

    if (type === "checkbox") {
      const selected = Array.isArray(value) ? value : [];
      return (
        <div className="space-y-2">
          {(options.length ? options : [label]).map((option: string) => (
            <label key={`${id}-${option}`} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={(e) => {
                  const next = e.target.checked
                    ? [...selected, option]
                    : selected.filter((item: string) => item !== option);
                  onChange(id, next);
                }}
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      );
    }

    if (type === "radio") {
      return (
        <div className="space-y-2">
          {options.map((option: string) => (
            <label key={`${id}-${option}`} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name={id}
                value={option}
                checked={String(value) === option}
                onChange={() => onChange(id, option)}
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      );
    }

    if (type === "datepicker") {
      const dateValue =
        typeof value === "string" && value.includes("T") ? value.split("T")[0] : String(value);
      return (
        <input
          id={id}
          type="date"
          className={baseInputClass}
          value={dateValue}
          required={required}
          onChange={(e) => onChange(id, e.target.value)}
        />
      );
    }

    if (type === "timepicker") {
      return (
        <input
          id={id}
          type="time"
          className={baseInputClass}
          value={String(value)}
          required={required}
          onChange={(e) => onChange(id, e.target.value)}
        />
      );
    }

    if (type === "number" || type === "slider") {
      return (
        <input
          id={id}
          type="number"
          className={baseInputClass}
          value={String(value)}
          required={required}
          min={props.min}
          max={props.max}
          step={props.step}
          onChange={(e) => onChange(id, Number(e.target.value))}
        />
      );
    }

    if (type === "toggle") {
      return (
        <label className="flex items-center gap-2 text-sm">
          <input
            id={id}
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(id, e.target.checked)}
          />
          <span>{label}</span>
        </label>
      );
    }

    return (
      <input
        id={id}
        type={type === "email" || type === "password" ? type : "text"}
        className={baseInputClass}
        placeholder={props.placeholder || ""}
        value={String(value)}
        required={required}
        onChange={(e) => onChange(id, e.target.value)}
      />
    );
  };

  return (
    <div
      className={`h-full overflow-y-auto border ${formStyle?.borderRadius || "rounded-lg"} ${formStyle?.background || "bg-white dark:bg-gray-900"}`}
    >
      <div className={formStyle?.padding || "p-4"}>
        <div className="grid grid-cols-4 gap-4">
          {visibleElements.map((element) => (
            <div key={element.id} className={`space-y-2 ${spanClass(element.id)}`}>
              {String(element.type || "").toLowerCase() !== "toggle" &&
                String(element.type || "").toLowerCase() !== "header" &&
                String(element.type || "").toLowerCase() !== "paragraph" && (
                  <label htmlFor={element.id} className={formStyle?.labelText || "text-sm font-medium"}>
                    {element.properties?.label || element.label || "Field"}
                    {element.properties?.validation?.required ? " *" : ""}
                  </label>
                )}
              {renderField(element)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
