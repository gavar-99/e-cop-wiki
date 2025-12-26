const { createAutoBackup } = require('./db/backupManager');
const Store = require('electron-store');

const store = new Store();
let backupTimer = null;

const SCHEDULE_INTERVALS = {
  'manual': 0,
  'hourly': 60 * 60 * 1000,          // 1 hour
  'daily': 24 * 60 * 60 * 1000,       // 24 hours
  'weekly': 7 * 24 * 60 * 60 * 1000   // 7 days
};

/**
 * Start backup scheduler based on stored settings
 */
const startScheduler = () => {
  const schedule = store.get('backupSchedule', 'daily');
  const interval = SCHEDULE_INTERVALS[schedule];

  // Clear existing timer if any
  if (backupTimer) {
    clearInterval(backupTimer);
    backupTimer = null;
  }

  if (interval === 0) {
    console.log('Backup schedule: Manual only');
    return;
  }

  console.log(`Backup schedule: ${schedule} (every ${interval}ms)`);

  // Set up interval timer
  backupTimer = setInterval(async () => {
    console.log(`Running scheduled backup (${schedule})...`);
    const result = await createAutoBackup();
    if (result.success) {
      console.log(`Scheduled backup created: ${result.filename}`);
    } else {
      console.error('Scheduled backup failed:', result.message);
    }
  }, interval);

  // Run initial backup after 1 minute (don't block startup)
  // Only if no backup was created recently
  setTimeout(async () => {
    const lastBackup = store.get('lastAutoBackup', 0);
    const now = Date.now();
    const timeSinceLastBackup = now - lastBackup;

    // Only create backup if last one was more than half the interval ago
    if (timeSinceLastBackup > interval / 2) {
      console.log('Running initial backup check...');
      const result = await createAutoBackup();
      if (result.success) {
        store.set('lastAutoBackup', now);
        console.log(`Initial backup created: ${result.filename}`);
      }
    } else {
      console.log('Recent backup exists, skipping initial backup');
    }
  }, 60 * 1000); // Wait 1 minute after startup
};

/**
 * Update backup schedule
 * @param {string} newSchedule - New schedule type
 * @returns {Object} Result object
 */
const updateSchedule = (newSchedule) => {
  if (!SCHEDULE_INTERVALS.hasOwnProperty(newSchedule)) {
    return { success: false, message: 'Invalid schedule type' };
  }

  console.log(`Updating backup schedule to: ${newSchedule}`);
  store.set('backupSchedule', newSchedule);
  startScheduler(); // Restart with new schedule

  return { success: true, schedule: newSchedule };
};

/**
 * Get current backup schedule
 * @returns {string} Current schedule type
 */
const getSchedule = () => {
  return store.get('backupSchedule', 'daily');
};

/**
 * Stop scheduler (called on app shutdown)
 */
const stopScheduler = () => {
  if (backupTimer) {
    clearInterval(backupTimer);
    backupTimer = null;
    console.log('Backup scheduler stopped');
  }
};

/**
 * Get available schedule options
 * @returns {Array} Array of schedule options
 */
const getScheduleOptions = () => {
  return Object.keys(SCHEDULE_INTERVALS).map(key => ({
    value: key,
    label: key.charAt(0).toUpperCase() + key.slice(1),
    interval: SCHEDULE_INTERVALS[key]
  }));
};

module.exports = {
  startScheduler,
  stopScheduler,
  updateSchedule,
  getSchedule,
  getScheduleOptions
};
