import { validateContact } from "../validators/contact-validator.js";
import { fieldErrors } from "../utils/zod-errors.js";
import ApiResponse from "../utils/api-response.js";
import logger from "../utils/logger.js";

export const submitContact = async (req, res) => {
  const validation = validateContact(req.body);

  if (!validation.success) {
    return res.status(400).json(ApiResponse.error("Validation failed", fieldErrors(validation)));
  }

  logger.info("Contact form submission", validation.data);
  return res.json(
    ApiResponse.successMessage(
      "Thank you for reaching out — our team will get back to you within two working days."
    )
  );
};
