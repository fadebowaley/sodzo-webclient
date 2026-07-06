/**
 * Cookie Authentication Test Script
 *
 * Run this in browser console after opening the app
 *
 * This script will:
 * 1. Test login and check for Set-Cookie headers
 * 2. Test refresh with empty body (cookie-based)
 * 3. Check if cookies are being set and sent
 *
 * Usage:
 * 1. Open browser console (F12)
 * 2. Copy and paste this entire script
 * 3. Run: await testCookieAuth('isreal@sotsm.org', '@judah_saby1')
 */

async function testCookieAuth(email, password) {
  console.log("🍪 === COOKIE AUTHENTICATION TEST ===\n");

  const API_BASE = "https://api.stg.saby.ai/v1";
  const results = {
    login: null,
    refresh: null,
    cookies: null,
    summary: {},
  };

  try {
    // Test 1: Login and check for Set-Cookie header
    console.log("📝 Test 1: Login and check for Set-Cookie header...");
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Important: include cookies
      body: JSON.stringify({ email, password }),
    });

    const loginData = await loginResponse.json().catch(() => null);
    const setCookieHeader = loginResponse.headers.get("set-cookie");

    results.login = {
      status: loginResponse.status,
      hasSetCookie: !!setCookieHeader,
      setCookieHeader: setCookieHeader,
      hasRefreshTokenInBody: !!(
        loginData?.refresh?.token ||
        loginData?.refresh_token ||
        loginData?.refreshToken
      ),
      responseData: {
        hasUser: !!loginData?.user,
        hasAccessToken: !!(
          loginData?.access?.token ||
          loginData?.access_token ||
          loginData?.token
        ),
        hasRefreshToken: !!(
          loginData?.refresh?.token ||
          loginData?.refresh_token ||
          loginData?.refreshToken
        ),
      },
    };

    console.log("✅ Login Response:", {
      status: loginResponse.status,
      hasSetCookie: !!setCookieHeader,
      setCookieHeader: setCookieHeader || "NOT SET",
      refreshTokenInBody: results.login.hasRefreshTokenInBody,
    });

    if (setCookieHeader) {
      console.log("✅ Set-Cookie header found:", setCookieHeader);
      const isHttpOnly = setCookieHeader.includes("HttpOnly");
      const isSecure = setCookieHeader.includes("Secure");
      const hasSameSite = setCookieHeader.includes("SameSite");

      console.log("   - HttpOnly:", isHttpOnly ? "✅" : "❌");
      console.log("   - Secure:", isSecure ? "✅" : "❌");
      console.log("   - SameSite:", hasSameSite ? "✅" : "❌");

      results.summary.cookieFlags = {
        httpOnly: isHttpOnly,
        secure: isSecure,
        sameSite: hasSameSite,
      };
    } else {
      console.log("❌ No Set-Cookie header found in login response");
      console.log("   This means backend is NOT setting cookies yet");
    }

    // Test 2: Check document.cookie (HttpOnly cookies won't appear here)
    console.log("\n📝 Test 2: Check document.cookie...");
    const documentCookies = document.cookie;
    console.log("   document.cookie:", documentCookies || "(empty)");
    console.log(
      "   Note: HttpOnly cookies are NOT visible in document.cookie (this is correct!)"
    );

    results.cookies = {
      documentCookie: documentCookies,
      note: "HttpOnly cookies are not accessible via document.cookie",
    };

    // Test 3: Try refresh with empty body (cookie-based)
    console.log("\n📝 Test 3: Test refresh with empty body (cookie-based)...");

    // Wait a bit for login to complete
    await new Promise((resolve) => setTimeout(resolve, 500));

    const refreshResponse = await fetch(`${API_BASE}/auth/refresh-tokens`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Important: include cookies
      body: JSON.stringify({}), // Empty body - cookie should be sent automatically
    });

    const refreshData = await refreshResponse.json().catch(() => null);
    const refreshSetCookie = refreshResponse.headers.get("set-cookie");

    results.refresh = {
      status: refreshResponse.status,
      hasSetCookie: !!refreshSetCookie,
      setCookieHeader: refreshSetCookie,
      hasAccessToken: !!(
        refreshData?.access?.token ||
        refreshData?.access_token ||
        refreshData?.token
      ),
      responseData: refreshData,
    };

    console.log("✅ Refresh Response:", {
      status: refreshResponse.status,
      hasSetCookie: !!refreshSetCookie,
      hasAccessToken: results.refresh.hasAccessToken,
    });

    if (refreshResponse.status === 200 || refreshResponse.status === 201) {
      console.log("✅ Cookie-based refresh SUCCESSFUL!");
      results.summary.refreshWorks = true;
    } else if (refreshResponse.status === 401) {
      console.log(
        "❌ Refresh failed with 401 - cookie may not be set or invalid"
      );
      results.summary.refreshWorks = false;
      results.summary.refreshError =
        "401 Unauthorized - cookie missing or invalid";
    } else if (refreshResponse.status === 400) {
      console.log(
        "❌ Refresh failed with 400 - backend may require refreshToken in body"
      );
      results.summary.refreshWorks = false;
      results.summary.refreshError =
        "400 Bad Request - backend expects refreshToken in body";
    } else {
      console.log(`⚠️ Refresh returned status ${refreshResponse.status}`);
      results.summary.refreshWorks = false;
      results.summary.refreshError = `Status ${refreshResponse.status}`;
    }

    // Summary
    console.log("\n📊 === TEST SUMMARY ===");
    console.log(
      "Login Set-Cookie:",
      results.login.hasSetCookie ? "✅ YES" : "❌ NO"
    );
    console.log(
      "Refresh Token in Body:",
      results.login.hasRefreshTokenInBody
        ? "⚠️ YES (not using cookies)"
        : "✅ NO (using cookies)"
    );
    console.log(
      "Cookie-based Refresh:",
      results.summary.refreshWorks ? "✅ WORKS" : "❌ FAILED"
    );

    if (
      results.login.hasSetCookie &&
      !results.login.hasRefreshTokenInBody &&
      results.summary.refreshWorks
    ) {
      console.log("\n🎉 SUCCESS: Backend IS using HTTP-only cookies!");
      results.summary.backendUsesCookies = true;
    } else if (
      !results.login.hasSetCookie &&
      results.login.hasRefreshTokenInBody
    ) {
      console.log(
        "\n⚠️ Backend is NOT using cookies yet - still using body-based tokens"
      );
      results.summary.backendUsesCookies = false;
    } else {
      console.log("\n⚠️ Mixed state - backend may be partially migrated");
      results.summary.backendUsesCookies = "partial";
    }

    return results;
  } catch (error) {
    console.error("❌ Test failed:", error);
    results.error = error.message;
    return results;
  }
}

// Export for use
if (typeof window !== "undefined") {
  window.testCookieAuth = testCookieAuth;
  console.log(
    '✅ Test function available: await testCookieAuth("isreal@sotsm.org", "@judah_saby1")'
  );
}
