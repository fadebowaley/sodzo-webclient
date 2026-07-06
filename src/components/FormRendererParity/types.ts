export interface FormElementType {
  id: string;
  type: string;
  label?: string;
  properties: Record<string, any>;
}

export type PreviewFormData = Record<string, any>;
