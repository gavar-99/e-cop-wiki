/**
 * Asset Service
 * Business logic for asset management
 */
const { copyFileWithHash } = require('../utils/fileUtils');
const { assetDir } = require('../db/mongoConnection');

/**
 * Save asset file with hash-based naming
 * @param {string} sourcePath - Source file path
 * @returns {Object} Object with hash and fileName
 */
const saveAssetWithHash = (sourcePath) => {
  return copyFileWithHash(sourcePath, assetDir);
};

/**
 * Get asset directory path
 * @returns {string} Asset directory path
 */
const getAssetDir = () => assetDir;

module.exports = {
  saveAssetWithHash,
  getAssetDir
};
