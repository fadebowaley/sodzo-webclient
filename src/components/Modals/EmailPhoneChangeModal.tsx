import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Mail,
  Phone,
  Shield,
  Eye,
  EyeOff,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";

interface EmailPhoneChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "email" | "phone";
  currentValue: string;
  onSuccess: () => void;
}

export default function EmailPhoneChangeModal({
  isOpen,
  onClose,
  type,
  currentValue,
  onSuccess,
}: EmailPhoneChangeModalProps) {
  const queryClient = useQueryClient();
  const { api, logout, user } = useAuth();
  const [step, setStep] = useState<"password" | "otp" | "newValue">("password");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [newValue, setNewValue] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Get user email from auth context
  const userEmail = user?.email || "";

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

  const handlePasswordVerification = async () => {
    if (!password) {
      toast.error("Please enter your password");
      return;
    }

    setLoading(true);
    try {
      // Verify password by attempting to refresh token or verify credentials
      // For now, we'll send a request to verify password
      // This endpoint should verify the password before proceeding
      await api.post("/auth/verify-password", { password });

      // If password is verified, request OTP
      await requestOTP();
      setStep("otp");
      setOtpSent(true);
      setCountdown(60); // 60 second cooldown
      toast.success(
        `Verification code sent to your ${type === "email" ? "email" : "phone"}`
      );
      // Focus first input after a brief delay
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
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

  const requestOTP = async () => {
    try {
      // Request OTP to be sent to current email/phone
      await api.post(`/auth/request-${type}-change-otp`, {
        currentValue,
      });
    } catch (err: any) {
      console.error("OTP request failed:", err);
      // Continue anyway - backend should handle this
    }
  };

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
      handleOTPVerification(newOtp.join(""));
    }
  };

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

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

  const handleOTPVerification = async (otpValue?: string) => {
    const codeToVerify = otpValue || otp.join("");

    if (!codeToVerify || codeToVerify.length !== 6) {
      toast.error("Please enter the complete 6-digit verification code");
      return;
    }

    if (!userEmail) {
      toast.error("User email not found. Please try logging in again.");
      return;
    }

    setLoading(true);
    try {
      // Verify OTP - backend requires email, not type
      await api.post("/auth/verify-otp", {
        email: userEmail, // Backend requires email to look up user
        otp: codeToVerify,
      });

      setStep("newValue");
      toast.success("Verification successful");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Invalid verification code");
      // Clear OTP on error
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitChange = async () => {
    if (!newValue) {
      toast.error(
        `Please enter your new ${
          type === "email" ? "email address" : "phone number"
        }`
      );
      return;
    }

    // Validate format
    if (type === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newValue)) {
        toast.error("Please enter a valid email address");
        return;
      }
    } else {
      // Basic phone validation
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      if (!phoneRegex.test(newValue) || newValue.length < 10) {
        toast.error("Please enter a valid phone number");
        return;
      }
    }

    setLoading(true);
    try {
      // Update email/phone - OTP already verified in previous step
      const endpoint =
        type === "email" ? "/users/change-email" : "/users/change-phone";
      await api.patch(endpoint, {
        [type === "email" ? "email" : "phone"]: newValue,
        // OTP is already verified in handleOTPVerification step, no need to send it again
      });

      // Invalidate React Query cache to ensure fresh data on next fetch
      queryClient.invalidateQueries({ queryKey: ["userProfile", user?.id] });

      toast.success(
        `${type === "email" ? "Email" : "Phone number"} updated successfully!`
      );
      onSuccess();
      handleClose();
    } catch (err: any) {
      if (err.response?.status === 401) {
        logout();
        toast.error("Session expired — please sign in again");
      } else {
        toast.error(
          err.response?.data?.message ||
            `Failed to update ${type === "email" ? "email" : "phone number"}`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep("password");
    setPassword("");
    setOtp(["", "", "", "", "", ""]);
    setNewValue("");
    setShowPassword(false);
    setOtpSent(false);
    setLoading(false);
    setResending(false);
    setCountdown(0);
    onClose();
  };

  const resendOTP = async () => {
    if (countdown > 0) return;

    setResending(true);
    try {
      await requestOTP();
      setCountdown(60); // 60 second cooldown
      toast.success("Verification code resent!");
    } catch (err: any) {
      toast.error("Failed to resend code. Please try again.");
    } finally {
      setResending(false);
    }
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
                    {type === "email" ? (
                      <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Change {type === "email" ? "Email" : "Phone Number"}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Secure verification required
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
                        For your security, we need to verify your identity
                        before changing your{" "}
                        {type === "email" ? "email" : "phone number"}. You'll
                        need your password and a verification code.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Step 1: Password Verification */}
                {step === "password" && (
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
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter your password"
                          className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 touch-target">
                          {showPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={handlePasswordVerification}
                      disabled={loading || !password}
                      className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-colors ${
                        loading || !password
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700"
                      }`}>
                      {loading ? "Verifying..." : "Continue"}
                    </button>
                  </motion.div>
                )}

                {/* Step 2: OTP Verification */}
                {step === "otp" && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4">
                    {/* Header */}
                    <div className="text-center mb-4">
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", duration: 0.6 }}
                        className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/30">
                        {type === "email" ? (
                          <Mail className="w-8 h-8 text-white" />
                        ) : (
                          <Phone className="w-8 h-8 text-white" />
                        )}
                      </motion.div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                        Verify OTP
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Enter the 6-digit code sent to{" "}
                        {type === "email" ? (
                          <span className="font-semibold text-blue-600 dark:text-blue-400">
                            {currentValue}
                          </span>
                        ) : (
                          <span className="font-semibold text-blue-600 dark:text-blue-400">
                            {maskPhoneNumber(currentValue)}
                          </span>
                        )}
                      </p>
                    </div>

                    {/* OTP Input */}
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

                    {/* Verify Button */}
                    <motion.button
                      onClick={() => handleOTPVerification()}
                      disabled={loading || otp.join("").length !== 6}
                      whileHover={{
                        scale: otp.join("").length === 6 ? 1.02 : 1,
                      }}
                      whileTap={{
                        scale: otp.join("").length === 6 ? 0.98 : 1,
                      }}
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

                {/* Step 3: New Value */}
                {step === "newValue" && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        New{" "}
                        {type === "email" ? "Email Address" : "Phone Number"}
                      </label>
                      <input
                        type={type === "email" ? "email" : "tel"}
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                        placeholder={
                          type === "email"
                            ? "newemail@example.com"
                            : "+1 (555) 123-4567"
                        }
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base"
                        autoFocus
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Current {type}:{" "}
                        {type === "phone"
                          ? maskPhoneNumber(currentValue)
                          : currentValue}
                      </p>
                    </div>
                    <button
                      onClick={handleSubmitChange}
                      disabled={loading || !newValue}
                      className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-colors ${
                        loading || !newValue
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700"
                      }`}>
                      {loading
                        ? "Updating..."
                        : `Update ${type === "email" ? "Email" : "Phone"}`}
                    </button>
                  </motion.div>
                )}

                {/* Progress Steps */}
                <div className="flex items-center justify-center space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                  {["password", "otp", "newValue"].map((s, index) => (
                    <div
                      key={s}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        step === s
                          ? "bg-blue-600 w-8"
                          : ["password", "otp", "newValue"].indexOf(step) >
                            index
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
