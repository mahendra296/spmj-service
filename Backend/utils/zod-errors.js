/**
 * Reduce a failed Zod `safeParse` result into a flat { field: message } map,
 * suitable for ApiResponse.error(message, fieldErrors(validation)).
 */
export const fieldErrors = (validation) => {
  const issues = validation.error.errors || validation.error.issues || [];
  const errors = {};
  for (const issue of issues) {
    const field = issue.path?.[0];
    if (field && !errors[field]) errors[field] = issue.message;
  }
  return errors;
};
