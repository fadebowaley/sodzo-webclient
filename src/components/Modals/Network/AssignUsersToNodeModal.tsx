import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UserPlus, Search } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { useNodeOperations } from "../../../hooks/useNodeOperations";
import { Node } from "../../../utils/networkHelpers";
import toast from "react-hot-toast";

interface AssignUsersToNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  node: Node | null;
}

interface User {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  avatar?: string;
}

export default function AssignUsersToNodeModal({
  isOpen,
  onClose,
  onSuccess,
  node,
}: AssignUsersToNodeModalProps) {
  const { api } = useAuth();
  const { assignUsersToNode } = useNodeOperations();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(
    new Set()
  );

  // Fetch users
  useEffect(() => {
    if (!isOpen) return;

    const fetchUsers = async () => {
      try {
        const res = await api.get("/users", { params: { limit: 1000 } });
        if (res.data?.results) {
          setUsers(res.data.results);
        }

        // Pre-select currently assigned users
        if (node?.users) {
          const assignedIds = new Set(
            node.users.map((u: any) => u.id || u._id).filter(Boolean)
          );
          setSelectedUserIds(assignedIds);
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
        toast.error("Failed to load users");
      }
    };

    fetchUsers();
  }, [isOpen, api, node]);

  const filteredUsers = users.filter((user) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      user.firstname?.toLowerCase().includes(search) ||
      user.lastname?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search)
    );
  });

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!node) {
      toast.error("Node not found");
      return;
    }

    setLoading(true);
    try {
      const result = await assignUsersToNode(
        node.id,
        Array.from(selectedUserIds)
      );

      if (result.success) {
        toast.success("Users assigned successfully");
        handleClose();
        onSuccess?.();
      }
    } catch (error) {
      console.error("Error assigning users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSearchTerm("");
    setSelectedUserIds(new Set());
    setLoading(false);
    onClose();
  };

  if (!isOpen || !node) return null;

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
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Assign Users to Node
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {node.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Search */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search users..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {selectedUserIds.size} user(s) selected
                </p>
              </div>

              {/* User List */}
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                <div className="p-6 space-y-2">
                  {filteredUsers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No users found
                    </div>
                  ) : (
                    filteredUsers.map((user) => {
                      const isSelected = selectedUserIds.has(user.id);
                      return (
                        <label
                          key={user.id}
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500"
                              : "bg-gray-50 dark:bg-gray-700/50 border-2 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700"
                          }`}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleUser(user.id)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={`${user.firstname} ${user.lastname}`}
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                              {user.firstname?.[0]?.toUpperCase()}
                              {user.lastname?.[0]?.toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {user.firstname} {user.lastname}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {user.email}
                            </p>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`px-4 py-2 text-white rounded-lg transition-colors flex items-center gap-2 ${
                      loading
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}>
                    <UserPlus className="w-4 h-4" />
                    {loading ? "Assigning..." : "Assign Users"}
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
