import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import ForgotPasswordModal from "./Modals/ForgotPasswordModal";
import { Mail, Lock, LogIn, Eye, EyeOff } from "lucide-react";
import { detectMobileLoginIssues } from "../utils/mobileUtils";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ open, onClose }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    if (open) {
      setEmail("");
      setPassword("");
      setError("");

      // Check for mobile-specific issues when modal opens
      const mobileIssues = detectMobileLoginIssues();
      if (mobileIssues.isMobile && mobileIssues.issues.length > 0) {
        // Don't show error immediately, but log it for debugging
        if (import.meta.env.DEV) {
          console.warn(
            "[AuthModal] Mobile login issues detected:",
            mobileIssues.issues
          );
        }
      }
    }
  }, [open]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling on mobile

    // Trim inputs to avoid whitespace issues
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setError("Please enter both email and password");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await login(trimmedEmail, trimmedPassword);
      setLoading(false);
      toast.success("Login successful!");
      onClose();
      navigate("/dashboard");
    } catch (err) {
      setLoading(false);
      let message = "Login failed";

      if (err instanceof Error) {
        message = err.message;
      } else if (typeof err === "object" && err !== null) {
        // Handle axios errors
        const axiosError = err as any;
        if (axiosError.response?.data?.message) {
          message = axiosError.response.data.message;
        } else if (axiosError.message) {
          message = axiosError.message;
        }
      }

      // Enhanced error logging for mobile debugging
      let mobileIssues;
      try {
        mobileIssues = detectMobileLoginIssues();
      } catch (mobileError) {
        // If mobile detection fails, create a safe fallback
        mobileIssues = {
          isMobile: false,
          cookiesEnabled:
            typeof navigator !== "undefined" ? navigator.cookieEnabled : true,
          localStorageAvailable: true,
          issues: [],
        };
      }
      
      if (import.meta.env.DEV || mobileIssues.isMobile) {
        console.error("[AuthModal] Login error:", {
          error: err,
          userAgent:
            typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
          isMobile: mobileIssues.isMobile,
          cookieEnabled: mobileIssues.cookiesEnabled,
          localStorageAvailable: mobileIssues.localStorageAvailable,
          issues: mobileIssues.issues,
        });
      }

      // Provide more helpful error messages for mobile users
      let displayMessage = message;
      if (mobileIssues.isMobile) {
        // Check for common mobile-specific errors
        const lowerMessage = message.toLowerCase();
        if (
          lowerMessage.includes("network") ||
          lowerMessage.includes("cors") ||
          lowerMessage.includes("failed to fetch")
        ) {
          displayMessage =
            "Network error. Please check your internet connection and try again. If the problem persists, ensure cookies are enabled in your browser settings.";
        } else if (
          lowerMessage.includes("unauthorized") ||
          lowerMessage.includes("401")
        ) {
          displayMessage =
            "Login failed. Please check your email and password. If you continue to have issues, try clearing your browser cache and cookies.";
        }

        // Add mobile-specific issue warnings
        if (mobileIssues.issues.length > 0) {
          displayMessage += ` ${mobileIssues.issues.join(" ")}`;
        }
      }

      setError(displayMessage);
      toast.error(displayMessage);
    }
  };

  if (!open && !showForgotPassword) return null;

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            key="auth-modal"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}>
            {/* Modal Card */}
            <motion.div
              className="relative w-full max-w-md mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}>
              {/* Close button */}
              <button
                className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={onClose}
                aria-label="Close">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Header with gradient */}
              <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 px-8 py-8 text-center">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", duration: 0.6 }}
                  className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <LogIn className="w-8 h-8 text-white" />
                </motion.div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Welcome Back
                </h2>
                <p className="text-blue-100 text-sm">
                  Sign in to your account to continue
                </p>
              </div>

              {/* Form Content */}
              <div className="px-8 py-6">
                <form className="space-y-5" onSubmit={handleLogin}>
                  {/* Email Field */}
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        autoCapitalize="none"
                        autoCorrect="off"
                        inputMode="email"
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label
                        htmlFor="password"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors font-medium">
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        autoCapitalize="none"
                        autoCorrect="off"
                        className="block w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        aria-label={showPassword ? "Hide password" : "Show password"}>
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {error}
                      </p>
                    </motion.div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading || !email.trim() || !password.trim()}
                    className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 touch-target ${
                      loading || !email.trim() || !password.trim()
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:scale-95"
                    }`}
                    onTouchStart={(e) => {
                      // Ensure touch events work properly on mobile
                      e.currentTarget.classList.add("active");
                    }}
                    onTouchEnd={(e) => {
                      e.currentTarget.classList.remove("active");
                    }}>
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg
                          className="animate-spin h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Signing in...</span>
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <LogIn className="w-5 h-5" />
                        <span>Sign In</span>
                      </span>
                    )}
                  </button>
                </form>

                {/* Footer */}
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={onClose}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium hover:underline transition-colors">
                      Contact your administrator
                    </button>
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        onSuccess={() => {
          setShowForgotPassword(false);
          toast.success(
            "Password reset successful! Please login with your new password."
          );
        }}
      />
    </>
  );
};

export default AuthModal;
