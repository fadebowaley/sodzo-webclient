import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Clock, X, RefreshCw, Key } from "lucide-react";
import { ApiKeyStatus } from "../../services/apiKeyStatusService";
import { useNavigate } from "react-router-dom";

interface ApiKeyStatusBannerProps {
  status: ApiKeyStatus;
  onDismiss?: () => void;
  onRefresh?: () => void;
}

export default function ApiKeyStatusBanner({
  status,
  onDismiss,
  onRefresh,
}: ApiKeyStatusBannerProps) {
  const navigate = useNavigate();
  const [isDismissed, setIsDismissed] = useState(false);

  // Determine banner type and styling
  const getBannerConfig = () => {
    if (!status.hasApiKey) {
      return {
        type: "error",
        icon: Key,
        bgColor: "bg-red-50 dark:bg-red-900/20",
        borderColor: "border-red-200 dark:border-red-800",
        iconColor: "text-red-600 dark:text-red-400",
        textColor: "text-red-800 dark:text-red-200",
        title: "API Key Not Found",
        actionLabel: "Create API Key",
        actionPath: "/admin",
      };
    }

    if (status.needsApproval) {
      return {
        type: "warning",
        icon: Clock,
        bgColor: "bg-amber-50 dark:bg-amber-900/20",
        borderColor: "border-amber-200 dark:border-amber-800",
        iconColor: "text-amber-600 dark:text-amber-400",
        textColor: "text-amber-800 dark:text-amber-200",
        title: "API Key Pending Approval",
        actionLabel: "View Status",
        actionPath: "/admin",
      };
    }

    if (status.needsRegeneration) {
      return {
        type: "error",
        icon: AlertTriangle,
        bgColor: "bg-red-50 dark:bg-red-900/20",
        borderColor: "border-red-200 dark:border-red-800",
        iconColor: "text-red-600 dark:text-red-400",
        textColor: "text-red-800 dark:text-red-200",
        title: "API Key Action Required",
        actionLabel: "Regenerate API Key",
        actionPath: "/admin",
      };
    }

    if (status.isExpired) {
      return {
        type: "error",
        icon: AlertTriangle,
        bgColor: "bg-red-50 dark:bg-red-900/20",
        borderColor: "border-red-200 dark:border-red-800",
        iconColor: "text-red-600 dark:text-red-400",
        textColor: "text-red-800 dark:text-red-200",
        title: "API Key Expired",
        actionLabel: "Regenerate API Key",
        actionPath: "/admin",
      };
    }

    if (status.daysUntilExpiry !== null && status.daysUntilExpiry <= 7) {
      return {
        type: "warning",
        icon: Clock,
        bgColor: "bg-amber-50 dark:bg-amber-900/20",
        borderColor: "border-amber-200 dark:border-amber-800",
        iconColor: "text-amber-600 dark:text-amber-400",
        textColor: "text-amber-800 dark:text-amber-200",
        title: "API Key Expiring Soon",
        actionLabel: "Renew API Key",
        actionPath: "/admin",
      };
    }

    return null;
  };

  const config = getBannerConfig();
  if (!config || isDismissed) return null;

  const Icon = config.icon;

  const handleAction = () => {
    navigate(config.actionPath);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className={`relative rounded-lg border ${config.borderColor} ${config.bgColor} p-4 shadow-sm`}>
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`flex-shrink-0 ${config.iconColor}`}>
            <Icon className="h-5 w-5" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className={`text-sm font-semibold ${config.textColor} mb-1`}>
              {config.title}
            </h3>
            <p className={`text-sm ${config.textColor} opacity-90`}>
              {status.message}
            </p>

            {/* Additional Info */}
            {status.daysUntilExpiry !== null && (
              <div className={`mt-2 text-xs ${config.textColor} opacity-75`}>
                {status.isExpired
                  ? `Expired ${Math.abs(status.daysUntilExpiry)} day${
                      Math.abs(status.daysUntilExpiry) !== 1 ? "s" : ""
                    } ago`
                  : `Expires in ${status.daysUntilExpiry} day${
                      status.daysUntilExpiry !== 1 ? "s" : ""
                    }`}
              </div>
            )}

            {/* Action Button */}
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={handleAction}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  config.type === "error"
                    ? "bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
                    : "bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600"
                }`}>
                {config.actionLabel}
              </button>
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${config.textColor} opacity-70 hover:opacity-100`}
                  title="Refresh status">
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Dismiss Button */}
          <button
            onClick={handleDismiss}
            className={`flex-shrink-0 ${config.textColor} opacity-50 hover:opacity-100 transition-opacity`}
            aria-label="Dismiss">
            <X className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
