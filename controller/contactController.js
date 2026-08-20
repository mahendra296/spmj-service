import { validateContact } from "../validators/contact-validator.js";
import {
  createContactSubmission,
  getContactSubmissions,
  countContactSubmissions,
  deleteContactSubmission,
} from "../service/contact-service.js";
import { parsePage, parsePageSize, pageSizeQuery, buildPagination } from "../utils/pagination.js";
import { PAGE_SIZE_OPTIONS } from "../config/constant.js";
import logger from "../utils/logger.js";

export const getContactPage = async (req, res) => {
  try {
    const successMessages = res.locals.flash.success;
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

  try {
    await createContactSubmission(validation.data);
  } catch (error) {
    logger.logError(error, req);
    req.flash("error", "Could not send your message. Please try again.");
    return res.redirect("/contact");
  }

  logger.info("Contact form submission", validation.data);
  req.flash("success", "Thank you for reaching out — our team will get back to you within two working days.");
  return res.redirect("/contact");
};

/* ---------- Admin: read-only list + delete ---------- */

export const listContactAdmin = async (req, res) => {
  try {
    const pageSize = parsePageSize(req.query.size);
    const totalCount = await countContactSubmissions();
    const pagination = buildPagination({
      page: parsePage(req.query.page),
      pageSize,
      totalCount,
      baseUrl: "/admin/contact",
      query: pageSizeQuery(pageSize),
    });
    const submissions = await getContactSubmissions({
      limit: pageSize,
      offset: pagination.offset,
    });
    return res.render("admin/contact/index", {
      title: "Contact Messages — SPMJ Admin",
      page: "admin",
      submissions,
      pagination,
      pageSize,
      pageSizeOptions: PAGE_SIZE_OPTIONS,
    });
  } catch (error) {
    logger.logError(error, req);
    return res.status(500).send("Internal server error.");
  }
};

export const deleteContactAdmin = async (req, res) => {
  try {
    await deleteContactSubmission(Number(req.params.id));
    req.flash("success", "Message deleted.");
  } catch (error) {
    logger.logError(error, req);
    req.flash("error", "Could not delete the message.");
  }
  return res.redirect("/admin/contact");
};
