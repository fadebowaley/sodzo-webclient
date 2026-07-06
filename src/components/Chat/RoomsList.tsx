import { motion } from "framer-motion";
import { Hash, Users, Lock } from "lucide-react";

interface Room {
  id: string;
  name: string;
  description?: string;
  isPrivate: boolean;
  memberCount: number;
  unreadCount?: number;
}

interface RoomsListProps {
  rooms?: Room[];
  selectedRoomId?: string;
  onRoomSelect?: (roomId: string) => void;
}

// Mock data for UI demonstration
const mockRooms: Room[] = [
  {
    id: "1",
    name: "General",
    description: "General discussion",
    isPrivate: false,
    memberCount: 12,
    unreadCount: 3,
  },
  {
    id: "2",
    name: "Development",
    description: "Development team chat",
    isPrivate: false,
    memberCount: 8,
    unreadCount: 0,
  },
  {
    id: "3",
    name: "Design",
    description: "Design team discussions",
    isPrivate: false,
    memberCount: 5,
  },
  {
    id: "4",
    name: "Private Team",
    description: "Private team room",
    isPrivate: true,
    memberCount: 3,
    unreadCount: 1,
  },
];

export default function RoomsList({
  rooms = mockRooms,
  selectedRoomId,
  onRoomSelect,
}: RoomsListProps) {
  return (
    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
      <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-4">
        Threads ({rooms.length})
      </h3>
      <div className="space-y-2 max-h-80 overflow-y-auto chat-scrollbar">
        {rooms.map((room, index) => (
          <motion.div
            key={room.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onRoomSelect?.(room.id)}
            className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-colors ${
              selectedRoomId === room.id
                ? "bg-blue-100 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700"
                : "hover:bg-gray-100 dark:hover:bg-gray-700/50"
            }`}>
            <div
              className={`p-3 rounded-xl ${
                selectedRoomId === room.id
                  ? "bg-blue-500 dark:bg-blue-600"
                  : "bg-gray-200 dark:bg-gray-700"
              }`}>
              {room.isPrivate ? (
                <Lock
                  className={`w-5 h-5 ${
                    selectedRoomId === room.id
                      ? "text-white"
                      : "text-gray-600 dark:text-gray-300"
                  }`}
                />
              ) : (
                <Hash
                  className={`w-5 h-5 ${
                    selectedRoomId === room.id
                      ? "text-white"
                      : "text-gray-600 dark:text-gray-300"
                  }`}
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <p className="text-base font-medium text-gray-900 dark:text-white truncate">
                  {room.name}
                </p>
                {room.unreadCount && room.unreadCount > 0 && (
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white text-sm flex items-center justify-center font-semibold">
                    {room.unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Users className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {room.memberCount} members
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

