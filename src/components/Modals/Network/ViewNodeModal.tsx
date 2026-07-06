import { motion, AnimatePresence } from "framer-motion";
import { X, Building, MapPin, Calendar, Users } from "lucide-react";
import { Node, formatDate } from "../../../utils/networkHelpers";
import { LevelBadge } from "../../Network/LevelBadge";

interface ViewNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  node: Node | null;
}

export default function ViewNodeModal({
  isOpen,
  onClose,
  node,
}: ViewNodeModalProps) {
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
            onClick={onClose}
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
                      Node Details
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      View node information
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Name
                  </label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {node.name}
                  </p>
                </div>

                {/* Node ID */}
                {node.nodeId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Node ID
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {node.nodeId}
                    </p>
                  </div>
                )}

                {/* Level and Structure */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Level
                    </label>
                    <LevelBadge level={node.level} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Structure
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {node.structure?.name || "—"}
                    </p>
                  </div>
                </div>

                {/* Location */}
                {(node.address || node.city || node.state || node.country) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Location
                    </label>
                    <div className="space-y-1 text-gray-900 dark:text-white">
                      {node.address && <p>{node.address}</p>}
                      <p>
                        {[node.city, node.state, node.country]
                          .filter(Boolean)
                          .join(", ") || "—"}
                        {(node as any).postalCode &&
                          ` ${(node as any).postalCode}`}
                      </p>
                    </div>
                  </div>
                )}

                {/* Users */}
                {node.users && node.users.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Assigned Users ({node.users.length})
                    </label>
                    <div className="space-y-2">
                      {node.users.slice(0, 5).map((user: any) => (
                        <div
                          key={user.id || user._id}
                          className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.firstname}
                              className="w-8 h-8 rounded-full"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm">
                              {user.firstname?.[0]}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.firstname} {user.lastname}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      ))}
                      {node.users.length > 5 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          +{node.users.length - 5} more users
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  {node.createdAt && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Created
                      </label>
                      <p className="text-gray-900 dark:text-white">
                        {formatDate(node.createdAt)}
                      </p>
                    </div>
                  )}
                  {(node as any).dateOfEstablishment && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Established
                      </label>
                      <p className="text-gray-900 dark:text-white">
                        {formatDate((node as any).dateOfEstablishment)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Status */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-4">
                    {node.isMain && (
                      <span className="px-3 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full">
                        Main Node
                      </span>
                    )}
                    {node.isActive === false && (
                      <span className="px-3 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                        Inactive
                      </span>
                    )}
                    {node.isActive !== false && !node.isMain && (
                      <span className="px-3 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
