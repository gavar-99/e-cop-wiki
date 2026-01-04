/**
 * Activity Log Repository
 * Data access layer for ActivityLog operations
 */
const { ActivityLog } = require('../db/models');
const { formatActivityLog } = require('../utils/formatters');

/**
 * Create activity log entry
 * @param {Object} logData - Log data
 * @returns {Promise<Object>} Created log document
 */
const create = async ({ username, action, entityType, entityId = null, entityTitle = null, details = null }) => {
  return await ActivityLog.create({
    username,
    action,
    entityType,
    entityId,
    entityTitle,
    details,
  });
};

/**
 * Find logs with filters
 * @param {Object} options - Filter options
 * @returns {Promise<Array>} Array of formatted logs
 */
const findWithFilters = async (options = {}) => {
  const { username, action, entityType, limit = 100, offset = 0 } = options;

  const filter = {};
  if (username) filter.username = username;
  if (action) filter.action = action;
  if (entityType) filter.entityType = entityType;

  const logs = await ActivityLog.find(filter)
    .sort({ timestamp: -1 })
    .skip(offset)
    .limit(limit);

  return logs.map(formatActivityLog);
};

/**
 * Get log statistics
 * @returns {Promise<Object>} Stats object
 */
const getStats = async () => {
  const totalLogs = await ActivityLog.countDocuments();
  const uniqueUsers = await ActivityLog.distinct('username').then(u => u.length);

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentActions = await ActivityLog.aggregate([
    { $match: { timestamp: { $gte: sevenDaysAgo } } },
    { $group: { _id: '$action', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const topUsers = await ActivityLog.aggregate([
    { $group: { _id: '$username', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
  ]);

  return {
    totalLogs,
    uniqueUsers,
    recentActions: recentActions.map(r => ({ action: r._id, count: r.count })),
    topUsers: topUsers.map(u => ({ username: u._id, count: u.count })),
  };
};

/**
 * Update username in all logs
 * @param {string} oldUsername - Current username
 * @param {string} newUsername - New username
 * @returns {Promise<Object>} Update result
 */
const updateUsername = async (oldUsername, newUsername) => {
  return await ActivityLog.updateMany(
    { username: oldUsername },
    { username: newUsername }
  );
};

/**
 * Delete all logs (for import)
 * @returns {Promise<Object>} Delete result
 */
const deleteAll = async () => {
  return await ActivityLog.deleteMany({});
};

/**
 * Bulk insert logs (for import)
 * @param {Array} logs - Array of log data
 * @returns {Promise<Array>} Inserted documents
 */
const insertMany = async (logs) => {
  return await ActivityLog.insertMany(logs);
};

/**
 * Get all logs as lean objects (for export)
 * @returns {Promise<Array>} Array of plain objects
 */
const findAllLean = async () => {
  return await ActivityLog.find({}).lean();
};

module.exports = {
  create,
  findWithFilters,
  getStats,
  updateUsername,
  deleteAll,
  insertMany,
  findAllLean
};
