export const MILLISECONDS_PER_SECOND = 1000;
export const SECONDS_PER_MINUTE = 60;
export const MINUTE_PER_HOUR = 60;
export const HOUR_PER_DAY = 24;
export const DAY_PER_WEEK = 7;

// Session lifetime: 8 hours (flash messages only)
export const SESSION_MAX_AGE =
  8 * MINUTE_PER_HOUR * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND;

// JWT access token: short-lived (15 minutes)
export const ACCESS_TOKEN_EXPIRY =
  15 * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND;

// JWT refresh token: long-lived (7 days)
export const REFRESH_TOKEN_EXPIRY =
  DAY_PER_WEEK *
  HOUR_PER_DAY *
  MINUTE_PER_HOUR *
  SECONDS_PER_MINUTE *
  MILLISECONDS_PER_SECOND;

// Slider auto-advance interval (used in client script)
export const SLIDER_INTERVAL_MS = 5000;

// Role-based access control
export const ROLES = {
  ADMIN: "ROLE_ADMIN",
  USER: "ROLE_USER",
};

// Blog / News categories
export const BLOG_CATEGORIES = ["article", "press", "announcement"];

// Gallery media types
export const MEDIA_TYPES = ["image", "video"];

// Upload limits
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
