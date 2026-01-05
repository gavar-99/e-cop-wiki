/**
 * Asset Service
 * Business logic for asset management (Local + GridFS)
 */
const fs = require('fs');
const path = require('path');
const { copyFileWithHash } = require('../utils/fileUtils');
const { assetDir, getGridFSBucket } = require('../db/mongoConnection');

// Simple mime map
const getMimeType = (ext) => {
  const map = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.md': 'text/markdown'
  };
  return map[ext.toLowerCase()] || 'application/octet-stream';
};

/**
 * Save asset file (Local + GridFS)
 * @param {string} sourcePath - Source file path
 * @returns {Promise<Object>} Asset details
 */
const saveAsset = async (sourcePath) => {
  // 1. Save to Local Cache (and get Hash)
  const { hash, fileName } = copyFileWithHash(sourcePath, assetDir);
  const localPath = path.join(assetDir, fileName);
  const stats = fs.statSync(localPath);
  const mimeType = getMimeType(path.extname(fileName));
  
  let gridfsId = null;

  // 2. Upload to GridFS (if connected)
  const bucket = getGridFSBucket();
  if (bucket) {
    try {
      // Check if already exists in GridFS
      const existing = await bucket.find({ filename: fileName }).toArray();
      if (existing.length > 0) {
        gridfsId = existing[0]._id;
      } else {
        // Upload
        const uploadStream = bucket.openUploadStream(fileName, {
          contentType: mimeType,
          metadata: { originalName: path.basename(sourcePath), hash }
        });
        
        await new Promise((resolve, reject) => {
           fs.createReadStream(localPath)
             .pipe(uploadStream)
             .on('error', reject)
             .on('finish', resolve);
        });
        
        gridfsId = uploadStream.id;
      }
    } catch (error) {
      console.error('GridFS Upload Error:', error);
      // Continue without GridFS (fail open for local use)
    }
  }

  return {
    fileName,
    hash,
    gridfsId,
    mimeType,
    size: stats.size
  };
};

/**
 * Ensure asset exists locally (download from GridFS if needed)
 * @param {string} fileName - Filename (hash.ext)
 * @returns {Promise<string>} Local file path
 */
const ensureAssetLocal = async (fileName) => {
  const localPath = path.join(assetDir, fileName);
  
  if (fs.existsSync(localPath)) {
    return localPath;
  }

  const bucket = getGridFSBucket();
  if (bucket) {
    try {
      await new Promise((resolve, reject) => {
        bucket.openDownloadStreamByName(fileName)
          .pipe(fs.createWriteStream(localPath))
          .on('error', reject)
          .on('finish', resolve);
      });
      return localPath;
    } catch (error) {
      console.error('GridFS Download Error:', error);
    }
  }
  
  return null; // File missing locally and globally
};

/**
 * Legacy wrapper for synchronous calls (only does local copy)
 * @deprecated Use saveAsset instead
 */
const saveAssetWithHash = (sourcePath) => {
    return copyFileWithHash(sourcePath, assetDir);
}

const getAssetDir = () => assetDir;

module.exports = {
  saveAsset,
  ensureAssetLocal,
  getAssetDir,
  saveAssetWithHash
};