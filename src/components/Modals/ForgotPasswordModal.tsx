import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Mail,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { API_BASE, API_ENDPOINTS } from "../../utils/api";
import axios from "axios";
import toast from "react-hot-toast";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ForgotPasswordModal({
  isOpen,
  onClose,
  onSuccess,
}: ForgotPasswordModalProps) {
  const [step, setStep] = useState<"email" | "otp" | "password">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

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

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep("email");
      setEmail("");
      setOtp(["", "", "", "", "", ""]);
      setNewPassword("");
      setConfirmPassword("");
      setShowPassword(false);
      setShowConfirmPassword(false);
      setCountdown(0);
    }
  }, [isOpen]);

  const handleRequestOTP = async () => {
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      // Use resend-otp endpoint with password-reset purpose for verified users
      await axios.post(`${API_BASE}/auth/resend-otp`, {
        email,
        purpose: "password-reset", // Allow verified users to receive OTP for password reset
      });
      setStep("otp");
      setCountdown(60);
      toast.success("Verification code sent to your email");
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Failed to send verification code"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newOtp.every((digit) => digit !== "") && newOtp.join("").length === 6) {
      handleVerifyOTP(newOtp.join(""));
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (/^\d{1,6}$/.test(pastedData)) {
      const newOtp = [...otp];
      for (let i = 0; i < 6; i++) {
        newOtp[i] = pastedData[i] || "";
      }
      setOtp(newOtp);
      const nextIndex = Math.min(pastedData.length, 5);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  const handleVerifyOTP = async (otpValue?: string) => {
    const codeToVerify = otpValue || otp.join("");

    if (!codeToVerify || codeToVerify.length !== 6) {
      toast.error("Please enter the complete 6-digit verification code");
      return;
    }

    setLoading(true);
    try {
      // Verify OTP using verify-otp endpoint
      await axios.post(`${API_BASE}/auth/verify-otp`, {
        email,
        otp: codeToVerify,
      });

      setStep("password");
      toast.success("Verification successful");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Invalid verification code");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
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

    setLoading(true);
    try {
      // Use change-password endpoint with OTP for password reset
      await axios.post(`${API_BASE}/auth/change-password`, {
        email,
        otp: otp.join(""),
        newPassword,
      });

      toast.success("Password reset successfully! You can now login.");
      onSuccess?.();
      handleClose();
    } catch (err: any) {
      toast.error(
        err.response?.data?.message ||
          "Failed to reset password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const resendOTP = async () => {
    if (countdown > 0) return;

    setResending(true);
    try {
      await axios.post(`${API_BASE}/auth/resend-otp`, {
        email,
        purpose: "password-reset", // Allow verified users to receive OTP for password reset
      });
      setCountdown(60);
      toast.success("Verification code resent!");
    } catch (err: any) {
      toast.error("Failed to resend code. Please try again.");
    } finally {
      setResending(false);
    }
  };

  const handleClose = () => {
    setStep("email");
    setEmail("");
    setOtp(["", "", "", "", "", ""]);
    setNewPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setCountdown(0);
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
                      Reset Password
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {step === "email"
                        ? "Enter your email address"
                        : step === "otp"
                        ? "Verify your identity"
                        : "Set new password"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Step 1: Email */}
                {step === "email" && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base"
                        autoFocus
                      />
                    </div>
                    <button
                      onClick={handleRequestOTP}
                      disabled={loading || !email}
                      className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-colors ${
                        loading || !email
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700"
                      }`}>
                      {loading ? "Sending..." : "Send Verification Code"}
                    </button>
                  </motion.div>
                )}

                {/* Step 2: OTP */}
                {step === "otp" && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4">
                    <div className="text-center mb-4">
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", duration: 0.6 }}
                        className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/30">
                        <Mail className="w-8 h-8 text-white" />
                      </motion.div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                        Check Your Email
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Enter the 6-digit code sent to{" "}
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          {email}
                        </span>
                      </p>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 text-center">
                        Enter 6-digit verification code
                      </label>
                      <div className="flex gap-3 justify-center">
                        {otp.map((digit, index) => (
                          <motion.input
                            key={index}
                            ref={(el) => (inputRefs.current[index] = el)}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) =>
                              handleOtpChange(index, e.target.value)
                            }
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            onPaste={index === 0 ? handlePaste : undefined}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className="w-14 h-16 text-center text-2xl font-bold border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-800 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all shadow-sm hover:shadow-md"
                          />
                        ))}
                      </div>
                    </div>

                    <motion.button
                      onClick={() => handleVerifyOTP()}
                      disabled={loading || otp.join("").length !== 6}
                      whileHover={{
                        scale: otp.join("").length === 6 ? 1.02 : 1,
                      }}
                      whileTap={{ scale: otp.join("").length === 6 ? 0.98 : 1 }}
                      className="w-full py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mb-4 shadow-lg shadow-green-500/30 flex items-center justify-center gap-2">
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-5 h-5" />
                          <span>Verify Code</span>
                        </>
                      )}
                    </motion.button>

                    <div className="text-center">
                      <button
                        onClick={resendOTP}
                        disabled={resending || countdown > 0}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2 mx-auto font-medium">
                        <RefreshCw
                          className={`w-4 h-4 ${
                            resending ? "animate-spin" : ""
                          }`}
                        />
                        {countdown > 0
                          ? `Resend code in ${countdown}s`
                          : resending
                          ? "Sending..."
                          : "Didn't receive code? Resend"}
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: New Password */}
                {step === "password" && (
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
                          type={showPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password"
                          className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                          {showPassword ? (
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
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              Password strength
                            </span>
                            <span
                              className={`text-xs font-medium ${
                                passwordStrength.color === "red"
                                  ? "text-red-600"
                                  : passwordStrength.color === "yellow"
                                  ? "text-yellow-600"
                                  : passwordStrength.color === "blue"
                                  ? "text-blue-600"
                                  : "text-green-600"
                              }`}>
                              {passwordStrength.label}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
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
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Requirements:
                        </p>
                        <div className="text-xs space-y-1">
                          <div
                            className={`flex items-center gap-2 ${
                              newPassword.length >= 8
                                ? "text-green-600 dark:text-green-400"
                                : "text-gray-500"
                            }`}>
                            <span>{newPassword.length >= 8 ? "✓" : "○"}</span>
                            <span>At least 8 characters</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm new password"
                          className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                          {showConfirmPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                      {confirmPassword && newPassword !== confirmPassword && (
                        <p className="text-xs text-red-600 mt-1">
                          Passwords do not match
                        </p>
                      )}
                    </div>

                    <button
                      onClick={handleResetPassword}
                      disabled={
                        loading ||
                        !newPassword ||
                        !confirmPassword ||
                        newPassword !== confirmPassword ||
                        newPassword.length < 8
                      }
                      className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-colors ${
                        loading ||
                        !newPassword ||
                        !confirmPassword ||
                        newPassword !== confirmPassword ||
                        newPassword.length < 8
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700"
                      }`}>
                      {loading ? "Resetting Password..." : "Reset Password"}
                    </button>
                  </motion.div>
                )}

                {/* Progress Steps */}
                <div className="flex items-center justify-center space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                  {["email", "otp", "password"].map((s, index) => (
                    <div
                      key={s}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        step === s
                          ? "bg-blue-600 w-8"
                          : ["email", "otp", "password"].indexOf(step) > index
                          ? "bg-blue-400"
                          : "bg-gray-300 dark:bg-gray-600"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
