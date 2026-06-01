import { validateContact } from "../validators/contact-validator.js";
import logger from "../utils/logger.js";

export const getContactPage = async (req, res) => {
  try {
    const successMessages = req.flash("success");
    return res.render("contact", {
      title: "Contact — SPMJ Foundation",
      page: "contact",
      sent: successMessages.length > 0,
      errors: null,
      values: {},
    });
  } catch (error) {
    logger.logError(error, req);
    return res.status(500).send("Internal server error.");
  }
};

export const submitContact = async (req, res) => {
  const validation = validateContact(req.body);

  if (!validation.success) {
    const issues = validation.error.errors || validation.error.issues || [];
    const errors = {};
    for (const issue of issues) {
      const field = issue.path?.[0];
      if (field && !errors[field]) {
        errors[field] = issue.message;
      }
    }
    return res.status(400).render("contact", {
      title: "Contact — SPMJ Foundation",
      page: "contact",
      sent: false,
      errors,
      values: req.body,
    });
  }

  logger.info("Contact form submission", validation.data);
  req.flash("success", "Thank you for reaching out — our team will get back to you within two working days.");
  return res.redirect("/contact");
};
