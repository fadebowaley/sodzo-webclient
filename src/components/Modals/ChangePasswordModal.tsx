import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, Eye, EyeOff, Shield, CheckCircle } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ChangePasswordModal({
  isOpen,
  onClose,
  onSuccess,
}: ChangePasswordModalProps) {
  const { api, logout } = useAuth();
  const [step, setStep] = useState<"current" | "new">("current");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Password strength checker
  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: "", color: "" };
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 2) return { strength, label: "Weak", color: "red" };
    if (strength === 3) return { strength, label: "Fair", color: "yellow" };
    if (strength === 4) return { strength, label: "Good", color: "blue" };
    return { strength, label: "Strong", color: "green" };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  const handleCurrentPasswordVerification = async () => {
    if (!currentPassword) {
      toast.error("Please enter your current password");
      return;
    }

    setLoading(true);
    try {
      // Verify current password
      await api.post("/auth/verify-password", { password: currentPassword });
      toast.success("Password verified");
      setStep("new");
    } catch (err: any) {
      if (err.response?.status === 401) {
        logout();
        toast.error("Session expired — please sign in again");
      } else {
        toast.error(err.response?.data?.message || "Invalid password");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!newPassword) {
      toast.error("Please enter a new password");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword === currentPassword) {
      toast.error("New password must be different from current password");
      return;
    }

    setLoading(true);
    try {
      // Change password for authenticated user
      await api.post("/auth/change-password-authenticated", {
        currentPassword,
        newPassword,
      });

      toast.success("Password changed successfully!");
      onSuccess?.();
      handleClose();
    } catch (err: any) {
      if (err.response?.status === 401) {
        logout();
        toast.error("Session expired — please sign in again");
      } else {
        toast.error(err.response?.data?.message || "Failed to change password");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep("current");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Change Password
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Secure password update
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors touch-target">
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Security Notice */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                        Security Verification
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                        For your security, we need to verify your current
                        password before you can change it.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Step 1: Current Password */}
                {step === "current" && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter your current password"
                          className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && currentPassword) {
                              handleCurrentPasswordVerification();
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowCurrentPassword(!showCurrentPassword)
                          }
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 touch-target">
                          {showCurrentPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={handleCurrentPasswordVerification}
                      disabled={loading || !currentPassword}
                      className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-colors ${
                        loading || !currentPassword
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700"
                      }`}>
                      {loading ? "Verifying..." : "Continue"}
                    </button>
                  </motion.div>
                )}

                {/* Step 2: New Password */}
                {step === "new" && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password (min. 8 characters)"
                          className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 touch-target">
                          {showNewPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                      {/* Password Strength Indicator */}
                      {newPassword && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Password strength:
                            </span>
                            <span
                              className={`text-xs font-medium ${
                                passwordStrength.color === "red"
                                  ? "text-red-600 dark:text-red-400"
                                  : passwordStrength.color === "yellow"
                                  ? "text-yellow-600 dark:text-yellow-400"
                                  : passwordStrength.color === "blue"
                                  ? "text-blue-600 dark:text-blue-400"
                                  : "text-green-600 dark:text-green-400"
                              }`}>
                              {passwordStrength.label}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full transition-all ${
                                passwordStrength.color === "red"
                                  ? "bg-red-500"
                                  : passwordStrength.color === "yellow"
                                  ? "bg-yellow-500"
                                  : passwordStrength.color === "blue"
                                  ? "bg-blue-500"
                                  : "bg-green-500"
                              }`}
                              style={{
                                width: `${
                                  (passwordStrength.strength / 5) * 100
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                      {/* Password Requirements */}
                      <div className="mt-3 space-y-1">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          Requirements:
                        </p>
                        <div className="space-y-1">
                          {[
                            {
                              check: newPassword.length >= 8,
                              text: "At least 8 characters",
                            },
                            {
                              check: /[a-z]/.test(newPassword),
                              text: "One lowercase letter",
                            },
                            {
                              check: /[A-Z]/.test(newPassword),
                              text: "One uppercase letter",
                            },
                            {
                              check: /[0-9]/.test(newPassword),
                              text: "One number",
                            },
                            {
                              check: /[^a-zA-Z0-9]/.test(newPassword),
                              text: "One special character",
                            },
                          ].map((req, idx) => (
                            <div
                              key={idx}
                              className="flex items-center space-x-2 text-xs">
                              {req.check ? (
                                <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                              ) : (
                                <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 dark:border-gray-600 flex-shrink-0" />
                              )}
                              <span
                                className={
                                  req.check
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-gray-500 dark:text-gray-400"
                                }>
                                {req.text}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm your new password"
                          className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base"
                          onKeyDown={(e) => {
                            if (
                              e.key === "Enter" &&
                              newPassword &&
                              confirmPassword &&
                              newPassword === confirmPassword
                            ) {
                              handlePasswordChange();
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 touch-target">
                          {showConfirmPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                      {confirmPassword && newPassword !== confirmPassword && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                          Passwords do not match
                        </p>
                      )}
                      {confirmPassword &&
                        newPassword === confirmPassword &&
                        newPassword.length >= 8 && (
                          <p className="mt-1 text-xs text-green-600 dark:text-green-400 flex items-center space-x-1">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Passwords match</span>
                          </p>
                        )}
                    </div>

                    <div className="flex space-x-3">
                      <button
                        onClick={() => {
                          setStep("current");
                          setNewPassword("");
                          setConfirmPassword("");
                        }}
                        className="flex-1 py-3 px-4 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        Back
                      </button>
                      <button
                        onClick={handlePasswordChange}
                        disabled={
                          loading ||
                          !newPassword ||
                          !confirmPassword ||
                          newPassword !== confirmPassword ||
                          newPassword.length < 8 ||
                          newPassword === currentPassword
                        }
                        className={`flex-1 py-3 px-4 rounded-lg text-white font-medium transition-colors ${
                          loading ||
                          !newPassword ||
                          !confirmPassword ||
                          newPassword !== confirmPassword ||
                          newPassword.length < 8 ||
                          newPassword === currentPassword
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700"
                        }`}>
                        {loading ? "Updating..." : "Change Password"}
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Progress Steps */}
                <div className="flex items-center justify-center space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div
                    className={`w-2 h-2 rounded-full transition-all ${
                      step === "current" ? "bg-blue-600 w-8" : "bg-blue-400"
                    }`}
                  />
                  <div
                    className={`w-2 h-2 rounded-full transition-all ${
                      step === "new"
                        ? "bg-blue-600 w-8"
                        : step === "new"
                        ? "bg-blue-400"
                        : "bg-gray-300 dark:bg-gray-600"
                    }`}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
