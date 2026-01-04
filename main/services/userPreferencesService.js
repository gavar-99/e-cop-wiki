/**
 * User Preferences Service
 * Business logic for user preferences
 */
const userPreferencesRepository = require('../repositories/userPreferencesRepository');

/**
 * Get user preferences
 * @param {string} username - Username
 * @returns {Promise<Object|null>} Preferences or null
 */
const getUserPreferences = async (username) => {
    try {
        return await userPreferencesRepository.getOrCreate(username);
    } catch (error) {
        console.error('Error getting user preferences:', error);
        return null;
    }
};

/**
 * Update user preferences
 * @param {string} username - Username
 * @param {Object} preferences - Preferences to update
 * @returns {Promise<Object>} Result with success status
 */
const updateUserPreferences = async (username, preferences) => {
    try {
        await userPreferencesRepository.update(username, preferences);
        return { success: true };
    } catch (error) {
        console.error('Error updating user preferences:', error);
        return { success: false, message: error.message };
    }
};

/**
 * Reset user preferences to defaults
 * @param {string} username - Username
 * @returns {Promise<Object>} Result with success status
 */
const resetUserPreferences = async (username) => {
    try {
        await userPreferencesRepository.deleteByUsername(username);
        return { success: true };
    } catch (error) {
        console.error('Error resetting user preferences:', error);
        return { success: false, message: error.message };
    }
};

module.exports = {
    getUserPreferences,
    updateUserPreferences,
    resetUserPreferences
};
