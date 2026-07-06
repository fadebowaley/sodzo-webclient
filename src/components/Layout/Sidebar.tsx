import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cloud,
  Home,
  Mail,
  ShieldCheck,
  FolderOpen,
  Network,
  Calendar,
  BarChart3,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  Heart,
  Users
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { mockUser } from "../../data/mockData";
import { getAvatarUrl } from "../../utils/env";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Modules", href: "/projects", icon: FolderOpen },
  { name: "Network", href: "/network", icon: Network },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Email Center", href: "/emails", icon: Mail },
  { name: "Cloud Storage", href: "/storage", icon: Cloud },
  { name: "Givings", href: "/givings", icon: Heart },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Store", href: "/store", icon: ShoppingBag },
  { name: "User", href: "/user", icon: Users },
  { name: "Admin", href: "/admin", icon: ShieldCheck, ownerOnly: true },

];

// const futureFeatures = [
//   { name: 'Notifications', href: '/notifications', icon: Bell },
//   { name: 'Analytics', href: '/analytics', icon: BarChart3 },
//   { name: 'Access Control', href: '/access', icon: Shield },
//   { name: 'Advanced Reports', href: '/reports', icon: TrendingUp },
// ];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function Sidebar({
  isOpen,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();

  // Check if user has admin privileges (isSaby, isOwner, or isSuper)
  // Only users with these privileges should see Admin link
  // Note: isAdmin alone is NOT sufficient - regular admins cannot see Admin section
  const currentUser = user;
  const hasAdminAccess =
    currentUser?.isSaby === true ||
    currentUser?.isOwner === true ||
    currentUser?.isSuper === true;

  // Debug in development
  if (import.meta.env.DEV && currentUser) {
    console.debug("[Sidebar] Admin access check:", {
      hasAdminAccess,
      isSaby: currentUser.isSaby,
      isOwner: currentUser.isOwner,
      isSuper: currentUser.isSuper,
      isAdmin: currentUser.isAdmin,
    });
  }

  const sidebarVariants = {
    open: { x: 0 },
    closed: { x: "-100%" },
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        className={`
          fixed inset-y-0 left-0 z-30 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300
          ${isCollapsed ? "w-16" : "w-64"}
          lg:relative lg:translate-x-0 lg:z-0
        `}
        initial={false}
        animate={isOpen ? "open" : "closed"}
        variants={sidebarVariants}
        transition={{ duration: 0.3, ease: "easeInOut" }}>
        <div className="flex flex-col h-full">
          {/* Logo and Toggle */}
          <motion.div
            className={`flex items-center h-16 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 ${
              isCollapsed ? "px-3 justify-center" : "px-4 justify-between"
            }`}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}>
            {!isCollapsed ? (
              <>
                <div className="flex items-center space-x-2 flex-1">
                  {/* Logo Container */}
                  <motion.div
                    className="rounded-lg flex items-center justify-center"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 10,
                    }}>
                    <img
                      src="/logo.png"
                      alt="The Sword of the Spirit Ministries Logo"
                      className="w-auto h-12 object-cover"
                    />
                  </motion.div>

                  {/* Ministry Name */}
                  <span className="text-xs font-bold text-gray-900 dark:text-white tracking-wide truncate">
                    The Sword of the Spirit Ministries
                  </span>
                </div>
                {/* Collapse Button */}
                {onToggleCollapse && (
                  <button
                    onClick={onToggleCollapse}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Collapse sidebar">
                    <ChevronLeft className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </button>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center w-full">
                {/* Logo only when collapsed */}
                <motion.div
                  className="rounded-lg flex items-center justify-center"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}>
                  <img
                    src="/logo.png"
                    alt="The Sword of the Spirit Ministries Logo"
                    className="w-auto h-8 object-cover"
                  />
                </motion.div>
              </div>
            )}
          </motion.div>

          {/* Navigation */}
          <nav
            className={`flex-1 py-6 space-y-2 bg-white dark:bg-gray-800 ${
              isCollapsed ? "px-2" : "px-4"
            }`}>
            <div className="space-y-1">
              {navigation
                .filter((item) => {
                  // Filter out Admin link if user doesn't have admin access
                  if (item.ownerOnly) {
                    return hasAdminAccess;
                  }
                  return true;
                })
                .map((item, index) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + index * 0.05 }}>
                      <Link
                        to={item.href}
                        className={`
                        flex items-center rounded-lg text-sm font-medium transition-all duration-200 group relative
                        ${
                          isCollapsed ? "justify-center px-2 py-2" : "px-3 py-2"
                        }
                        ${
                          isActive
                            ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-r-2 border-blue-600"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                        }
                      `}
                        onClick={onClose}
                        title={isCollapsed ? item.name : undefined}>
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}>
                          <item.icon
                            className={`w-5 h-5 ${isCollapsed ? "" : "mr-3"}`}
                          />
                        </motion.div>
                        {!isCollapsed && (
                          <span className="truncate">{item.name}</span>
                        )}
                        {/* Tooltip for collapsed state */}
                        {isCollapsed && (
                          <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                            {item.name}
                          </span>
                        )}
                      </Link>
                    </motion.div>
                  );
                })}
            </div>

            {/* Future Features
            <div className="pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="px-3 mb-2">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Coming Soon
                </p>
              </div>
              <div className="space-y-1">
                {futureFeatures.map((item, index) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-400 dark:text-gray-500 cursor-not-allowed"
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </motion.div>
                ))}
              </div>
            </div> */}
          </nav>

          {/* User Profile */}
          {!isCollapsed && (
            <motion.div
              className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}>
              <div className="flex items-center space-x-3">
                <img
                  src={getAvatarUrl(
                    user?.avatar,
                    user?.avatarUrl || user?.avatar || mockUser[0]?.avatar
                  )}
                  alt={`${
                    user
                      ? `${user.firstname} ${user.lastname}`
                      : user
                      ? user.name ?? user.firstname ?? "User"
                      : `${mockUser[0]?.firstname} ${mockUser[0]?.lastname}`
                  }`}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user
                      ? `${user.firstname} ${user.lastname}`
                      : user
                      ? user.name ?? user.firstname ?? "User"
                      : `${mockUser[0]?.firstname} ${mockUser[0]?.lastname}`}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user?.roles?.[0] ||
                      (Array.isArray(user?.roles)
                        ? String(user?.roles[0])
                        : Array.isArray(user?.metadata?.roles)
                        ? String(user?.metadata?.roles[0])
                        : mockUser[0]?.roles?.[0] || "Project Manager")}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Collapsed User Avatar and Toggle */}
          {isCollapsed && (
            <motion.div
              className="p-2 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col items-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}>
              <img
                src={getAvatarUrl(
                  user?.avatar,
                  user?.avatarUrl || user?.avatar || mockUser[0]?.avatar
                )}
                alt={`${
                  user
                    ? `${user.firstname} ${user.lastname}`
                    : user
                    ? user.name ?? user.firstname ?? "User"
                    : `${mockUser[0]?.firstname} ${mockUser[0]?.lastname}`
                }`}
                className="w-8 h-8 rounded-full"
                title={
                  user
                    ? `${user.firstname} ${user.lastname}`
                    : `${mockUser[0]?.firstname} ${mockUser[0]?.lastname}`
                }
              />
              {/* Expand Button */}
              {onToggleCollapse && (
                <button
                  onClick={onToggleCollapse}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Expand sidebar">
                  <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>
    </>
  );
}