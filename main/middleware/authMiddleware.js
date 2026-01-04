/**
 * Auth Middleware
 * Session management and permission guards
 */

// Session state (managed by main process)
let activeSession = null;

/**
 * Get current active session
 * @returns {Object|null} Active session or null
 */
const getSession = () => activeSession;

/**
 * Set active session
 * @param {Object|null} session - Session object { username, role }
 */
const setSession = (session) => {
  activeSession = session;
};

/**
 * Clear active session
 */
const clearSession = () => {
  activeSession = null;
};

/**
 * Update session username
 * @param {string} newUsername - New username
 */
const updateSessionUsername = (newUsername) => {
  if (activeSession) {
    activeSession.username = newUsername;
  }
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if authenticated
 */
const isAuthenticated = () => !!activeSession;

/**
 * Check if user is admin
 * @returns {boolean} True if admin
 */
const isAdmin = () => activeSession?.role === 'admin';

/**
 * Check if user can edit (admin or editor)
 * @returns {boolean} True if can edit
 */
const canEdit = () => activeSession && ['admin', 'editor'].includes(activeSession.role);

/**
 * Permission denied response factory
 * @param {string} message - Optional custom message
 * @returns {Object} Error response
 */
const permissionDenied = (message = 'Permission Denied') => ({
  success: false,
  message
});

/**
 * Not authenticated response factory
 * @returns {Object} Error response
 */
const notAuthenticated = () => ({
  success: false,
  message: 'Not authenticated'
});

/**
 * Admin required response factory
 * @returns {Object} Error response
 */
const adminRequired = () => ({
  success: false,
  message: 'Admin access required'
});

/**
 * Guard decorator for requiring authentication
 * @param {Function} handler - IPC handler function
 * @returns {Function} Wrapped handler
 */
const requireAuth = (handler) => async (...args) => {
  if (!isAuthenticated()) {
    return notAuthenticated();
  }
  return handler(...args);
};

/**
 * Guard decorator for requiring admin role
 * @param {Function} handler - IPC handler function
 * @returns {Function} Wrapped handler
 */
const requireAdmin = (handler) => async (...args) => {
  if (!isAuthenticated()) {
    return notAuthenticated();
  }
  if (!isAdmin()) {
    return adminRequired();
  }
  return handler(...args);
};

/**
 * Guard decorator for requiring edit permissions
 * @param {Function} handler - IPC handler function
 * @returns {Function} Wrapped handler
 */
const requireEditor = (handler) => async (...args) => {
  if (!isAuthenticated()) {
    return notAuthenticated();
  }
  if (!canEdit()) {
    return permissionDenied();
  }
  return handler(...args);
};

module.exports = {
  getSession,
  setSession,
  clearSession,
  updateSessionUsername,
  isAuthenticated,
  isAdmin,
  canEdit,
  permissionDenied,
  notAuthenticated,
  adminRequired,
  requireAuth,
  requireAdmin,
  requireEditor
};
