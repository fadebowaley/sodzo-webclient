import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import OnlineUsers from "./OnlineUsers";
import RoomsList from "./RoomsList";
import ChatWindow from "./ChatWindow";
import { useState } from "react";

interface ChatPanelProps {
  isOpen: boolean;
  onClose?: () => void;
  variant?: "white" | "dark";
}

type MobileTab = "chat" | "users" | "rooms";

export default function ChatPanel({
  isOpen,
  onClose,
  variant = "white",
}: ChatPanelProps) {
  const [selectedRoomId, setSelectedRoomId] = useState<string>("1");
  const [mobileTab, setMobileTab] = useState<MobileTab>("chat");

  const handleSendMessage = (text: string) => {
    // UI-only: Just log for demonstration
    console.log("Sending message:", text);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-40"
          />

          {/* Chat Panel */}
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={`fixed bottom-0 md:bottom-6 right-0 md:right-24 z-50 w-full md:w-[95vw] max-w-4xl h-[calc(100vh-4rem)] md:h-[90vh] max-h-[800px] md:rounded-2xl shadow-2xl overflow-hidden flex flex-col ${
              variant === "dark"
                ? "bg-gray-800 dark:bg-gray-900 border-t md:border border-gray-700 dark:border-gray-600"
                : "bg-white dark:bg-gray-800 border-t md:border border-gray-200 dark:border-gray-700"
            }`}>
            {/* Desktop Layout */}
            <div className="hidden md:flex h-full">
              {/* Sidebar - Online Users & Threads */}
              <div className="flex flex-col w-80 border-r border-gray-200 dark:border-gray-700 overflow-y-auto chat-scrollbar">
                <OnlineUsers />
                <RoomsList
                  selectedRoomId={selectedRoomId}
                  onRoomSelect={setSelectedRoomId}
                />
              </div>

              {/* Main Chat Area */}
              <div className="flex-1 flex flex-col min-w-0">
                <ChatWindow
                  roomName={
                    selectedRoomId === "1"
                      ? "General"
                      : selectedRoomId === "2"
                      ? "Development"
                      : selectedRoomId === "3"
                      ? "Design"
                      : "Private Team"
                  }
                  onSendMessage={handleSendMessage}
                />
              </div>
            </div>

            {/* Mobile Layout */}
            <div className="md:hidden flex flex-col h-full">
              {/* Mobile Header with Close Button */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Chat
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-target"
                  aria-label="Close chat">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Mobile Content Area */}
              <div className="flex-1 overflow-hidden">
                {mobileTab === "chat" && (
                  <div className="h-full">
                    <ChatWindow
                      roomName={
                        selectedRoomId === "1"
                          ? "General"
                          : selectedRoomId === "2"
                          ? "Development"
                          : selectedRoomId === "3"
                          ? "Design"
                          : "Private Team"
                      }
                      onSendMessage={handleSendMessage}
                    />
                  </div>
                )}
                {mobileTab === "users" && (
                  <div className="h-full overflow-y-auto chat-scrollbar">
                    <OnlineUsers />
                  </div>
                )}
                {mobileTab === "rooms" && (
                  <div className="h-full overflow-y-auto chat-scrollbar">
                    <RoomsList
                      selectedRoomId={selectedRoomId}
                      onRoomSelect={(id) => {
                        setSelectedRoomId(id);
                        setMobileTab("chat");
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Mobile: Tabs for switching between sections */}
              <div className="flex border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 safe-area-bottom">
                <button
                  onClick={() => setMobileTab("chat")}
                  className={`flex-1 py-3 text-sm font-medium transition-colors touch-target ${
                    mobileTab === "chat"
                      ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-500"
                      : "text-gray-600 dark:text-gray-400"
                  }`}>
                  Chat
                </button>
                <button
                  onClick={() => setMobileTab("users")}
                  className={`flex-1 py-3 text-sm font-medium transition-colors touch-target ${
                    mobileTab === "users"
                      ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-500"
                      : "text-gray-600 dark:text-gray-400"
                  }`}>
                  Users
                </button>
                <button
                  onClick={() => setMobileTab("rooms")}
                  className={`flex-1 py-3 text-sm font-medium transition-colors touch-target ${
                    mobileTab === "rooms"
                      ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-500"
                      : "text-gray-600 dark:text-gray-400"
                  }`}>
                  Threads
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

