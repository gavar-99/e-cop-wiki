/**
 * User Repository
 * Data access layer for User operations
 */
const { User } = require('../db/models');
const { formatUser } = require('../utils/formatters');

/**
 * Find user by username
 * @param {string} username - Username to find
 * @returns {Promise<Object|null>} User document or null
 */
const findByUsername = async (username) => {
    return await User.findOne({ username });
};

/**
 * Find active user by username
 * @param {string} username - Username to find
 * @returns {Promise<Object|null>} User document or null
 */
const findActiveByUsername = async (username) => {
    return await User.findOne({ username, active: true });
};

/**
 * Check if user exists
 * @param {string} username - Username to check
 * @returns {Promise<boolean>} True if exists
 */
const exists = async (username) => {
    const user = await User.findOne({ username });
    return !!user;
};

/**
 * Create new user
 * @param {Object} userData - User data
 * @returns {Promise<Object>} Created user document
 */
const create = async ({ username, salt, hash, role }) => {
    return await User.create({ username, salt, hash, role });
};

/**
 * Get all users (formatted for API)
 * @returns {Promise<Array>} Array of formatted users
 */
const findAll = async () => {
    const users = await User.find({}, 'username role active createdAt').sort({ createdAt: -1 });
    return users.map(formatUser);
};

/**
 * Delete user by username
 * @param {string} username - Username to delete
 * @returns {Promise<Object>} Delete result
 */
const deleteByUsername = async (username) => {
    return await User.deleteOne({ username });
};

/**
 * Update user role
 * @param {string} username - Username
 * @param {string} role - New role
 * @returns {Promise<Object>} Update result
 */
const updateRole = async (username, role) => {
    return await User.updateOne({ username }, { role });
};

/**
 * Toggle user active status
 * @param {string} username - Username
 * @returns {Promise<Object>} User with new status
 */
const toggleActive = async (username) => {
    const user = await User.findOne({ username });
    if (!user) return null;

    user.active = !user.active;
    await user.save();
    return user;
};

/**
 * Update user credentials (salt and hash)
 * @param {string} username - Username
 * @param {Object} credentials - { salt, hash }
 * @returns {Promise<Object>} Update result
 */
const updateCredentials = async (username, { salt, hash }) => {
    return await User.updateOne({ username }, { salt, hash });
};

/**
 * Update username
 * @param {string} currentUsername - Current username
 * @param {string} newUsername - New username
 * @returns {Promise<Object>} Updated user
 */
const updateUsername = async (currentUsername, newUsername) => {
    const user = await User.findOne({ username: currentUsername });
    if (!user) return null;

    user.username = newUsername;
    await user.save();
    return user;
};

/**
 * Delete all users (for import)
 * @returns {Promise<Object>} Delete result
 */
const deleteAll = async () => {
    return await User.deleteMany({});
};

/**
 * Bulk insert users (for import)
 * @param {Array} users - Array of user data
 * @returns {Promise<Array>} Inserted documents
 */
const insertMany = async (users) => {
    return await User.insertMany(users);
};

/**
 * Get all users as lean objects (for export)
 * @returns {Promise<Array>} Array of plain objects
 */
const findAllLean = async () => {
    return await User.find({}).lean();
};

module.exports = {
    findByUsername,
    findActiveByUsername,
    exists,
    create,
    findAll,
    deleteByUsername,
    updateRole,
    toggleActive,
    updateCredentials,
    updateUsername,
    deleteAll,
    insertMany,
    findAllLean
};
