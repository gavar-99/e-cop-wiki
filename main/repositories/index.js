/**
 * Repositories Module Index
 * Re-exports all repository modules
 */

const userRepository = require('./userRepository');
const entryRepository = require('./entryRepository');
const tagRepository = require('./tagRepository');
const activityLogRepository = require('./activityLogRepository');
const userPreferencesRepository = require('./userPreferencesRepository');

module.exports = {
  userRepository,
  entryRepository,
  tagRepository,
  activityLogRepository,
  userPreferencesRepository
};
