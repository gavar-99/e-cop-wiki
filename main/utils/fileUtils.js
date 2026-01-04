/**
 * File Utility Functions
 * File system operations
 */
const fs = require('fs');
const path = require('path');
const { hashBuffer } = require('./hashUtils');

/**
 * Read file and generate hash-based filename
 * @param {string} sourcePath - Source file path
 * @param {string} targetDir - Target directory for the file
 * @returns {Object} Object with hash and fileName
 */
const copyFileWithHash = (sourcePath, targetDir) => {
    const fileBuffer = fs.readFileSync(sourcePath);
    const hash = hashBuffer(fileBuffer);
    const ext = path.extname(sourcePath);
    const fileName = `${hash}${ext}`;
    const targetPath = path.join(targetDir, fileName);

    if (!fs.existsSync(targetPath)) {
        fs.writeFileSync(targetPath, fileBuffer);
    }

    return { hash, fileName };
};

/**
 * Ensure directory exists (create if not)
 * @param {string} dirPath - Directory path
 */
const ensureDir = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

/**
 * Safe delete file (check existence first)
 * @param {string} filePath - File path to delete
 * @returns {boolean} True if deleted, false if not found
 */
const safeDelete = (filePath) => {
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
    }
    return false;
};

/**
 * Validate filename (prevent directory traversal)
 * @param {string} filename - Filename to validate
 * @returns {boolean} True if valid
 */
const isValidFilename = (filename) => {
    return !filename.includes('..') &&
        !filename.includes('/') &&
        !filename.includes('\\');
};

/**
 * Copy directory recursively
 * @param {string} src - Source directory
 * @param {string} dest - Destination directory
 */
const copyDirRecursive = (src, dest) => {
    fs.cpSync(src, dest, { recursive: true });
};

/**
 * Remove directory recursively
 * @param {string} dirPath - Directory path
 */
const removeDirRecursive = (dirPath) => {
    if (fs.existsSync(dirPath)) {
        fs.rmSync(dirPath, { recursive: true, force: true });
    }
};

/**
 * Get files in directory with stats
 * @param {string} dirPath - Directory path
 * @param {Function} filter - Optional filter function
 * @returns {Array} Array of file objects with name, path, and stats
 */
const getFilesWithStats = (dirPath, filter = () => true) => {
    if (!fs.existsSync(dirPath)) {
        return [];
    }

    return fs.readdirSync(dirPath)
        .filter(filter)
        .map(name => {
            const filePath = path.join(dirPath, name);
            const stats = fs.statSync(filePath);
            return {
                name,
                path: filePath,
                size: stats.size,
                mtime: stats.mtime,
                isFile: stats.isFile(),
                isDirectory: stats.isDirectory()
            };
        });
};

module.exports = {
    copyFileWithHash,
    ensureDir,
    safeDelete,
    isValidFilename,
    copyDirRecursive,
    removeDirRecursive,
    getFilesWithStats
};
