import {
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY,
  ROLES,
} from "../config/constant.js";
import {
  verifyJwtToken,
  refreshJwtToken,
  isSessionActive,
} from "../service/auth-service.js";
import { env } from "../validators/env.js";

/* ---------- Cookie helpers ---------- */

const cookieBaseConfig = () => ({
  httpOnly: true,
  sameSite: "strict",
  // `secure` cookies are dropped by browsers over plain HTTP, so only enable
  // it in production (where the site is served over HTTPS).
  secure: env.NODE_ENV === "production",
});

export const setAuthCookies = (res, accessToken, refreshToken) => {
  const base = cookieBaseConfig();
  res.cookie("access_token", accessToken, {
    ...base,
    maxAge: ACCESS_TOKEN_EXPIRY,
  });
  res.cookie("refresh_token", refreshToken, {
    ...base,
    maxAge: REFRESH_TOKEN_EXPIRY,
  });
};

export const clearAuthCookies = (res) => {
  res.clearCookie("access_token");
  res.clearCookie("refresh_token");
};

/**
 * Soft authentication: read the access token (or transparently refresh it
 * from the refresh token) and attach the principal to `req.user` and
 * `res.locals.user` so views can read it as `user`. Never redirects — public
 * pages work for everyone; route guards below enforce protected pages.
 */
export const verifyAuthToken = async (req, res, next) => {
  const accessToken = req.cookies?.access_token;
  const refreshToken = req.cookies?.refresh_token;

  const attach = (user) => {
    req.user = user;
    res.locals.user = user;
  };

  attach(null);

  if (!accessToken && !refreshToken) {
    return next();
  }

  // 1) Try the access token.
  if (accessToken) {
    try {
      const decoded = verifyJwtToken(accessToken);

      // Reject tokens whose session has been invalidated (logout).
      if (decoded.refreshTokenId && !isSessionActive(decoded.refreshTokenId)) {
        clearAuthCookies(res);
        return next();
      }

      attach(decoded);
      return next();
    } catch {
      // Expired/invalid — fall through to the refresh token.
      res.clearCookie("access_token");
    }
  }

  // 2) Try to silently refresh.
  if (refreshToken) {
    try {
      const { newAccessToken, newRefreshToken, user } = await refreshJwtToken(
        refreshToken
      );
      attach(user);
      setAuthCookies(res, newAccessToken, newRefreshToken);
      return next();
    } catch {
      clearAuthCookies(res);
    }
  }

  return next();
};

/**
 * Require an authenticated user (any role).
 */
export const requireAuth = (req, res, next) => {
  if (!req.user) {
    if (typeof req.flash === "function") {
      req.flash("error", "Please sign in to continue");
    }
    return res.redirect("/admin/login");
  }
  return next();
};

/**
 * Require the authenticated user to have one of the given roles.
 */
export const requireRole = (...roles) => {
  return (req, res, next) => {
    const user = req.user;

    if (!user) {
      if (typeof req.flash === "function") {
        req.flash("error", "Please sign in to continue");
      }
      return res.redirect("/admin/login");
    }

    if (!roles.includes(user.role)) {
      if (typeof req.flash === "function") {
        req.flash("error", "You don't have permission to access that page.");
      }
      return res.redirect("/");
    }

    return next();
  };
};

/**
 * Guard middleware for admin-only routes (ROLE_ADMIN).
 */
export const requireAdmin = requireRole(ROLES.ADMIN);
