import { useState, useEffect, useCallback } from "react";
import {
  checkApiKeyStatus,
  ApiKeyStatus,
} from "../services/apiKeyStatusService";
import { useAuth } from "../contexts/AuthContext";

const POLL_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

export const useApiKeyStatus = () => {
  const { isAuthenticated, api } = useAuth();
  const [status, setStatus] = useState<ApiKeyStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!isAuthenticated || !api) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await checkApiKeyStatus(api);
      setStatus(result);
      setLastChecked(new Date());
    } catch (err) {
      const error =
        err instanceof Error
          ? err
          : new Error("Failed to check API key status");
      setError(error);
      console.error("[useApiKeyStatus] Error:", error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, api]);

  // Initial fetch
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Poll every 6 hours
  useEffect(() => {
    if (!isAuthenticated) return;

    const intervalId = setInterval(() => {
      fetchStatus();
    }, POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [isAuthenticated, fetchStatus]);

  // Check if banner should be shown
  const shouldShowBanner = useCallback(() => {
    if (!status) return false;

    // Show banner if:
    // 1. No API key found
    // 2. Needs approval
    // 3. Needs regeneration (rejected, inactive, or expired)
    // 4. Expiring soon (within 7 days)
    return (
      !status.hasApiKey ||
      status.needsApproval ||
      status.needsRegeneration ||
      (status.daysUntilExpiry !== null &&
        status.daysUntilExpiry <= 7 &&
        !status.isExpired)
    );
  }, [status]);

  return {
    status,
    loading,
    error,
    lastChecked,
    shouldShowBanner: shouldShowBanner(),
    refetch: fetchStatus,
  };
};
