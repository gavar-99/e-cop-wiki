/**
 * User Service
 * Business logic for user operations
 */
const userRepository = require('../repositories/userRepository');
const activityLogRepository = require('../repositories/activityLogRepository');
const entryRepository = require('../repositories/entryRepository');
const { generateRandomHex, hashPassword, hashPasswordPbkdf2 } = require('../utils/hashUtils');

/**
 * Verify user credentials
 * @param {string} username - Username
 * @param {string} password - Password
 * @returns {Promise<Object>} Result with success status
 */
const verifyUser = async (username, password) => {
    try {
        const user = await userRepository.findActiveByUsername(username);
        if (!user) {
            return { success: false, message: 'User not found or deactivated' };
        }

        const hash = hashPassword(password, user.salt);
        if (hash === user.hash) {
            return { success: true, role: user.role, username: user.username };
        }
        return { success: false, message: 'Invalid credentials' };
    } catch (error) {
        return { success: false, message: error.message };
    }
};

/**
 * Create new user
 * @param {string} username - Username
 * @param {string} password - Password
 * @param {string} role - User role
 * @returns {Promise<Object>} Result with success status
 */
const createUser = async (username, password, role) => {
    const salt = generateRandomHex(16);
    const hash = hashPassword(password, salt);

    try {
        await userRepository.create({ username, salt, hash, role });
        return { success: true };
    } catch (error) {
        return { success: false, message: error.message };
    }
};

/**
 * Get all users
 * @returns {Promise<Array>} Array of users
 */
const getAllUsers = async () => {
    try {
        return await userRepository.findAll();
    } catch (error) {
        console.error('Error getting users:', error);
        return [];
    }
};

/**
 * Delete user
 * @param {string} username - Username to delete
 * @returns {Promise<Object>} Result with success status
 */
const deleteUser = async (username) => {
    try {
        await userRepository.deleteByUsername(username);
        return { success: true };
    } catch (error) {
        return { success: false, message: error.message };
    }
};

/**
 * Update user role
 * @param {string} username - Username
 * @param {string} newRole - New role
 * @returns {Promise<Object>} Result with success status
 */
const updateUserRole = async (username, newRole) => {
    try {
        await userRepository.updateRole(username, newRole);
        return { success: true };
    } catch (error) {
        return { success: false, message: error.message };
    }
};

/**
 * Toggle user active status
 * @param {string} username - Username
 * @returns {Promise<Object>} Result with success status and new active state
 */
const toggleUserActive = async (username) => {
    try {
        const user = await userRepository.toggleActive(username);
        if (!user) return { success: false, message: 'User not found' };
        return { success: true, active: user.active ? 1 : 0 };
    } catch (error) {
        return { success: false, message: error.message };
    }
};

/**
 * Reset user password (admin action)
 * @param {string} username - Username
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} Result with success status
 */
const resetUserPassword = async (username, newPassword) => {
    try {
        const salt = generateRandomHex(16);
        const hash = hashPasswordPbkdf2(newPassword, salt);
        await userRepository.updateCredentials(username, { salt, hash });
        return { success: true };
    } catch (error) {
        return { success: false, message: error.message };
    }
};

/**
 * Change own password
 * @param {string} username - Username
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} Result with success status
 */
const changeOwnPassword = async (username, currentPassword, newPassword) => {
    try {
        const user = await userRepository.findByUsername(username);
        if (!user) return { success: false, message: 'User not found' };

        // Verify current password
        const hash = hashPasswordPbkdf2(currentPassword, user.salt);
        if (hash !== user.hash) {
            return { success: false, message: 'Current password is incorrect' };
        }

        // Set new password
        const newSalt = generateRandomHex(16);
        const newHash = hashPasswordPbkdf2(newPassword, newSalt);

        user.salt = newSalt;
        user.hash = newHash;
        await user.save();

        return { success: true };
    } catch (error) {
        return { success: false, message: error.message };
    }
};

/**
 * Change own username
 * @param {string} currentUsername - Current username
 * @param {string} newUsername - New username
 * @param {string} password - Password for verification
 * @returns {Promise<Object>} Result with success status
 */
const changeOwnUsername = async (currentUsername, newUsername, password) => {
    try {
        // Check if new username already exists
        const existingUser = await userRepository.findByUsername(newUsername);
        if (existingUser) {
            return { success: false, message: 'Username already exists' };
        }

        // Verify password
        const user = await userRepository.findByUsername(currentUsername);
        if (!user) return { success: false, message: 'User not found' };

        const hash = hashPasswordPbkdf2(password, user.salt);
        if (hash !== user.hash) {
            return { success: false, message: 'Password is incorrect' };
        }

        // Update username in user record
        await userRepository.updateUsername(currentUsername, newUsername);

        // Update username in all entries
        await entryRepository.updateAuthorUsername(currentUsername, newUsername);

        // Update username in activity logs
        await activityLogRepository.updateUsername(currentUsername, newUsername);

        return { success: true };
    } catch (error) {
        return { success: false, message: error.message };
    }
};

module.exports = {
    verifyUser,
    createUser,
    getAllUsers,
    deleteUser,
    updateUserRole,
    toggleUserActive,
    resetUserPassword,
    changeOwnPassword,
    changeOwnUsername
};
