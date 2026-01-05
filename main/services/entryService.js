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
 * Get entry by title
 * @param {string} title - Entry title
 * @returns {Promise<Object|null>} Formatted entry or null
 */
const getEntryByTitle = async (title) => {
  try {
    const { formatEntry } = require('../utils/formatters');
    const entry = await entryRepository.findByTitle(title);
    return entry ? formatEntry(entry) : null;
  } catch (error) {
    console.error('Error getting entry by title:', error);
    return null;
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
 * Ensure an article exists for each tag
 * @param {string[]} tags - Array of tag names
 * @param {string} authorUsername - Username to credit for stubs
 */
const ensureTagArticles = async (tags, authorUsername) => {
  for (const tagName of tags) {
    try {
      const existingEntry = await entryRepository.findByTitle(tagName);
      if (!existingEntry) {
        console.log(`Creating stub article for keyword: ${tagName}`);
        const stubTitle = tagName.charAt(0).toUpperCase() + tagName.slice(1);
        const stubContent = `This is a stub article for **${tagName}**. You can contribute by expanding it.`;

        // Calculate master hash for the stub
        const masterHash = calculateEntryHash({
          title: stubTitle,
          content: stubContent,
          tags: [],
          assets: [],
          infobox: [],
        });

        await entryRepository.create({
          title: stubTitle,
          content: stubContent,
          sha256Hash: masterHash,
          authorUsername,
          tags: [],
          assets: [],
          infobox: [],
        });
      }
    } catch (error) {
      console.error(`Error creating stub for ${tagName}:`, error);
    }
  }
};

/**
 * Create new entry
 * @param {Object} params - Entry data
 * @returns {Promise<Object>} Result with success status and entryId
 */
const createEntry = async ({
  title,
  content,
  tags = [],
  infobox = [],
  assets = [],
  authorUsername,
  eventDate = null,
}) => {
  try {
    // Filter out tags that are already represented in the title
    // Logic: If the title contains the tag as a whole word, we assume this entry covers the topic.
    // e.g. Title: "History of Mongolia", Tag: "Mongolia" -> No stub created.
    const tagsNeedingStubs = tags.filter((tag) => {
      // Escape regex special characters in tag
      const escapedTag = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const tagRegex = new RegExp(`\\b${escapedTag}\\b`, 'i');
      return !tagRegex.test(title);
    });

    // Ensure articles exist for other tags
    await ensureTagArticles(tagsNeedingStubs, authorUsername);

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
      infobox,
    });

    const entry = await entryRepository.create({
      title,
      content,
      sha256Hash: masterHash,
      authorUsername,
      eventDate: eventDate ? new Date(eventDate) : null,
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
const updateEntry = async ({
  entryId,
  title,
  content,
  tags = [],
  infobox = [],
  removedAssetIds = [],
  eventDate = null,
}) => {
  try {
    const entry = await entryRepository.findById(entryId);
    if (!entry) return { success: false, message: 'Entry not found' };

    // Get current user (we need authorUsername for potential stubs)
    // Note: in a real app we'd get this from context, but here we'll use the entry's author
    // or system if we can't find it.
    const authorUsername = entry.authorUsername || 'system';

    // Filter out tags that are already represented in the title
    const tagsNeedingStubs = tags.filter((tag) => {
      const escapedTag = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const tagRegex = new RegExp(`\\b${escapedTag}\\b`, 'i');
      return !tagRegex.test(title);
    });

    // Ensure articles exist for all tags
    await ensureTagArticles(tagsNeedingStubs, authorUsername);

    // Get or create tags
    const tagIds = [];
    for (const tagName of tags) {
      const tagId = await tagRepository.getOrCreateId(tagName);
      if (tagId) tagIds.push(tagId);
    }

    // Remove specified assets
    if (removedAssetIds.length > 0) {
      entry.assets = entry.assets.filter((a) => !removedAssetIds.includes(a._id.toString()));
    }

    // Update fields
    entry.title = title;
    entry.content = content;
    entry.tags = tagIds;
    entry.eventDate = eventDate ? new Date(eventDate) : null;
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
      assets: entry.assets.map((a) => ({ hash: a.sha256Hash })),
      infobox: entry.infobox.map((f) => ({ key: f.fieldKey, value: f.fieldValue })),
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
      tags: tags.map((t) => t.name),
      assets: entry.assets.map((a) => ({ hash: a.sha256Hash })),
      infobox: entry.infobox.map((f) => ({ key: f.fieldKey, value: f.fieldValue })),
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
    await Promise.all(assets.map((a) => ensureAssetLocal(a.asset_path)));

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
  getEntryByTitle,
  createEntry,
  updateEntry,
  deleteEntry,
  restoreEntry,
  addEntryAssets,
  getEntryAssets,
  updateAssetCaption,
  getEntryInfobox,
  searchEntries,
  searchAutocomplete,
};
