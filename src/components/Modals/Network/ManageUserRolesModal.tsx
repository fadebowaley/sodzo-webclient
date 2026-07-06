import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Shield, Search, Check, XCircle, Plus } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { useUserOperations, User } from "../../../hooks/useUserOperations";
import toast from "react-hot-toast";

interface ManageUserRolesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  user: User | null;
}

interface Role {
  id: string;
  _id?: string;
  name: string;
  description?: string;
  permissions?: any[];
}

export default function ManageUserRolesModal({
  isOpen,
  onClose,
  onSuccess,
  user,
}: ManageUserRolesModalProps) {
  const { api } = useAuth();
  const { assignRolesToUser, updateUser } = useUserOperations();
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<Set<string>>(
    new Set()
  );
  const [removedRoleIds, setRemovedRoleIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingRoles, setLoadingRoles] = useState(false);

  // Normalize current user roles to IDs
  const currentRoleIds = useMemo(() => {
    if (!user?.roles) return new Set<string>();
    return new Set(
      user.roles
        .map((role) => {
          if (typeof role === "object") {
            return role.id || role._id || "";
          }
          return role;
        })
        .filter(Boolean)
    );
  }, [user]);

  // Fetch available roles
  useEffect(() => {
    if (!isOpen) return;

    const fetchRoles = async () => {
      setLoadingRoles(true);
      try {
        const response = await api.get("/roles", { params: { limit: 500 } });

        // Extract roles from response
        let rolesArray: Role[] = [];
        if (Array.isArray(response.data)) {
          rolesArray = response.data;
        } else if (
          response.data?.results &&
          Array.isArray(response.data.results)
        ) {
          rolesArray = response.data.results;
        } else if (
          response.data?.data?.results &&
          Array.isArray(response.data.data.results)
        ) {
          rolesArray = response.data.data.results;
        }

        setRoles(rolesArray);
      } catch (error: any) {
        console.error("Failed to fetch roles:", error);
        toast.error("Failed to load roles");
      } finally {
        setLoadingRoles(false);
      }
    };

    fetchRoles();
  }, [isOpen, api, user]);

  // Filter roles based on search query - exclude current roles (they're shown separately)
  const filteredRoles = useMemo(() => {
    if (!searchQuery) {
      return roles.filter((role) => {
        const roleId = role.id || role._id || "";
        return !currentRoleIds.has(roleId);
      });
    }

    const query = searchQuery.toLowerCase();
    return roles.filter((role) => {
      const roleId = role.id || role._id || "";
      if (currentRoleIds.has(roleId)) return false; // Exclude current roles

      const name = (role.name || "").toLowerCase();
      const description = (role.description || "").toLowerCase();
      return name.includes(query) || description.includes(query);
    });
  }, [roles, searchQuery, currentRoleIds]);

  // Get current roles with full role objects
  const currentRolesWithDetails = useMemo(() => {
    if (!user?.roles) return [];
    return user.roles
      .map((role) => {
        const roleId = typeof role === "object" ? role.id || role._id : role;
        const roleName = typeof role === "object" ? role.name : role;
        const fullRole = roles.find((r) => (r.id || r._id) === roleId);
        return {
          id: roleId,
          name: roleName,
          description: fullRole?.description,
        };
      })
      .filter((r) => r.id && !removedRoleIds.has(r.id));
  }, [user, roles, removedRoleIds]);

  // Handle role selection for adding (multi-select - toggle)
  const toggleRoleSelection = (roleId: string) => {
    setSelectedRoleIds((prev) => {
      const next = new Set(prev);
      if (next.has(roleId)) {
        next.delete(roleId);
      } else {
        next.add(roleId);
      }
      return next;
    });
  };

  // Handle removing a current role
  const removeRole = (roleId: string) => {
    setRemovedRoleIds((prev) => new Set(prev).add(roleId));
    // Also remove from selected if it was selected
    setSelectedRoleIds((prev) => {
      const next = new Set(prev);
      next.delete(roleId);
      return next;
    });
  };

  // Handle restoring a removed role
  const restoreRole = (roleId: string) => {
    setRemovedRoleIds((prev) => {
      const next = new Set(prev);
      next.delete(roleId);
      return next;
    });
  };

  // Handle submit - calculate final roles and update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("User not found");
      return;
    }

    // Calculate final roles: (current - removed) + new
    const finalRoleIds = new Set<string>();

    // Add current roles that weren't removed
    currentRoleIds.forEach((roleId) => {
      if (!removedRoleIds.has(roleId)) {
        finalRoleIds.add(roleId);
      }
    });

    // Add newly selected roles
    selectedRoleIds.forEach((roleId) => {
      if (!currentRoleIds.has(roleId)) {
        finalRoleIds.add(roleId);
      }
    });

    if (finalRoleIds.size === 0) {
      toast.error("User must have at least one role");
      return;
    }

    setLoading(true);
    try {
      // Use updateUser to set the complete roles array
      // First, we need to get the role IDs as an array
      const rolesArray = Array.from(finalRoleIds);

      // Try using updateUser with roles field
      const result = await updateUser(user.id, { roles: rolesArray });

      if (result.success) {
        const addedCount = selectedRoleIds.size;
        const removedCount = removedRoleIds.size;

        if (addedCount > 0 && removedCount > 0) {
          toast.success(
            `Roles updated: ${addedCount} added, ${removedCount} removed`
          );
        } else if (addedCount > 0) {
          toast.success(
            `${addedCount} role${addedCount > 1 ? "s" : ""} added successfully`
          );
        } else if (removedCount > 0) {
          toast.success(
            `${removedCount} role${
              removedCount > 1 ? "s" : ""
            } removed successfully`
          );
        } else {
          toast.success("Roles updated successfully");
        }

        handleClose();
        onSuccess?.();
      }
    } catch (error) {
      console.error("Error updating roles:", error);
      // Fallback: try using assignRoles for new roles only
      if (selectedRoleIds.size > 0) {
        try {
          const newRoleIds = Array.from(selectedRoleIds).filter(
            (id) => !currentRoleIds.has(id)
          );
          if (newRoleIds.length > 0) {
            const assignResult = await assignRolesToUser(user.id, newRoleIds);
            if (assignResult.success) {
              toast.success(
                "New roles added (some operations may require page refresh)"
              );
              handleClose();
              onSuccess?.();
            }
          }
        } catch (assignError) {
          console.error("Error with fallback assign:", assignError);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedRoleIds(new Set());
    setRemovedRoleIds(new Set());
    setSearchQuery("");
    setLoading(false);
    onClose();
  };

  if (!isOpen || !user) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Manage User Roles
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {user.firstname} {user.lastname}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Current Roles with Remove Option */}
                {currentRolesWithDetails.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Current Roles
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {currentRolesWithDetails.map((role) => {
                        const isRemoved = removedRoleIds.has(role.id);
                        return (
                          <div
                            key={role.id}
                            className={`
                              flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full transition-all
                              ${
                                isRemoved
                                  ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 line-through opacity-60"
                                  : "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                              }
                            `}>
                            <span>{role.name}</span>
                            {!isRemoved ? (
                              <button
                                type="button"
                                onClick={() => removeRole(role.id)}
                                className="ml-1 p-0.5 hover:bg-red-200 dark:hover:bg-red-800 rounded-full transition-colors"
                                title="Remove role">
                                <XCircle className="w-3 h-3" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => restoreRole(role.id)}
                                className="ml-1 p-0.5 hover:bg-green-200 dark:hover:bg-green-800 rounded-full transition-colors"
                                title="Restore role">
                                <Plus className="w-3 h-3 rotate-45" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {removedRoleIds.size > 0 && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                        {removedRoleIds.size} role
                        {removedRoleIds.size > 1 ? "s" : ""} marked for removal
                      </p>
                    )}
                  </div>
                )}

                {/* Search Bar */}
                <div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search roles..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {filteredRoles.length} role
                      {filteredRoles.length !== 1 ? "s" : ""} available to add
                    </p>
                    <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
                      {selectedRoleIds.size} role
                      {selectedRoleIds.size !== 1 ? "s" : ""} selected
                    </p>
                  </div>
                </div>

                {/* Role List */}
                <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                  {loadingRoles ? (
                    <div className="flex justify-center items-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : filteredRoles.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        {searchQuery
                          ? "No roles found matching your search"
                          : "No roles available"}
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                      {filteredRoles.map((role) => {
                        const roleId = role.id || role._id || "";
                        const isSelected = selectedRoleIds.has(roleId);

                        return (
                          <button
                            key={roleId}
                            type="button"
                            onClick={() => toggleRoleSelection(roleId)}
                            className={`
                              w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors
                              ${
                                isSelected
                                  ? "bg-blue-50 dark:bg-blue-900/20"
                                  : ""
                              }
                            `}>
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3 flex-1">
                                <div
                                  className={`
                                    mt-0.5 p-2 rounded-lg flex-shrink-0
                                    ${
                                      isSelected
                                        ? "bg-blue-500 text-white"
                                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                                    }
                                  `}>
                                  {isSelected ? (
                                    <Check className="w-4 h-4" />
                                  ) : (
                                    <Shield className="w-4 h-4" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                                    {role.name}
                                  </p>
                                  {role.description && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                      {role.description}
                                    </p>
                                  )}
                                  {role.permissions &&
                                    role.permissions.length > 0 && (
                                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                        {role.permissions.length} permission
                                        {role.permissions.length !== 1
                                          ? "s"
                                          : ""}
                                      </p>
                                    )}
                                </div>
                              </div>
                              {isSelected && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full flex-shrink-0">
                                  Selected
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      loading ||
                      (selectedRoleIds.size === 0 && removedRoleIds.size === 0)
                    }
                    className={`
                      px-4 py-2 text-white rounded-lg transition-colors flex items-center gap-2
                      ${
                        loading ||
                        (selectedRoleIds.size === 0 &&
                          removedRoleIds.size === 0)
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700"
                      }
                    `}>
                    <Shield className="w-4 h-4" />
                    {loading ? "Updating..." : "Update Roles"}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}


