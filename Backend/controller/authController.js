import { validateAdminLogin } from "../validators/auth-validator.js";
import {
  verifyPassword,
  generateJwtToken,
  generateRefreshToken,
  createSession,
  verifyRefreshToken,
  refreshJwtToken,
  deleteRefreshTokenById,
} from "../service/auth-service.js";
import { getUserByEmail } from "../service/user-service.js";
import { countEvents } from "../service/event-service.js";
import { countBlogPosts } from "../service/blog-service.js";
import { countGalleryItems } from "../service/gallery-service.js";
import {
  setAuthCookies,
  clearAuthCookies,
} from "../middlewares/verify-auth-middleware.js";
import ApiResponse from "../utils/api-response.js";
import logger from "../utils/logger.js";

/**
 * Create a session and set fresh access + refresh token cookies. Returns the
 * public-safe user shape sent back in the response body.
 */
const issueTokens = async (user, req, res) => {
  const session = await createSession(user.id, {
    ip: req.clientIp || req.ip,
    userAgent: req.headers["user-agent"],
  });

  const accessToken = generateJwtToken({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    refreshTokenId: session.id,
  });

  const refreshToken = generateRefreshToken({ refreshTokenId: session.id });

  setAuthCookies(res, accessToken, refreshToken);

  return { id: user.id, name: user.name, email: user.email, role: user.role };
};

export const submitLogin = async (req, res) => {
  const validation = validateAdminLogin(req.body);

  if (!validation.success) {
    const errorMessage =
      validation.error.errors?.[0]?.message ||
      validation.error.issues?.[0]?.message ||
      "Validation failed";
    return res.status(400).json(ApiResponse.error(errorMessage));
  }

  const { email, password } = validation.data;

  try {
    const user = await getUserByEmail(email);

    // Same generic message whether the email or the password is wrong,
    // so we don't leak which accounts exist.
    if (!user || !(await verifyPassword(password, user.password))) {
      logger.logAuth("login_failed", null, {
        email,
        ip: req.clientIp || req.ip,
      });
      return res.status(401).json(ApiResponse.error("Invalid email or password."));
    }

    const publicUser = await issueTokens(user, req, res);
    logger.logAuth("login_success", user.id, { email, role: user.role });

    return res.json(ApiResponse.success({ user: publicUser }, "Login successful."));
  } catch (error) {
    logger.logError(error, req);
    return res.status(500).json(ApiResponse.error("Something went wrong. Please try again."));
  }
};

export const me = async (req, res) => {
  const user = req.user
    ? { id: req.user.id, name: req.user.name, email: req.user.email, role: req.user.role }
    : null;
  return res.json(ApiResponse.success({ user }));
};

export const refresh = async (req, res) => {
  const refreshToken = req.cookies?.refresh_token;
  if (!refreshToken) {
    return res.status(401).json(ApiResponse.error("Not signed in."));
  }
  try {
    const { newAccessToken, newRefreshToken, user } = await refreshJwtToken(refreshToken);
    setAuthCookies(res, newAccessToken, newRefreshToken);
    const publicUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    return res.json(ApiResponse.success({ user: publicUser }));
  } catch (error) {
    clearAuthCookies(res);
    return res.status(401).json(ApiResponse.error("Session expired. Please sign in again."));
  }
};

export const getDashboard = async (req, res) => {
  const [events, posts, gallery] = await Promise.all([
    countEvents(),
    countBlogPosts(),
    countGalleryItems(),
  ]);

  return res.json(ApiResponse.success({ counts: { events, posts, gallery } }));
};

export const logout = async (req, res) => {
  const email = req.user?.email;
  const userId = req.user?.id;

  try {
    const refreshToken = req.cookies?.refresh_token;
    if (refreshToken) {
      const decoded = verifyRefreshToken(refreshToken);
      if (decoded?.refreshTokenId) {
        await deleteRefreshTokenById(decoded.refreshTokenId);
      }
    }
    logger.logAuth("logout", userId ?? null, { email });
  } catch (error) {
    // Token may already be invalid/expired — still clear cookies below.
    logger.logError(error, req);
  }

  clearAuthCookies(res);
  return res.json(ApiResponse.successMessage("Logged out."));
};
