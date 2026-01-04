/**
 * Hash Utility Functions
 * Centralized cryptographic operations
 */
const crypto = require('crypto');

/**
 * Create SHA256 hash from buffer
 * @param {Buffer} buffer - Data buffer to hash
 * @returns {string} Hex-encoded hash
 */
const hashBuffer = (buffer) => {
    return crypto.createHash('sha256').update(buffer).digest('hex');
};

/**
 * Create SHA256 hash from string
 * @param {string} data - String data to hash
 * @returns {string} Hex-encoded hash
 */
const hashString = (data) => {
    return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Generate random bytes as hex string
 * @param {number} length - Number of bytes
 * @returns {string} Hex-encoded random bytes
 */
const generateRandomHex = (length = 16) => {
    return crypto.randomBytes(length).toString('hex');
};

/**
 * Hash password with salt using scrypt
 * @param {string} password - Plain text password
 * @param {string} salt - Salt for hashing
 * @returns {string} Hex-encoded hash
 */
const hashPassword = (password, salt) => {
    return crypto.scryptSync(password, salt, 64).toString('hex');
};

/**
 * Hash password with salt using PBKDF2 (legacy compatibility)
 * @param {string} password - Plain text password
 * @param {string} salt - Salt for hashing
 * @returns {string} Hex-encoded hash
 */
const hashPasswordPbkdf2 = (password, salt) => {
    return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
};

/**
 * Calculate master hash for entry integrity
 * @param {Object} params - Entry parameters
 * @param {string} params.title - Entry title
 * @param {string} params.content - Entry content
 * @param {string[]} params.tags - Array of tag names
 * @param {Array} params.assets - Array of asset objects with hash property
 * @param {Array} params.infobox - Array of infobox fields with key/value
 * @returns {string} Master hash
 */
const calculateEntryHash = ({ title, content, tags = [], assets = [], infobox = [] }) => {
    const sortedTags = tags.slice().sort();
    const tagsString = sortedTags.join(',');

    const assetsHash = assets.length > 0
        ? hashString(assets.map(a => a.hash || a.sha256Hash).join('|'))
        : 'no-assets';

    const infoboxHash = infobox.length > 0
        ? hashString(
            infobox
                .map(f => `${f.key || f.fieldKey}:${f.value || f.fieldValue}`)
                .sort()
                .join('|')
        )
        : 'no-infobox';

    return hashString(`${title}|${content}|${tagsString}|${assetsHash}|${infoboxHash}`);
};

module.exports = {
    hashBuffer,
    hashString,
    generateRandomHex,
    hashPassword,
    hashPasswordPbkdf2,
    calculateEntryHash
};
