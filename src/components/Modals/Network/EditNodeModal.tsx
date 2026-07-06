import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Building, Save } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { useNodeOperations } from "../../../hooks/useNodeOperations";
import { Node } from "../../../utils/networkHelpers";
import toast from "react-hot-toast";

interface EditNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  node: Node | null;
}

export default function EditNodeModal({
  isOpen,
  onClose,
  onSuccess,
  node,
}: EditNodeModalProps) {
  const { api } = useAuth();
  const { updateNode } = useNodeOperations();
  const [loading, setLoading] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [level, setLevel] = useState("");
  const [structure, setStructure] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [dateOfEstablishment, setDateOfEstablishment] = useState("");
  const [isMain, setIsMain] = useState(false);

  // Options
  const [levels, setLevels] = useState<Array<{ id: string; name: string }>>([]);
  const [structures, setStructures] = useState<
    Array<{ id: string; name: string; level: string }>
  >([]);

  // Initialize form when node changes
  useEffect(() => {
    if (node && isOpen) {
      setName(node.name || "");
      setLevel(node.level?.id || "");
      setStructure(node.structure?.id || "");
      setAddress(node.address || "");
      setCity(node.city || "");
      setState(node.state || "");
      setCountry(node.country || "");
      setPostalCode((node as any).postalCode || "");
      setDateOfEstablishment((node as any).dateOfEstablishment || "");
      setIsMain(node.isMain || false);
    }
  }, [node, isOpen]);

  // Fetch levels and structures
  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      try {
        const [levelsRes, structuresRes] = await Promise.all([
          api.get("/level", { params: { limit: 500 } }),
          api.get("/structure", { params: { limit: 500 } }),
        ]);

        if (levelsRes.data?.results) {
          setLevels(
            levelsRes.data.results.map((l: any) => ({
              id: l.id || l._id,
              name: l.name,
            }))
          );
        }

        if (structuresRes.data?.results) {
          setStructures(
            structuresRes.data.results.map((s: any) => ({
              id: s.id || s._id,
              name: s.name,
              level:
                typeof s.level === "object"
                  ? s.level.id || s.level._id
                  : s.level,
            }))
          );
        }
      } catch (error) {
        console.error("Failed to fetch levels/structures:", error);
        toast.error("Failed to load form data");
      }
    };

    fetchData();
  }, [isOpen, api]);

  // Filter structures by selected level
  const availableStructures = level
    ? structures.filter((s) => s.level === level)
    : structures;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!node || !name || !level || !structure) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const result = await updateNode(node.id, {
        name,
        level,
        structure,
        address: address || undefined,
        city: city || undefined,
        state: state || undefined,
        country: country || undefined,
        postalCode: postalCode || undefined,
        dateOfEstablishment: dateOfEstablishment || undefined,
        isMain,
      });

      if (result.success) {
        toast.success("Node updated successfully");
        handleClose();
        onSuccess?.();
      }
    } catch (error) {
      console.error("Error updating node:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
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
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Building className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Edit Node
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Update node information
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter node name"
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Level <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={level}
                      onChange={(e) => {
                        setLevel(e.target.value);
                        setStructure(""); // Reset structure when level changes
                      }}
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="">Select level</option>
                      {levels.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Structure <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={structure}
                      onChange={(e) => setStructure(e.target.value)}
                      required
                      disabled={!level}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed">
                      <option value="">Select structure</option>
                      {availableStructures.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Enter city"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      State
                    </label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="Enter state"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter address"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Country
                    </label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="NG"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="Enter postal code"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date of Establishment
                  </label>
                  <input
                    type="date"
                    value={dateOfEstablishment}
                    onChange={(e) => setDateOfEstablishment(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isMain"
                    checked={isMain}
                    onChange={(e) => setIsMain(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label
                    htmlFor="isMain"
                    className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Main node
                  </label>
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
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}>
                    <Save className="w-4 h-4" />
                    {loading ? "Saving..." : "Save Changes"}
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
