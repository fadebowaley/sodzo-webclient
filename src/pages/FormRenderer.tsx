import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Save,
  Send,
  CheckCircle,
  AlertCircle,
  FileText,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  MessageSquare,
  Upload,
  Eye,
  EyeOff,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

// Mock form data - in real app this would come from API
const mockFormData = {
  id: "1",
  name: "Member Registration",
  description: "Collect new member information and contact details",
  fields: [
    {
      id: "1",
      label: "Full Name",
      type: "text",
      required: true,
      placeholder: "Enter your full name",
    },
    {
      id: "2",
      label: "Email Address",
      type: "email",
      required: true,
      placeholder: "Enter your email address",
    },
    {
      id: "3",
      label: "Phone Number",
      type: "tel",
      required: true,
      placeholder: "Enter your phone number",
    },
    {
      id: "4",
      label: "Date of Birth",
      type: "date",
      required: true,
    },
    {
      id: "5",
      label: "Address",
      type: "textarea",
      required: false,
      placeholder: "Enter your address",
    },
    {
      id: "6",
      label: "How did you hear about us?",
      type: "select",
      required: false,
      options: [
        "Website",
        "Social Media",
        "Friend/Family",
        "Church Visit",
        "Other",
      ],
    },
    {
      id: "7",
      label: "Are you interested in volunteering?",
      type: "radio",
      required: false,
      options: ["Yes", "No", "Maybe"],
    },
    {
      id: "8",
      label: "Ministries of Interest",
      type: "checkbox",
      required: false,
      options: ["Worship", "Children", "Youth", "Outreach", "Administration"],
    },
    {
      id: "9",
      label: "Profile Photo",
      type: "file",
      required: false,
      accept: "image/*",
    },
  ],
};

interface FormField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  accept?: string;
}

interface FormData {
  id: string;
  name: string;
  description: string;
  fields: FormField[];
}

export default function FormRenderer() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // In real app, fetch form data from API
    if (formId === "new") {
      // Handle new form creation
      navigate("/projects");
      return;
    }

    // Mock API call
    setTimeout(() => {
      setFormData(mockFormData);
    }, 500);
  }, [formId, navigate]);

  const handleInputChange = (fieldId: string, value: any) => {
    setFormValues((prev) => ({
      ...prev,
      [fieldId]: value,
    }));

    // Clear error when user starts typing
    if (errors[fieldId]) {
      setErrors((prev) => ({
        ...prev,
        [fieldId]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData) return false;

    formData.fields.forEach((field) => {
      if (
        field.required &&
        (!formValues[field.id] || formValues[field.id] === "")
      ) {
        newErrors[field.id] = `${field.label} is required`;
      }

      // Email validation
      if (field.type === "email" && formValues[field.id]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formValues[field.id])) {
          newErrors[field.id] = "Please enter a valid email address";
        }
      }

      // Phone validation
      if (field.type === "tel" && formValues[field.id]) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        if (!phoneRegex.test(formValues[field.id].replace(/\s/g, ""))) {
          newErrors[field.id] = "Please enter a valid phone number";
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    setIsSubmitting(true);

    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      if (import.meta.env.DEV) {
      console.log("Form submitted:", formValues);
      }
      setIsSubmitted(true);
      toast.success("Form submitted successfully!");

      // Reset form after 3 seconds
      setTimeout(() => {
        setIsSubmitted(false);
        setFormValues({});
        navigate("/projects");
      }, 3000);
    } catch (error) {
      toast.error("Failed to submit form. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = () => {
    // Save form as draft
    localStorage.setItem(`form_draft_${formId}`, JSON.stringify(formValues));
    toast.success("Draft saved successfully!");
  };

  const renderField = (field: FormField) => {
    const value = formValues[field.id] || "";
    const error = errors[field.id];

    switch (field.type) {
      case "text":
      case "email":
      case "tel":
        return (
          <input
            type={field.type}
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
              error ? "border-red-500" : "border-gray-300 dark:border-gray-600"
            } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
          />
        );

      case "password":
        return (
          <div className="relative">
            <input
              type={showPassword[field.id] ? "text" : "password"}
              value={value}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                error
                  ? "border-red-500"
                  : "border-gray-300 dark:border-gray-600"
              } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
            />
            <button
              type="button"
              onClick={() =>
                setShowPassword((prev) => ({
                  ...prev,
                  [field.id]: !prev[field.id],
                }))
              }
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPassword[field.id] ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        );

      case "date":
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
              error ? "border-red-500" : "border-gray-300 dark:border-gray-600"
            } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
          />
        );

      case "textarea":
        return (
          <textarea
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
              error ? "border-red-500" : "border-gray-300 dark:border-gray-600"
            } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
          />
        );

      case "select":
        return (
          <select
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
              error ? "border-red-500" : "border-gray-300 dark:border-gray-600"
            } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}>
            <option value="">Select an option</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case "radio":
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <label key={option} className="flex items-center">
                <input
                  type="radio"
                  name={field.id}
                  value={option}
                  checked={value === option}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700 dark:text-gray-300">
                  {option}
                </span>
              </label>
            ))}
          </div>
        );

      case "checkbox":
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <label key={option} className="flex items-center">
                <input
                  type="checkbox"
                  checked={
                    Array.isArray(value) ? value.includes(option) : false
                  }
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    const newValues = e.target.checked
                      ? [...currentValues, option]
                      : currentValues.filter((v) => v !== option);
                    handleInputChange(field.id, newValues);
                  }}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700 dark:text-gray-300">
                  {option}
                </span>
              </label>
            ))}
          </div>
        );

      case "file":
        return (
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <input
              type="file"
              accept={field.accept}
              onChange={(e) => handleInputChange(field.id, e.target.files?.[0])}
              className="hidden"
              id={`file-${field.id}`}
            />
            <label
              htmlFor={`file-${field.id}`}
              className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium">
              {value ? value.name : "Click to upload file"}
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Drag and drop or click to select
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  if (!formData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <motion.div
        className="text-center py-12"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}>
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Form Submitted Successfully!
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Thank you for your submission. We'll get back to you soon.
        </p>
        <div className="animate-pulse">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Redirecting to modules...
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}>
        <button
          onClick={() => navigate("/projects")}
          className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Forms
        </button>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleSaveDraft}
            className="flex items-center px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </button>
        </div>
      </motion.div>

      {/* Form Header */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {formData.name}
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          {formData.description}
        </p>
      </motion.div>

      {/* Form */}
      <motion.form
        onSubmit={handleSubmit}
        className="space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}>
        {formData.fields.map((field, index) => (
          <motion.div
            key={field.id}
            className="space-y-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * index }}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {renderField(field)}
            {errors[field.id] && (
              <div className="flex items-center text-red-500 text-sm">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors[field.id]}
              </div>
            )}
          </motion.div>
        ))}

        {/* Submit Button */}
        <motion.div
          className="pt-6 border-t border-gray-200 dark:border-gray-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full flex items-center justify-center px-6 py-3 rounded-lg font-medium transition-colors ${
              isSubmitting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}>
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Form
              </>
            )}
          </button>
        </motion.div>
      </motion.form>
    </div>
  );
}
