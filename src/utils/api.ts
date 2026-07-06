import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import { getApiKeySync } from "./apiKeyStorage";
import { db } from "./dbService";
import { ENV_CONFIG } from "./env";
import { extractRateLimitInfo, getSecondsUntilReset } from "./rateLimit";

// Vite env: use VITE_API_BASE for flexible dev/prod bases.
// Default to production API to avoid accidental staging calls in production builds.
export const API_BASE =
  (import.meta.env.VITE_API_BASE as string) || "https://api.saby.ai/v1";

// API Endpoints from environment variables
export const API_ENDPOINTS = {
  AUTH: import.meta.env.VITE_API_AUTH_ENDPOINT || "/auth/login",
  REFRESH: import.meta.env.VITE_API_REFRESH_ENDPOINT || "/auth/refresh-tokens",
  LOGOUT: import.meta.env.VITE_API_LOGOUT_ENDPOINT || "/auth/logout",
  USER: import.meta.env.VITE_API_USER_ENDPOINT || "/user",
  NODE: import.meta.env.VITE_API_NODE_ENDPOINT || "/node",
  FORMS: import.meta.env.VITE_API_FORMS_ENDPOINT || "/project-forms",
  CHECK_API_KEY_STATUS: "/auth/check-api-key-status",
};

const LOCAL_REFRESH_KEY =
  import.meta.env.VITE_REFRESH_TOKEN_KEY || "saby:refresh_token";

// RefreshResponse type was removed because we accept multiple response shapes from the API

