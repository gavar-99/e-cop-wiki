/**
 * Integrity Service
 * Business logic for data integrity verification
 */
const fs = require('fs');
const path = require('path');
const entryRepository = require('../repositories/entryRepository');
const { hashBuffer, calculateEntryHash } = require('../utils/hashUtils');
const { assetDir } = require('../db/mongoConnection');

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

            // Calculate expected master hash
            const calculatedMasterHash = calculateEntryHash({
                title: entry.title,
                content: entry.content,
                tags: entry.tags.map(t => t.name),
                assets: entry.assets.map(a => ({ hash: a.sha256Hash })),
                infobox: entry.infobox.map(f => ({ key: f.fieldKey, value: f.fieldValue }))
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
