import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, RotateCcw } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { useNodeOperations } from "../../../hooks/useNodeOperations";
import { Node } from "../../../utils/networkHelpers";
import toast from "react-hot-toast";

interface RestoreNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  node: Node | null;
}

export default function RestoreNodeModal({
  isOpen,
  onClose,
  onSuccess,
  node,
}: RestoreNodeModalProps) {
  const { api } = useAuth();
  const { restoreNode } = useNodeOperations();
  const [loading, setLoading] = useState(false);
  const [parent, setParent] = useState<string>("");
  const [level, setLevel] = useState<string>("");
  const [availableNodes, setAvailableNodes] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [levels, setLevels] = useState<Array<{ id: string; name: string }>>([]);

  // Fetch available nodes and levels for restore
  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      try {
        const [nodesRes, levelsRes] = await Promise.all([
          api.get("/node", { params: { limit: 1000, status: "active" } }),
          api.get("/level", { params: { limit: 500 } }),
        ]);

        if (nodesRes.data?.results) {
          setAvailableNodes(
            nodesRes.data.results.map((n: any) => ({
              id: n.id || n._id,
              name: n.name,
            }))
          );
        }

        if (levelsRes.data?.results) {
          setLevels(
            levelsRes.data.results.map((l: any) => ({
              id: l.id || l._id,
              name: l.name,
            }))
          );
          // Set default level if node has one
          if (node?.level?.id) {
            setLevel(node.level.id);
          }
        }
      } catch (error) {
        console.error("Failed to fetch restore options:", error);
      }
    };

    fetchData();
  }, [isOpen, api, node]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!node) {
      toast.error("Node not found");
      return;
    }

    setLoading(true);
    try {
      const result = await restoreNode(node.id, {
        parent: parent || null,
        level: level || undefined,
      });

      if (result.success) {
        toast.success("Node restored successfully");
        handleClose();
        onSuccess?.();
      }
    } catch (error) {
      console.error("Error restoring node:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setParent("");
    setLevel("");
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
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <RotateCcw className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Restore Node
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

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-300">
                    Restore this node to active status. You can optionally
                    change its parent or level.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Parent Node (Optional)
                  </label>
                  <select
                    value={parent}
                    onChange={(e) => setParent(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">No parent (root node)</option>
                    {availableNodes
                      .filter((n) => n.id !== node.id)
                      .map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Level (Optional)
                  </label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">Keep current level</option>
                    {levels.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
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
                    disabled={loading}
                    className={`px-4 py-2 text-white rounded-lg transition-colors flex items-center gap-2 ${
                      loading
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700"
                    }`}>
                    <RotateCcw className="w-4 h-4" />
                    {loading ? "Restoring..." : "Restore Node"}
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
