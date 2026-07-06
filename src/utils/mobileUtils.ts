/**
 * Mobile-specific utilities for handling browser differences
 */

/**
 * Safely check if localStorage is available
 * Some mobile browsers (especially in private mode) may block localStorage
 */
export function isLocalStorageAvailable(): boolean {
  try {
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return false;
    }

    // Try to write and read a test value
    const testKey = "__localStorage_test__";
    localStorage.setItem(testKey, "test");
    const value = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);

    return value === "test";
  } catch {
    return false;
  }
}

/**
 * Safely get item from localStorage with fallback
 */
export function safeLocalStorageGet(key: string): string | null {
  if (!isLocalStorageAvailable()) {
    if (import.meta.env.DEV) {
      console.warn(
        `[mobileUtils] localStorage not available, cannot get ${key}`
      );
    }
    return null;
  }

  try {
    return localStorage.getItem(key);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn(
        `[mobileUtils] Error reading localStorage key ${key}:`,
        error
      );
    }
    return null;
  }
}

/**
 * Safely set item in localStorage with fallback
 */
export function safeLocalStorageSet(key: string, value: string): boolean {
  if (!isLocalStorageAvailable()) {
    if (import.meta.env.DEV) {
      console.warn(
        `[mobileUtils] localStorage not available, cannot set ${key}`
      );
    }
    return false;
  }

  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn(
        `[mobileUtils] Error writing localStorage key ${key}:`,
        error
      );
    }
    return false;
  }
}

/**
 * Check if running on a mobile device
 */
export function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

/**
 * Check if cookies are enabled
 */
export function areCookiesEnabled(): boolean {
  if (typeof navigator === "undefined") return false;
  return navigator.cookieEnabled;
}

/**
 * Detect potential mobile login issues
 */
export function detectMobileLoginIssues(): {
  isMobile: boolean;
  cookiesEnabled: boolean;
  localStorageAvailable: boolean;
  issues: string[];
} {
  const isMobile = isMobileDevice();
  const cookiesEnabled = areCookiesEnabled();
  const localStorageAvailable = isLocalStorageAvailable();
  const issues: string[] = [];

  if (isMobile) {
    if (!cookiesEnabled) {
      issues.push(
        "Cookies are disabled. Please enable cookies in your browser settings."
      );
    }
    if (!localStorageAvailable) {
      issues.push(
        "Local storage is not available. This may be due to private browsing mode."
      );
    }
  }

  return {
    isMobile,
    cookiesEnabled,
    localStorageAvailable,
    issues,
  };
}
