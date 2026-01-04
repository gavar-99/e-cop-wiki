/**
 * Integrity Service
 * Business logic for data integrity verification
 */
const fs = require('fs');
const path = require('path');
const entryRepository = require('../repositories/entryRepository');
const { hashBuffer, hashString } = require('../utils/hashUtils');
const { assetDir } = require('../db/mongoConnection');

/**
 * Calculate entry hash for integrity verification
 * Must match the hash calculation used when creating/updating entries
 */
const calculateVerificationHash = ({ title, content, tags = [], assets = [], infobox = [] }) => {
  // Tags are stored lowercase in DB, sort them for consistent hashing
  const sortedTags = tags.slice().sort();
  const tagsString = sortedTags.join(',');

  const assetsHash = assets.length > 0
    ? hashString(assets.map(a => a.sha256Hash).join('|'))
    : 'no-assets';

  const infoboxHash = infobox.length > 0
    ? hashString(
      infobox
        .map(f => `${f.fieldKey}:${f.fieldValue}`)
        .sort()
        .join('|')
    )
    : 'no-infobox';

  return hashString(`${title}|${content}|${tagsString}|${assetsHash}|${infoboxHash}`);
};

/**
 * Verify integrity of all entries
 * @returns {Promise<Array>} Array of compromised entries
 */
const verifyIntegrity = async () => {
  try {
    const entries = await entryRepository.findAllWithTags();
    const compromised = [];

    for (const entry of entries) {
      let reason = null;

      // Verify each asset
      for (const asset of entry.assets) {
        const filePath = path.join(assetDir, asset.assetPath);
        if (fs.existsSync(filePath)) {
          const fileBuffer = fs.readFileSync(filePath);
          const calculatedHash = hashBuffer(fileBuffer);

          if (calculatedHash !== asset.sha256Hash) {
            reason = 'Asset Content Tampered';
            break;
          }
        } else {
          reason = 'Asset Missing';
          break;
        }
      }

      // Calculate expected master hash using tag names from populated documents
      const tagNames = entry.tags.map(t => t.name);
      const calculatedMasterHash = calculateVerificationHash({
        title: entry.title,
        content: entry.content,
        tags: tagNames,
        assets: entry.assets || [],
        infobox: entry.infobox || []
      });

      if (calculatedMasterHash !== entry.sha256Hash) {
        compromised.push({
          id: entry._id.toString(),
          title: entry.title,
          reason: reason || 'Metadata/Content Tampered',
        });
      } else if (reason) {
        compromised.push({
          id: entry._id.toString(),
          title: entry.title,
          reason,
        });
      }
    }

    return compromised;
  } catch (error) {
    console.error('Integrity verification error:', error);
    return [];
  }
};

module.exports = {
  verifyIntegrity
};
