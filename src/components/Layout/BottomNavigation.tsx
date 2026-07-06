import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Home,
  FolderOpen,
  Calendar,
  BarChart3,
  MoreVertical,
} from "lucide-react";

interface NavItem {
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
}

interface BottomNavigationProps {
  onMoreClick: () => void;
}

export default function BottomNavigation({
  onMoreClick,
}: BottomNavigationProps) {
  const location = useLocation();

  const primaryNavItems: NavItem[] = [
    { path: "/dashboard", icon: Home, label: "Dashboard" },
    { path: "/projects", icon: FolderOpen, label: "Modules" },
    { path: "/calendar", icon: Calendar, label: "Calendar" },
    { path: "/reports", icon: BarChart3, label: "Reports" },
  ];

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <motion.nav
      className="fixed bottom-0 left-0 right-0 glass-effect-mobile z-50 safe-area-bottom mobile-glow"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}>
      {/* Safe area spacer for iOS - handled via CSS utility */}
      {/* Decorative gradient bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-30" />

      <div className="flex items-center justify-around h-16 px-2 relative">
        {primaryNavItems.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center justify-center flex-1 min-w-0 px-2 py-2 relative touch-target">
              <motion.div
                className="relative"
                whileTap={{ scale: 0.85 }}
                transition={{ duration: 0.15 }}>
                <Icon
                  className={`w-6 h-6 transition-colors ${
                    active
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                />
                {active && (
                  <motion.div
                    className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full"
                    layoutId="activeIndicator"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.div>
              <span
                className={`text-xs mt-1 font-medium transition-colors truncate w-full text-center ${
                  active
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-500 dark:text-gray-400"
                }`}>
                {item.label}
              </span>

              {/* Active background indicator with glow */}
              {active && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/20 rounded-xl -z-10 mobile-glow"
                  layoutId="activeBackground"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </Link>
          );
        })}

        {/* More Button */}
        <motion.button
          onClick={onMoreClick}
          className={`flex flex-col items-center justify-center flex-1 min-w-0 px-2 py-2 relative touch-target ${
            location.pathname === "/network" ||
            location.pathname === "/emails" ||
            location.pathname === "/storage" ||
            location.pathname === "/store" ||
            location.pathname === "/admin"
              ? "text-blue-600 dark:text-blue-400"
              : "text-gray-500 dark:text-gray-400"
          }`}
          whileTap={{ scale: 0.85 }}
          transition={{ duration: 0.15 }}
          aria-label="More options">
          <MoreVertical className="w-6 h-6" />
          <span className="text-xs mt-1 font-medium">More</span>
        </motion.button>
      </div>
    </motion.nav>
  );
}
