/**
 * User IPC Handlers
 * Handle user management operations
 */
const { userService, activityLogService } = require('../services');
const {
  getSession,
  isAuthenticated,
  isAdmin,
  updateSessionUsername,
  notAuthenticated,
  adminRequired,
} = require('../middleware/authMiddleware');

/**
 * Register user handlers
 * @param {Electron.IpcMain} ipcMain - IPC main instance
 */
const register = (ipcMain) => {
  // Get all users
  ipcMain.handle('get-users', async () => {
    if (!isAuthenticated() || !isAdmin()) {
      return adminRequired();
    }
    return await userService.getAllUsers();
  });

  // Create user
  ipcMain.handle('create-user', async (event, { username, password, role }) => {
    if (!isAuthenticated() || !isAdmin()) {
      return adminRequired();
    }
    const session = getSession();
    const result = await userService.createUser(username, password, role);
    if (result.success) {
      await activityLogService.logActivity(
        session.username,
        'create',
        'user',
        null,
        username,
        `Created user with role: ${role}`
      );
    }
    return result;
  });

  // Delete user
  ipcMain.handle('delete-user', async (event, username) => {
    if (!isAuthenticated() || !isAdmin()) {
      return adminRequired();
    }
    const session = getSession();
    if (username === session.username) {
      return { success: false, message: 'Cannot delete your own account' };
    }
    const result = await userService.deleteUser(username);
    if (result.success) {
      await activityLogService.logActivity(
        session.username,
        'delete',
        'user',
        null,
        username,
        'Deleted user'
      );
    }
    return result;
  });

  // Update user role
  ipcMain.handle('update-user-role', async (event, { username, role }) => {
    if (!isAuthenticated() || !isAdmin()) {
      return adminRequired();
    }
    const session = getSession();
    const result = await userService.updateUserRole(username, role);
    if (result.success) {
      await activityLogService.logActivity(
        session.username,
        'edit',
        'user',
        null,
        username,
        `Updated role to: ${role}`
      );
    }
    return result;
  });

  // Toggle user active status
  ipcMain.handle('toggle-user-active', async (event, username) => {
    if (!isAuthenticated() || !isAdmin()) {
      return adminRequired();
    }
    const session = getSession();
    if (username === session.username) {
      return { success: false, message: 'Cannot deactivate your own account' };
    }
    const result = await userService.toggleUserActive(username);
    if (result.success) {
      const status = result.active ? 'activated' : 'deactivated';
      await activityLogService.logActivity(
        session.username,
        'edit',
        'user',
        null,
        username,
        `User ${status}`
      );
    }
    return result;
  });

  // Reset user password (admin)
  ipcMain.handle('reset-user-password', async (event, { username, newPassword }) => {
    if (!isAuthenticated() || !isAdmin()) {
      return adminRequired();
    }
    const session = getSession();
    const result = await userService.resetUserPassword(username, newPassword);
    if (result.success) {
      await activityLogService.logActivity(
        session.username,
        'edit',
        'user',
        null,
        username,
        'Password reset by admin'
      );
    }
    return result;
  });

  // Change own password
  ipcMain.handle('change-own-password', async (event, { currentPassword, newPassword }) => {
    if (!isAuthenticated()) {
      return notAuthenticated();
    }
    const session = getSession();
    const result = await userService.changeOwnPassword(
      session.username,
      currentPassword,
      newPassword
    );
    if (result.success) {
      await activityLogService.logActivity(
        session.username,
        'edit',
        'user',
        null,
        session.username,
        'Changed own password'
      );
    }
    return result;
  });

  // Change own username
  ipcMain.handle('change-own-username', async (event, { newUsername, password }) => {
    if (!isAuthenticated()) {
      return notAuthenticated();
    }
    const session = getSession();
    const currentUsername = session.username;
    const result = await userService.changeOwnUsername(currentUsername, newUsername, password);
    if (result.success) {
      await activityLogService.logActivity(
        newUsername,
        'edit',
        'user',
        null,
        newUsername,
        `Changed username from ${currentUsername}`
      );
      // Update active session
      updateSessionUsername(newUsername);
    }
    return result;
  });

  // Update profile image
  ipcMain.handle('update-profile-image', async (event, { username, profileImage }) => {
    if (!isAuthenticated()) {
      return notAuthenticated();
    }
    const session = getSession();
    // Users can only update their own profile image, admins can update any
    if (session.username !== username && !isAdmin()) {
      return { success: false, message: "Cannot update other user's profile image" };
    }
    const result = await userService.updateProfileImage(username, profileImage);
    if (result.success) {
      await activityLogService.logActivity(
        session.username,
        'edit',
        'user',
        null,
        username,
        'Updated profile image'
      );
    }
    return result;
  });

  // Get profile image
  ipcMain.handle('get-profile-image', async (event, username) => {
    if (!isAuthenticated()) {
      return notAuthenticated();
    }
    return await userService.getProfileImage(username);
  });
};

module.exports = { register };
