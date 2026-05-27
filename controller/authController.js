import { validateAdminLogin } from "../validators/auth-validator.js";
import { env } from "../validators/env.js";
import logger from "../utils/logger.js";

export const getLoginPage = async (req, res) => {
  try {
    if (req.session?.admin) {
      return res.redirect("/admin/dashboard");
    }
    return res.render("admin/login", {
      title: "Admin Login — SPMG",
      page: "admin",
      error: req.flash("error"),
      success: req.flash("success"),
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

  const { username, password } = validation.data;

  if (username !== env.ADMIN_USER || password !== env.ADMIN_PASS) {
    logger.logAuth("admin_login_failed", null, {
      username,
      ip: req.clientIp || req.ip,
    });
    req.flash("error", "Invalid username or password.");
    return res.redirect("/admin/login");
  }

  req.session.admin = { username };
  logger.logAuth("admin_login_success", null, { username });
  return res.redirect("/admin/dashboard");
};

export const getDashboardPage = async (req, res) => {
  try {
    return res.render("admin/dashboard", {
      title: "Admin Dashboard — SPMG",
      page: "admin",
      user: req.session.admin,
    });
  } catch (error) {
    logger.logError(error, req);
    return res.status(500).send("Internal server error.");
  }
};

export const logout = async (req, res) => {
  const username = req.session?.admin?.username;
  req.session.destroy((err) => {
    if (err) {
      logger.logError(err, req);
    } else {
      logger.logAuth("admin_logout", null, { username });
    }
    return res.redirect("/admin/login");
  });
};
