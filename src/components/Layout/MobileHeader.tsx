import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, User, Globe, LogOut, X, ChevronLeft, Lock, Users } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";
import { getAvatarUrl } from "../../utils/env";
import ThemeToggle from "../UI/ThemeToggle";
import ChangePasswordModal from "../Modals/ChangePasswordModal";

interface MobileHeaderProps {
  onMenuClick: () => void;
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export default function MobileHeader({
  onMenuClick,
  title,
  showBack = false,
  onBack,
}: MobileHeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Get page title from location if not provided
  const getPageTitle = () => {
    if (title) return title;

    const pathToTitle: Record<string, string> = {
      "/dashboard": "Dashboard",
      "/projects": "Modules",
      "/network": "Network",
      "/calendar": "Calendar",
      "/emails": "Email Center",
      "/storage": "Cloud Storage",
      "/reports": "Reports",
      "/settings": "Settings",
      "/team": "Team",
      "/admin": "Admin",
    };

    return pathToTitle[location.pathname] || "Sodzo";
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <motion.header
      className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 transition-colors sticky top-0 z-40"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.2 }}>
      <div className="flex items-center justify-between h-12 relative z-10">
        {/* Left side */}
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          {showBack ? (
            <motion.button
              onClick={handleBack}
              className="p-2 -ml-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors touch-target"
              whileTap={{ scale: 0.9 }}
              aria-label="Go back">
              <ChevronLeft className="w-5 h-5" />
            </motion.button>
          ) : (
            <motion.button
              onClick={onMenuClick}
              className="p-2 -ml-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors touch-target"
              whileTap={{ scale: 0.9 }}
              aria-label="Open menu">
              <Menu className="w-5 h-5" />
            </motion.button>
          )}

          {/* Page Title */}
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate ml-1">
            {getPageTitle()}
          </h1>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-1">
          {/* Theme Toggle */}
          <div className="scale-90">
            <ThemeToggle />
          </div>

          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <motion.button
              onClick={() => setProfileOpen(!profileOpen)}
              className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors touch-target"
              whileTap={{ scale: 0.9 }}
              aria-label="Profile menu">
              <img
                src={getAvatarUrl(user?.avatar)}
                alt={
                  user ? `${user.firstname} ${user.lastname}` : "User avatar"
                }
                className="w-8 h-8 rounded-full ring-2 ring-gray-200 dark:ring-gray-700"
              />
            </motion.button>

            <AnimatePresence>
              {profileOpen && (
                <>
                  {/* Overlay */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 bg-black/20 z-50"
                    onClick={() => setProfileOpen(false)}
                  />

                  {/* Dropdown Menu */}
                  <motion.div
                    className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}>
                    {/* User Info Section */}
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {user ? `${user.firstname} ${user.lastname}` : "User"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {user?.roles?.[0] || "Project Manager"}
                      </p>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <Link
                        to="/settings"
                        className="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors active:bg-gray-100 dark:active:bg-gray-600"
                        onClick={() => setProfileOpen(false)}>
                        <User className="w-4 h-4 mr-3 text-gray-500 dark:text-gray-400" />
                        Profile Settings
                      </Link>
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          setChangePasswordOpen(true);
                        }}
                        className="flex items-center w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors active:bg-gray-100 dark:active:bg-gray-600">
                        <Lock className="w-4 h-4 mr-3 text-gray-500 dark:text-gray-400" />
                        Change Password
                      </button>
                      <Link
                        to="/settings?tab=nodes"
                        className="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors active:bg-gray-100 dark:active:bg-gray-600"
                        onClick={() => setProfileOpen(false)}>
                        <Globe className="w-4 h-4 mr-3 text-gray-500 dark:text-gray-400" />
                        Node Settings
                      </Link>
                      <Link
                        to="/team"
                        className="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors active:bg-gray-100 dark:active:bg-gray-600"
                        onClick={() => setProfileOpen(false)}>
                        <Users className="w-4 h-4 mr-3 text-gray-500 dark:text-gray-400" />
                        Team
                      </Link>
                    </div>

                    {/* Logout */}
                    <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                      <button
                        className="flex items-center w-full px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors active:bg-red-100 dark:active:bg-red-900/30"
                        onClick={() => {
                          setProfileOpen(false);
                          // logout() handles all cleanup and redirect internally
                          logout();
                        }}>
                        <LogOut className="w-4 h-4 mr-3" />
                        Logout
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
        onSuccess={() => {
          toast.success("Password changed successfully!");
        }}
      />
    </motion.header>
  );
}
