import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import FormPreview from "./LocalFormPreview";
import type { FormElementType } from "./types";
import { mapApiFormToPreviewElements } from "./formPreviewAdapter";

interface ParityFormRendererProps {
  form: any | null;
  onSubmit?: (values: Record<string, any>) => Promise<void> | void;
  disableSubmit?: boolean;
  disableReason?: string;
  mode?: "create" | "edit" | "view";
  initialValues?: Record<string, any>;
  submitLabel?: string;
}

const formStyles = {
  default: {
    background: "bg-white dark:bg-gray-900",
    inputBackground: "bg-white dark:bg-gray-800",
    inputBorder: "border-gray-300 dark:border-gray-600",
    inputFocus: "ring-blue-500",
    borderRadius: "rounded-lg",
    padding: "p-4",
    inputText: "text-gray-900 dark:text-white",
    labelText: "text-gray-700 dark:text-gray-300",
  },
  modern: {
    background: "bg-blue-50 dark:bg-blue-950",
    inputBackground: "bg-white dark:bg-gray-800",
    inputBorder: "border-blue-400 dark:border-blue-500",
    inputFocus: "ring-blue-500",
    borderRadius: "rounded-xl",
    padding: "p-6",
    inputText: "text-gray-900 dark:text-white",
    labelText: "text-gray-700 dark:text-gray-200",
  },
  minimal: {
    background: "bg-gray-50 dark:bg-gray-800",
    inputBackground: "bg-white dark:bg-gray-700",
    inputBorder: "border-b-2 border-gray-400",
    inputFocus: "ring-gray-500",
    borderRadius: "rounded-none",
    padding: "p-4",
    inputText: "text-gray-900 dark:text-white",
    labelText: "text-gray-600 dark:text-gray-300",
  },
  elegant: {
    background:
      "bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900 dark:to-pink-900",
    inputBackground: "bg-white/80 dark:bg-gray-800/80",
    inputBorder: "border-slate-200 dark:border-slate-600",
    inputFocus: "ring-violet-500",
    borderRadius: "rounded-2xl",
    padding: "p-6",
    inputText: "text-slate-900 dark:text-slate-100",
    labelText: "text-slate-700 dark:text-slate-300",
  },
  dark: {
    background: "bg-gray-900",
    inputBackground: "bg-gray-800",
    inputBorder: "border-gray-700",
    inputFocus: "ring-blue-500",
    borderRadius: "rounded-lg",
    padding: "p-6",
    inputText: "text-gray-100",
    labelText: "text-gray-300",
  },
  light: {
    background: "bg-gray-50",
    inputBackground: "bg-white",
    inputBorder: "border-gray-200",
    inputFocus: "ring-blue-500",
    borderRadius: "rounded-lg",
    padding: "p-6",
    inputText: "text-gray-900",
    labelText: "text-gray-700",
  },
} as const;

export default function ParityFormRenderer({
  form,
  onSubmit,
  disableSubmit = false,
  disableReason,
  mode = "create",
  initialValues = {},
  submitLabel,
}: ParityFormRendererProps) {
  const [formData, setFormData] = useState<Record<string, any>>(initialValues || {});
  const [submitting, setSubmitting] = useState(false);
  const isReadOnly = mode === "view";
  const submitButtonLabel =
    submitLabel || (mode === "edit" ? "Save Changes" : "Submit Module");

  useEffect(() => {
    setFormData(initialValues || {});
  }, [initialValues]);

  const mappedElements = useMemo<FormElementType[]>(() => {
    if (!form) return [];
    return mapApiFormToPreviewElements(form);
  }, [form]);

  // Strip any submit buttons that came from the form definition — we always
  // render our own controlled submit bar below so there is exactly one button.
  const elementsWithoutSubmit = useMemo<FormElementType[]>(
    () =>
      mappedElements.filter(
        (el) =>
          !(
            el.type === "button" &&
            String(el.properties?.buttonType || "").toLowerCase() === "submit"
          )
      ),
    [mappedElements]
  );

  const handleInputChange = (id: string, value: any) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  // Called by the <form onSubmit> wrapper — not by FormPreview's onSave prop
  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isReadOnly || !onSubmit || submitting || disableSubmit) return;
    try {
      setSubmitting(true);
      await onSubmit(formData);
    } catch (error: any) {
      toast.error(error?.message || "Failed to submit module");
    } finally {
      setSubmitting(false);
    }
  };

  if (!form) {
    return (
      <div className="py-16 text-center text-sm text-gray-500 dark:text-gray-400">
        No form selected
      </div>
    );
  }

  const styleName = String(form?.style || "default") as keyof typeof formStyles;
  const selectedStyle = formStyles[styleName] || formStyles.default;

  return (
    /*
     * Why <form> here?
     * FormPreview's root element is a <div>, not a <form>. Any <button type="submit">
     * it renders therefore has no parent form and does nothing when clicked.
     * Wrapping in <form onSubmit> fixes this: all submit-typed buttons (native or
     * shadcn) inside FormPreview will now trigger this handler correctly.
     */
    <form
      onSubmit={handleFormSubmit}
      noValidate
      className="flex flex-col gap-0"
    >
      {/* FormPreview renders all form fields */}
      <fieldset
        disabled={disableSubmit || isReadOnly}
        className={
          disableSubmit || isReadOnly ? "pointer-events-none opacity-70" : undefined
        }
      >
        <FormPreview
          elements={elementsWithoutSubmit}
          onSave={() => {
            /* intentionally empty — submission is handled by the <form> wrapper */
          }}
          wizardMode={Boolean(form?.wizardMode)}
          columnSpans={(form?.columnSpans || {}) as Record<string, 1 | 2 | 3 | 4>}
          formStyle={selectedStyle}
          formData={formData}
          onInputChange={handleInputChange}
        />
      </fieldset>

      {/* ── Sticky submit bar ─────────────────────────────────────────────── */}
      {/* Always visible at the bottom of the drawer — user never has to scroll
          past the last field to find the button. */}
      <div className="sticky bottom-0 z-10 border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
        {isReadOnly ? (
          <div className="rounded-md border border-blue-300 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-800 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
            Read-only mode enabled for this submission.
          </div>
        ) : null}
        {disableSubmit && (
          <div className="mb-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
            {disableReason || "Submission is currently unavailable for this date."}
          </div>
        )}
        {!isReadOnly ? (
          <button
            type="submit"
            disabled={submitting || disableSubmit}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {mode === "edit" ? "Saving..." : "Submitting..."}
              </>
            ) : (
              submitButtonLabel
            )}
          </button>
        ) : null}
      </div>
    </form>
  );
}