export function createAPI(
  getAccessToken?: () => string | null,
  setAccessToken?: (t: string | null) => void,
  getRefreshToken?: () => string | null,
  onAuthFailure?: () => void,
  onAuthSuccess?: (response: any) => void,
  onVerificationNeeded?: (email?: string) => void
): AxiosInstance {
  const api = axios.create({
    baseURL: API_BASE,
    headers: { "Content-Type": "application/json" },
    // Send cookies (HttpOnly access/refresh cookies) by default. Backend must allow credentials via CORS.
    withCredentials: true,
  });

  // Attach Authorization header from in-memory access token if present.
  // Also attach global API key conditionally based on login mode (for login requests).
  api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    try {
      if (!config.headers) {
        return config;
      }

      // Removed: API key attachment for login requests
      // All registered users can login without API key requirement
      // API keys are no longer part of authentication flow

      // Attach access token if available
      const token = getAccessToken ? getAccessToken() : null;
      if (token) {
        (config.headers as Record<string, string>)[
          "Authorization"
        ] = `Bearer ${token}`;
      }

      // For requests without token, add API key if available (for non-auth endpoints only)
      // Do NOT add API key to auth endpoints (login, refresh, logout)
      const isAuthEndpoint = config.url?.includes("/auth/") || false;
      if (!token && !isAuthEndpoint) {
        const globalApiKey = getApiKeySync();
        if (globalApiKey) {
          (config.headers as Record<string, string>)["X-API-Key"] =
            globalApiKey;
        }
      }

      // Track request start time for duration calculation
      (config as any).metadata = {
        startTime: Date.now(),
      };
    } catch (e) {
      // ignore
    }
    return config;
  });

  // We intentionally do NOT attach Authorization headers or read tokens from storage.
  // All tokens are managed by the browser (HttpOnly cookies) and by the backend.
  type CustomRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

  // Single-refresh queue to avoid concurrent refresh requests
  let isRefreshing = false;
  let failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: unknown) => void;
    config: CustomRequestConfig;
  }> = [];

  // Cooldown/backoff for 429 responses to avoid spamming the refresh endpoint
  let refreshCooldownUntil = 0; // timestamp ms until which we won't attempt refresh
  let refreshBackoffMs = 10000; // initial backoff 10s
  const REFRESH_BACKOFF_MAX = 2000000; // max 2000 seconds (~33 minutes)

  // Rate limit configuration (requests per minute)
  // Note: Actual rate limiting is enforced by the backend API server
  // This value is for reference and can be used for client-side throttling if needed
  const RATE_LIMIT_RPM = ENV_CONFIG.RATE_LIMIT_REQUESTS_PER_MINUTE; // Default: 2000 requests per minute

  const inCooldown = () => Date.now() < refreshCooldownUntil;

  // doRefresh is the single place that actually calls the refresh endpoint and applies backoff on 429
  const doRefresh = async () => {
    console.log("[🔍 TOKEN TRACK] Token refresh attempt started");

    if (inCooldown()) {
      const err: any = new Error("Refresh cooldown");
      err.status = 429;
      console.log(
        "[🔍 TOKEN TRACK] ❌ Token refresh blocked - cooldown active"
      );
      throw err;
    }
    try {
      // Backend requires refreshToken in the body. Check if we have one available.
      const refreshToken = getRefreshToken ? getRefreshToken() : null;
      // Temporary fallback: if we don't have an in-memory refresh token but a legacy localStorage key exists,
      // include it in the body. This helps during migration; we avoid writing to localStorage in new code paths.
      let legacy: string | null = null;
      try {
        if (typeof localStorage !== "undefined") {
          legacy = localStorage.getItem(LOCAL_REFRESH_KEY);
        }
      } catch (e) {
        // localStorage may be unavailable on some mobile browsers (private mode, etc.)
        if (import.meta.env.DEV) {
          console.debug(
            "[api] localStorage unavailable for refresh token fallback"
          );
        }
      }

      console.log("[🔍 TOKEN TRACK] Token refresh - checking tokens:", {
        refreshToken: {
          inMemory: refreshToken ? `${refreshToken.substring(0, 20)}...` : null,
          inMemoryExists: !!refreshToken,
        },
        legacy: {
          inLocalStorage: legacy ? `${legacy.substring(0, 20)}...` : null,
          inLocalStorageExists: !!legacy,
        },
        willUse: refreshToken ? "in-memory" : legacy ? "localStorage" : "none",
      });

      // If no refreshToken is available, don't attempt refresh - backend requires it
      if (!refreshToken && !legacy) {
        const err: any = new Error("No refresh token available");
        err.status = 401;
        console.log(
          "[🔍 TOKEN TRACK] ❌ Token refresh failed - no refresh token available"
        );
        throw err;
      }

      const body = refreshToken ? { refreshToken } : { refreshToken: legacy };
      console.log(
        "[🔍 TOKEN TRACK] Sending refresh request with token from:",
        refreshToken ? "memory" : "localStorage"
      );

      const resp = await axios.post(
        `${API_BASE}${API_ENDPOINTS.REFRESH}`,
        body,
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      );

      console.log("[🔍 TOKEN TRACK] ✅ Token refresh successful:", {
        status: resp.status,
        hasNewAccessToken: !!(
          resp.data?.access?.token ||
          resp.data?.access_token ||
          resp.data?.token
        ),
        hasNewRefreshToken: !!(
          resp.data?.refresh?.token ||
          resp.data?.refresh_token ||
          resp.data?.refreshToken
        ),
      });

      // reset backoff on success
      refreshBackoffMs = 10000;
      refreshCooldownUntil = 0;
      return resp;
    } catch (e: any) {
      const status = e?.response?.status ?? null;
      console.log("[🔍 TOKEN TRACK] ❌ Token refresh failed:", {
        status,
        message: e?.message,
        responseData: e?.response?.data,
      });

      if (status === 429) {
        // apply exponential backoff
        refreshCooldownUntil = Date.now() + refreshBackoffMs;
        refreshBackoffMs = Math.min(refreshBackoffMs * 2, REFRESH_BACKOFF_MAX);
        console.log("[🔍 TOKEN TRACK] Rate limited - applying backoff:", {
          backoffMs: refreshBackoffMs,
          cooldownUntil: new Date(refreshCooldownUntil).toISOString(),
        });
      }
      throw e;
    }
  };

  const processQueue = (error: unknown) => {
    failedQueue.forEach(({ resolve, reject }) => {
      if (error) return reject(error);
      resolve();
    });
    failedQueue = [];
  };

  // Helper function to check if error indicates verification needed
  const isVerificationNeeded = (error: AxiosError): boolean => {
    const errorData = error.response?.data as any;
    const errorMessage = (
      errorData?.message ||
      errorData?.error ||
      error.message ||
      ""
    ).toLowerCase();

    // Check for verification-related keywords
    const verificationKeywords = [
      "verify",
      "verification",
      "otp",
      "unverified",
      "not verified",
      "account not verified",
      "email not verified",
      "please verify",
      "verification required",
    ];

    const hasVerificationKeyword = verificationKeywords.some((keyword) =>
      errorMessage.includes(keyword)
    );

    // Check for specific error codes that indicate verification needed
    const verificationErrorCode =
      errorData?.code === "ACCOUNT_NOT_VERIFIED" ||
      errorData?.code === "VERIFICATION_REQUIRED" ||
      errorData?.errorCode === "ACCOUNT_NOT_VERIFIED";

    // Check if response indicates verification needed
    const requiresVerification =
      errorData?.requiresVerification === true ||
      errorData?.verificationRequired === true;

    return (
      hasVerificationKeyword || verificationErrorCode || requiresVerification
    );
  };

  // Removed: isApiKeyApprovalNeeded helper function
  // API keys are no longer part of authentication flow

  api.interceptors.response.use(
    async (res) => {
      // Log successful API call to database
      try {
        const config = res.config as any;
        const duration = config.metadata?.startTime
          ? Date.now() - config.metadata.startTime
          : undefined;

        await db.apiCalls.add({
          endpoint: res.config.url || "",
          method: (res.config.method || "GET").toUpperCase(),
          status: res.status,
          statusText: res.statusText,
          responseBody: res.data,
          timestamp: new Date(),
          duration: duration,
        });
      } catch (error) {
        // Silently fail logging - don't break API calls
        if (import.meta.env.DEV) {
          console.warn("[API] Failed to log API call:", error);
        }
      }

      // Extract and store rate limit info
      const rateLimitInfo = extractRateLimitInfo(res);
      if (rateLimitInfo) {
        // Store in a way that components can access
        (res as any).rateLimitInfo = rateLimitInfo;
      }

      return res;
    },
    async (err: AxiosError & { config?: CustomRequestConfig }) => {
      const originalConfig = err.config;
      if (!originalConfig) return Promise.reject(err);

      // Handle CORS errors gracefully - these are backend configuration issues
      // Check if this is a CORS error (no response, network error, or specific CORS message)
      const errorMessage = err.message?.toLowerCase() || "";
      const isCorsError =
        !err.response &&
        (errorMessage.includes("cors") ||
          errorMessage.includes("access-control") ||
          errorMessage.includes("preflight") ||
          errorMessage.includes("access-control-allow-origin") ||
          err.code === "ERR_NETWORK" ||
          err.code === "ERR_FAILED");

      if (isCorsError) {
        const endpoint = originalConfig.url || "";
        // Silently handle CORS errors for optional endpoints (like /storage/stats)
        // These might not be available or configured on the backend
        // NOTE: This is a backend CORS configuration issue. The backend needs to:
        // 1. Add the frontend origin (https://stg.saby.ai) to allowed CORS origins
        // 2. Include 'Access-Control-Allow-Origin' header in the response
        // 3. Handle preflight OPTIONS requests properly
        if (endpoint.includes("/storage/stats")) {
          if (import.meta.env.DEV) {
            console.debug(
              "[API] CORS error for /storage/stats - endpoint may not be configured on backend. " +
                "Backend needs to allow CORS from https://stg.saby.ai"
            );
          }
          // Return a rejected promise with a silent error that won't show toasts
          const corsError: any = new Error("CORS: Endpoint not available");
          corsError.isCorsError = true;
          corsError.silent = true; // Flag to prevent toast notifications
          return Promise.reject(corsError);
        }

        // For other CORS errors, log in dev but don't spam console
        if (import.meta.env.DEV) {
          console.warn(
            `[API] CORS error for ${endpoint}:`,
            err.message || "CORS policy blocked request"
          );
        }
      }

      // Log failed API call to database (skip for silent CORS errors)
      if (!isCorsError || !originalConfig.url?.includes("/storage/stats")) {
        try {
          const config = err.config as any;
          const duration = config?.metadata?.startTime
            ? Date.now() - config.metadata.startTime
            : undefined;

          await db.apiCalls.add({
            endpoint: err.config?.url || "",
            method: (err.config?.method || "GET").toUpperCase(),
            status: err.response?.status || 0,
            statusText: err.response?.statusText || "Network Error",
            error: err.message,
            timestamp: new Date(),
            duration: duration,
          });
        } catch (error) {
          // Silently fail logging - don't break error handling
          if (import.meta.env.DEV) {
            console.warn("[API] Failed to log API call error:", error);
          }
        }
      }

      // Handle 429 Rate Limit errors (before other error checks)
      if (err.response?.status === 429) {
        const rateLimitInfo = extractRateLimitInfo(err.response);
        const errorData = err.response?.data as any;

        // Create enhanced error with rate limit info
        const rateLimitError: any = new Error(
          errorData?.message ||
            errorData?.error?.message ||
            "Too many requests. Please try again later."
        );
        rateLimitError.status = 429;
        rateLimitError.rateLimitInfo = rateLimitInfo;
        rateLimitError.retryAfter = rateLimitInfo
          ? getSecondsUntilReset(rateLimitInfo)
          : undefined;
        rateLimitError.isRateLimitError = true;

        return Promise.reject(rateLimitError);
      }

      // Removed: API key approval error checking
      // API keys are no longer part of authentication flow

      // Check if 401 error indicates verification needed (before attempting refresh)
      if (err.response?.status === 401 && isVerificationNeeded(err)) {
        const errorData = err.response?.data as any;
        const email = errorData?.email || errorData?.user?.email || undefined;

        // Notify that verification is needed
        if (typeof onVerificationNeeded === "function") {
          try {
            onVerificationNeeded(email);
          } catch (e) {
            // ignore errors from callback
          }
        }

        // Reject with a specific error that can be caught by components
        const verificationError: any = new Error(
          errorData?.message || "Account verification required"
        );
        verificationError.isVerificationNeeded = true;
        verificationError.email = email;
        return Promise.reject(verificationError);
      }

      // On 401 attempt one refresh (cookie-based). If it fails, call onAuthFailure (logout) and reject.
      // EXCEPTION: Don't attempt refresh for logout requests - if logout fails, just ignore it
      const isLogoutRequest =
        originalConfig.url?.includes(API_ENDPOINTS.LOGOUT) || false;

      if (
        err.response?.status === 401 &&
        !originalConfig._retry &&
        !isLogoutRequest
      ) {
        console.log(
          "[🔍 TOKEN TRACK] 401 Unauthorized detected - checking for refresh token"
        );
        console.log("[🔍 TOKEN TRACK] Request that failed:", {
          url: originalConfig.url,
          method: originalConfig.method,
          endpoint: originalConfig.url?.includes("/auth/")
            ? "auth endpoint"
            : "protected endpoint",
        });

        if (isRefreshing) {
          console.log(
            "[🔍 TOKEN TRACK] Refresh already in progress - queuing request"
          );
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject, config: originalConfig });
          }).then(() => api.request(originalConfig));
        }

        originalConfig._retry = true;
        isRefreshing = true;

        try {
          // Check if refresh token exists before attempting refresh
          const refreshToken = getRefreshToken ? getRefreshToken() : null;
          let legacy: string | null = null;
          try {
            if (typeof localStorage !== "undefined") {
              legacy = localStorage.getItem(LOCAL_REFRESH_KEY);
            }
          } catch (e) {
            // localStorage unavailable
          }

          console.log("[🔍 TOKEN TRACK] 401 handler - refresh token check:", {
            refreshToken: {
              inMemory: refreshToken
                ? `${refreshToken.substring(0, 20)}...`
                : null,
              inMemoryExists: !!refreshToken,
            },
            legacy: {
              inLocalStorage: legacy ? `${legacy.substring(0, 20)}...` : null,
              inLocalStorageExists: !!legacy,
            },
            willAttemptRefresh: !!(refreshToken || legacy),
          });

          // If no refresh token, immediately call onAuthFailure (terminal state)
          if (!refreshToken && !legacy) {
            console.log(
              "[🔍 TOKEN TRACK] ❌ No refresh token available - triggering logout"
            );
            isRefreshing = false;
            processQueue(err);
            if (typeof onAuthFailure === "function") {
              try {
                onAuthFailure();
              } catch (e) {
                // ignore errors from callback
              }
            }
            return Promise.reject(err);
          }

          console.log(
            "[🔍 TOKEN TRACK] ✅ Refresh token found - attempting token refresh"
          );

          // Use the guarded doRefresh which applies cooldown/backoff on 429
          const resp = await doRefresh();

          // If the server returns a new access token in the response body, update in-memory token.
          try {
            const data = resp && resp.data ? (resp.data as any) : null;
            const newAccess =
              data?.access?.token ??
              data?.tokens?.access?.token ??
              data?.access_token ??
              data?.token ??
              null;
            const newRefresh =
              data?.refresh?.token ??
              data?.tokens?.refresh?.token ??
              data?.refresh_token ??
              data?.refreshToken ??
              null;

            console.log("[🔍 TOKEN TRACK] Token refresh response received:", {
              hasNewAccessToken: !!newAccess,
              hasNewRefreshToken: !!newRefresh,
              accessTokenPreview: newAccess
                ? `${newAccess.substring(0, 20)}...`
                : null,
              refreshTokenPreview: newRefresh
                ? `${newRefresh.substring(0, 20)}...`
                : null,
            });

            if (newAccess && typeof setAccessToken === "function") {
              setAccessToken(newAccess);
              console.log("[🔍 TOKEN TRACK] ✅ Updated access token in memory");
            }

            // Note: New refresh token will be handled by handleSuccessfulAuth callback
          } catch (e) {
            // ignore parsing errors
            console.log(
              "[🔍 TOKEN TRACK] ⚠️ Error parsing refresh response:",
              e
            );
          }

          processQueue(null);
          isRefreshing = false;
          console.log(
            "[🔍 TOKEN TRACK] ✅ Token refresh complete - retrying original request"
          );

          // Retry the original request once after refresh
          // Update Authorization header with new token
          const newToken = getAccessToken ? getAccessToken() : null;
          if (newToken && originalConfig.headers) {
            (originalConfig.headers as Record<string, string>)[
              "Authorization"
            ] = `Bearer ${newToken}`;
          }
          return api.request(originalConfig);
        } catch (refreshErr) {
          console.log(
            "[🔍 TOKEN TRACK] ❌ Token refresh failed in 401 handler:",
            {
              status: (refreshErr as any)?.response?.status,
              message: (refreshErr as any)?.message,
              willTriggerLogout: true,
            }
          );

          processQueue(refreshErr);
          isRefreshing = false;

          // Notify caller to clear session state (frontend should clear in-memory user state)
          try {
            if (typeof onAuthFailure === "function") {
              console.log(
                "[🔍 TOKEN TRACK] Calling onAuthFailure callback (will trigger logout)"
              );
              onAuthFailure();
            }
          } catch (e) {
            // ignore errors from callback
          }

          return Promise.reject(refreshErr);
        }
      }

      return Promise.reject(err);
    }
  );

  // Expose guarded refresh helper for callers (e.g., AuthContext startup restore) to avoid bypassing cooldown/backoff
  (api as any)._doRefresh = doRefresh;

  // Store onAuthSuccess callback for later updates
  (api as any)._onAuthSuccess = onAuthSuccess;
  (api as any)._setAuthSuccessCallback = (cb: (response: any) => void) => {
    (api as any)._onAuthSuccess = cb;
  };

  return api;
}

