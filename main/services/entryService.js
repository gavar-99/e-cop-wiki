/**
 * Entry Service
 * Business logic for entry operations
 */
const entryRepository = require('../repositories/entryRepository');
const tagRepository = require('../repositories/tagRepository');
const { calculateEntryHash } = require('../utils/hashUtils');

/**
 * Get all entries
 * @returns {Promise<Array>} Array of entries
 */
const getEntries = async () => {
  try {
    return await entryRepository.findAllActive();
  } catch (error) {
    console.error('Error getting entries:', error);
    return [];
  }
};

/**
 * Get entry by ID
 * @param {string} entryId - Entry ID
 * @returns {Promise<Object|null>} Entry or null
 */
const getEntryById = async (entryId) => {
  try {
    return await entryRepository.findByIdFormatted(entryId);
  } catch (error) {
    console.error('Error getting entry:', error);
    return null;
  }
};

/**
 * Create new entry
 * @param {Object} params - Entry data
 * @returns {Promise<Object>} Result with success status and entryId
 */
const createEntry = async ({ title, content, tags = [], infobox = [], assets = [], authorUsername }) => {
  try {
    // Get or create tags
    const tagIds = [];
    for (const tagName of tags) {
      const tagId = await tagRepository.getOrCreateId(tagName);
      if (tagId) tagIds.push(tagId);
    }

    // Calculate master hash
    const masterHash = calculateEntryHash({
      title,
      content,
      tags,
      assets,
      infobox
    });

    const entry = await entryRepository.create({
      title,
      content,
      sha256Hash: masterHash,
      authorUsername,
      tags: tagIds,
      assets: assets.map((a, idx) => ({
        assetPath: a.fileName,
        sha256Hash: a.hash,
        gridfsId: a.gridfsId,
        mimeType: a.mimeType,
        size: a.size,
        caption: '',
        displayOrder: idx,
      })),
      infobox: infobox.map((f, idx) => ({
        fieldKey: f.key,
        fieldValue: f.value,
        displayOrder: idx,
      })),
    });

    return { success: true, entryId: entry._id.toString() };
  } catch (error) {
    console.error('Error creating entry:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Update entry
 * @param {Object} params - Update data
 * @returns {Promise<Object>} Result with success status
 */
const updateEntry = async ({ entryId, title, content, tags = [], infobox = [], removedAssetIds = [] }) => {
  try {
    const entry = await entryRepository.findById(entryId);
    if (!entry) return { success: false, message: 'Entry not found' };

    // Get or create tags
    const tagIds = [];
    for (const tagName of tags) {
      const tagId = await tagRepository.getOrCreateId(tagName);
      if (tagId) tagIds.push(tagId);
    }

    // Remove specified assets
    if (removedAssetIds.length > 0) {
      entry.assets = entry.assets.filter(a => !removedAssetIds.includes(a._id.toString()));
    }

    // Update fields
    entry.title = title;
    entry.content = content;
    entry.tags = tagIds;
    entry.infobox = infobox.map((f, idx) => ({
      fieldKey: f.key,
      fieldValue: f.value,
      displayOrder: f.displayOrder || idx,
    }));
    entry.updatedAt = new Date();

    // Recalculate hash
    entry.sha256Hash = calculateEntryHash({
      title,
      content,
      tags,
      assets: entry.assets.map(a => ({ hash: a.sha256Hash })),
      infobox: entry.infobox.map(f => ({ key: f.fieldKey, value: f.fieldValue }))
    });

    await entry.save();
    return { success: true };
  } catch (error) {
    console.error('Error updating entry:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Delete entry (soft delete)
 * @param {string} entryId - Entry ID
 * @param {string} deletedBy - Username who deleted
 * @returns {Promise<Object>} Result with success status
 */
const deleteEntry = async (entryId, deletedBy) => {
  try {
    await entryRepository.softDelete(entryId, deletedBy);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

/**
 * Restore deleted entry
 * @param {string} entryId - Entry ID
 * @returns {Promise<Object>} Result with success status
 */
const restoreEntry = async (entryId) => {
  try {
    await entryRepository.restore(entryId);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

/**
 * Add assets to entry
 * @param {string} entryId - Entry ID
 * @param {Array} assets - Array of { fileName, hash }
 * @returns {Promise<Object>} Result with success status
 */
const addEntryAssets = async (entryId, assets) => {
  try {
    const entry = await entryRepository.findById(entryId);
    if (!entry) return { success: false, message: 'Entry not found' };

    const startOrder = entry.assets.length;
    for (let i = 0; i < assets.length; i++) {
      entry.assets.push({
        assetPath: assets[i].fileName,
        sha256Hash: assets[i].hash,
        gridfsId: assets[i].gridfsId,
        mimeType: assets[i].mimeType,
        size: assets[i].size,
        caption: '',
        displayOrder: startOrder + i,
      });
    }

    // Recalculate hash
    const tags = await tagRepository.findByIds(entry.tags);
    entry.sha256Hash = calculateEntryHash({
      title: entry.title,
      content: entry.content,
      tags: tags.map(t => t.name),
      assets: entry.assets.map(a => ({ hash: a.sha256Hash })),
      infobox: entry.infobox.map(f => ({ key: f.fieldKey, value: f.fieldValue }))
    });

    await entry.save();
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

/**
 * Get entry assets
 * @param {string} entryId - Entry ID
 * @returns {Promise<Array>} Array of assets
 */
const getEntryAssets = async (entryId) => {
  try {
    const assets = await entryRepository.getAssets(entryId);
    
    // Ensure assets exist locally (Read-Through Cache)
    const { ensureAssetLocal } = require('./assetService');
    await Promise.all(assets.map(a => ensureAssetLocal(a.asset_path)));
    
    return assets;
  } catch (error) {
    console.error('Error getting entry assets:', error);
    return [];
  }
};

/**
 * Update asset caption
 * @param {string} assetId - Asset ID
 * @param {string} caption - New caption
 * @returns {Promise<Object>} Result with success status
 */
const updateAssetCaption = async (assetId, caption) => {
  try {
    await entryRepository.updateAssetCaption(assetId, caption);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

/**
 * Get entry infobox
 * @param {string} entryId - Entry ID
 * @returns {Promise<Array>} Array of infobox fields
 */
const getEntryInfobox = async (entryId) => {
  try {
    return await entryRepository.getInfobox(entryId);
  } catch (error) {
    console.error('Error getting entry infobox:', error);
    return [];
  }
};

/**
 * Search entries
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of matching entries
 */
const searchEntries = async (query) => {
  if (!query || !query.trim()) return [];

  try {
    return await entryRepository.search(query.trim());
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
};

/**
 * Search entries for autocomplete
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of autocomplete items
 */
const searchAutocomplete = async (query) => {
  if (!query || query.trim().length < 1) return [];

  try {
    return await entryRepository.searchAutocomplete(query.trim());
  } catch (error) {
    console.error('Autocomplete error:', error);
    return [];
  }
};

module.exports = {
  getEntries,
  getEntryById,
  createEntry,
  updateEntry,
  deleteEntry,
  restoreEntry,
  addEntryAssets,
  getEntryAssets,
  updateAssetCaption,
  getEntryInfobox,
  searchEntries,
  searchAutocomplete
};
