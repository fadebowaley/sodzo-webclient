import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Globe,
  Edit3,
  Save,
  X,
  Building,
  Calendar,
  Camera,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import type { User } from "../contexts/AuthContext";
import toast from "react-hot-toast";
import {
  mapNodeProfileToFields,
  mapNodeSchemaToFields,
  convertFormValuesToAPIFormat,
  FormField,
} from "../utils/formMapper";
import DynamicFormRenderer from "../components/Forms/DynamicFormRenderer";

export default function NodeProfileClean() {
  const queryClient = useQueryClient();
  const { api, logout, user } = useAuth();
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Get user ID from AuthContext (now supports full user model)
  const userId = user?.id;

  // Fetch nodes using React Query
  const {
    data: nodes = [],
    isLoading: nodesLoading,
    error: nodesError,
  } = useQuery({
    queryKey: ["userNodes", userId],
    queryFn: async () => {
      if (!userId) return [];

      const res = await api.get(`/users/${userId}/nodes`);
      const data = res.data?.results || res.data || [];

      // Auto-select first node if available
      if (data.length > 0 && !selectedNode) {
        setSelectedNode(data[0]);
      }

      return data;
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

  // Handle nodes error
  useEffect(() => {
    if (nodesError) {
      const axiosError = nodesError as any;
      if (axiosError.response?.status !== 401) {
        toast.error("Failed to load church information");
        console.error("Nodes fetch error:", nodesError);
      }
    }
  }, [nodesError, logout]);

  // Auto-select first node when nodes are loaded
  useEffect(() => {
    if (nodes.length > 0 && !selectedNode) {
      setSelectedNode(nodes[0]);
    }
  }, [nodes, selectedNode]);

  // Fetch node details when a node is selected using React Query
  const {
    data: nodeDetailsData,
    isLoading: nodeDetailsLoading,
    error: nodeDetailsError,
  } = useQuery({
    queryKey: ["nodeDetails", selectedNode?.id],
    queryFn: async () => {
      if (!selectedNode?.id) return null;

      // Fetch both schema and actual node data in parallel
      const [schemaResponse, dataResponse] = await Promise.all([
        api.get(`/schema/node`).catch(() => null), // Schema is optional
        api.get(`/node/${selectedNode.id}/branch`),
      ]);

      const fullNodeData = dataResponse.data;
      const schemaData = schemaResponse?.data?.data || null;

      // Use schema if available, otherwise fallback to data-driven mapping
      let fields: FormField[] = [];
      if (schemaData) {
        // Use schema-based mapping for accurate field definitions
        fields = mapNodeSchemaToFields(schemaData, fullNodeData);
      } else {
        // Fallback to data-driven mapping
        fields = mapNodeProfileToFields(fullNodeData);
      }

      return {
        nodeData: fullNodeData,
        formFields: fields,
        schemaData,
      };
    },
    enabled: !!selectedNode?.id,
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
  const nodeData = nodeDetailsData?.nodeData || null;
  const formFields = nodeDetailsData?.formFields || [];
  const loading = nodesLoading || nodeDetailsLoading;

  // Handle node details error
  useEffect(() => {
    if (nodeDetailsError) {
      const axiosError = nodeDetailsError as any;
      if (axiosError.response?.status !== 401) {
        toast.error("Failed to load node details");
        console.error("Node details fetch error:", nodeDetailsError);
      }
    }
  }, [nodeDetailsError, logout]);

  // Reset form when no node is selected
  useEffect(() => {
    if (!selectedNode?.id) {
      setFormValues({});
    }
  }, [selectedNode]);

  // Initialize form values when node data is loaded
  useEffect(() => {
    if (!nodeData || formFields.length === 0 || !selectedNode?.id) return;

    // Restore from localStorage draft if available
    const storageKey = `node_profile_draft_${selectedNode.id}`;
    let savedDraft: Record<string, any> | null = null;
    try {
      const draftData = localStorage.getItem(storageKey);
      if (draftData) {
        savedDraft = JSON.parse(draftData);
      }
    } catch (e) {
      // localStorage may be unavailable or corrupted, ignore
      if (import.meta.env.DEV) {
        console.warn(
          "[NodeProfile] Failed to load draft from localStorage:",
          e
        );
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
            // Otherwise, get nested value from nodeData
            const value = getNestedValue(nodeData, field.name);
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
  }, [nodeData, formFields, selectedNode?.id]);

  const getNestedValue = (obj: any, path: string): any => {
    return path.split(".").reduce((current, key) => {
      return current && typeof current === "object" ? current[key] : undefined;
    }, obj);
  };

  const handleFieldChange = (fieldPath: string, value: any) => {
    setFormValues((prev) => {
      const updated = {
        ...prev,
        [fieldPath]: value,
      };

      // Persist form values to localStorage as user types
      if (selectedNode?.id) {
        try {
          const storageKey = `node_profile_draft_${selectedNode.id}`;
          localStorage.setItem(storageKey, JSON.stringify(updated));
        } catch (e) {
          // localStorage may be unavailable, ignore
          if (import.meta.env.DEV) {
            console.warn(
              "[NodeProfile] Failed to save draft to localStorage:",
              e
            );
          }
        }
      }

      return updated;
    });
  };

  const handleSelect = (nodeId: string) => {
    // Clear draft for previous node if switching
    if (selectedNode?.id && selectedNode.id !== nodeId) {
      try {
        const storageKey = `node_profile_draft_${selectedNode.id}`;
        localStorage.removeItem(storageKey);
      } catch (e) {
        // ignore
      }
    }

    const node = nodes.find((n) => n.id === nodeId);
    setSelectedNode(node);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!selectedNode?.id || !nodeData) return;

    setSaving(true);
    try {
      // Convert flat form values back to nested API format
      const payload = convertFormValuesToAPIFormat(formValues, nodeData);

      // Debug: Log payload before submission (dev only)
      if (import.meta.env.DEV) {
        console.log(
          "[NodeProfile] Payload to submit:",
          JSON.stringify(payload, null, 2)
        );
      }

      // Update node profile
      // Try the user-specific endpoint first, fallback to direct node endpoint only for 404
      let resp;
      try {
        if (import.meta.env.DEV) {
          console.log(
            "[NodeProfile] Trying endpoint:",
            `/users/${userId}/nodes/${selectedNode.id}`
          );
        }
        resp = await api.patch(
          `/users/${userId}/nodes/${selectedNode.id}`,
          payload
        );
        if (import.meta.env.DEV) {
          console.log("[NodeProfile] Response from user endpoint:", resp);
        }
      } catch (err: any) {
        if (import.meta.env.DEV) {
          console.warn(
            "[NodeProfile] User endpoint failed:",
            err.response?.status,
            err.response?.data
          );
        }

        // If user-specific endpoint fails, try fallback endpoint
        // 404 = endpoint doesn't exist, try fallback
        // 403 = might be endpoint-specific permission, still try fallback
        if (err.response?.status === 404 || err.response?.status === 403) {
          if (import.meta.env.DEV) {
            console.log(
              `[NodeProfile] Primary endpoint failed with ${err.response?.status}, trying fallback endpoint:`,
              `/node/${selectedNode.id}`
            );
          }
          try {
            resp = await api.patch(`/node/${selectedNode.id}`, payload);
            if (import.meta.env.DEV) {
              console.log(
                "[NodeProfile] Response from fallback endpoint:",
                resp
              );
            }
          } catch (fallbackErr: any) {
            if (import.meta.env.DEV) {
              console.warn(
                "[NodeProfile] Fallback endpoint also failed:",
                fallbackErr.response?.status,
                fallbackErr.response?.data
              );
            }
            // If both endpoints fail, throw the fallback error
            // (which will be caught by outer catch block with better error message)
            throw fallbackErr;
          }
        } else {
          throw err;
        }
      }

      // Handle response - check if it's wrapped in success/data structure
      const responseData = resp.data;
      const updated = responseData?.data || responseData;
      if (import.meta.env.DEV) {
        console.log("[NodeProfile] Extracted node data:", updated);
      }

      // Update node data - merge with existing data from cache
      const mergedData = { ...nodeData, ...updated };

      // Regenerate form fields in case structure changed
      const updatedFields = mapNodeProfileToFields(mergedData);

      // Update form values with new data
      const updatedValues: Record<string, any> = {};
      updatedFields.forEach((field) => {
        const value = getNestedValue(mergedData, field.name);
        updatedValues[field.name] = value ?? field.value ?? "";
      });
      setFormValues(updatedValues);

      // Update selected node in the list
      const updatedNodes = nodes.map((n) =>
        n.id === selectedNode.id ? { ...n, ...updated } : n
      );
      setSelectedNode({ ...selectedNode, ...updated });

      // Update React Query cache optimistically with new data
      // Update node details cache
      queryClient.setQueryData(
        ["nodeDetails", selectedNode?.id],
        (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            nodeData: mergedData,
            formFields: updatedFields,
          };
        }
      );

      // Update nodes list cache
      queryClient.setQueryData(["userNodes", userId], updatedNodes);
      queryClient.setQueryData(["nodes", userId], (oldData: any) => {
        if (!oldData) return oldData;
        // Update the specific node in the nodes array
        return oldData.map((node: any) =>
          node.id === selectedNode.id ? { ...node, ...updated } : node
        );
      });

      // Invalidate React Query cache to ensure fresh data on next fetch
      queryClient.invalidateQueries({
        queryKey: ["nodeDetails", selectedNode?.id],
      });
      queryClient.invalidateQueries({ queryKey: ["userNodes", userId] });
      queryClient.invalidateQueries({ queryKey: ["nodes", userId] });

      toast.success("Node profile updated successfully!");
      setIsEditing(false);

      // Clear the draft from localStorage after successful save
      if (selectedNode?.id) {
        try {
          const storageKey = `node_profile_draft_${selectedNode.id}`;
          localStorage.removeItem(storageKey);
        } catch (e) {
          // ignore
        }
      }
    } catch (err: any) {
      console.error("Error saving node:", err);
      console.error("[NodeProfile] Full error details:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });

      if (err.response?.status === 401) {
        logout();
        toast.error("Session expired — please sign in again");
      } else if (err.response?.status === 403) {
        const errorMessage =
          err.response?.data?.message ||
          "You don't have permission to update this node. Please contact your administrator.";
        toast.error(errorMessage);
      } else {
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "Failed to save node changes. Please try again.";
        toast.error(errorMessage);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (nodeData) {
      // Reset form values to original node data
      const resetValues: Record<string, any> = {};
      formFields.forEach((field) => {
        const value = getNestedValue(nodeData, field.name);
        resetValues[field.name] = value ?? field.value ?? "";
      });
      setFormValues(resetValues);

      // Clear the draft from localStorage when canceling
      if (selectedNode?.id) {
        try {
          const storageKey = `node_profile_draft_${selectedNode.id}`;
          localStorage.removeItem(storageKey);
        } catch (e) {
          // ignore
        }
      }
    }
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Loading church information...</span>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="text-center text-gray-500 mt-10">
        <Globe className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <p className="text-xl font-semibold">Please log in to view nodes</p>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="text-center text-gray-500 mt-10">
        <Globe className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <p className="text-xl font-semibold">No church information available</p>
        <p className="text-gray-400">
          Please contact your administrator to set up church details.
        </p>
      </div>
    );
  }

  if (!selectedNode || !nodeData) {
    return (
      <div className="text-center text-gray-500 mt-10">
        <Globe className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <p className="text-xl font-semibold">Select a node to view details</p>
      </div>
    );
  }

  const nodeName = nodeData.name || selectedNode.name || "Church Name";
  const nodeDescription = nodeData.structure?.description || "";
  const levelName = nodeData.level?.name || "";
  const dateOfEstablishment = nodeData.dateOfEstablishment
    ? new Date(nodeData.dateOfEstablishment).toLocaleDateString()
    : "";

  return (
    <div className="space-y-8">
      {/* Node Selector */}
      {nodes.length > 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Node
          </label>
          <select
            value={selectedNode.id}
            onChange={(e) => handleSelect(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            disabled={isEditing}>
            {nodes.map((node) => (
              <option key={node.id} value={node.id}>
                {node.name ||
                  node.structure?.name ||
                  node.nodeId ||
                  "Unnamed Node"}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Node Header */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-white dark:border-gray-700 shadow-lg bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center">
                <Globe className="w-10 h-10 text-white" />
              </div>
              <button className="absolute -bottom-2 -right-2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-lg">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {nodeName}
              </h2>
              {nodeDescription && (
                <p className="text-gray-600 dark:text-gray-300">
                  {nodeDescription}
                </p>
              )}
              <div className="flex items-center space-x-4 mt-2">
                {levelName && (
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Building className="w-4 h-4 mr-1" />
                    {levelName}
                  </div>
                )}
                {dateOfEstablishment && (
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Calendar className="w-4 h-4 mr-1" />
                    Established {dateOfEstablishment}
                  </div>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => (isEditing ? handleCancel() : setIsEditing(true))}
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
            onClick={handleCancel}
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
