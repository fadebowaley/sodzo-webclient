// Environment configuration utilities
export const ENV_CONFIG = {
  // Application settings
  APP_NAME:
    import.meta.env.VITE_APP_NAME || "The Sword of the Spirit Ministries",
  APP_VERSION: import.meta.env.VITE_APP_VERSION || "1.0.0",
  APP_ENV: import.meta.env.VITE_APP_ENV || "development",
  DEFAULT_THEME: import.meta.env.VITE_DEFAULT_THEME || "light",

  // External services
  DEFAULT_AVATAR_SERVICE:
    import.meta.env.VITE_DEFAULT_AVATAR_SERVICE ||
    "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1",
  RANDOM_USER_API:
    import.meta.env.VITE_RANDOM_USER_API ||
    "https://randomuser.me/api/portraits",
  CDN_BASE_URL: import.meta.env.VITE_CDN_BASE_URL || "https://cdn.example.com",

  // Feature flags
  ENABLE_CHAT: import.meta.env.VITE_ENABLE_CHAT === "true",
  ENABLE_STORAGE: import.meta.env.VITE_ENABLE_STORAGE === "true",
  ENABLE_FORMS: import.meta.env.VITE_ENABLE_FORMS === "true",
  ENABLE_PROJECTS: import.meta.env.VITE_ENABLE_PROJECTS === "true",
  ENABLE_ADMIN: import.meta.env.VITE_ENABLE_ADMIN === "true",
  ENABLE_EMAILS: import.meta.env.VITE_ENABLE_EMAILS === "true",

  // Development settings
  USE_MOCK_DATA: import.meta.env.VITE_USE_MOCK_DATA === "true",
  DEBUG_MODE: import.meta.env.VITE_DEBUG_MODE === "true",
  ENABLE_API_LOGGING: import.meta.env.VITE_ENABLE_API_LOGGING === "true",

  // UI/UX settings
  ANIMATION_DURATION: parseInt(
    import.meta.env.VITE_ANIMATION_DURATION || "300"
  ),
  PAGE_TRANSITION_DURATION: parseInt(
    import.meta.env.VITE_PAGE_TRANSITION_DURATION || "200"
  ),
  REDUCED_MOTION: import.meta.env.VITE_REDUCED_MOTION === "true",

  // Security settings
  SESSION_TIMEOUT: parseInt(import.meta.env.VITE_SESSION_TIMEOUT || "30"),
  SECURE_COOKIES: import.meta.env.VITE_SECURE_COOKIES === "true",

  // API Rate Limiting
  RATE_LIMIT_REQUESTS_PER_MINUTE: parseInt(
    import.meta.env.VITE_RATE_LIMIT_RPM || "2000"
  ),
};

// Helper function to get avatar URL with fallback
export const getAvatarUrl = (userAvatar?: string, fallback?: string): string => {
  return userAvatar || fallback || ENV_CONFIG.DEFAULT_AVATAR_SERVICE;
};

// Helper function to get random user avatar
export const getRandomUserAvatar = (gender: 'men' | 'women', id: number): string => {
  return `${ENV_CONFIG.RANDOM_USER_API}/${gender}/${id}.jpg`;
};

// Helper function to check if feature is enabled
export const isFeatureEnabled = (feature: keyof typeof ENV_CONFIG): boolean => {
  return ENV_CONFIG[feature] === true;
};

// Helper function to get CDN URL
export const getCdnUrl = (path: string): string => {
  return `${ENV_CONFIG.CDN_BASE_URL}/${path}`.replace(/\/+/g, '/');
};
