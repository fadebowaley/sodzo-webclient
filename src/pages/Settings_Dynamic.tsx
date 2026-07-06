/**
 * Dynamic Profile Form Implementation
 * This will replace the EditableProfileForm in Settings.tsx
 */

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  User as UserIcon,
  Camera,
  Edit3,
  Save,
  X,
  Calendar,
  Shield,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import type { User } from "../contexts/AuthContext";
import { mockUser } from "../data/mockData";
import toast from "react-hot-toast";
import {
  mapUserProfileToFields,
  convertFormValuesToAPIFormat,
  FormField,
} from "../utils/formMapper";
import DynamicFormRenderer from "../components/Forms/DynamicFormRenderer";

interface DynamicProfileFormProps {
  userId: string;
}

export function DynamicProfileForm({ userId }: DynamicProfileFormProps) {
  const queryClient = useQueryClient();
  const { api, logout, user, setUser } = useAuth();

  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch user profile using React Query
  const {
    data: userProfileData,
    isLoading: loading,
    error: profileError,
  } = useQuery({
    queryKey: ["userProfile", userId],
    queryFn: async () => {
      if (!userId) return null;

      const response = await api.get(`/users/${userId}`);
      const fullUserData = response.data;

      // Map user data to form fields
      const fields = mapUserProfileToFields(fullUserData);

      return {
        userData: fullUserData,
        formFields: fields,
      };
    },
    enabled: !!userId,
    retry: (failureCount, error: any) => {
      // Don't retry on 401 errors
      if (error?.response?.status === 401) {
        logout();
        toast.error("Session expired — please sign in again");
        return false;
      }
      return failureCount < 2; // Retry up to 2 times
    },
  });

  // Extract data from query result
  const userData = userProfileData?.userData || null;
  const formFields = userProfileData?.formFields || [];

  // Handle errors
  useEffect(() => {
    if (profileError) {
      const axiosError = profileError as any;
      if (axiosError.response?.status !== 401) {
        toast.error("Failed to load profile");
        console.error("Profile fetch error:", profileError);
      }
    }
  }, [profileError]);

  // Initialize form values when data is loaded
  useEffect(() => {
    if (!userData || formFields.length === 0) return;

    const initialValues: Record<string, any> = {};
    formFields.forEach((field) => {
      // Get nested value from userData
      const value = getNestedValue(userData, field.name);
      initialValues[field.name] = value ?? field.value ?? "";
    });
    setFormValues(initialValues);
  }, [userData, formFields]);

  const getNestedValue = (obj: any, path: string): any => {
    return path.split(".").reduce((current, key) => {
      return current && typeof current === "object" ? current[key] : undefined;
    }, obj);
  };

  const handleFieldChange = (fieldPath: string, value: any) => {
    setFormValues((prev) => ({
      ...prev,
      [fieldPath]: value,
    }));
  };

  const handleSave = async () => {
    if (!userId || !userData) return;

    setSaving(true);
    try {
      // Convert flat form values back to nested API format
      const payload = convertFormValuesToAPIFormat(formValues, userData);

      // Ensure token is fresh before saving
      try {
        const doRefresh = (api as any)?._doRefresh as
          | (() => Promise<any>)
          | undefined;
        if (doRefresh) {
          await doRefresh();
        } else {
          await api.post("/auth/refresh-tokens", {}, { withCredentials: true });
        }
      } catch (refreshErr) {
        console.warn("[Settings] refresh before save failed", refreshErr);
        logout();
        toast.error("Session expired — please sign in again");
        setSaving(false);
        return;
      }

      // Update user profile
      const resp = await api.patch(`/users/${userId}`, payload);
      const updated = resp.data as Partial<UserModel>;

      // Update user data - merge with existing data from cache
      const mergedData = { ...userData, ...updated };

      // Regenerate form fields in case structure changed
      const updatedFields = mapUserProfileToFields(mergedData);

      // Update form values with new data
      const updatedValues: Record<string, any> = {};
      updatedFields.forEach((field) => {
        const value = getNestedValue(mergedData, field.name);
        updatedValues[field.name] = value ?? field.value ?? "";
      });
      setFormValues(updatedValues);

      // Update user context (now unified in AuthContext)
      const merged = { ...(user ?? {}), ...updated } as User;
      setUser(merged);

      // Update React Query cache optimistically with new data
      queryClient.setQueryData(["userProfile", userId], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          userData: mergedData,
          formFields: updatedFields,
        };
      });

      // Invalidate React Query cache to ensure fresh data on next fetch
      queryClient.invalidateQueries({ queryKey: ["userProfile", userId] });

      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (err: unknown) {
      let msg = "Update failed";
      if (err instanceof Error) msg = err.message;
      if (
        typeof msg === "string" &&
        msg.includes("No refresh token available")
      ) {
        logout();
        toast.error("Session expired — please sign in again");
      } else {
        toast.error(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Loading profile...</span>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="text-center text-gray-500 mt-10">
        <UserIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <p className="text-xl font-semibold">No profile data available</p>
      </div>
    );
  }

  const displayName =
    `${userData.firstname || ""} ${userData.lastname || ""}`.trim() || "User";
  const memberSince = userData.createdAt
    ? new Date(userData.createdAt).toLocaleDateString()
    : null;

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <img
                src={userData.avatar || mockUser[0]?.avatar}
                alt="Profile"
                className="w-20 h-20 rounded-full border-4 border-white dark:border-gray-700 shadow-lg"
              />
              <button className="absolute -bottom-2 -right-2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-lg">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {displayName}
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                {userData.email}
              </p>
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <Calendar className="w-4 h-4 mr-1" />
                  Member since {memberSince ?? "Unknown"}
                </div>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <Shield className="w-4 h-4 mr-1" />
                  {userData.isSuper || userData.isAdmin ? "Admin" : "Member"}
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Edit3 className="w-4 h-4 mr-2" />
            {isEditing ? "Cancel" : "Edit Profile"}
          </button>
        </div>
      </div>

      {/* Dynamic Form */}
      <DynamicFormRenderer
        fields={formFields}
        values={formValues}
        onChange={handleFieldChange}
        disabled={!isEditing}
      />

      {/* Action Buttons */}
      {isEditing && (
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => {
              setIsEditing(false);
              // Reset form values to original data
              const resetValues: Record<string, any> = {};
              formFields.forEach((field) => {
                const value = getNestedValue(userData, field.name);
                resetValues[field.name] = value ?? field.value ?? "";
              });
              setFormValues(resetValues);
            }}
            className="flex items-center px-6 py-3 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <X className="w-4 h-4 mr-2" />
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center px-6 py-3 rounded-lg text-white transition-colors ${
              saving
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}
    </div>
  );
}
