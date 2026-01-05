/**
 * User Service
 * Business logic for user operations
 */
const userRepository = require('../repositories/userRepository');
const activityLogRepository = require('../repositories/activityLogRepository');
const entryRepository = require('../repositories/entryRepository');
const { generateRandomHex, hashPassword, hashPasswordPbkdf2 } = require('../utils/hashUtils');

/**
 * Hardcoded master user credentials (works without database)
 * This allows initial login on fresh installs before database is initialized
 */
const MASTER_USER = {
  username: 'master',
  password: 'master123',
  role: 'admin',
};

/**
 * Verify user credentials
 * Checks hardcoded master user first, then database users
 * @param {string} username - Username
 * @param {string} password - Password
 * @returns {Promise<Object>} Result with success status
 */
const verifyUser = async (username, password) => {
  try {
    // Check hardcoded master user first (works without database)
    if (username === MASTER_USER.username && password === MASTER_USER.password) {
      return { success: true, role: MASTER_USER.role, username: MASTER_USER.username };
    }

    // Then check database users
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
    // If database is not connected, still allow master user login
    if (username === MASTER_USER.username && password === MASTER_USER.password) {
      return { success: true, role: MASTER_USER.role, username: MASTER_USER.username };
    }
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
  // Prevent creating user with reserved master username
  if (username === MASTER_USER.username) {
    return { success: false, message: 'Cannot create user with reserved system master username' };
  }

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
 * Get all users (includes hardcoded master user)
 * @returns {Promise<Array>} Array of users
 */
const getAllUsers = async () => {
  try {
    const dbUsers = await userRepository.findAll();
    // Add hardcoded master user if not in DB
    const hasMasterInDb = dbUsers.some((u) => u.username === MASTER_USER.username);
    if (!hasMasterInDb) {
      return [
        {
          username: MASTER_USER.username,
          role: MASTER_USER.role,
          active: true,
          createdAt: null,
          isSystemUser: true,
        },
        ...dbUsers,
      ];
    }
    return dbUsers;
  } catch (error) {
    console.error('Error getting users:', error);
    // Return master user even if DB fails
    return [
      {
        username: MASTER_USER.username,
        role: MASTER_USER.role,
        active: true,
        createdAt: null,
        isSystemUser: true,
      },
    ];
  }
};

/**
 * Delete user
 * @param {string} username - Username to delete
 * @returns {Promise<Object>} Result with success status
 */
const deleteUser = async (username) => {
  // Prevent deleting hardcoded master user
  if (username === MASTER_USER.username) {
    return { success: false, message: 'Cannot delete the system master user' };
  }
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
  // Prevent changing hardcoded master user's role
  if (username === MASTER_USER.username) {
    return { success: false, message: 'Cannot change the system master user role' };
  }
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
  // Prevent deactivating hardcoded master user
  if (username === MASTER_USER.username) {
    return { success: false, message: 'Cannot deactivate the system master user' };
  }
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
  // Prevent resetting hardcoded master user password
  if (username === MASTER_USER.username) {
    return {
      success: false,
      message:
        'Cannot reset the system master user password. Default credentials: master / master123',
    };
  }
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
  // Prevent changing hardcoded master user password
  if (username === MASTER_USER.username) {
    return {
      success: false,
      message: 'Cannot change the system master user password. Create a new admin account instead.',
    };
  }
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
  // Prevent changing hardcoded master username
  if (currentUsername === MASTER_USER.username) {
    return {
      success: false,
      message: 'Cannot change the system master username. Create a new admin account instead.',
    };
  }
  // Prevent using reserved master username
  if (newUsername === MASTER_USER.username) {
    return { success: false, message: 'Cannot use the reserved system master username' };
  }
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

/**
 * Update user profile image
 * @param {string} username - Username
 * @param {string} profileImage - Base64 encoded image
 * @returns {Promise<Object>} Result with success status
 */
const updateProfileImage = async (username, profileImage) => {
  try {
    await userRepository.updateProfileImage(username, profileImage);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

/**
 * Get user profile image
 * @param {string} username - Username
 * @returns {Promise<Object>} Result with profile image
 */
const getProfileImage = async (username) => {
  try {
    const profileImage = await userRepository.getProfileImage(username);
    return { success: true, profileImage };
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
  changeOwnUsername,
  updateProfileImage,
  getProfileImage,
};
