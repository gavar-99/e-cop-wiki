/**
 * Entry Repository
 * Data access layer for Entry operations
 */
const { Entry } = require('../db/models');
const { formatEntry, formatAsset, formatInfoboxField, formatAutocompleteEntry } = require('../utils/formatters');

/**
 * Find entry by ID with populated tags
 * @param {string} entryId - Entry ID
 * @returns {Promise<Object|null>} Entry document or null
 */
const findById = async (entryId) => {
    return await Entry.findById(entryId).populate('tags', 'name');
};

/**
 * Find entry by ID (formatted for API)
 * @param {string} entryId - Entry ID
 * @returns {Promise<Object|null>} Formatted entry or null
 */
const findByIdFormatted = async (entryId) => {
    const entry = await findById(entryId);
    return entry ? formatEntry(entry) : null;
};

/**
 * Find entry by title (case-insensitive exact match)
 * @param {string} title - Entry title
 * @returns {Promise<Object|null>} Entry document or null
 */
const findByTitle = async (title) => {
    return await Entry.findOne({
        title: { $regex: new RegExp(`^${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        deletedAt: null
    }).populate('tags', 'name');
};

/**
 * Get all active entries (not deleted)
 * @returns {Promise<Array>} Array of formatted entries
 */
const findAllActive = async () => {
    const entries = await Entry.find({ deletedAt: null })
        .populate('tags', 'name')
        .sort({ createdAt: -1 });
    return entries.map(formatEntry);
};

/**
 * Get all entries (for integrity check)
 * @returns {Promise<Array>} Array of entry documents
 */
const findAllWithTags = async () => {
    return await Entry.find({}).populate('tags', 'name');
};

/**
 * Create new entry
 * @param {Object} entryData - Entry data
 * @returns {Promise<Object>} Created entry document
 */
const create = async (entryData) => {
    return await Entry.create(entryData);
};

/**
 * Update entry by ID
 * @param {string} entryId - Entry ID
 * @param {Object} updateData - Fields to update
 * @returns {Promise<Object>} Update result
 */
const updateById = async (entryId, updateData) => {
    return await Entry.updateOne({ _id: entryId }, { ...updateData, updatedAt: new Date() });
};

/**
 * Soft delete entry
 * @param {string} entryId - Entry ID
 * @param {string} deletedBy - Username who deleted
 * @returns {Promise<Object>} Update result
 */
const softDelete = async (entryId, deletedBy) => {
    return await Entry.updateOne(
        { _id: entryId },
        { deletedAt: new Date(), deletedBy }
    );
};

/**
 * Restore soft-deleted entry
 * @param {string} entryId - Entry ID
 * @returns {Promise<Object>} Update result
 */
const restore = async (entryId) => {
    return await Entry.updateOne(
        { _id: entryId },
        { deletedAt: null, deletedBy: null }
    );
};

/**
 * Search entries by title or content
 * @param {string} searchTerm - Search query
 * @param {number} limit - Maximum results
 * @returns {Promise<Array>} Array of formatted entries
 */
const search = async (searchTerm, limit = 50) => {
    const regex = new RegExp(searchTerm, 'i');
    const entries = await Entry.find({
        deletedAt: null,
        $or: [{ title: regex }, { content: regex }],
    })
        .populate('tags', 'name')
        .sort({ createdAt: -1 })
        .limit(limit);

    return entries.map(formatEntry);
};

/**
 * Search entries for autocomplete
 * @param {string} searchTerm - Search query
 * @param {number} limit - Maximum results
 * @returns {Promise<Array>} Array of autocomplete items
 */
const searchAutocomplete = async (searchTerm, limit = 8) => {
    const regex = new RegExp(searchTerm, 'i');
    const entries = await Entry.find({
        deletedAt: null,
        $or: [{ title: regex }, { content: regex }],
    })
        .populate('tags', 'name')
        .sort({ createdAt: -1 })
        .limit(limit);

    return entries.map(formatAutocompleteEntry);
};

/**
 * Find entries by tag ID
 * @param {string} tagId - Tag ID
 * @returns {Promise<Array>} Array of { id, title }
 */
const findByTagId = async (tagId) => {
    const entries = await Entry.find({
        tags: tagId,
        deletedAt: null
    }).select('_id title');

    return entries.map(e => ({
        id: e._id.toString(),
        title: e.title,
    }));
};

/**
 * Remove tag from all entries
 * @param {string} tagId - Tag ID to remove
 * @returns {Promise<Object>} Update result with modifiedCount
 */
const removeTagFromAll = async (tagId) => {
    return await Entry.updateMany(
        { tags: tagId },
        { $pull: { tags: tagId }, updatedAt: new Date() }
    );
};

/**
 * Update author username in all entries
 * @param {string} oldUsername - Current username
 * @param {string} newUsername - New username
 * @returns {Promise<Object>} Update result
 */
const updateAuthorUsername = async (oldUsername, newUsername) => {
    return await Entry.updateMany(
        { authorUsername: oldUsername },
        { authorUsername: newUsername }
    );
};

/**
 * Get entry assets
 * @param {string} entryId - Entry ID
 * @returns {Promise<Array>} Array of formatted assets
 */
const getAssets = async (entryId) => {
    const entry = await Entry.findById(entryId);
    if (!entry) return [];
    return entry.assets.map(formatAsset);
};

/**
 * Get entry infobox
 * @param {string} entryId - Entry ID
 * @returns {Promise<Array>} Array of formatted infobox fields
 */
const getInfobox = async (entryId) => {
    const entry = await Entry.findById(entryId);
    if (!entry) return [];
    return entry.infobox.map(formatInfoboxField);
};

/**
 * Update asset caption
 * @param {string} assetId - Asset subdocument ID
 * @param {string} caption - New caption
 * @returns {Promise<Object>} Update result
 */
const updateAssetCaption = async (assetId, caption) => {
    return await Entry.updateOne(
        { 'assets._id': assetId },
        { $set: { 'assets.$.caption': caption } }
    );
};

/**
 * Count all entries
 * @returns {Promise<number>} Entry count
 */
const count = async () => {
    return await Entry.countDocuments();
};

/**
 * Delete all entries (for import)
 * @returns {Promise<Object>} Delete result
 */
const deleteAll = async () => {
    return await Entry.deleteMany({});
};

/**
 * Bulk insert entries (for import)
 * @param {Array} entries - Array of entry data
 * @returns {Promise<Array>} Inserted documents
 */
const insertMany = async (entries) => {
    return await Entry.insertMany(entries);
};

/**
 * Get all entries as lean objects (for export)
 * @returns {Promise<Array>} Array of plain objects
 */
const findAllLean = async () => {
    return await Entry.find({}).lean();
};

module.exports = {
    findById,
    findByIdFormatted,
    findByTitle,
    findAllActive,
    findAllWithTags,
    create,
    updateById,
    softDelete,
    restore,
    search,
    searchAutocomplete,
    findByTagId,
    removeTagFromAll,
    updateAuthorUsername,
    getAssets,
    getInfobox,
    updateAssetCaption,
    count,
    deleteAll,
    insertMany,
    findAllLean
};
