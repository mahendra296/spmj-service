import { validateContact } from "../validators/contact-validator.js";
import {
  createContactSubmission,
  getContactSubmissions,
  countContactSubmissions,
  deleteContactSubmission,
} from "../service/contact-service.js";
import { parsePage, parsePageSize, buildPagination, toPaginationMeta } from "../utils/pagination.js";
import { fieldErrors } from "../utils/zod-errors.js";
import ApiResponse from "../utils/api-response.js";
import logger from "../utils/logger.js";

export const submitContact = async (req, res) => {
  const validation = validateContact(req.body);

  if (!validation.success) {
    return res.status(400).json(ApiResponse.error("Validation failed", fieldErrors(validation)));
  }

  try {
    await createContactSubmission(validation.data);
  } catch (error) {
    logger.logError(error, req);
    return res.status(500).json(ApiResponse.error("Could not send your message. Please try again."));
  }

  return res.json(
    ApiResponse.successMessage(
      "Thank you for reaching out — our team will get back to you within two working days."
    )
  );
};

/* ---------- Admin: read-only list + delete ---------- */

export const listContactAdmin = async (req, res) => {
  const pageSize = parsePageSize(req.query.size);
  const totalCount = await countContactSubmissions();
  const pagination = buildPagination({ page: parsePage(req.query.page), pageSize, totalCount });
  const submissions = await getContactSubmissions({ limit: pageSize, offset: pagination.offset });
  return res.json(
    ApiResponse.success({ submissions, pagination: toPaginationMeta(pagination) })
  );
};

export const deleteContactAdmin = async (req, res) => {
  try {
    await deleteContactSubmission(Number(req.params.id));
    return res.json(ApiResponse.successMessage("Message deleted."));
  } catch (error) {
    logger.logError(error, req);
    return res.status(500).json(ApiResponse.error("Could not delete the message."));
  }
};
