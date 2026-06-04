import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { eq, and } from "drizzle-orm";

import { db } from "../config/db.js";
import { refreshTokensTable } from "../drizzle/schema.js";
import {
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY,
  MILLISECONDS_PER_SECOND,
} from "../config/constant.js";
import {
  addSession,
  removeSession,
  removeSessions,
  isSessionActive,
} from "./session-cache.js";
import { getUserById } from "./user-service.js";
import logger from "../utils/logger.js";

/**
 * Hash a plaintext password using argon2id.
 */
export const hashPassword = async (password) => {
  logger.info("Invoke hashPassword method");
  try {
    return await argon2.hash(password);
  } catch (error) {
    logger.error("Error while executing hashPassword", error);
    throw error;
  }
};

/**
 * Verify a plaintext password against a stored argon2 hash.
 */
export const verifyPassword = async (password, hashedPassword) => {
  logger.info("Invoke verifyPassword method");
  if (!hashedPassword) return false;
  try {
    return await argon2.verify(hashedPassword, password);
  } catch (error) {
    // A mismatch/garbled hash is an expected "no" — log at debug, return false.
    logger.debug("verifyPassword returned false: {}", error.message);
    return false;
  }
};

/* ---------- JWT tokens ---------- */

/**
 * Sign a short-lived access token. The payload carries everything the app
 * needs to authorise a request (including `role`) plus the session id so we
 * can check the session is still active.
 */
export const generateJwtToken = ({ id, name, email, role, refreshTokenId }) => {
  logger.info("Invoke generateJwtToken method");
  logger.info("Signing access token for user id: {}", id);
  return jwt.sign(
    { id, name, email, role, refreshTokenId },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY / MILLISECONDS_PER_SECOND }
  );
};

/**
 * Sign a long-lived refresh token. It only carries the session id.
 */
export const generateRefreshToken = ({ refreshTokenId }) => {
  logger.info("Invoke generateRefreshToken method");
  logger.info("Signing refresh token for session: {}", refreshTokenId);
  return jwt.sign({ refreshTokenId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY / MILLISECONDS_PER_SECOND,
  });
};

// Note: verifyJwtToken / verifyRefreshToken run on every request and throw on
// normal token expiry, so they're logged at debug only — logging them at
// info/error would flood the logs and report routine expiry as errors.
export const verifyJwtToken = (token) => {
  logger.debug("Invoke verifyJwtToken method");
  return jwt.verify(token, process.env.JWT_SECRET);
};

export const verifyRefreshToken = (token) => {
  logger.debug("Invoke verifyRefreshToken method");
  return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
};

/* ---------- Sessions (refresh_tokens table) ---------- */

export const createSession = async (userId, { ip, userAgent }) => {
  logger.info("Invoke createSession method");
  logger.info("Creating session for user id: {}", userId);
  try {
    const [session] = await db
      .insert(refreshTokensTable)
      .values({ userId, userAgent, ip, valid: true })
      .returning({ id: refreshTokensTable.id });

    addSession(session.id);
    logger.info("Session created with id: {}", session.id);
    return session;
  } catch (error) {
    logger.error("Error while executing createSession", error);
    throw error;
  }
};

export const findSessionById = async (refreshTokenId) => {
  logger.info("Invoke findSessionById method");
  logger.info("Finding session by id: {}", refreshTokenId);
  try {
    const [session] = await db
      .select()
      .from(refreshTokensTable)
      .where(
        and(
          eq(refreshTokensTable.id, refreshTokenId),
          eq(refreshTokensTable.valid, true)
        )
      );

    return session;
  } catch (error) {
    logger.error("Error while executing findSessionById", error);
    throw error;
  }
};

export const getSessionsByUserId = async (userId) => {
  logger.info("Invoke getSessionsByUserId method");
  logger.info("Fetching sessions for user id: {}", userId);
  try {
    return await db
      .select()
      .from(refreshTokensTable)
      .where(
        and(
          eq(refreshTokensTable.userId, userId),
          eq(refreshTokensTable.valid, true)
        )
      )
      .orderBy(refreshTokensTable.createdAt);
  } catch (error) {
    logger.error("Error while executing getSessionsByUserId", error);
    throw error;
  }
};

/**
 * Exchange a valid refresh token for a fresh access + refresh token pair.
 * Throws (and cleans up the session) if the token or session is invalid.
 */
export const refreshJwtToken = async (refreshToken) => {
  logger.info("Invoke refreshJwtToken method");
  let refreshTokenId = null;
  try {
    const decoded = verifyRefreshToken(refreshToken);
    refreshTokenId = decoded.refreshTokenId;

    const currentSession = await findSessionById(refreshTokenId);
    if (!currentSession) {
      throw new Error("Invalid session");
    }

    const user = await getUserById(currentSession.userId);
    if (!user) {
      await deleteRefreshTokenById(refreshTokenId);
      throw new Error("Invalid user");
    }

    const userInfo = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      refreshTokenId: currentSession.id,
    };

    const newAccessToken = generateJwtToken(userInfo);
    const newRefreshToken = generateRefreshToken({
      refreshTokenId: currentSession.id,
    });

    logger.info("Refreshed tokens for user id: {}", user.id);
    return { newAccessToken, newRefreshToken, user: userInfo };
  } catch (error) {
    // Expired/invalid refresh tokens are routine — log at warn, not error.
    logger.warn("Refresh token rejected: {}", error.message);
    if (refreshTokenId) {
      await deleteRefreshTokenById(refreshTokenId);
    }
    throw error;
  }
};

export const deleteRefreshTokenById = async (refreshTokenId) => {
  logger.info("Invoke deleteRefreshTokenById method");
  logger.info("Deleting session id: {}", refreshTokenId);
  try {
    removeSession(refreshTokenId);
    await db
      .delete(refreshTokensTable)
      .where(eq(refreshTokensTable.id, refreshTokenId));
  } catch (error) {
    logger.error("Error while executing deleteRefreshTokenById", error);
    throw error;
  }
};

export const deleteRefreshTokenByUserId = async (userId) => {
  logger.info("Invoke deleteRefreshTokenByUserId method");
  logger.info("Deleting all sessions for user id: {}", userId);
  try {
    const sessions = await db
      .select({ id: refreshTokensTable.id })
      .from(refreshTokensTable)
      .where(eq(refreshTokensTable.userId, userId));

    removeSessions(sessions.map((s) => s.id));

    await db
      .delete(refreshTokensTable)
      .where(eq(refreshTokensTable.userId, userId));
  } catch (error) {
    logger.error("Error while executing deleteRefreshTokenByUserId", error);
    throw error;
  }
};

export { isSessionActive };

/**
 * Warm the in-memory session cache from the DB on startup so existing
 * logged-in users stay logged in across server restarts.
 */
export const loadSessionsIntoCache = async () => {
  logger.info("Invoke loadSessionsIntoCache method");
  try {
    const sessions = await db
      .select({ id: refreshTokensTable.id })
      .from(refreshTokensTable)
      .where(eq(refreshTokensTable.valid, true));

    sessions.forEach((session) => addSession(session.id));
    logger.info("Loaded {} session(s) into cache", sessions.length);
    return sessions.length;
  } catch (error) {
    logger.error("Error while executing loadSessionsIntoCache", error);
    throw error;
  }
};
