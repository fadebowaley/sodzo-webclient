import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save } from "lucide-react";
import { useUserOperations, User } from "../../../hooks/useUserOperations";
import toast from "react-hot-toast";

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  user: User | null;
}

export default function EditUserModal({
  isOpen,
  onClose,
  onSuccess,
  user,
}: EditUserModalProps) {
  const { updateUser } = useUserOperations();
  const [loading, setLoading] = useState(false);

  // Form state
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  // Initialize form when user changes
  useEffect(() => {
    if (user && isOpen) {
      setFirstname(user.firstname || "");
      setLastname(user.lastname || "");
      setEmail(user.email || "");
      setPhoneNumber(user.phoneNumber || "");
    }
  }, [user, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !firstname || !lastname || !email) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const result = await updateUser(user.id, {
        firstname,
        lastname,
        email,
        phoneNumber: phoneNumber || undefined,
      });

      if (result.success) {
        toast.success("User updated successfully");
        handleClose();
        onSuccess?.();
      }
    } catch (error) {
      console.error("Error updating user:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
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
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Save className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Edit User
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Update user information
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={firstname}
                      onChange={(e) => setFirstname(e.target.value)}
                      placeholder="Enter first name"
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={lastname}
                      onChange={(e) => setLastname(e.target.value)}
                      placeholder="Enter last name"
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email address"
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Enter phone number"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
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
