const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const mongoConnection = require('./mongoConnection');
const { User, Tag, Entry, ActivityLog } = require('./models');

const { assetDir, userDataPath } = mongoConnection;

// Initialize database connection and seed data
const initDB = async () => {
  // Connect to MongoDB
  const connectionResult = await mongoConnection.connect();
  if (!connectionResult.success) {
    console.error('Failed to connect to MongoDB:', connectionResult.message);
    return connectionResult;
  }

  // Seed default users
  await seedDefaultUsers();

  // Seed sample research data
  await seedResearch();

  return { success: true };
};

// Seed default users
const seedDefaultUsers = async () => {
  try {
    // Default Admin
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
      await createUser('admin', 'admin123', 'admin');
      console.log('Default Admin Account Created: admin / admin123');
    }

    // Test Editor
    const editorExists = await User.findOne({ username: 'editor' });
    if (!editorExists) {
      await createUser('editor', 'editor123', 'editor');
      console.log('Test Editor Account Created: editor / editor123');
    }

    // Test Reader
    const readerExists = await User.findOne({ username: 'reader' });
    if (!readerExists) {
      await createUser('reader', 'reader123', 'reader');
      console.log('Test Reader Account Created: reader / reader123');
    }
  } catch (error) {
    console.error('Error seeding users:', error.message);
  }
};

// Seed sample research data
const seedResearch = async () => {
  try {
    const existingEntries = await Entry.countDocuments();
    if (existingEntries > 0) {
      console.log('Database already seeded, skipping seed data.');
      return;
    }

    console.log('Seeding Extended WW2 Knowledge Graph with Tags...');

    const samples = [
      {
        title: 'Operation Overlord',
        content: 'Operation Overlord was the codename for the [[Battle of Normandy]], the Allied operation that launched the successful invasion of German-occupied Western Europe during World War II. The operation commenced on 6 June 1944 with the [[D-Day]] landings.',
        tags: ['WW2', 'Military Operation', 'Allied Forces', '1944']
      },
      {
        title: 'Battle of Normandy',
        content: 'The Battle of Normandy lasted from June 1944 to August 1944, resulting in the Allied liberation of Western Europe from Nazi Germany\'s control.',
        tags: ['WW2', 'France', '1944', 'Allied Victory']
      },
      {
        title: 'D-Day',
        content: 'D-Day (June 6, 1944) marked the start of [[Operation Overlord]]. More than 156,000 American, British, and Canadian troops stormed 50 miles of Normandy\'s fiercely defended beaches.',
        tags: ['WW2', '1944', 'Normandy', 'Invasion']
      },
      {
        title: 'Dwight D. Eisenhower',
        content: 'General Dwight David "Ike" Eisenhower was the Supreme Commander of the Allied Expeditionary Force in Europe.',
        tags: ['WW2', 'Allied Commander', 'US', 'Biography']
      },
      {
        title: 'Erwin Rommel',
        content: 'Erwin Rommel, popularly known as the Desert Fox, was a German field marshal of World War II.',
        tags: ['WW2', 'German Commander', 'Biography', 'Atlantic Wall']
      }
    ];

    for (const sample of samples) {
      // Get or create tags
      const tagIds = [];
      for (const tagName of sample.tags) {
        const tagId = await getOrCreateTag(tagName);
        if (tagId) tagIds.push(tagId);
      }

      const sortedTags = sample.tags.slice().sort();
      const tagsString = sortedTags.join(',');
      const masterHash = crypto
        .createHash('sha256')
        .update(`${sample.title}|${sample.content}|${tagsString}|no-assets|no-infobox`)
        .digest('hex');

      await Entry.create({
        title: sample.title,
        content: sample.content,
        tags: tagIds,
        sha256Hash: masterHash,
        authorUsername: 'admin'
      });
    }

    console.log('Extended WW2 Knowledge Graph Seeded with Tags.');
  } catch (error) {
    console.error('Error seeding research:', error.message);
  }
};

