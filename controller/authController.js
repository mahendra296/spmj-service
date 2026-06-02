import { validateAdminLogin } from "../validators/auth-validator.js";
import {
  verifyPassword,
  generateJwtToken,
  generateRefreshToken,
  createSession,
  verifyRefreshToken,
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
import { ROLES } from "../config/constant.js";
import logger from "../utils/logger.js";

/**
 * Create a session and set fresh access + refresh token cookies.
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
};

export const getLoginPage = async (req, res) => {
  try {
    if (req.user) {
      return res.redirect(req.user.role === ROLES.ADMIN ? "/admin/dashboard" : "/");
    }
    return res.render("admin/login", {
      title: "Admin Login — SPMJ Foundation",
      page: "admin",
      error: res.locals.flash.error,
      success: res.locals.flash.success,
    });
  } catch (error) {
    logger.logError(error, req);
    return res.status(500).send("Internal server error.");
  }
};

export const submitLogin = async (req, res) => {
  const validation = validateAdminLogin(req.body);

  if (!validation.success) {
    const errorMessage =
      validation.error.errors?.[0]?.message ||
      validation.error.issues?.[0]?.message ||
      "Validation failed";
    req.flash("error", errorMessage);
    return res.redirect("/admin/login");
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
      req.flash("error", "Invalid email or password.");
      return res.redirect("/admin/login");
    }

    await issueTokens(user, req, res);
    logger.logAuth("login_success", user.id, { email, role: user.role });

    if (user.role === ROLES.ADMIN) {
      return res.redirect("/admin/dashboard");
    }

    // Authenticated, but not an admin — no admin area to enter.
    req.flash(
      "success",
      `Signed in as ${user.name}. Your account does not have admin access.`
    );
    return res.redirect("/");
  } catch (error) {
    logger.logError(error, req);
    req.flash("error", "Something went wrong. Please try again.");
    return res.redirect("/admin/login");
  }
};

export const getDashboardPage = async (req, res) => {
  try {
    const [events, posts, gallery] = await Promise.all([
      countEvents(),
      countBlogPosts(),
      countGalleryItems(),
    ]);

    return res.render("admin/dashboard", {
      title: "Admin Dashboard — SPMJ Foundation",
      page: "admin",
      user: req.user,
      counts: { events, posts, gallery },
    });
  } catch (error) {
    logger.logError(error, req);
    return res.status(500).send("Internal server error.");
  }
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
  return res.redirect("/admin/login");
};
