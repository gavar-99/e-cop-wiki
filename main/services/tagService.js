/**
 * Tag Service
 * Business logic for tag/keyword operations
 */
const tagRepository = require('../repositories/tagRepository');
const entryRepository = require('../repositories/entryRepository');

/**
 * Get all tags with entry count
 * @returns {Promise<Array>} Array of tags
 */
const getAllTags = async () => {
    try {
        return await tagRepository.findAllWithCount();
    } catch (error) {
        console.error('Error getting all tags:', error);
        return [];
    }
};

/**
 * Get tags for specific entry
 * @param {string} entryId - Entry ID
 * @returns {Promise<Array>} Array of tags
 */
const getEntryTags = async (entryId) => {
    try {
        const entry = await entryRepository.findById(entryId);
        if (!entry) return [];

        return entry.tags.map(t => ({
            id: t._id.toString(),
            name: t.name,
            tag_name: t.name, // For compatibility
        }));
    } catch (error) {
        console.error('Error getting entry tags:', error);
        return [];
    }
};

/**
 * Set tags for entry
 * @param {string} entryId - Entry ID
 * @param {string[]} tagNames - Array of tag names
 * @returns {Promise<void>}
 */
const setEntryTags = async (entryId, tagNames = []) => {
    try {
        const tagIds = [];
        for (const tagName of tagNames) {
            const tagId = await tagRepository.getOrCreateId(tagName);
            if (tagId) tagIds.push(tagId);
        }

        await entryRepository.updateById(entryId, { tags: tagIds });
    } catch (error) {
        console.error('Error setting entry tags:', error);
    }
};

/**
 * Rename keyword/tag
 * @param {string} oldName - Current name
 * @param {string} newName - New name
 * @returns {Promise<Object>} Result with success status
 */
const renameKeyword = async (oldName, newName) => {
    try {
        return await tagRepository.rename(oldName, newName);
    } catch (error) {
        console.error('Error renaming keyword:', error);
        return { success: false, message: error.message };
    }
};

/**
 * Delete keyword/tag
 * @param {string} keywordId - Tag ID
 * @returns {Promise<Object>} Result with success status and affected count
 */
const deleteKeyword = async (keywordId) => {
    try {
        // Remove keyword from all entries
        const result = await entryRepository.removeTagFromAll(keywordId);

        // Delete the tag document
        await tagRepository.deleteById(keywordId);

        return { success: true, entriesAffected: result.modifiedCount };
    } catch (error) {
        console.error('Error deleting keyword:', error);
        return { success: false, message: error.message };
    }
};

/**
 * Get entries by keyword/tag
 * @param {string} keywordId - Tag ID
 * @returns {Promise<Array>} Array of entries
 */
const getEntriesByKeyword = async (keywordId) => {
    try {
        return await entryRepository.findByTagId(keywordId);
    } catch (error) {
        console.error('Error getting entries by keyword:', error);
        return [];
    }
};

module.exports = {
    getAllTags,
    getEntryTags,
    setEntryTags,
    renameKeyword,
    deleteKeyword,
    getEntriesByKeyword
};
