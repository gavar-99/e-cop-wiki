/**
 * User Preferences Repository
 * Data access layer for UserPreferences operations
 */
const { UserPreferences } = require('../db/models');

/**
 * Find preferences by username
 * @param {string} username - Username
 * @returns {Promise<Object|null>} Preferences document or null
 */
const findByUsername = async (username) => {
    return await UserPreferences.findOne({ username });
};

/**
 * Get or create preferences for user
 * @param {string} username - Username
 * @returns {Promise<Object>} Preferences document
 */
const getOrCreate = async (username) => {
    let prefs = await UserPreferences.findOne({ username });
    if (!prefs) {
        prefs = await UserPreferences.create({ username });
    }
    return prefs;
};

/**
 * Update preferences
 * @param {string} username - Username
 * @param {Object} preferences - Preferences to update
 * @returns {Promise<Object>} Updated document
 */
const update = async (username, preferences) => {
    return await UserPreferences.findOneAndUpdate(
        { username },
        { ...preferences, updatedAt: new Date() },
        { upsert: true, new: true }
    );
};

/**
 * Delete preferences (reset to defaults)
 * @param {string} username - Username
 * @returns {Promise<Object>} Delete result
 */
const deleteByUsername = async (username) => {
    return await UserPreferences.findOneAndDelete({ username });
};

module.exports = {
    findByUsername,
    getOrCreate,
    update,
    deleteByUsername
};
