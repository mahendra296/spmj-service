export const MILLISECONDS_PER_SECOND = 1000;
export const SECONDS_PER_MINUTE = 60;
export const MINUTE_PER_HOUR = 60;
export const HOUR_PER_DAY = 24;
export const DAY_PER_WEEK = 7;

// Session lifetime: 8 hours
export const SESSION_MAX_AGE =
  8 * MINUTE_PER_HOUR * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND;

// Slider auto-advance interval (used in client script)
export const SLIDER_INTERVAL_MS = 5000;

// Role-based access control
export const ROLES = {
  ADMIN: "ROLE_ADMIN",
  USER: "ROLE_USER",
};
