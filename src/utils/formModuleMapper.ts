import {
  Users,
  Calendar,
  Heart,
  BookOpen,
  Music,
  Camera,
  Gift,
  GraduationCap,
  Home,
  Briefcase,
  Star,
  BarChart3,
  FileText,
  LucideIcon,
} from "lucide-react";

export interface FormModuleData {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  category?: string;
  fields?: number;
  submissions?: number;
  lastUsed?: string;
}

// Icon mapping based on form name/keywords
const iconMap: Array<{
  keywords: string[];
  icon: LucideIcon;
  color: string;
}> = [
  { keywords: ["member", "registration", "register"], icon: Users, color: "bg-blue-500" },
  { keywords: ["event", "activity"], icon: Calendar, color: "bg-green-500" },
  { keywords: ["prayer", "request"], icon: Heart, color: "bg-red-500" },
  { keywords: ["bible", "study", "education"], icon: BookOpen, color: "bg-purple-500" },
  { keywords: ["worship", "music", "song"], icon: Music, color: "bg-yellow-500" },
  { keywords: ["photo", "gallery", "image"], icon: Camera, color: "bg-pink-500" },
  { keywords: ["volunteer", "application"], icon: Briefcase, color: "bg-indigo-500" },
  { keywords: ["gift", "donation", "offering"], icon: Gift, color: "bg-orange-500" },
  { keywords: ["children", "kids", "youth"], icon: GraduationCap, color: "bg-teal-500" },
  { keywords: ["fellowship", "home", "group"], icon: Home, color: "bg-cyan-500" },
  { keywords: ["testimony", "testimonies"], icon: Star, color: "bg-amber-500" },
  { keywords: ["feedback", "survey"], icon: BarChart3, color: "bg-emerald-500" },
];

// Default icon/color
const defaultIcon = FileText;
const defaultColor = "bg-gray-500";

/**
 * Find icon and color based on form name/description
 */
function findIconAndColor(name: string, description?: string): { icon: LucideIcon; color: string } {
  const searchText = `${name} ${description || ""}`.toLowerCase();
  
  for (const mapping of iconMap) {
    if (mapping.keywords.some(keyword => searchText.includes(keyword))) {
      return { icon: mapping.icon, color: mapping.color };
    }
  }
  
  return { icon: defaultIcon, color: defaultColor };
}

/**
 * Extract field count from form elements
 */
function getFieldCount(elements?: any[]): number {
  if (!elements) return 0;
  // Count non-header elements
  return elements.filter(el => el.type !== "header").length;
}

/**
 * Map API form response to FormModuleData
 */
export function mapFormToModule(form: any): FormModuleData {
  console.log('📦 [Module Mapper] Full Form Payload:', JSON.stringify(form, null, 2));
  console.log('📦 [Module Mapper] Configuration:', form.configuration);
  console.log('📦 [Module Mapper] Elements:', form.elements);
  
  const name = form.configuration?.projectName || form.name || "Untitled Form";
  const description = form.configuration?.description || form.description || "";
  const { icon, color } = findIconAndColor(name, description);
  
  // Filter out headers when counting fields
  const actualFields = form.elements?.filter((el: any) => {
    const isHeader = el.type === 'header' || 
                    el.type === 'title' ||
                    el.type === 'h1' ||
                    el.type === 'h2' ||
                    el.type === 'h3' ||
                    el.type === 'h4' ||
                    el.type === 'h5' ||
                    el.type === 'h6';
    return !isHeader;
  }) || [];
  const fields = actualFields.length;
  
  // configuration.tags is the canonical category store in the MongoDB model
  // (described as "Categories like CRM, Sales, etc.").
  // Fall back to a bare `category` field if ever present.
  const tags: string[] = Array.isArray(form.configuration?.tags)
    ? form.configuration.tags
    : [];
  const category: string | undefined =
    form.configuration?.category ||
    form.category ||
    tags[0] ||
    undefined;
  
  // Extract submission count if available
  const submissions = form.submissions?.length || form.submissionCount;
  
  // Extract last used date
  const lastUsed = form.updatedAt || form.lastUsed;
  
  console.log('📦 [Module Mapper] Extracted Module Data:', {
    id: form.projectId || form.id || "",
    name,
    description,
    icon: icon.name,
    color,
    category,
    fields,
    submissions,
    lastUsed,
  });
  
  // Extract additional details from form elements that could be used
  if (form.elements && Array.isArray(form.elements)) {
    const elementTypes = form.elements.map((el: any) => ({
      id: el.id,
      type: el.type,
      elementType: el.elementType,
      label: el.properties?.label,
      hasOptions: !!el.properties?.options,
      isRequired: el.properties?.required,
    }));
    console.log('📦 [Module Mapper] Element Details:', elementTypes);
  }
  
  return {
    id: form.projectId || form.id || "",
    name,
    description,
    icon,
    color,
    category,
    fields,
    submissions,
    lastUsed,
  };
}

/**
 * Map array of API forms to FormModuleData array
 */
export function mapFormsToModules(forms: any[]): FormModuleData[] {
  return forms.map(mapFormToModule).filter(module => module.id); // Filter out invalid modules
}

