import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import {
  Network,
  Mail,
  Cloud,
  ShieldCheck,
  ShoppingBag,
  X,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

interface MoreDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MoreMenuItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  ownerOnly?: boolean;
}

export default function MoreDrawer({ isOpen, onClose }: MoreDrawerProps) {
  const location = useLocation();
  const { user } = useAuth();

  // Check if user has admin privileges
  const currentUser = user;
  const hasAdminAccess =
    currentUser?.isSaby === true ||
    currentUser?.isOwner === true ||
    currentUser?.isSuper === true;

  const moreMenuItems: MoreMenuItem[] = [
    { name: "Network", href: "/network", icon: Network },
    { name: "Email Center", href: "/emails", icon: Mail },
    { name: "Cloud Storage", href: "/storage", icon: Cloud },
    { name: "Store", href: "/store", icon: ShoppingBag },
    { name: "Admin", href: "/admin", icon: ShieldCheck, ownerOnly: true },
  ];

  const filteredItems = moreMenuItems.filter((item) => {
    if (item.ownerOnly) {
      return hasAdminAccess;
    }
    return true;
  });

  const handleLinkClick = () => {
    onClose();
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
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer with glass effect */}
          <motion.div
            className="fixed right-0 top-0 bottom-0 w-80 max-w-[85vw] glass-effect-mobile z-50 shadow-2xl mobile-glow-purple"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}>
            {/* Decorative gradient border */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-60" />

            {/* Header with enhanced gradient */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/30 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
              {/* Shimmer effect */}
              <div className="absolute inset-0 shimmer opacity-20" />
              <h2 className="text-xl font-bold gradient-text-mobile relative z-10">
                More
              </h2>
              <motion.button
                onClick={onClose}
                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors touch-target"
                whileTap={{ scale: 0.9 }}
                aria-label="Close drawer">
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Menu Items */}
            <nav className="py-4 overflow-y-auto h-full pb-safe">
              <div className="space-y-1 px-4">
                {filteredItems.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;

                  return (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}>
                      <Link
                        to={item.href}
                        onClick={handleLinkClick}
                        className={`flex items-center px-4 py-3.5 rounded-xl text-base font-medium transition-all duration-200 touch-target relative overflow-hidden ${
                          isActive
                            ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/20 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50 shadow-md mobile-glow"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-50/80 dark:hover:bg-gray-800/80 active:bg-gray-100 dark:active:bg-gray-700"
                        }`}>
                        {/* Hover shimmer */}
                        {!isActive && (
                          <div className="absolute inset-0 shimmer opacity-0 hover:opacity-30 transition-opacity" />
                        )}
                        <Icon
                          className={`w-5 h-5 mr-3 ${
                            isActive
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-gray-500 dark:text-gray-400"
                          }`}
                        />
                        <span className="flex-1">{item.name}</span>
                        <ChevronRight
                          className={`w-5 h-5 transition-transform ${
                            isActive
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-gray-400 dark:text-gray-500"
                          }`}
                        />
                      </Link>
                    </motion.div>
                  );
                })}
              </div>

              {/* Settings Link */}
              <div className="mt-8 px-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                <Link
                  to="/settings"
                  onClick={handleLinkClick}
                  className={`flex items-center px-4 py-3.5 rounded-xl text-base font-medium transition-all duration-200 touch-target ${
                    location.pathname === "/settings"
                      ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700"
                  }`}>
                  <svg
                    className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span className="flex-1">Settings</span>
                  <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                </Link>
              </div>
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
