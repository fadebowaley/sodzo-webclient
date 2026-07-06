import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  User as UserIcon,
  Globe,
  Key,
  Download,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building,
  Users,
  Shield,
  Camera,
  Edit3,
  Save,
  X,
  Pencil,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import type { User } from "../contexts/AuthContext";
import { mockUser } from "../data/mockData";
import toast from "react-hot-toast";
import NodeProfileClean from "./NodeProfileClean";
import { useSearchParams } from "react-router-dom";
import {
  mapUserProfileToFields,
  mapUserSchemaToFields,
  convertFormValuesToAPIFormat,
  FormField,
} from "../utils/formMapper";
import DynamicFormRenderer from "../components/Forms/DynamicFormRenderer";
import EmailPhoneChangeModal from "../components/Modals/EmailPhoneChangeModal";

export default function Settings() {
  const { api, logout, user, setUser, token: accessToken } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Get initial tab from URL parameter
  const initialTab = searchParams.get("tab") || "profile";
  const [activeTab, setActiveTab] = useState(initialTab);

  // Update active tab when URL parameter changes
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab") || "profile";
    setActiveTab(tabFromUrl);
  }, [searchParams]);

  // Update URL when tab changes
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  type NotificationKey = "email" | "push" | "sms" | "marketing";
  const [notifications, setNotifications] = useState<
    Record<NotificationKey, boolean>
  >({
    email: true,
    push: false,
    sms: false,
    marketing: true,
  });

  const tabs = [
    { id: "profile", name: "User Profile", icon: UserIcon },
    { id: "nodes", name: "Nodes & Profile", icon: Globe },
  ];

  const renderProfileTab = () => (
    <div className="space-y-6">
      {/* Profile Form - editable fields */}
      <EditableProfileForm />
    </div>
  );

  function EditableProfileForm() {
    const queryClient = useQueryClient();
    const [formValues, setFormValues] = useState<Record<string, any>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [emailModalOpen, setEmailModalOpen] = useState(false);
    const [phoneModalOpen, setPhoneModalOpen] = useState(false);

    // Fetch user profile and schema using React Query
    const {
      data: userProfileData,
      isLoading: loading,
      error: profileError,
    } = useQuery({
      queryKey: ["userProfile", user?.id],
      queryFn: async () => {
        if (!user?.id) {
          // Return null if user.id is missing - this is expected during initial load
          return null;
        }

        // Fetch both schema and actual user data in parallel
        const [schemaResponse, dataResponse] = await Promise.all([
          api.get(`/schema/user`).catch((err) => {
            // Log but don't fail on schema errors (it's optional)
            if (err.response?.status !== 401) {
              console.warn("[Settings] Schema fetch failed:", err);
            }
            return null;
          }),
          api.get(`/users/${user.id}`).catch((err) => {
            // Handle 401 by triggering logout
            if (err.response?.status === 401) {
              logout();
              toast.error("Session expired — please sign in again");
              return null;
            }
            throw err;
          }),
        ]);

        // If dataResponse failed, return null
        if (!dataResponse) {
          return null;
        }

        const fullUserData = dataResponse.data;
        const schemaData = schemaResponse?.data?.data || null;

        // Use schema if available, otherwise fallback to data-driven mapping
        let fields: FormField[] = [];
        if (schemaData) {
          // Use schema-based mapping for accurate field definitions
          fields = mapUserSchemaToFields(schemaData, fullUserData);
        } else {
          // Fallback to data-driven mapping
          fields = mapUserProfileToFields(fullUserData);
        }

        return {
          userData: fullUserData,
          formFields: fields,
          schemaData,
        };
      },
      enabled: !!user?.id,
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

        // Don't show error for 401 - logout handles it
        if (axiosError.response?.status === 401) {
          return;
        }

        // Don't show error if user.id is missing (query shouldn't run)
        if (!user?.id) {
          if (import.meta.env.DEV) {
            console.warn(
              "[Settings] Profile fetch error but user.id is missing - query should not have run"
            );
          }
          return;
        }

        // Log error details for debugging
        if (import.meta.env.DEV) {
          console.error("Profile fetch error:", {
            error: profileError,
            message: axiosError.message,
            status: axiosError.response?.status,
            userId: user?.id,
          });
        }

        // Show user-friendly error
        const errorMessage =
          axiosError.response?.data?.message ||
          axiosError.message ||
          "Failed to load user profile";
        toast.error(errorMessage);
      }
    }, [profileError, user?.id]);

    // Initialize form values when data is loaded
    useEffect(() => {
      if (!userData || formFields.length === 0) return;

      // Restore from localStorage draft if available
      let savedDraft: Record<string, any> | null = null;
      if (user?.id) {
        try {
          const storageKey = `user_profile_draft_${user.id}`;
          const draftData = localStorage.getItem(storageKey);
          if (draftData) {
            savedDraft = JSON.parse(draftData);
          }
        } catch (e) {
          // localStorage may be unavailable or corrupted, ignore
          if (import.meta.env.DEV) {
            console.warn(
              "[Settings] Failed to load draft from localStorage:",
              e
            );
          }
        }
      }

      // Initialize form values - merge existing values (if editing) with saved draft and new fields
      setFormValues((prevValues) => {
        // If we're editing, preserve existing values; otherwise start fresh
        const baseValues = isEditing ? prevValues : {};
        const initialValues: Record<string, any> = { ...baseValues };

        formFields.forEach((field) => {
          // Only set value if it doesn't already exist (preserves user input when editing)
          if (initialValues[field.name] === undefined) {
            // First check if we have a saved draft value for this field
            if (savedDraft && savedDraft[field.name] !== undefined) {
              initialValues[field.name] = savedDraft[field.name];
            } else {
              // Otherwise, get nested value from userData
              const value = getNestedValue(userData, field.name);
              initialValues[field.name] =
                value !== undefined && value !== null
                  ? value
                  : field.value !== undefined && field.value !== null
                  ? field.value
                  : "";
            }
          }
        });

        return initialValues;
      });
      // Note: isEditing is intentionally NOT in dependencies to prevent resetting values during editing
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userData, formFields, user?.id]);

    const getNestedValue = (obj: any, path: string): any => {
      return path.split(".").reduce((current, key) => {
        return current && typeof current === "object"
          ? current[key]
          : undefined;
      }, obj);
    };

    const handleFieldChange = (fieldPath: string, value: any) => {
      setFormValues((prev) => {
        const updated = {
          ...prev,
          [fieldPath]: value,
        };

        // Persist form values to localStorage as user types
        if (user?.id) {
          try {
            const storageKey = `user_profile_draft_${user.id}`;
            localStorage.setItem(storageKey, JSON.stringify(updated));
          } catch (e) {
            // localStorage may be unavailable, ignore
            if (import.meta.env.DEV) {
              console.warn(
                "[Settings] Failed to save draft to localStorage:",
                e
              );
            }
          }
        }

        return updated;
      });
    };

    const handleSave = async () => {
      if (!user?.id || !userData) return;

      setSaving(true);
      try {
        // Convert flat form values back to nested API format
        const payload = convertFormValuesToAPIFormat(formValues, userData);

        // Debug: Log payload before submission (dev only)
        if (import.meta.env.DEV) {
          console.log(
            "[Settings] Payload to submit:",
            JSON.stringify(payload, null, 2)
          );
        }

        // Note: Token refresh is handled automatically by the API interceptor on 401 errors
        // No need to manually refresh before saving - the interceptor will handle it if needed

        // Update user profile
        if (import.meta.env.DEV) {
          console.log(
            "[Settings] Making PATCH request to:",
            `/users/${user.id}`
          );
        }
        const resp = await api.patch(`/users/${user.id}`, payload);
        if (import.meta.env.DEV) {
          console.log("[Settings] Response received:", resp);
          console.log("[Settings] Response data:", resp.data);
        }

        // Handle response - check if it's wrapped in success/data structure
        const responseData = resp.data;
        const updated = (responseData?.data ||
          responseData) as Partial<UserModel>;
        if (import.meta.env.DEV) {
          console.log("[Settings] Extracted user data:", updated);
        }

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
        queryClient.setQueryData(["userProfile", user?.id], (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            userData: mergedData,
            formFields: updatedFields,
          };
        });

        // Invalidate React Query cache to ensure fresh data on next fetch
        queryClient.invalidateQueries({ queryKey: ["userProfile", user?.id] });
        // Also invalidate related queries that might be affected by user profile changes
        if (user?.id) {
          queryClient.invalidateQueries({ queryKey: ["nodes", user.id] });
          queryClient.invalidateQueries({ queryKey: ["userNodes", user.id] });
        }

        toast.success("Profile updated successfully!");
        setIsEditing(false);

        // Clear the draft from localStorage after successful save
        if (user?.id) {
          try {
            const storageKey = `user_profile_draft_${user.id}`;
            localStorage.removeItem(storageKey);
          } catch (e) {
            // ignore
          }
        }
      } catch (err: unknown) {
        console.error("[Settings] Save error:", err);
        let msg = "Update failed";
        if (err instanceof Error) {
          msg = err.message;
        }
        if ((err as any)?.response) {
          const errorResponse = (err as any).response;
          console.error("[Settings] Error response:", errorResponse);
          console.error("[Settings] Error response data:", errorResponse.data);
          console.error("[Settings] Error status:", errorResponse.status);
          msg =
            errorResponse?.data?.message || errorResponse?.data?.error || msg;
        }
        if (
          typeof msg === "string" &&
          msg.includes("No refresh token available")
        ) {
          logout();
          toast.error("Session expired — please sign in again");
        } else {
          toast.error(msg || "Failed to update profile. Please try again.");
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
        {/* Profile Header Card - Redesigned */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            {/* Left: Avatar and User Info */}
            <div className="flex items-center space-x-4 flex-1">
              <div className="relative">
                <img
                  src={userData.avatar || mockUser[0]?.avatar}
                  alt="Profile"
                  className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-700 shadow-lg"
                />
                <button className="absolute -bottom-2 -right-2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-lg">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {displayName}
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  {userData.email}
                </p>
                <div className="flex flex-wrap items-center gap-4 mt-3">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="w-4 h-4 mr-1.5" />
                    Member since {memberSince ?? "Unknown"}
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Shield className="w-4 h-4 mr-1.5" />
                    {userData.isSuper || userData.isAdmin ? "Admin" : "Member"}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Edit Button */}
            <button
              onClick={() => {
                if (isEditing) {
                  // Reset form values to original user data when canceling
                  if (userData) {
                    const resetValues: Record<string, any> = {};
                    formFields.forEach((field) => {
                      const value = getNestedValue(userData, field.name);
                      resetValues[field.name] = value ?? field.value ?? "";
                    });
                    setFormValues(resetValues);

                    // Clear the draft from localStorage when canceling
                    if (user?.id) {
                      try {
                        const storageKey = `user_profile_draft_${user.id}`;
                        localStorage.removeItem(storageKey);
                      } catch (e) {
                        // ignore
                      }
                    }
                  }
                }
                setIsEditing(!isEditing);
              }}
              className="flex items-center px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors whitespace-nowrap">
              <Edit3 className="w-4 h-4 mr-2" />
              {isEditing ? "Cancel" : "Edit Profile"}
            </button>
          </div>

          {/* Account Status Section - Moved into Header */}
          <div className="mt-6 pt-6 border-t border-blue-200 dark:border-blue-800">
            <div className="flex items-center mb-4">
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
                Account Status
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800/50 rounded-lg border border-blue-100 dark:border-blue-900/50">
                <div className="flex items-center flex-1 min-w-0">
                  <Mail className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-3 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Email Address
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {userData?.email || "Not set"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 flex-shrink-0">
                  <div className="flex items-center">
                    <span
                      className={`inline-block w-3 h-3 mr-2 rounded-full ${
                        userData?.isEmailVerified
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                    />
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      {userData?.isEmailVerified ? "Verified" : "Not Verified"}
                    </span>
                  </div>
                  <button
                    onClick={() => setEmailModalOpen(true)}
                    className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors touch-target"
                    title="Change email address">
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800/50 rounded-lg border border-blue-100 dark:border-blue-900/50">
                <div className="flex items-center flex-1 min-w-0">
                  <Phone className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-3 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Phone Number
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {userData?.phoneNumber || "Not set"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 flex-shrink-0">
                  <div className="flex items-center">
                    <span
                      className={`inline-block w-3 h-3 mr-2 rounded-full ${
                        userData?.isPhoneVerified
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                    />
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      {userData?.isPhoneVerified ? "Verified" : "Not Verified"}
                    </span>
                  </div>
                  <button
                    onClick={() => setPhoneModalOpen(true)}
                    className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors touch-target"
                    title="Change phone number">
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Form - Renders all fields from profile and customFields */}
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

        {/* Email Change Modal */}
        <EmailPhoneChangeModal
          isOpen={emailModalOpen}
          onClose={() => setEmailModalOpen(false)}
          type="email"
          currentValue={userData?.email || ""}
          onSuccess={async () => {
            // Invalidate cache to trigger refetch - EmailPhoneChangeModal already invalidates,
            // but we'll do it here too to ensure form values update
            queryClient.invalidateQueries({
              queryKey: ["userProfile", user?.id],
            });
            // The query will automatically refetch and update userData/formFields
          }}
        />;

        {
          /* Phone Change Modal */
        }
        <EmailPhoneChangeModal
          isOpen={phoneModalOpen}
          onClose={() => setPhoneModalOpen(false)}
          type="phone"
          currentValue={userData?.phoneNumber || ""}
          onSuccess={async () => {
            // Invalidate cache to trigger refetch - EmailPhoneChangeModal already invalidates,
            // but we'll do it here too to ensure form values update
            queryClient.invalidateQueries({
              queryKey: ["userProfile", user?.id],
            });
            // The query will automatically refetch and update userData/formFields
          }}
        />;
      </div>
    );
  }

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Email Notifications
        </h3>
        <div className="space-y-4">
          {(
            [
              {
                key: "email",
                label: "Email notifications",
                description: "Receive email updates about your projects",
              },
              {
                key: "marketing",
                label: "Marketing emails",
                description: "Receive emails about new features and updates",
              },
            ] as const
          ).map((item) => {
            type NotificationItem = {
              key: NotificationKey;
              label: string;
              description: string;
            };
            const it = item as unknown as NotificationItem;
            const k = it.key as NotificationKey;
            return (
              <div key={k} className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    {it.label}
                  </h4>
                  <p className="text-sm text-gray-500">{it.description}</p>
                </div>
                <button
                  onClick={() =>
                    setNotifications((prev) => ({ ...prev, [k]: !prev[k] }))
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifications[k] ? "bg-blue-600" : "bg-gray-200"
                  }`}>
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifications[k] ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Push Notifications
        </h3>
        <div className="space-y-4">
          {(
            [
              {
                key: "push",
                label: "Push notifications",
                description: "Receive push notifications on your devices",
              },
              {
                key: "sms",
                label: "SMS notifications",
                description: "Receive SMS updates for urgent matters",
              },
            ] as const
          ).map((item) => {
            type NotificationItem = {
              key: NotificationKey;
              label: string;
              description: string;
            };
            const it = item as unknown as NotificationItem;
            const k = it.key as NotificationKey;
            return (
              <div key={k} className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    {it.label}
                  </h4>
                  <p className="text-sm text-gray-500">{it.description}</p>
                </div>
                <button
                  onClick={() =>
                    setNotifications((prev) => ({ ...prev, [k]: !prev[k] }))
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifications[k] ? "bg-blue-600" : "bg-gray-200"
                  }`}>
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifications[k] ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Password</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Password
            </label>
            <input
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <input
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/*<div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Two-Factor Authentication</h3>
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Two-factor authentication</h4>
              <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Enable
            </button>
          </div>
        </div>
      </div> */}

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">API Keys</h3>
        <div className="space-y-3">
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">
                  Production API Key
                </h4>
                <p className="text-sm text-gray-500 font-mono">
                  sk_live_****************************
                </p>
              </div>
              <button className="p-2 text-gray-500 hover:text-gray-700">
                <Key className="w-4 h-4" />
              </button>
            </div>
          </div>
          <button className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 transition-colors">
            + Generate New API Key
          </button>
        </div>
      </div>
    </div>
  );

  const renderAppearanceTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Theme</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: "Light", description: "Clean and minimal light theme" },
            { name: "Dark", description: "Easy on the eyes dark theme" },
            { name: "System", description: "Adapts to your system settings" },
          ].map((theme) => (
            <div
              key={theme.name}
              className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-900">
                  {theme.name}
                </h4>
                <div className="w-4 h-4 border border-gray-300 rounded-full"></div>
              </div>
              <p className="text-sm text-gray-500">{theme.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Language</h3>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          <option>English (US)</option>
          <option>English (UK)</option>
          <option>Spanish</option>
          <option>French</option>
          <option>German</option>
        </select>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Timezone</h3>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          <option>Pacific Time (PT)</option>
          <option>Mountain Time (MT)</option>
          <option>Central Time (CT)</option>
          <option>Eastern Time (ET)</option>
        </select>
      </div>
    </div>
  );

  const renderIntegrationsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Connected Apps
        </h3>
        <div className="space-y-4">
          {[
            {
              name: "Slack",
              description: "Team communication",
              connected: true,
            },
            {
              name: "Google Drive",
              description: "File storage and sharing",
              connected: true,
            },
            {
              name: "Trello",
              description: "Project management",
              connected: false,
            },
            {
              name: "GitHub",
              description: "Code repository",
              connected: false,
            },
          ].map((app) => (
            <div
              key={app.name}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h4 className="text-sm font-medium text-gray-900">
                  {app.name}
                </h4>
                <p className="text-sm text-gray-500">{app.description}</p>
              </div>
              <button
                className={`px-4 py-2 rounded-lg transition-colors ${
                  app.connected
                    ? "bg-red-100 text-red-700 hover:bg-red-200"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}>
                {app.connected ? "Disconnect" : "Connect"}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Data Export</h3>
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">
                Export your data
              </h4>
              <p className="text-sm text-gray-500">
                Download a copy of all your data
              </p>
            </div>
            <button className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNodeProfileTab = () => (
    <div className="space-y-6">
      <NodeProfileClean />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          Manage your account preferences and settings
        </p>
      </div>

      {/* Horizontal Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
              }`}>
              <div className="flex items-center space-x-2">
                <tab.icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        {activeTab === "profile" && renderProfileTab()}
        {activeTab === "nodes" && renderNodeProfileTab()}
      </div>
    </div>
  );
}
