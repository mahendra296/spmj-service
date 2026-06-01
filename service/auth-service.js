import argon2 from "argon2";

/**
 * Hash a plaintext password using argon2id.
 */
export const hashPassword = async (password) => {
  return argon2.hash(password);
};

/**
 * Verify a plaintext password against a stored argon2 hash.
 */
export const verifyPassword = async (password, hashedPassword) => {
  if (!hashedPassword) return false;
  try {
    return await argon2.verify(hashedPassword, password);
  } catch {
    return false;
  }
};
