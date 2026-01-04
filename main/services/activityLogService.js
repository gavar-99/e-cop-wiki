/**
 * Activity Log Service
 * Business logic for activity logging
 */
const activityLogRepository = require('../repositories/activityLogRepository');

/**
 * Log an activity
 * @param {string} username - User who performed the action
 * @param {string} action - Action type (login, logout, create, edit, delete, restore)
 * @param {string} entityType - Entity type (auth, entry, user)
 * @param {string|null} entityId - Entity ID (optional)
 * @param {string|null} entityTitle - Entity title (optional)
 * @param {string|null} details - Additional details (optional)
 * @returns {Promise<void>}
 */
const logActivity = async (username, action, entityType, entityId = null, entityTitle = null, details = null) => {
  try {
    await activityLogRepository.create({
      username,
      action,
      entityType,
      entityId,
      entityTitle,
      details,
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

/**
 * Get activity logs with optional filters
 * @param {Object} options - Filter options
 * @returns {Promise<Array>} Array of logs
 */
const getActivityLogs = async (options = {}) => {
  try {
    return await activityLogRepository.findWithFilters(options);
  } catch (error) {
    console.error('Error getting activity logs:', error);
    return [];
  }
};

/**
 * Get log statistics
 * @returns {Promise<Object>} Stats object
 */
const getLogStats = async () => {
  try {
    return await activityLogRepository.getStats();
  } catch (error) {
    console.error('Error getting log stats:', error);
    return { totalLogs: 0, uniqueUsers: 0, recentActions: [], topUsers: [] };
  }
};

module.exports = {
  logActivity,
  getActivityLogs,
  getLogStats
};
