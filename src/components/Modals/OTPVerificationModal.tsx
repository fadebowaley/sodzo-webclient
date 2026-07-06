import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";
import {
  X,
  Mail,
  RefreshCw,
  Lock,
  Eye,
  EyeOff,
  Phone,
  Send,
  ShieldCheck,
} from "lucide-react";

interface OTPVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email?: string;
  phoneNumber?: string;
  onVerified: () => void;
}

export default function OTPVerificationModal({
  isOpen,
  onClose,
  email,
  phoneNumber,
  onVerified,
}: OTPVerificationModalProps) {
  const { api, login } = useAuth();
  const [step, setStep] = useState<"request" | "otp" | "password">("request");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Helper function to mask phone number - show first 3 digits and last 2 digits
  const maskPhoneNumber = (phone?: string): string => {
    if (!phone) return "XXXXXXXXXX";

    // Remove all non-digit characters for processing
    const digitsOnly = phone.replace(/\D/g, "");

    if (digitsOnly.length <= 3) {
      // If 3 digits or less, show all digits
      return digitsOnly;
    }

    if (digitsOnly.length <= 5) {
      // If 5 digits or less, show first 3 and last 2 (may overlap)
      const first3 = digitsOnly.slice(0, 3);
      const last2 = digitsOnly.slice(-2);
      return first3 + "X".repeat(Math.max(0, digitsOnly.length - 5)) + last2;
    }

    // Show first 3 digits, mask the middle, show last 2 digits
    const first3 = digitsOnly.slice(0, 3);
    const last2 = digitsOnly.slice(-2);
    const maskedLength = Math.max(0, digitsOnly.length - 5); // Middle digits to mask

    return first3 + "X".repeat(maskedLength) + last2;
  };

  useEffect(() => {
    if (isOpen) {
      setStep("request");
      setOtpSent(false);
      setOtp(["", "", "", "", "", ""]);
      setNewPassword("");
      setConfirmPassword("");
      setShowPassword(false);
      setShowConfirmPassword(false);
      setCountdown(0);
    }
  }, [isOpen]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are entered
    if (newOtp.every((digit) => digit !== "") && newOtp.join("").length === 6) {
      handleVerify(newOtp.join(""));
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
      // Focus the next empty input or the last one
      const nextIndex = Math.min(pastedData.length, 5);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  const handleVerify = async (otpValue?: string) => {
    const codeToVerify = otpValue || otp.join("");

    if (!codeToVerify) {
      toast.error("Please enter the verification code");
      return;
    }

    if (!email) {
      toast.error("Email is required for verification");
      return;
    }

    if (codeToVerify.length !== 6) {
      toast.error("Please enter the complete 6-digit verification code");
      return;
    }

    setLoading(true);
    try {
      // Send OTP to backend with email (email is required by backend)
      await api.post("/auth/verify-otp", {
        otp: codeToVerify,
        email: email, // Email is required by backend
      });

      toast.success(
        "OTP verified successfully! Now set your password to complete registration."
      );
      // Move to password change step - all unverified users are first-timers and must set password
      setStep("password");
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        "Invalid verification code. Please try again.";
      toast.error(errorMessage);

      // Clear OTP on error
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
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

    if (!email) {
      toast.error("Email is required");
      return;
    }

    setLoading(true);
    try {
      // Update password for unverified user
      await api.post("/auth/change-password", {
        email: email,
        newPassword: newPassword,
        otp: otp.join(""), // Include OTP for verification
      });

      toast.success("Password updated successfully! Logging you in...");

      // Authenticate user with new password
      try {
        await login(email, newPassword);
        toast.success("Login successful!");
        onVerified();
        onClose();
      } catch (loginErr: any) {
        // If login fails, still consider password change successful
        // User can login manually
        const loginErrorMessage =
          loginErr.response?.data?.message ||
          loginErr.message ||
          "Password updated but login failed. Please try logging in manually.";
        toast.error(loginErrorMessage);
        onVerified();
        onClose();
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        "Failed to update password. Please try again.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOTP = async () => {
    if (!email) {
      toast.error("Email is required");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/resend-otp", {
        email: email,
      });
      toast.success("OTP code sent successfully!");
      setOtpSent(true);
      setStep("otp");
      setCountdown(60); // 60 second cooldown
      // Focus first input after a brief delay
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        "Failed to send OTP code. Please try again.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;

    setResending(true);
    try {
      await api.post("/auth/resend-otp", {
        email: email || "",
      });
      toast.success("Verification code resent!");
      setCountdown(60); // 60 second cooldown
    } catch (err: any) {
      toast.error(
        err.response?.data?.message ||
          "Failed to resend verification code. Please try again."
      );
    } finally {
      setResending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}>
        <motion.div
          className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}>
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Close">
            <X className="w-5 h-5" />
          </button>

          {/* Step Indicator */}
          <div className="flex items-center justify-center mb-6 gap-1">
            <div
              className={`flex items-center gap-1.5 ${
                step === "request"
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-400"
              }`}>
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                  step === "request"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/50"
                    : step === "otp" || step === "password"
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                }`}>
                {step === "request" ? "1" : "✓"}
              </div>
            </div>
            <div
              className={`h-0.5 transition-all ${
                step === "otp" || step === "password"
                  ? "w-12 bg-green-500"
                  : "w-8 bg-gray-300 dark:bg-gray-600"
              }`}
            />
            <div
              className={`flex items-center gap-1.5 ${
                step === "otp"
                  ? "text-blue-600 dark:text-blue-400"
                  : step === "password"
                  ? "text-green-600 dark:text-green-400"
                  : "text-gray-400"
              }`}>
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                  step === "otp"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/50"
                    : step === "password"
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                }`}>
                {step === "password" ? "✓" : "2"}
              </div>
            </div>
            <div
              className={`h-0.5 transition-all ${
                step === "password"
                  ? "w-12 bg-green-500"
                  : "w-8 bg-gray-300 dark:bg-gray-600"
              }`}
            />
            <div
              className={`flex items-center gap-1.5 ${
                step === "password"
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-400"
              }`}>
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                  step === "password"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/50"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                }`}>
                3
              </div>
            </div>
          </div>

          {/* Step 1: Request OTP */}
          {step === "request" && (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.5 }}
                  className="w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-blue-500/30">
                  <ShieldCheck className="w-10 h-10 text-white" />
                </motion.div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  Verify Your Account
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                  Welcome! As a first-time user, please click below to receive
                  an OTP code on your registered phone number
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-base font-semibold text-blue-700 dark:text-blue-300">
                    {maskPhoneNumber(phoneNumber)}
                  </span>
                </div>
              </div>

              {/* Request OTP Button */}
              <motion.button
                onClick={handleRequestOTP}
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30 mb-4 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Sending OTP...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Send the OTP Code</span>
                  </>
                )}
              </motion.button>
            </>
          )}

          {/* Step 2: OTP Verification */}
          {step === "otp" && (
            <>
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-6">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", duration: 0.6 }}
                  className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/30">
                  <Mail className="w-8 h-8 text-white" />
                </motion.div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Verify OTP
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Enter the 6-digit code sent to{" "}
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {maskPhoneNumber(phoneNumber)}
                  </span>
                </p>
              </motion.div>

              {/* OTP Input */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-6">
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
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={index === 0 ? handlePaste : undefined}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="w-14 h-16 text-center text-2xl font-bold border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-800 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all shadow-sm hover:shadow-md"
                    />
                  ))}
                </div>
              </motion.div>

              {/* Verify Button */}
              <motion.button
                onClick={() => handleVerify()}
                disabled={loading || otp.join("").length !== 6}
                whileHover={{ scale: otp.join("").length === 6 ? 1.02 : 1 }}
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
                    <span>Verify OTP</span>
                  </>
                )}
              </motion.button>

              {/* Resend OTP */}
              <div className="text-center">
                <button
                  onClick={handleResendOTP}
                  disabled={resending || countdown > 0}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2 mx-auto font-medium">
                  <RefreshCw
                    className={`w-4 h-4 ${resending ? "animate-spin" : ""}`}
                  />
                  {countdown > 0
                    ? `Resend code in ${countdown}s`
                    : resending
                    ? "Sending..."
                    : "Didn't receive code? Resend"}
                </button>
              </div>
            </>
          )}

          {/* Step 2: Password Change */}
          {step === "password" && (
            <>
              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Create Your Password
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  As a first-time user, please create a secure password to
                  complete your account setup
                </p>
              </div>

              {/* New Password Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 8 characters)"
                    className="w-full px-4 py-3 pr-10 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your new password"
                    className="w-full px-4 py-3 pr-10 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handlePasswordChange();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Update Password Button */}
              <button
                onClick={handlePasswordChange}
                disabled={
                  loading ||
                  !newPassword ||
                  !confirmPassword ||
                  newPassword !== confirmPassword ||
                  newPassword.length < 8
                }
                className="w-full py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mb-4">
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Updating Password...
                  </div>
                ) : (
                  "Update Password & Sign In"
                )}
              </button>

              {/* Back to OTP */}
              <div className="text-center">
                <button
                  onClick={() => {
                    setStep("otp");
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                  ← Back to OTP verification
                </button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
