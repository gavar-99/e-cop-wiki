/**
 * Tag Repository
 * Data access layer for Tag operations
 */
const { Tag } = require('../db/models');
const { formatTag } = require('../utils/formatters');

/**
 * Find tag by name (case-insensitive, normalized)
 * @param {string} name - Tag name
 * @returns {Promise<Object|null>} Tag document or null
 */
const findByName = async (name) => {
  const normalized = name.trim().toLowerCase();
  return await Tag.findOne({ name: normalized });
};

/**
 * Find tag by ID
 * @param {string} tagId - Tag ID
 * @returns {Promise<Object|null>} Tag document or null
 */
const findById = async (tagId) => {
  return await Tag.findById(tagId);
};

/**
 * Create new tag
 * @param {string} name - Tag name (will be normalized)
 * @returns {Promise<Object>} Created tag document
 */
const create = async (name) => {
  const normalized = name.trim().toLowerCase();
  return await Tag.create({ name: normalized });
};

/**
 * Get or create tag by name
 * @param {string} name - Tag name
 * @returns {Promise<string|null>} Tag ID or null
 */
const getOrCreateId = async (name) => {
  const normalized = name.trim().toLowerCase();
  if (!normalized) return null;

  try {
    let tag = await Tag.findOne({ name: normalized });
    if (!tag) {
      tag = await Tag.create({ name: normalized });
    }
    return tag._id;
  } catch (error) {
    // Handle duplicate key error (race condition)
    if (error.code === 11000) {
      const tag = await Tag.findOne({ name: normalized });
      return tag?._id;
    }
    console.error('Error creating tag:', error);
    return null;
  }
};

/**
 * Get all tags with entry count
 * @returns {Promise<Array>} Array of tags with count
 */
const findAllWithCount = async () => {
  return await Tag.aggregate([
    {
      $lookup: {
        from: 'entries',
        localField: '_id',
        foreignField: 'tags',
        as: 'entries',
      },
    },
    {
      $project: {
        id: { $toString: '$_id' },
        name: 1,
        count: { $size: '$entries' },
      },
    },
    { $sort: { count: -1, name: 1 } },
  ]);
};

/**
 * Rename tag
 * @param {string} oldName - Current name
 * @param {string} newName - New name
 * @returns {Promise<Object>} Result with success status
 */
const rename = async (oldName, newName) => {
  const normalizedOld = oldName.trim().toLowerCase();
  const normalizedNew = newName.trim().toLowerCase();

  if (!normalizedOld || !normalizedNew) {
    return { success: false, message: 'Keyword names cannot be empty' };
  }

  if (normalizedOld === normalizedNew) {
    return { success: false, message: 'New name must be different from old name' };
  }

  // Check if new name already exists
  const existingTag = await Tag.findOne({ name: normalizedNew });
  if (existingTag) {
    return { success: false, message: 'A keyword with this name already exists' };
  }

  // Find and update the tag
  const tag = await Tag.findOne({ name: normalizedOld });
  if (!tag) {
    return { success: false, message: 'Keyword not found' };
  }

  tag.name = normalizedNew;
  await tag.save();

  return { success: true, message: 'Keyword renamed successfully' };
};

/**
 * Delete tag by ID
 * @param {string} tagId - Tag ID
 * @returns {Promise<Object>} Delete result
 */
const deleteById = async (tagId) => {
  return await Tag.findByIdAndDelete(tagId);
};

/**
 * Find tags by IDs
 * @param {Array<string>} tagIds - Array of tag IDs
 * @returns {Promise<Array>} Array of tag documents
 */
const findByIds = async (tagIds) => {
  return await Tag.find({ _id: { $in: tagIds } });
};

/**
 * Delete all tags (for import)
 * @returns {Promise<Object>} Delete result
 */
const deleteAll = async () => {
  return await Tag.deleteMany({});
};

/**
 * Bulk insert tags (for import)
 * @param {Array} tags - Array of tag data
 * @returns {Promise<Array>} Inserted documents
 */
const insertMany = async (tags) => {
  return await Tag.insertMany(tags);
};

/**
 * Get all tags as lean objects (for export)
 * @returns {Promise<Array>} Array of plain objects
 */
const findAllLean = async () => {
  return await Tag.find({}).lean();
};

module.exports = {
  findByName,
  findById,
  create,
  getOrCreateId,
  findAllWithCount,
  rename,
  deleteById,
  findByIds,
  deleteAll,
  insertMany,
  findAllLean
};
