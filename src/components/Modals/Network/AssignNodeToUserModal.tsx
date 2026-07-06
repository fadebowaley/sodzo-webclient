import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Building, Search } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { useNodeOperations } from "../../../hooks/useNodeOperations";
import { User } from "../../../hooks/useUserOperations";
import toast from "react-hot-toast";

interface AssignNodeToUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  user: User | null;
}

interface Node {
  id: string;
  name: string;
  level?: { name: string };
}

export default function AssignNodeToUserModal({
  isOpen,
  onClose,
  onSuccess,
  user,
}: AssignNodeToUserModalProps) {
  const { api } = useAuth();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [nodes, setNodes] = useState<Node[]>([]);
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(
    new Set()
  );

  // Fetch nodes
  useEffect(() => {
    if (!isOpen) return;

    const fetchNodes = async () => {
      try {
        const res = await api.get("/node", {
          params: { limit: 1000, status: "active" },
        });
        if (res.data?.results) {
          setNodes(res.data.results);
        }

        // Pre-select currently assigned nodes (if user has nodes property)
        // Note: This would require checking user's assigned nodes endpoint
      } catch (error) {
        console.error("Failed to fetch nodes:", error);
        toast.error("Failed to load nodes");
      }
    };

    fetchNodes();
  }, [isOpen, api]);

  const filteredNodes = nodes.filter((node) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return node.name?.toLowerCase().includes(search);
  });

  const toggleNode = (nodeId: string) => {
    setSelectedNodeIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("User not found");
      return;
    }

    if (selectedNodeIds.size === 0) {
      toast.error("Please select at least one node");
      return;
    }

    setLoading(true);
    try {
      // Assign nodes to user by updating each node's assigned users
      const nodeIds = Array.from(selectedNodeIds);

      // For each selected node, assign the user to it
      await Promise.all(
        nodeIds.map((nodeId) =>
          api.patch(`/node/${nodeId}/assign-users`, {
            userIds: [user.id],
          })
        )
      );

      toast.success("Nodes assigned successfully");
      handleClose();
      onSuccess?.();
    } catch (error) {
      console.error("Error assigning nodes:", error);
      toast.error("Failed to assign nodes");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSearchTerm("");
    setSelectedNodeIds(new Set());
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
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Building className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Assign Nodes to User
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

              {/* Search */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search nodes..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {selectedNodeIds.size} node(s) selected
                </p>
              </div>

              {/* Node List */}
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                <div className="p-6 space-y-2">
                  {filteredNodes.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No nodes found
                    </div>
                  ) : (
                    filteredNodes.map((node) => {
                      const isSelected = selectedNodeIds.has(node.id);
                      return (
                        <label
                          key={node.id}
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500"
                              : "bg-gray-50 dark:bg-gray-700/50 border-2 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700"
                          }`}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleNode(node.id)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <Building className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {node.name}
                            </p>
                            {node.level && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {node.level.name}
                              </p>
                            )}
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
                    disabled={loading || selectedNodeIds.size === 0}
                    className={`px-4 py-2 text-white rounded-lg transition-colors flex items-center gap-2 ${
                      loading || selectedNodeIds.size === 0
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}>
                    <Building className="w-4 h-4" />
                    {loading ? "Assigning..." : "Assign Nodes"}
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
