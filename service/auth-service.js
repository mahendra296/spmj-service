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

/* ---------- JWT tokens ---------- */

/**
 * Sign a short-lived access token. The payload carries everything the app
 * needs to authorise a request (including `role`) plus the session id so we
 * can check the session is still active.
 */
export const generateJwtToken = ({ id, name, email, role, refreshTokenId }) => {
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
  return jwt.sign({ refreshTokenId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY / MILLISECONDS_PER_SECOND,
  });
};

export const verifyJwtToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
};

/* ---------- Sessions (refresh_tokens table) ---------- */

export const createSession = async (userId, { ip, userAgent }) => {
  const [session] = await db
    .insert(refreshTokensTable)
    .values({ userId, userAgent, ip, valid: true })
    .returning({ id: refreshTokensTable.id });

  addSession(session.id);
  return session;
};

export const findSessionById = async (refreshTokenId) => {
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
};

export const getSessionsByUserId = async (userId) => {
  return db
    .select()
    .from(refreshTokensTable)
    .where(
      and(
        eq(refreshTokensTable.userId, userId),
        eq(refreshTokensTable.valid, true)
      )
    )
    .orderBy(refreshTokensTable.createdAt);
};

/**
 * Exchange a valid refresh token for a fresh access + refresh token pair.
 * Throws (and cleans up the session) if the token or session is invalid.
 */
export const refreshJwtToken = async (refreshToken) => {
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

    return { newAccessToken, newRefreshToken, user: userInfo };
  } catch (error) {
    if (refreshTokenId) {
      await deleteRefreshTokenById(refreshTokenId);
    }
    throw error;
  }
};

export const deleteRefreshTokenById = async (refreshTokenId) => {
  removeSession(refreshTokenId);
  await db
    .delete(refreshTokensTable)
    .where(eq(refreshTokensTable.id, refreshTokenId));
};

export const deleteRefreshTokenByUserId = async (userId) => {
  const sessions = await db
    .select({ id: refreshTokensTable.id })
    .from(refreshTokensTable)
    .where(eq(refreshTokensTable.userId, userId));

  removeSessions(sessions.map((s) => s.id));

  await db
    .delete(refreshTokensTable)
    .where(eq(refreshTokensTable.userId, userId));
};

export { isSessionActive };

/**
 * Warm the in-memory session cache from the DB on startup so existing
 * logged-in users stay logged in across server restarts.
 */
export const loadSessionsIntoCache = async () => {
  const sessions = await db
    .select({ id: refreshTokensTable.id })
    .from(refreshTokensTable)
    .where(eq(refreshTokensTable.valid, true));

  sessions.forEach((session) => addSession(session.id));
  return sessions.length;
};