// User Management Functions
const createUser = async (username, password, role) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');

  try {
    await User.create({ username, salt, hash, role });
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

const verifyUser = async (username, password) => {
  try {
    const user = await User.findOne({ username, active: true });
    if (!user) return { success: false, message: 'User not found or deactivated' };

    const hash = crypto.scryptSync(password, user.salt, 64).toString('hex');
    if (hash === user.hash) {
      return { success: true, role: user.role, username: user.username };
    }
    return { success: false, message: 'Invalid credentials' };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

const getAllUsers = async () => {
  try {
    const users = await User.find({}, 'username role active createdAt').sort({ createdAt: -1 });
    return users.map(u => ({
      id: u._id.toString(),
      username: u.username,
      role: u.role,
      active: u.active ? 1 : 0,
      created_at: u.createdAt
    }));
  } catch (error) {
    console.error('Error getting users:', error);
    return [];
  }
};

const deleteUser = async (username) => {
  try {
    await User.deleteOne({ username });
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

const updateUserRole = async (username, newRole) => {
  try {
    await User.updateOne({ username }, { role: newRole });
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

const toggleUserActive = async (username) => {
  try {
    const user = await User.findOne({ username });
    if (!user) return { success: false, message: 'User not found' };

    user.active = !user.active;
    await user.save();
    return { success: true, active: user.active ? 1 : 0 };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Asset Management
const saveAssetWithHash = (sourcePath) => {
  const fileBuffer = fs.readFileSync(sourcePath);
  const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
  const ext = path.extname(sourcePath);
  const fileName = `${hash}${ext}`;
  const targetPath = path.join(assetDir, fileName);

  if (!fs.existsSync(targetPath)) {
    fs.writeFileSync(targetPath, fileBuffer);
  }
  return { hash, fileName };
};

// Tag Management
const getOrCreateTag = async (tagName) => {
  const normalized = tagName.trim().toLowerCase();
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

const setEntryTags = async (entryId, tagNames = []) => {
  try {
    const tagIds = [];
    for (const tagName of tagNames) {
      const tagId = await getOrCreateTag(tagName);
      if (tagId) tagIds.push(tagId);
    }

    await Entry.updateOne({ _id: entryId }, { tags: tagIds, updatedAt: new Date() });
  } catch (error) {
    console.error('Error setting entry tags:', error);
  }
};

const getEntryTags = async (entryId) => {
  try {
    const entry = await Entry.findById(entryId).populate('tags', 'name');
    if (!entry) return [];

    return entry.tags.map(t => ({
      id: t._id.toString(),
      name: t.name,
      tag_name: t.name // For compatibility
    }));
  } catch (error) {
    console.error('Error getting entry tags:', error);
    return [];
  }
};

const getAllTags = async () => {
  try {
    const tags = await Tag.aggregate([
      {
        $lookup: {
          from: 'entries',
          localField: '_id',
          foreignField: 'tags',
          as: 'entries'
        }
      },
      {
        $project: {
          id: '$_id',
          name: 1,
          count: { $size: '$entries' }
        }
      },
      { $sort: { count: -1, name: 1 } }
    ]);

    return tags;
  } catch (error) {
    console.error('Error getting all tags:', error);
    return [];
  }
};

// Entry Management
const getEntries = async () => {
  try {
    const entries = await Entry.find({ deletedAt: null })
      .populate('tags', 'name')
      .sort({ createdAt: -1 });

    return entries.map(e => formatEntry(e));
  } catch (error) {
    console.error('Error getting entries:', error);
    return [];
  }
};

const getEntryById = async (entryId) => {
  try {
    const entry = await Entry.findById(entryId).populate('tags', 'name');
    return entry ? formatEntry(entry) : null;
  } catch (error) {
    console.error('Error getting entry:', error);
    return null;
  }
};

const formatEntry = (entry) => ({
  id: entry._id.toString(),
  title: entry.title,
  content: entry.content,
  sha256_hash: entry.sha256Hash,
  ipfs_cid: entry.ipfsCid,
  author_username: entry.authorUsername,
  timestamp: entry.createdAt,
  created_at: entry.createdAt,
  updated_at: entry.updatedAt,
  deleted_at: entry.deletedAt,
  deleted_by: entry.deletedBy,
  tags: entry.tags?.map(t => t.name) || []
});

const createEntry = async ({ title, content, tags = [], infobox = [], assets = [], authorUsername }) => {
  try {
    // Get or create tags
    const tagIds = [];
    for (const tagName of tags) {
      const tagId = await getOrCreateTag(tagName);
      if (tagId) tagIds.push(tagId);
    }

    // Calculate hash
    const sortedTags = tags.slice().sort();
    const tagsString = sortedTags.join(',');
    const assetsHash = assets.length > 0
      ? crypto.createHash('sha256').update(assets.map(a => a.hash).join('|')).digest('hex')
      : 'no-assets';
    const infoboxHash = infobox.length > 0
      ? crypto.createHash('sha256').update(infobox.map(f => `${f.key}:${f.value}`).sort().join('|')).digest('hex')
      : 'no-infobox';

    const masterHash = crypto
      .createHash('sha256')
      .update(`${title}|${content}|${tagsString}|${assetsHash}|${infoboxHash}`)
      .digest('hex');

    const entry = await Entry.create({
      title,
      content,
      sha256Hash: masterHash,
      authorUsername,
      tags: tagIds,
      assets: assets.map((a, idx) => ({
        assetPath: a.fileName,
        sha256Hash: a.hash,
        caption: '',
        displayOrder: idx
      })),
      infobox: infobox.map((f, idx) => ({
        fieldKey: f.key,
        fieldValue: f.value,
        displayOrder: idx
      }))
    });

    return { success: true, entryId: entry._id.toString() };
  } catch (error) {
    console.error('Error creating entry:', error);
    return { success: false, message: error.message };
  }
};

const updateEntry = async ({ entryId, title, content, tags = [], infobox = [], removedAssetIds = [] }) => {
  try {
    const entry = await Entry.findById(entryId);
    if (!entry) return { success: false, message: 'Entry not found' };

    // Get or create tags
    const tagIds = [];
    for (const tagName of tags) {
      const tagId = await getOrCreateTag(tagName);
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
      displayOrder: f.displayOrder || idx
    }));
    entry.updatedAt = new Date();

    // Recalculate hash
    const sortedTags = tags.slice().sort();
    const tagsString = sortedTags.join(',');
    const assetsHash = entry.assets.length > 0
      ? crypto.createHash('sha256').update(entry.assets.map(a => a.sha256Hash).join('|')).digest('hex')
      : 'no-assets';
    const infoboxHash = entry.infobox.length > 0
      ? crypto.createHash('sha256').update(entry.infobox.map(f => `${f.fieldKey}:${f.fieldValue}`).sort().join('|')).digest('hex')
      : 'no-infobox';

    entry.sha256Hash = crypto
      .createHash('sha256')
      .update(`${title}|${content}|${tagsString}|${assetsHash}|${infoboxHash}`)
      .digest('hex');

    await entry.save();
    return { success: true };
  } catch (error) {
    console.error('Error updating entry:', error);
    return { success: false, message: error.message };
  }
};

const deleteEntry = async (entryId, deletedBy) => {
  try {
    await Entry.updateOne(
      { _id: entryId },
      { deletedAt: new Date(), deletedBy }
    );
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

const restoreEntry = async (entryId) => {
  try {
    await Entry.updateOne(
      { _id: entryId },
      { deletedAt: null, deletedBy: null }
    );
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Asset Management for Entries
const addEntryAssets = async (entryId, assets) => {
  try {
    const entry = await Entry.findById(entryId);
    if (!entry) return { success: false, message: 'Entry not found' };

    const startOrder = entry.assets.length;
    for (let i = 0; i < assets.length; i++) {
      entry.assets.push({
        assetPath: assets[i].fileName,
        sha256Hash: assets[i].hash,
        caption: '',
        displayOrder: startOrder + i
      });
    }

    // Recalculate hash
    await recalculateEntryHash(entry);
    await entry.save();

    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

const getEntryAssets = async (entryId) => {
  try {
    const entry = await Entry.findById(entryId);
    if (!entry) return [];

    return entry.assets.map(a => ({
      id: a._id.toString(),
      asset_path: a.assetPath,
      sha256_hash: a.sha256Hash,
      caption: a.caption,
      display_order: a.displayOrder
    }));
  } catch (error) {
    console.error('Error getting entry assets:', error);
    return [];
  }
};

const updateAssetCaption = async (assetId, caption) => {
  try {
    await Entry.updateOne(
      { 'assets._id': assetId },
      { $set: { 'assets.$.caption': caption } }
    );
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Infobox Management
const getEntryInfobox = async (entryId) => {
  try {
    const entry = await Entry.findById(entryId);
    if (!entry) return [];

    return entry.infobox.map(f => ({
      field_key: f.fieldKey,
      field_value: f.fieldValue,
      display_order: f.displayOrder
    }));
  } catch (error) {
    console.error('Error getting entry infobox:', error);
    return [];
  }
};

// Search
const searchEntries = async (query) => {
  if (!query || !query.trim()) return [];

  try {
    const searchTerm = query.trim();
    const regex = new RegExp(searchTerm, 'i');

    const entries = await Entry.find({
      deletedAt: null,
      $or: [
        { title: regex },
        { content: regex }
      ]
    })
      .populate('tags', 'name')
      .sort({ createdAt: -1 })
      .limit(50);

    return entries.map(e => formatEntry(e));
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
};

const searchAutocomplete = async (query) => {
  if (!query || query.trim().length < 1) return [];

  try {
    const searchTerm = query.trim();
    const regex = new RegExp(searchTerm, 'i');

    const entries = await Entry.find({
      deletedAt: null,
      $or: [
        { title: regex },
        { content: regex }
      ]
    })
      .populate('tags', 'name')
      .sort({ createdAt: -1 })
      .limit(8);

    return entries.map(e => ({
      id: e._id.toString(),
      title: e.title,
      snippet: e.content.substring(0, 100),
      tags: e.tags?.map(t => t.name) || []
    }));
  } catch (error) {
    console.error('Autocomplete error:', error);
    return [];
  }
};

// Hash Calculation
const recalculateEntryHash = async (entry) => {
  const tags = await Tag.find({ _id: { $in: entry.tags } });
  const sortedTags = tags.map(t => t.name).sort();
  const tagsString = sortedTags.join(',');

  const assetsHash = entry.assets.length > 0
    ? crypto.createHash('sha256').update(entry.assets.map(a => a.sha256Hash).join('|')).digest('hex')
    : 'no-assets';

  const infoboxHash = entry.infobox.length > 0
    ? crypto.createHash('sha256').update(entry.infobox.map(f => `${f.fieldKey}:${f.fieldValue}`).sort().join('|')).digest('hex')
    : 'no-infobox';

  entry.sha256Hash = crypto
    .createHash('sha256')
    .update(`${entry.title}|${entry.content}|${tagsString}|${assetsHash}|${infoboxHash}`)
    .digest('hex');
};

// Integrity Verification
const verifyIntegrity = async () => {
  try {
    const entries = await Entry.find({}).populate('tags', 'name');
    const compromised = [];

    for (const entry of entries) {
      let reason = null;

      // Verify each asset
      for (const asset of entry.assets) {
        const filePath = path.join(assetDir, asset.assetPath);
        if (fs.existsSync(filePath)) {
          const fileBuffer = fs.readFileSync(filePath);
          const calculatedHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

          if (calculatedHash !== asset.sha256Hash) {
            reason = 'Asset Content Tampered';
            break;
          }
        } else {
          reason = 'Asset Missing';
          break;
        }
      }

      // Calculate expected hash
      const sortedTags = entry.tags.map(t => t.name).sort();
      const tagsString = sortedTags.join(',');

      const assetsHash = entry.assets.length > 0
        ? crypto.createHash('sha256').update(entry.assets.map(a => a.sha256Hash).join('|')).digest('hex')
        : 'no-assets';

      const infoboxHash = entry.infobox.length > 0
        ? crypto.createHash('sha256').update(entry.infobox.map(f => `${f.fieldKey}:${f.fieldValue}`).sort().join('|')).digest('hex')
        : 'no-infobox';

      const calculatedMasterHash = crypto
        .createHash('sha256')
        .update(`${entry.title}|${entry.content}|${tagsString}|${assetsHash}|${infoboxHash}`)
        .digest('hex');

      if (calculatedMasterHash !== entry.sha256Hash) {
        compromised.push({
          id: entry._id.toString(),
          title: entry.title,
          reason: reason || 'Metadata/Content Tampered'
        });
      } else if (reason) {
        compromised.push({
          id: entry._id.toString(),
          title: entry.title,
          reason
        });
      }
    }

    return compromised;
  } catch (error) {
    console.error('Integrity verification error:', error);
    return [];
  }
};

// Activity Logging
const logActivity = async (username, action, entityType, entityId = null, entityTitle = null, details = null) => {
  try {
    await ActivityLog.create({
      username,
      action,
      entityType,
      entityId,
      entityTitle,
      details
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

const getActivityLogs = async (options = {}) => {
  const { username, action, entityType, limit = 100, offset = 0 } = options;

  try {
    const filter = {};
    if (username) filter.username = username;
    if (action) filter.action = action;
    if (entityType) filter.entityType = entityType;

    const logs = await ActivityLog.find(filter)
      .sort({ timestamp: -1 })
      .skip(offset)
      .limit(limit);

    return logs.map(l => ({
      id: l._id.toString(),
      username: l.username,
      action: l.action,
      entity_type: l.entityType,
      entity_id: l.entityId?.toString(),
      entity_title: l.entityTitle,
      details: l.details,
      timestamp: l.timestamp
    }));
  } catch (error) {
    console.error('Error getting activity logs:', error);
    return [];
  }
};

const getLogStats = async () => {
  try {
    const totalLogs = await ActivityLog.countDocuments();
    const uniqueUsers = await ActivityLog.distinct('username').then(u => u.length);

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentActions = await ActivityLog.aggregate([
      { $match: { timestamp: { $gte: sevenDaysAgo } } },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const topUsers = await ActivityLog.aggregate([
      { $group: { _id: '$username', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    return {
      totalLogs,
      uniqueUsers,
      recentActions: recentActions.map(r => ({ action: r._id, count: r.count })),
      topUsers: topUsers.map(u => ({ username: u._id, count: u.count }))
    };
  } catch (error) {
    console.error('Error getting log stats:', error);
    return { totalLogs: 0, uniqueUsers: 0, recentActions: [], topUsers: [] };
  }
};

module.exports = {
  initDB,
  // Connection
  connect: mongoConnection.connect,
  disconnect: mongoConnection.disconnect,
  getConnectionStatus: mongoConnection.getStatus,
  getConnectionConfig: mongoConnection.getConfig,
  updateConnectionConfig: mongoConnection.updateConfig,
  testConnection: mongoConnection.testConnection,
  // Paths
  assetDir,
  userDataPath,
  // User management
  createUser,
  verifyUser,
  getAllUsers,
  deleteUser,
  updateUserRole,
  toggleUserActive,
  // Asset management
  saveAssetWithHash,
  // Tag management
  getOrCreateTag,
  setEntryTags,
  getEntryTags,
  getAllTags,
  // Entry management
  getEntries,
  getEntryById,
  createEntry,
  updateEntry,
  deleteEntry,
  restoreEntry,
  // Entry assets
  addEntryAssets,
  getEntryAssets,
  updateAssetCaption,
  // Infobox
  getEntryInfobox,
  // Search
  searchEntries,
  searchAutocomplete,
  // Integrity
  verifyIntegrity,
  // Activity logging
  logActivity,
  getActivityLogs,
  getLogStats
};
