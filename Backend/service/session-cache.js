// In-memory cache of active refresh-token session ids.
// A Set gives O(1) lookups so the auth middleware can validate a session
// on every request without hitting the database. Invalidating a session
// (logout / logout-all-devices) removes it here so it takes effect at once.

const activeSessions = new Set();

export const addSession = (sessionId) => {
  activeSessions.add(sessionId);
};

export const removeSession = (sessionId) => {
  activeSessions.delete(sessionId);
};

export const removeSessions = (sessionIds) => {
  sessionIds.forEach((id) => activeSessions.delete(id));
};

export const isSessionActive = (sessionId) => {
  return activeSessions.has(sessionId);
};

export const clearAllSessions = () => {
  activeSessions.clear();
};

export const getActiveSessionCount = () => {
  return activeSessions.size;
};