// DEV helper: call from browser console to check whether cookie-based refresh works.
/* Usage (in browser console):
   await window.__checkAuthCookie()
   -> logs a clear message about whether a cookie-based refresh succeeded or failed
*/
if (import.meta.env.DEV) {
  // attach a small helper to window for manual testing
  (window as any).__checkAuthCookie = async () => {
    try {
      console.debug(
        "[debug] checking cookie-based refresh at",
        `${API_BASE}${API_ENDPOINTS.REFRESH}`
      );
      // try cookie-based refresh (empty body, withCredentials true)
      const resp = await fetch(`${API_BASE}${API_ENDPOINTS.REFRESH}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });

      if (!resp.ok) {
        if (resp.status === 401) {
          console.warn(
            "[debug] cookie-refresh failed: 401 Unauthorized — cookie missing or invalid"
          );
        } else if (resp.status === 404) {
          console.warn("[debug] cookie-refresh endpoint not found (404)");
        } else {
          console.warn(
            "[debug] cookie-refresh returned",
            resp.status,
            await resp.text()
          );
        }
        return { ok: false, status: resp.status };
      }

      const data = await resp.json().catch(() => null);
      // If the server indicates a new access token (or success), report success
      const hasAccess = !!(
        data?.access ||
        data?.tokens?.access ||
        data?.access_token ||
        data?.token
      );
      if (hasAccess) {
        console.log(
          "[debug] cookie-refresh succeeded — cookies are working and server returned new tokens"
        );
      } else {
        console.log(
          "[debug] cookie-refresh succeeded (200) — server did not return token in body; server may be using cookies to rotate refresh token"
        );
      }
      return { ok: true, status: resp.status, data };
    } catch (err) {
      console.error("[debug] cookie-refresh request failed", err);
      return { ok: false, error: err };
    }
  };
}
