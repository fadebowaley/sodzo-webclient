import { motion } from "framer-motion";
import { Circle } from "lucide-react";

interface User {
  id: string;
  name: string;
  avatar?: string;
  status: "online" | "away" | "busy";
}

interface OnlineUsersProps {
  users?: User[];
}

// Mock data for UI demonstration
const mockUsers: User[] = [
  { id: "1", name: "John Doe", status: "online" },
  { id: "2", name: "Jane Smith", status: "online" },
  { id: "3", name: "Mike Johnson", status: "away" },
  { id: "4", name: "Sarah Williams", status: "online" },
  { id: "5", name: "Tom Brown", status: "busy" },
];

export default function OnlineUsers({ users = mockUsers }: OnlineUsersProps) {
  const getStatusColor = (status: User["status"]) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "away":
        return "bg-yellow-500";
      case "busy":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
        Online Users ({users.filter((u) => u.status === "online").length})
      </h3>
      <div className="space-y-1.5 max-h-64 overflow-y-auto chat-scrollbar">
        {users.map((user, index) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
            {/* Avatar placeholder */}
            <div className="relative flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-xs">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <Circle
                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${getStatusColor(
                  user.status
                )} rounded-full border-2 border-white dark:border-gray-800`}
                fill="currentColor"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {user.status}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

