import { motion } from "framer-motion";
import { X, MessageSquare } from "lucide-react";

interface ChatLauncherProps {
  isOpen: boolean;
  onClick: () => void;
  variant?: "white" | "dark";
}

export default function ChatLauncher({
  isOpen,
  onClick,
  variant = "white",
}: ChatLauncherProps) {
  const isDark = variant === "dark";

  return (
    <motion.button
      onClick={onClick}
      className={`fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 touch-target ${
        isDark
          ? "bg-gray-800 dark:bg-gray-900 border border-gray-700 dark:border-gray-600"
          : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
      }`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.9 }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}>
      {/* Close icon when open */}
      {isOpen ? (
        <motion.div
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={{ rotate: 90, opacity: 0 }}>
          <X
            className={`w-6 h-6 ${
              isDark
                ? "text-gray-200 dark:text-gray-300"
                : "text-gray-700 dark:text-gray-300"
            }`}
          />
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}>
          <MessageSquare
            className={`w-6 h-6 md:w-7 md:h-7 ${
              isDark
                ? "text-gray-200 dark:text-gray-300"
                : "text-gray-700 dark:text-gray-300"
            }`}
          />
        </motion.div>
      )}
    </motion.button>
  );
}
