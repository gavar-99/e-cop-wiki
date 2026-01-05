/**
 * Data Formatters
 * Transform database documents to API response format
 */

/**
 * Format entry document for API response
 * @param {Object} entry - Mongoose entry document
 * @returns {Object} Formatted entry object
 */
const formatEntry = (entry) => ({
  id: entry._id.toString(),
  title: entry.title,
  content: entry.content,
  sha256_hash: entry.sha256Hash,
  ipfs_cid: entry.ipfsCid,
  author_username: entry.authorUsername,
  event_date: entry.eventDate,
  timestamp: entry.createdAt,
  created_at: entry.createdAt,
  updated_at: entry.updatedAt,
  deleted_at: entry.deletedAt,
  deleted_by: entry.deletedBy,
  tags: entry.tags?.map((t) => t.name) || [],
});

/**
 * Format user document for API response
 * @param {Object} user - Mongoose user document
 * @returns {Object} Formatted user object
 */
const formatUser = (user) => ({
  id: user._id.toString(),
  username: user.username,
  role: user.role,
  active: user.active ? 1 : 0,
  created_at: user.createdAt,
});

/**
 * Format tag document for API response
 * @param {Object} tag - Mongoose tag document
 * @returns {Object} Formatted tag object
 */
const formatTag = (tag) => ({
  id: tag._id.toString(),
  name: tag.name,
  tag_name: tag.name, // For backward compatibility
});

/**
 * Format asset document for API response
 * @param {Object} asset - Asset subdocument
 * @returns {Object} Formatted asset object
 */
const formatAsset = (asset) => ({
  id: asset._id.toString(),
  asset_path: asset.assetPath,
  sha256_hash: asset.sha256Hash,
  caption: asset.caption,
  display_order: asset.displayOrder,
});

/**
 * Format infobox field for API response
 * @param {Object} field - Infobox field subdocument
 * @returns {Object} Formatted infobox field
 */
const formatInfoboxField = (field) => ({
  field_key: field.fieldKey,
  field_value: field.fieldValue,
  display_order: field.displayOrder,
});

/**
 * Format activity log for API response
 * @param {Object} log - ActivityLog document
 * @returns {Object} Formatted log object
 */
const formatActivityLog = (log) => ({
  id: log._id.toString(),
  username: log.username,
  action: log.action,
  entity_type: log.entityType,
  entity_id: log.entityId?.toString(),
  entity_title: log.entityTitle,
  details: log.details,
  timestamp: log.timestamp,
});

/**
 * Format entry for autocomplete response
 * @param {Object} entry - Entry document
 * @returns {Object} Formatted autocomplete item
 */
const formatAutocompleteEntry = (entry) => ({
  id: entry._id.toString(),
  title: entry.title,
  snippet: entry.content.substring(0, 100),
  tags: entry.tags?.map((t) => t.name) || [],
});

module.exports = {
  formatEntry,
  formatUser,
  formatTag,
  formatAsset,
  formatInfoboxField,
  formatActivityLog,
  formatAutocompleteEntry,
};
