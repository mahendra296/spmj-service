import { validateAdminLogin } from "../validators/auth-validator.js";
import { verifyPassword } from "../service/auth-service.js";
import { getUserByEmail } from "../service/user-service.js";
import { ROLES } from "../config/constant.js";
import logger from "../utils/logger.js";

export const getLoginPage = async (req, res) => {
  try {
    const user = req.session?.user;
    if (user) {
      return res.redirect(
        user.role === ROLES.ADMIN ? "/admin/dashboard" : "/"
      );
    }
    return res.render("admin/login", {
      title: "Admin Login — SPMJ Foundation",
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

    // Store the authenticated principal in the session
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
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
    return res.render("admin/dashboard", {
      title: "Admin Dashboard — SPMJ Foundation",
      page: "admin",
      user: req.session.user,
    });
  } catch (error) {
    logger.logError(error, req);
    return res.status(500).send("Internal server error.");
  }
};

export const logout = async (req, res) => {
  const email = req.session?.user?.email;
  const userId = req.session?.user?.id;
  req.session.destroy((err) => {
    if (err) {
      logger.logError(err, req);
    } else {
      logger.logAuth("logout", userId ?? null, { email });
    }
    return res.redirect("/admin/login");
  });
};
