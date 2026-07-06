import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useRef,
  useEffect,
} from "react";
import axios from "axios";
import { createAPI, API_ENDPOINTS } from "../utils/api";
import type { AxiosInstance } from "axios";
import { TokenManager } from "../utils/tokenManager";
import { extractExpirationFromResponse } from "../utils/tokenUtils";
import { SessionSync } from "../utils/sessionSync";
import OTPVerificationModal from "../components/Modals/OTPVerificationModal";
import { getSecondsUntilReset } from "../utils/rateLimit";
import { detectMobileLoginIssues } from "../utils/mobileUtils";
import toast from "react-hot-toast";

// Auth State Machine - Explicit states to prevent zombie sessions
export type AuthState =
  | "ANONYMOUS" // No user, no tokens
  | "AUTHENTICATED" // User and valid tokens
  | "REFRESHING" // Token refresh in progress
  | "SESSION_EXPIRED" // Terminal state - session expired
  | "LOGGING_OUT"; // Logout in progress

// User model - supports both simple auth response and full user profile
interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  avatar?: string; // Alternative field name
  metadata?: Record<string, unknown>;
  // Extended user fields from UserContext
  userId?: string;
  tenantId?: string;
  haloId?: string;
  firstname?: string;
  lastname?: string;
  roles?: string[];
  isOwner?: boolean;
  isSuper?: boolean;
  isAgreed?: boolean;
  status?: boolean;
  createdBy?: string | null;
  phoneNumber?: string;
  isPhoneVerified?: boolean;
  isEmailVerified?: boolean;
  otp?: string | null;
  otpExpires?: string | null;
  otpVerified?: boolean;
  deletedAt?: string | null;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null; // access token in memory
  authState: AuthState; // Explicit auth state
  isAuthenticated: boolean; // Derived from authState
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  forceLogout: (reason?: string) => void; // Terminal logout with cache clearing and redirect
  api: AxiosInstance;
  showVerificationModal: boolean;
  verificationEmail?: string;
  verificationPhoneNumber?: string;
  setShowVerificationModal: (show: boolean) => void;
  getAccessToken?: () => string | null; // For debugging/tracking
  getRefreshToken?: () => string | null; // For debugging/tracking
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Initialize user from localStorage if available (for persistence across refreshes)
  const [user, setUserState] = useState<User | null>(() => {
    try {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("auth:user");
        if (stored) {
          return JSON.parse(stored);
        }
      }
    } catch (e) {
      console.warn("[AuthContext] Failed to parse stored user:", e);
    }
    return null;
  });

  const [token, setTokenState] = useState<string | null>(null); // access token stays in memory only
  const [authState, setAuthState] = useState<AuthState>(() => {
    // Initialize auth state based on user and token
    const hasUser = user !== null;
    const hasToken = token !== null;
    if (hasUser && hasToken) {
      return "AUTHENTICATED";
    }
    return "ANONYMOUS";
  });
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState<
    string | undefined
  >(undefined);
  const [verificationPhoneNumber, setVerificationPhoneNumber] = useState<
    string | undefined
  >(undefined);
  // Keep a ref for the access token so createAPI's request interceptor can read a stable reference
  const tokenRef = useRef<string | null>(null);
  // Refresh tokens are persisted to localStorage for persistence across page refreshes.
  // Access tokens stay in memory only (not persisted) for security.
  // We keep an in-memory `user` and optionally the access token if server returns it in responses.
  // Refresh tokens are stored in both memory (for fast access) and localStorage (for persistence).

  const setTokenStateSafe = useCallback((t: string | null) => {
    tokenRef.current = t;
    setTokenState(t);
  }, []);

  // Update auth state based on user and token
  useEffect(() => {
    if (authState === "LOGGING_OUT" || authState === "SESSION_EXPIRED") {
      return; // Don't change state if already in terminal state
    }
    if (user && token) {
      setAuthState("AUTHENTICATED");
    } else if (user && !token) {
      // User exists but no token - could be refreshing
      if (authState !== "REFRESHING") {
        setAuthState("ANONYMOUS"); // No valid auth
      }
    } else {
      setAuthState("ANONYMOUS");
    }
  }, [user, token, authState]);

  // Wrapper for setUser that also persists to localStorage
  const setUser = useCallback((newUser: User | null) => {
    setUserState(newUser);
    try {
      if (typeof window !== "undefined") {
        if (newUser) {
          localStorage.setItem("auth:user", JSON.stringify(newUser));
        } else {
          localStorage.removeItem("auth:user");
        }
      }
    } catch (e) {
      console.warn("[AuthContext] Failed to persist user to localStorage:", e);
    }
  }, []);

  // create stable api instance and keep as ref. Provide get/set access token callbacks and
  // an onAuthFailure callback that the API layer will call if a refresh attempt fails.
  const apiRef = useRef<AxiosInstance | null>(null);
  // Stable getter that reads the ref value (not a render-bound closure)
  const getAccessToken = useCallback(() => tokenRef.current, []);
  const setAccessToken = useCallback(
    (t: string | null) => setTokenStateSafe(t),
    [setTokenStateSafe]
  );
  // Keep refresh token in memory for fast access, also persisted to localStorage for page refresh persistence
  // Initialize from localStorage on mount to restore token after page refresh
  const refreshTokenRef = useRef<string | null>(null);

  // Restore refresh token from localStorage on mount
  useEffect(() => {
    console.log(
      "[🔍 TOKEN TRACK] App initialization - checking refresh token state"
    );
    const accessTokenBefore = getAccessToken();
    const refreshTokenBefore = refreshTokenRef.current;
    const storedRefreshToken = (() => {
      try {
        if (typeof window !== "undefined") {
          return localStorage.getItem("saby:refresh_token");
        }
      } catch (e) {
        return null;
      }
      return null;
    })();

    console.log("[🔍 TOKEN TRACK] App initialization state:", {
      accessToken: {
        inMemory: accessTokenBefore
          ? `${accessTokenBefore.substring(0, 20)}...`
          : null,
        exists: !!accessTokenBefore,
      },
      refreshToken: {
        inMemory: refreshTokenBefore
          ? `${refreshTokenBefore.substring(0, 20)}...`
          : null,
        inMemoryExists: !!refreshTokenBefore,
        inLocalStorage: storedRefreshToken
          ? `${storedRefreshToken.substring(0, 20)}...`
          : null,
        inLocalStorageExists: !!storedRefreshToken,
      },
    });

    if (refreshTokenRef.current === null) {
      try {
        if (typeof window !== "undefined") {
          const stored = localStorage.getItem("saby:refresh_token");
          if (stored) {
            refreshTokenRef.current = stored;
            console.log(
              "[🔍 TOKEN TRACK] ✅ Restored refresh token from localStorage to memory"
            );
          } else {
            console.log(
              "[🔍 TOKEN TRACK] ⚠️ No refresh token found in localStorage"
            );
          }
        }
      } catch (e) {
        // localStorage may be unavailable (private mode, etc.)
        if (import.meta.env.DEV) {
          console.debug(
            "[AuthContext] localStorage unavailable during refresh token initialization"
          );
        }
        console.log("[🔍 TOKEN TRACK] ❌ Failed to access localStorage:", e);
      }
    } else {
      console.log(
        "[🔍 TOKEN TRACK] ✅ Refresh token already in memory, skipping restore"
      );
    }

    const accessTokenAfter = getAccessToken();
    const refreshTokenAfter = refreshTokenRef.current;
    console.log("[🔍 TOKEN TRACK] App initialization complete:", {
      accessToken: {
        exists: !!accessTokenAfter,
        value: accessTokenAfter
          ? `${accessTokenAfter.substring(0, 20)}...`
          : null,
      },
      refreshToken: {
        exists: !!refreshTokenAfter,
        value: refreshTokenAfter
          ? `${refreshTokenAfter.substring(0, 20)}...`
          : null,
      },
    });
  }, []);
  const getRefreshToken = useCallback(() => refreshTokenRef.current, []);

  // Token manager for proactive refresh scheduling
  const tokenManagerRef = useRef(new TokenManager());

  // Session sync for cross-tab communication
  const sessionSyncRef = useRef(new SessionSync());

  /**
   * Handle successful authentication (login or refresh)
   * Schedules proactive refresh and syncs across tabs
   */
  const handleSuccessfulAuth = useCallback(
    (response: any) => {
      const data = response?.data || response;
      const userResp = data?.user ?? null;
      const accessToken =
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

      // Update state (setUser handles localStorage persistence)
      console.log(
        "[🔍 TOKEN TRACK] handleSuccessfulAuth called - processing auth response"
      );
      console.log("[🔍 TOKEN TRACK] Auth response data:", {
        hasUser: !!userResp,
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!newRefresh,
        accessTokenPreview: accessToken
          ? `${accessToken.substring(0, 20)}...`
          : null,
        refreshTokenPreview: newRefresh
          ? `${newRefresh.substring(0, 20)}...`
          : null,
      });

      const accessTokenBefore = getAccessToken();
      const refreshTokenBefore = refreshTokenRef.current;
      const refreshTokenInStorageBefore = (() => {
        try {
          return typeof window !== "undefined"
            ? localStorage.getItem("saby:refresh_token")
            : null;
        } catch {
          return null;
        }
      })();

      if (userResp) {
        // Ensure user has 'id' field (normalize _id to id if needed)
        const normalizedUser = {
          ...userResp,
          id: userResp.id || (userResp as any)._id || userResp.userId || null,
        };
        setUser(normalizedUser);
        console.log("[🔍 TOKEN TRACK] User set:", {
          hasId: !!normalizedUser.id,
          id: normalizedUser.id,
          email: normalizedUser.email,
        });
      }
      if (accessToken) setTokenStateSafe(accessToken);
      if (newRefresh) {
        refreshTokenRef.current = newRefresh;
        // Persist refresh token to localStorage for persistence across page refreshes
        try {
          if (typeof window !== "undefined") {
            localStorage.setItem("saby:refresh_token", newRefresh);
            console.log(
              "[🔍 TOKEN TRACK] ✅ Refresh token saved to localStorage"
            );
          }
        } catch (e) {
          // localStorage may be unavailable (private mode, quota exceeded, etc.)
          if (import.meta.env.DEV) {
            console.warn(
              "[AuthContext] Failed to persist refresh token to localStorage:",
              e
            );
          }
          console.log(
            "[🔍 TOKEN TRACK] ❌ Failed to save refresh token to localStorage:",
            e
          );
        }
      }

      const accessTokenAfter = getAccessToken();
      const refreshTokenAfter = refreshTokenRef.current;
      const refreshTokenInStorageAfter = (() => {
        try {
          return typeof window !== "undefined"
            ? localStorage.getItem("saby:refresh_token")
            : null;
        } catch {
          return null;
        }
      })();

      console.log(
        "[🔍 TOKEN TRACK] handleSuccessfulAuth complete - token state:",
        {
          accessToken: {
            before: accessTokenBefore
              ? `${accessTokenBefore.substring(0, 20)}...`
              : null,
            after: accessTokenAfter
              ? `${accessTokenAfter.substring(0, 20)}...`
              : null,
            changed: accessTokenBefore !== accessTokenAfter,
          },
          refreshToken: {
            inMemory: {
              before: refreshTokenBefore
                ? `${refreshTokenBefore.substring(0, 20)}...`
                : null,
              after: refreshTokenAfter
                ? `${refreshTokenAfter.substring(0, 20)}...`
                : null,
              changed: refreshTokenBefore !== refreshTokenAfter,
            },
            inLocalStorage: {
              before: refreshTokenInStorageBefore
                ? `${refreshTokenInStorageBefore.substring(0, 20)}...`
                : null,
              after: refreshTokenInStorageAfter
                ? `${refreshTokenInStorageAfter.substring(0, 20)}...`
                : null,
              changed:
                refreshTokenInStorageBefore !== refreshTokenInStorageAfter,
            },
          },
        }
      );

      // Update auth state to AUTHENTICATED after successful auth
      setAuthState("AUTHENTICATED");

      // Extract expiration and schedule proactive refresh
      const expiresIn = extractExpirationFromResponse(response);
      if (expiresIn) {
        tokenManagerRef.current.scheduleProactiveRefresh(
          expiresIn * 1000, // Convert to milliseconds
          async () => {
            // Proactive refresh callback
            try {
              const doRefresh = (apiRef.current as any)?._doRefresh as
                | (() => Promise<any>)
                | undefined;
              if (doRefresh) {
                const refreshResp = await doRefresh();
                handleSuccessfulAuth(refreshResp);
              }
            } catch (error) {
              console.error("[AuthContext] Proactive refresh failed:", error);
              // Will fall back to reactive refresh on next 401
            }
          }
        );
      }

      // Broadcast to other tabs
      if (accessToken && expiresIn) {
        sessionSyncRef.current.broadcastRefresh({
          accessToken,
          expiresIn,
          refreshToken: newRefresh || undefined,
        });
      }
    },
    [setTokenStateSafe]
  );

  // Handle verification needed callback
  const handleVerificationNeeded = useCallback((email?: string) => {
    setVerificationEmail(email);
    setShowVerificationModal(true);
  }, []);

  // Handle verification completion
  const handleVerificationComplete = useCallback(async () => {
    setShowVerificationModal(false);
    // After verification, try to refresh the session or reload user data
    try {
      const doRefresh = (apiRef.current as any)?._doRefresh as
        | (() => Promise<any>)
        | undefined;
      if (doRefresh) {
        const resp = await doRefresh();
        handleSuccessfulAuth(resp);
      }
    } catch (e) {
      // If refresh fails, user may need to login again
      if (import.meta.env.DEV) {
        console.debug(
          "[AuthContext] Verification complete but refresh failed:",
          e
        );
      }
    }
  }, [handleSuccessfulAuth]);

  /**
   * forceLogout - Terminal logout function that clears all state, cache, and redirects
   * This is the ONLY function that should be called for terminal auth failures
   * @param reason - Optional reason for logout (shows toast error if provided)
   * @param silent - If true, suppresses toast errors (for user-initiated logouts)
   */
  const forceLogout = useCallback(
    (reason?: string, silent: boolean = false) => {
      // 1. IMMEDIATE state transition to LOGGING_OUT (prevents race conditions)
      setAuthState("LOGGING_OUT");

      // 2. Get refreshToken (in-memory + localStorage fallback)
      let refreshToken = refreshTokenRef.current;

      // Fallback: check localStorage for refresh token (same as refresh logic)
      if (!refreshToken) {
        try {
          if (typeof localStorage !== "undefined") {
            refreshToken = localStorage.getItem("saby:refresh_token");
          }
        } catch (e) {
          // localStorage may be unavailable
          if (import.meta.env.DEV) {
            console.debug(
              "[AuthContext] localStorage unavailable for refresh token"
            );
          }
        }
      }

      // 3. Backend logout (OPTIONAL - only if refreshToken exists)
      // Fire-and-forget: does NOT block logout completion, errors are ignored
      // Logout errors (401, 400, etc.) are expected if token is expired/invalid - just ignore them
      if (refreshToken) {
        // Silent logout - no verbose logging in production
        if (import.meta.env.DEV) {
          console.debug("[AuthContext] Preparing logout API call");
        }

        apiRef.current
          ?.post(
            API_ENDPOINTS.LOGOUT,
            { refreshToken },
            { withCredentials: true }
          )
          .then((response) => {
            // Silently handle success - no console logs or user notifications
            // Logout API call succeeded (status 204 is expected)
            if (import.meta.env.DEV) {
              console.debug(
                "[AuthContext] Logout API call successful:",
                response.status
              );
            }
          })
          .catch((error) => {
            // Silently ignore all logout errors - don't log or show to user
            // Logout still completes regardless of API call success
            // Common errors: 401 (expired token), 400 (invalid token), 404 (endpoint not found)
            // These are expected and should not be shown to users
            if (import.meta.env.DEV) {
              // Only log in dev mode for debugging
              console.debug(
                "[AuthContext] Backend logout failed (expected if token expired), continuing with local logout:",
                error?.response?.status || error?.message
              );
            }
            // No console.log or error display - completely silent
          });
      } else {
        console.log(
          "[🔍 TOKEN TRACK] ⚠️ No refresh token available, skipping backend logout call"
        );
        if (import.meta.env.DEV) {
          console.debug(
            "[AuthContext] No refresh token available, skipping backend logout call"
          );
        }
      }
      // 4. IMMEDIATE local state clearing (authoritative - not dependent on API)
      console.log("[🔍 TOKEN TRACK] Clearing tokens and state...");
      setUser(null);
      setTokenStateSafe(null);
      refreshTokenRef.current = null;
      tokenManagerRef.current.cancelScheduledRefresh();
      sessionSyncRef.current.broadcastLogout();

      // 5. Clear localStorage
      try {
        if (typeof window !== "undefined") {
          localStorage.removeItem("auth:user");
          localStorage.removeItem("user");
          localStorage.removeItem("token");
          localStorage.removeItem("saby:refresh_token");
          // Clear React Query cache
          localStorage.removeItem("REACT_QUERY_OFFLINE_CACHE");
          console.log(
            "[🔍 TOKEN TRACK] ✅ Cleared all tokens from localStorage"
          );
        }
      } catch (e) {
        console.warn("[AuthContext] Failed to clear storage:", e);
        console.log("[🔍 TOKEN TRACK] ❌ Failed to clear localStorage:", e);
      }

      const accessTokenAfter = getAccessToken();
      const refreshTokenInMemoryAfter = refreshTokenRef.current;
      const refreshTokenInStorageAfter = (() => {
        try {
          return typeof window !== "undefined"
            ? localStorage.getItem("saby:refresh_token")
            : null;
        } catch {
          return null;
        }
      })();

      console.log("[🔍 TOKEN TRACK] Logout complete - final token state:", {
        accessToken: {
          exists: !!accessTokenAfter,
          value: accessTokenAfter,
        },
        refreshToken: {
          inMemory: {
            exists: !!refreshTokenInMemoryAfter,
            value: refreshTokenInMemoryAfter,
          },
          inLocalStorage: {
            exists: !!refreshTokenInStorageAfter,
            value: refreshTokenInStorageAfter,
          },
        },
        allCleared:
          !accessTokenAfter &&
          !refreshTokenInMemoryAfter &&
          !refreshTokenInStorageAfter,
      });

      // 6. Set terminal state
      setAuthState("SESSION_EXPIRED");

      // 7. Show message if reason provided (only if not silent)
      // User-initiated logouts should be silent (no error toast)
      if (!silent) {
        if (reason) {
          toast.error(reason);
        } else {
          toast.error("Session expired — please sign in again");
        }
      }

      // Note: Redirect is handled by ProtectedRoute when it detects SESSION_EXPIRED state
      // No need for window.location.href here - React Router will handle it
    },
    [setUser, setTokenStateSafe]
  );

  if (!apiRef.current) {
    apiRef.current = createAPI(
      getAccessToken,
      setAccessToken,
      getRefreshToken,
      () => {
        // onAuthFailure: use forceLogout for terminal auth failures
        forceLogout("Session expired — please sign in again");
      },
      handleSuccessfulAuth, // onAuthSuccess: called after successful refresh in interceptor
      handleVerificationNeeded // onVerificationNeeded: called when account verification is required
    );
  } else {
    // Update the auth success callback if API already exists
    const api = apiRef.current as any;
    if (api._setAuthSuccessCallback) {
      api._setAuthSuccessCallback(handleSuccessfulAuth);
    }
  }

  // Update callback whenever handleSuccessfulAuth changes
  useEffect(() => {
    if (apiRef.current) {
      const api = apiRef.current as any;
      if (api._setAuthSuccessCallback) {
        api._setAuthSuccessCallback(handleSuccessfulAuth);
      }
    }
  }, [handleSuccessfulAuth]);

  // On mount, attempt a silent refresh to let the backend re-establish a session from cookies.
  // Run this only once using useEffect and a guard ref to avoid spamming the refresh endpoint.
  const restoreRunRef = useRef(false);
  useEffect(() => {
    if (restoreRunRef.current) return;
    restoreRunRef.current = true;

    // Attempt silent refresh if:
    // 1. No user exists, OR
    // 2. User exists but no access token (user restored from localStorage but token lost on refresh)
    const hasAccessToken = getAccessToken();
    const shouldAttemptRefresh = !user || !hasAccessToken;

    console.log("[🔍 TOKEN TRACK] Silent refresh check:", {
      hasUser: !!user,
      hasAccessToken: !!hasAccessToken,
      shouldAttemptRefresh,
      reason: !user
        ? "no user"
        : !hasAccessToken
        ? "no access token"
        : "user and token exist",
    });

    if (shouldAttemptRefresh) {
      // Use the api's guarded refresh helper so startup doesn't bypass backoff/cooldown
      try {
        // Check if we have a refreshToken before attempting refresh
        const refreshToken = refreshTokenRef.current;
        let legacy: string | null = null;
        try {
          if (typeof localStorage !== "undefined") {
            legacy = localStorage.getItem("saby:refresh_token");
          }
        } catch (e) {
          // localStorage may be unavailable on some mobile browsers
          if (import.meta.env.DEV) {
            console.debug(
              "[AuthContext] localStorage unavailable for refresh token"
            );
          }
        }

        // Don't attempt refresh if no refreshToken is available - backend requires it
        if (!refreshToken && !legacy) {
          console.log(
            "[🔍 TOKEN TRACK] ⚠️ Silent refresh skipped - no refresh token available"
          );
          // Ensure state is ANONYMOUS if no refresh token available
          if (authState !== "ANONYMOUS") {
            setAuthState("ANONYMOUS");
          }
          return; // User remains unauthenticated, no refresh token available
        }

        // Set state to REFRESHING before attempting refresh to prevent premature redirects
        console.log(
          "[🔍 TOKEN TRACK] Setting auth state to REFRESHING before silent refresh"
        );
        setAuthState("REFRESHING");

        console.log("[🔍 TOKEN TRACK] Attempting silent refresh...");
        const doRefresh = (apiRef.current as any)?._doRefresh as
          | (() => Promise<any>)
          | undefined;
        if (doRefresh) {
          doRefresh()
            .then((resp) => {
              console.log("[🔍 TOKEN TRACK] ✅ Silent refresh successful");
              handleSuccessfulAuth(resp);
            })
            .catch((err) => {
              console.log(
                "[🔍 TOKEN TRACK] ❌ Silent refresh failed:",
                err?.message
              );
              // Set state to ANONYMOUS on failure - user will be redirected to login
              setAuthState("ANONYMOUS");
            });
        } else {
          // Fallback: call refresh endpoint directly
          // Include refresh token in body (backend requires it)
          const body = refreshToken
            ? { refreshToken }
            : { refreshToken: legacy };

          console.log("[🔍 TOKEN TRACK] Using fallback refresh method");
          apiRef.current
            ?.post(API_ENDPOINTS.REFRESH, body, { withCredentials: true })
            .then((resp) => {
              console.log(
                "[🔍 TOKEN TRACK] ✅ Fallback silent refresh successful"
              );
              handleSuccessfulAuth(resp);
            })
            .catch((err) => {
              console.log(
                "[🔍 TOKEN TRACK] ❌ Fallback silent refresh failed:",
                err?.message
              );
              // Set state to ANONYMOUS on failure - user will be redirected to login
              setAuthState("ANONYMOUS");
            });
        }
      } catch (e) {
        console.log("[🔍 TOKEN TRACK] ❌ Silent refresh error:", e);
        // Set state to ANONYMOUS on error
        setAuthState("ANONYMOUS");
      }
    } else {
      console.log(
        "[🔍 TOKEN TRACK] Silent refresh skipped - user and access token both exist"
      );
    }
  }, [user, handleSuccessfulAuth, getAccessToken, authState]);

  const logout = useCallback(() => {
    // User-initiated logout - use forceLogout with silent=true to suppress errors
    forceLogout(undefined, true);
  }, [forceLogout]);

  // Provide setToken for compatibility with existing components (like AuthModal)
  const setToken = useCallback(
    (t: string | null) => {
      setTokenStateSafe(t);
    },
    [setTokenStateSafe]
  );

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        // Check for mobile-specific issues before attempting login (safely)
        try {
          const mobileIssues = detectMobileLoginIssues();
          if (mobileIssues.isMobile) {
            if (import.meta.env.DEV) {
              console.debug("[AuthContext] Mobile login attempt:", {
                userAgent:
                  typeof navigator !== "undefined"
                    ? navigator.userAgent
                    : "unknown",
                cookieEnabled: mobileIssues.cookiesEnabled,
                localStorageAvailable: mobileIssues.localStorageAvailable,
                issues: mobileIssues.issues,
              });
            }

            // Warn user if there are known issues
            if (mobileIssues.issues.length > 0 && import.meta.env.DEV) {
              console.warn(
                "[AuthContext] Potential mobile login issues detected:",
                mobileIssues.issues
              );
            }
          }
        } catch (mobileCheckError) {
          // If mobile detection fails, continue with login anyway
          if (import.meta.env.DEV) {
            console.warn(
              "[AuthContext] Mobile detection failed, continuing with login:",
              mobileCheckError
            );
          }
        }

        // In cookie-only mode the backend should set HttpOnly cookies on successful login.
        if (import.meta.env.DEV) {
          console.debug("[AuthContext] Attempting login:", {
            endpoint: API_ENDPOINTS.AUTH,
            baseURL: apiRef.current?.defaults?.baseURL,
            fullURL: `${apiRef.current?.defaults?.baseURL || ""}${
              API_ENDPOINTS.AUTH
            }`,
            email: email.substring(0, 3) + "***", // Partial email for logging
          });
        }

        console.log("[🔍 TOKEN TRACK] Login attempt - sending credentials");

        const resp = await apiRef.current!.post(
          API_ENDPOINTS.AUTH,
          { email, password },
          { withCredentials: true }
        );

        console.log("[🔍 TOKEN TRACK] ✅ Login API call successful:", {
          status: resp.status,
          hasUser: !!resp.data?.user,
          hasAccessToken: !!(
            resp.data?.access?.token ||
            resp.data?.access_token ||
            resp.data?.token
          ),
          hasRefreshToken: !!(
            resp.data?.refresh?.token ||
            resp.data?.refresh_token ||
            resp.data?.refreshToken
          ),
        });

        // Removed: API key approval error checking
        // API keys are no longer part of authentication flow

        const data = resp.data as any;
        const userResp: User | undefined = data.user ?? data ?? null;

        // Handle successful authentication (schedules proactive refresh, syncs tabs)
        handleSuccessfulAuth(resp);

        // Normalize user object to ensure 'id' field exists
        if (userResp) {
          const normalizedUser = {
            ...userResp,
            id: userResp.id || (userResp as any)._id || userResp.userId || null,
          };
          setUser(normalizedUser);
          console.log("[AuthContext] Login - User normalized and set:", {
            hasId: !!normalizedUser.id,
            id: normalizedUser.id,
            email: normalizedUser.email,
          });
        } else {
          setUser(null);
        }

        console.log("[🔍 TOKEN TRACK] Login complete - user state updated");

        // API key is stored in IndexedDB (generated on server, saved by admin)
        // No need to fetch from server - key is already available locally

        return userResp ?? ({} as User);
      } catch (err: unknown) {
        // Enhanced error logging for mobile debugging
        const userAgent =
          typeof navigator !== "undefined" ? navigator.userAgent : "unknown";
        const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent);
        const errorDetails: any = {
          error: err,
          isAxiosError: axios.isAxiosError(err),
          status: axios.isAxiosError(err) ? err.response?.status : undefined,
          message: err instanceof Error ? err.message : String(err),
          isMobile,
          userAgent: userAgent,
          cookieEnabled:
            typeof navigator !== "undefined" ? navigator.cookieEnabled : false,
        };

        if (axios.isAxiosError(err)) {
          errorDetails.responseData = err.response?.data;
          errorDetails.responseHeaders = err.response?.headers;
          // Check for CORS errors which are common on mobile
          if (!err.response && err.request) {
            errorDetails.networkError = true;
            errorDetails.corsIssue = "Possible CORS or network issue";
          }
        }

        console.error("[AuthContext] Login error caught:", errorDetails);

        // Log the actual request URL for debugging
        if (import.meta.env.DEV) {
          console.error(
            "[AuthContext] Failed request URL:",
            `${apiRef.current?.defaults?.baseURL || ""}${API_ENDPOINTS.AUTH}`
          );
        }
        // Check if error indicates API key approval needed
        if (
          err &&
          typeof err === "object" &&
          ("isApiKeyApprovalNeeded" in err ||
            (axios.isAxiosError(err) &&
              err.response?.data &&
              typeof err.response.data === "object" &&
              "message" in err.response.data &&
              typeof err.response.data.message === "string" &&
              err.response.data.message
                .toLowerCase()
                .includes("pending approval")))
        ) {
          const approvalErr = err as any;
          const errorMessage =
            approvalErr.message ||
            approvalErr.response?.data?.message ||
            "This production API key is pending approval. Please wait for SabyUser approval before using it.";

          console.error(
            "[AuthContext] API key approval required:",
            errorMessage
          );
          throw new Error(errorMessage);
        }

        // Handle rate limit errors
        if (axios.isAxiosError(err) && err.response?.status === 429) {
          const rateLimitError = err as any;
          const rateLimitInfo = rateLimitError.rateLimitInfo;
          const retryAfter =
            rateLimitError.retryAfter ||
            (rateLimitInfo ? getSecondsUntilReset(rateLimitInfo) : 900);

          let errorMessage = "Too many login attempts. ";
          if (retryAfter > 0) {
            const minutes = Math.ceil(retryAfter / 60);
            errorMessage += `Please try again in ${minutes} minute${
              minutes !== 1 ? "s" : ""
            }.`;
          } else {
            errorMessage += "Please try again later.";
          }

          // Store rate limit info for UI display
          const enhancedError: any = new Error(errorMessage);
          enhancedError.isRateLimitError = true;
          enhancedError.retryAfter = retryAfter;
          enhancedError.rateLimitInfo = rateLimitInfo;

          throw enhancedError;
        }

        // Check if error indicates verification needed
        if (err && typeof err === "object" && "isVerificationNeeded" in err) {
          const verificationErr = err as any;
          setVerificationEmail(verificationErr.email || email);
          setVerificationPhoneNumber(
            verificationErr.phoneNumber || verificationErr.phone
          );
          setShowVerificationModal(true);
          throw new Error("Account verification required");
        }

        let message = "Login failed";
        if (axios.isAxiosError(err)) {
          const errorData = err.response?.data as any;
          const errorMessage = errorData?.message || err.message || message;

          // Check if error message indicates API key approval needed
          const approvalKeywords = [
            "pending approval",
            "api key.*pending",
            "wait for.*approval",
            "sabyuser approval",
          ];
          const needsApproval = approvalKeywords.some((keyword) => {
            const regex = new RegExp(keyword, "i");
            return regex.test(errorMessage);
          });

          if (needsApproval) {
            console.error(
              "[AuthContext] API key approval required:",
              errorMessage
            );
            throw new Error(errorMessage);
          }

          // Check if error message indicates verification needed
          const verificationKeywords = [
            "verify",
            "verification",
            "otp",
            "unverified",
            "not verified",
          ];
          const needsVerification = verificationKeywords.some((keyword) =>
            errorMessage.toLowerCase().includes(keyword)
          );

          if (needsVerification) {
            setVerificationEmail(errorData?.email || email);
            setVerificationPhoneNumber(
              errorData?.phoneNumber || errorData?.phone
            );
            setShowVerificationModal(true);
            throw new Error("Account verification required");
          }

          message = errorMessage;
        } else if (err instanceof Error) message = err.message;
        throw new Error(message);
      }
    },
    [handleSuccessfulAuth]
  );

  // Listen for cross-tab events
  useEffect(() => {
    const sessionSync = sessionSyncRef.current;

    // Listen for token refreshes from other tabs
    const unsubRefresh = sessionSync.onRefresh((tokens) => {
      if (tokens.accessToken) {
        setTokenStateSafe(tokens.accessToken);
        // Reschedule proactive refresh if expiration provided
        if (tokens.expiresIn) {
          tokenManagerRef.current.scheduleProactiveRefresh(
            tokens.expiresIn * 1000,
            async () => {
              try {
                const doRefresh = (apiRef.current as any)?._doRefresh as
                  | (() => Promise<any>)
                  | undefined;
                if (doRefresh) {
                  const refreshResp = await doRefresh();
                  handleSuccessfulAuth(refreshResp);
                }
              } catch (error) {
                console.error("[AuthContext] Cross-tab refresh failed:", error);
              }
            }
          );
        }
      }
      if (tokens.refreshToken) {
        refreshTokenRef.current = tokens.refreshToken;
      }
    });

    // Listen for logout from other tabs
    const unsubLogout = sessionSync.onLogout(() => {
      setUser(null); // This will also clear localStorage
      setTokenStateSafe(null);
      tokenManagerRef.current.cancelScheduledRefresh();
    });

    return () => {
      unsubRefresh();
      unsubLogout();
    };
  }, [setTokenStateSafe, handleSuccessfulAuth, setUser]);

  // Setup visibility-based refresh (refresh when user returns to tab)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible") {
        const timeUntilExpiration =
          tokenManagerRef.current.getTimeUntilExpiration();

        // If token expires in less than 1 minute, refresh now
        if (timeUntilExpiration !== null && timeUntilExpiration < 60000) {
          try {
            const doRefresh = (apiRef.current as any)?._doRefresh as
              | (() => Promise<any>)
              | undefined;
            if (doRefresh) {
              const refreshResp = await doRefresh();
              handleSuccessfulAuth(refreshResp);
            }
          } catch (error) {
            console.error("[AuthContext] Visibility refresh failed:", error);
            // Will fall back to reactive refresh on next 401
          }
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [handleSuccessfulAuth]);

  // Add debug helpers in development
  useEffect(() => {
    if (import.meta.env.DEV) {
      (window as any).__authDebug = {
        getToken: () => tokenRef.current,
        getExpiration: () => tokenManagerRef.current.getTimeUntilExpiration(),
        forceRefresh: async () => {
          try {
            const doRefresh = (apiRef.current as any)?._doRefresh as
              | (() => Promise<any>)
              | undefined;
            if (doRefresh) {
              const refreshResp = await doRefresh();
              handleSuccessfulAuth(refreshResp);
              return { success: true, response: refreshResp };
            }
            return { success: false, error: "doRefresh not available" };
          } catch (error) {
            return { success: false, error };
          }
        },
        getRefreshCooldown: () => {
          // This would require exposing cooldown state from api.ts
          return "Check api interceptor state";
        },
      };
    }
  }, [handleSuccessfulAuth]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        authState,
        isAuthenticated: authState === "AUTHENTICATED",
        setUser,
        setToken,
        login,
        logout,
        forceLogout,
        api: apiRef.current!,
        showVerificationModal,
        verificationEmail,
        verificationPhoneNumber,
        setShowVerificationModal,
        getAccessToken,
        getRefreshToken,
      }}>
      {children}
      <OTPVerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        email={verificationEmail}
        phoneNumber={verificationPhoneNumber}
        onVerified={handleVerificationComplete}
      />
    </AuthContext.Provider>
  );
};

// Export types and hook at the end to fix Fast Refresh
export type { User };

/**
 * Custom hook to access auth context
 * Must be used within AuthProvider
 */
function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

export { useAuth };
