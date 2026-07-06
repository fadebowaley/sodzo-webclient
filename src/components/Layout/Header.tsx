import { useState, useRef, useEffect } from 'react';
import { Menu, Bell, User, Globe, LogOut, Lock, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import ThemeToggle from "../UI/ThemeToggle";
import { useAuth } from "../../contexts/AuthContext";
import { getAvatarUrl } from "../../utils/env";
import ChangePasswordModal from "../Modals/ChangePasswordModal";

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  // navigate not used here; keep import placeholder in case navigation is added later
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

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

  return (
    <motion.header
      className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 lg:px-6 transition-colors"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}>
      <div className="flex items-center justify-between h-16">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden transition-colors">
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <motion.button
            className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}>
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </motion.button>

          {/* Real User */}
          {/* <div className="relative" ref={profileRef}>
            <button
              className="flex items-center space-x-3 focus:outline-none"
              onClick={() => setProfileOpen((open) => !open)}
            >
              <img
                src={getAvatarUrl(user?.avatar)}
                alt="User avatar"
                className="w-8 h-8 rounded-full"
              />
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {user?.firstname} {user?.lastname}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.roles?.[0] || "Project Manager"}
                </p>
              </div>
            </button>
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                <button
                  className="block w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg"
                  onClick={() => {
                    setProfileOpen(false);
                    // clear both auth and user contexts and redirect to auth page
                    logout();
                    logout();
                    navigate('/');
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div> */}

          {/* User Profile */}
          <div className="relative" ref={profileRef}>
            <button
              className="flex items-center space-x-3 focus:outline-none"
              onClick={() => setProfileOpen((open) => !open)}>
              <img
                src={getAvatarUrl(user?.avatar, user?.avatarUrl)}
                alt={
                  user
                    ? `${user.firstname} ${user.lastname}`
                    : user
                    ? user.name ?? user.firstname ?? "User"
                    : "User avatar"
                }
                className="w-8 h-8 rounded-full"
              />
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {user
                    ? `${user.firstname} ${user.lastname}`
                    : user
                    ? user.name ?? user.firstname ?? "User"
                    : "User"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.roles?.[0] ||
                    (Array.isArray(user?.roles)
                      ? String(user?.roles[0])
                      : Array.isArray(user?.metadata?.roles)
                      ? String(user?.metadata?.roles[0])
                      : "Project Manager")}
                </p>
              </div>
            </button>
            {profileOpen && (
              <motion.div
                className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 overflow-hidden"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}>
                {/* User Info Section */}
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user
                      ? `${user.firstname} ${user.lastname}`
                      : user
                      ? user.name ?? user.firstname ?? "User"
                      : "User"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user?.roles?.[0] ||
                      (Array.isArray(user?.roles)
                        ? String(user?.roles[0])
                        : Array.isArray(user?.metadata?.roles)
                        ? String(user?.metadata?.roles[0])
                        : "Project Manager")}
                  </p>
                </div>

                {/* Profile Settings Links */}
                <div className="py-1">
                  <Link
                    to="/settings"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => setProfileOpen(false)}>
                    <User className="w-4 h-4 mr-3" />
                    Profile Settings
                  </Link>
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      setChangePasswordOpen(true);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <Lock className="w-4 h-4 mr-3" />
                    Change Password
                  </button>
                  <Link
                    to="/settings?tab=nodes"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => setProfileOpen(false)}>
                    <Globe className="w-4 h-4 mr-3" />
                    Node Settings
                  </Link>
                  <Link
                    to="/team"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => setProfileOpen(false)}>
                    <Users className="w-4 h-4 mr-3" />
                    Team
                  </Link>
                </div>

                {/* Logout */}
                <div className="border-t border-gray-200 dark:border-gray-700">
                  <button
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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
            )}
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