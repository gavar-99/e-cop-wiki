const Database = require('better-sqlite3');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');

let userDataPath;
try {
  // Check for explicit test mode or missing Electron app
  if (process.env.TEST_MODE === 'true') {
     throw new Error('Test Mode Active');
  }

  const electron = require('electron');
  if (electron.app) {
    userDataPath = electron.app.getPath('userData');
  } else {
    throw new Error('Electron app not available');
  }
} catch (e) {
  // Fallback for testing environment
  console.log('Running in detached/test mode. Using temp directory.');
  userDataPath = path.join(os.tmpdir(), 'ecop-wiki-test');
}

const vaultDir = path.join(userDataPath, 'vault');
const assetDir = path.join(userDataPath, 'assets');

// Ensure persistent directories exist
if (!fs.existsSync(vaultDir)) fs.mkdirSync(vaultDir, { recursive: true });
if (!fs.existsSync(assetDir)) fs.mkdirSync(assetDir, { recursive: true });

const dbPath = path.join(vaultDir, 'vault.db');
const db = new Database(dbPath);

const migrateExistingEntries = () => {
  console.log('Migrating existing entries to new tag-aware schema...');

  const entries = db.prepare('SELECT * FROM research_entries').all();

  for (const entry of entries) {
    // Recalculate SHA-256 with empty tags
    let assetHash = 'no-asset';

    if (entry.asset_path) {
      const filePath = path.join(assetDir, entry.asset_path);
      if (fs.existsSync(filePath)) {
        const fileBuffer = fs.readFileSync(filePath);
        assetHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
      }
    }

    // New fingerprint: title|content|tags|assetHash (empty tags = '')
    const newMasterHash = crypto
      .createHash('sha256')
      .update(`${entry.title}|${entry.content}||${assetHash}`)
      .digest('hex');

    // Update the hash
    db.prepare('UPDATE research_entries SET sha256_hash = ? WHERE id = ?')
      .run(newMasterHash, entry.id);
  }

  // Populate FTS5 with existing entries
  try {
    const insertFts = db.prepare(`
      INSERT INTO research_fts(rowid, title, content, tags)
      SELECT id, title, content, '' FROM research_entries
    `);
    insertFts.run();
    console.log('FTS5 table populated with existing entries.');
  } catch (e) {
    console.log('FTS5 population skipped:', e.message);
  }

  console.log('Migration complete.');
};

const initDB = () => {
  db.exec(`
        CREATE TABLE IF NOT EXISTS research_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            asset_path TEXT,
            sha256_hash TEXT UNIQUE,
            ipfs_cid TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS tags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE COLLATE NOCASE NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS entry_tags (
            entry_id INTEGER NOT NULL,
            tag_id INTEGER NOT NULL,
            PRIMARY KEY (entry_id, tag_id),
            FOREIGN KEY (entry_id) REFERENCES research_entries(id) ON DELETE CASCADE,
            FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_entry_tags_entry ON entry_tags(entry_id);
        CREATE INDEX IF NOT EXISTS idx_entry_tags_tag ON entry_tags(tag_id);

        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            salt TEXT NOT NULL,
            hash TEXT NOT NULL,
            role TEXT NOT NULL,
            active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Add active column to existing users table if it doesn't exist
    try {
        db.exec(`ALTER TABLE users ADD COLUMN active INTEGER DEFAULT 1`);
        console.log('Added active column to users table');
    } catch (e) {
        // Column already exists, ignore
    }

    // Add created_at column to existing users table if it doesn't exist
    // Note: SQLite doesn't support non-constant defaults in ALTER TABLE
    try {
        db.exec(`ALTER TABLE users ADD COLUMN created_at DATETIME`);
        console.log('Added created_at column to users table');
        // Update existing users to have current timestamp
        db.exec(`UPDATE users SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL`);
    } catch (e) {
        // Column already exists, ignore
    }

    // Create FTS5 virtual table if not exists
    try {
        db.exec(`
            CREATE VIRTUAL TABLE IF NOT EXISTS research_fts USING fts5(
                title,
                content,
                tags
            );
        `);
    } catch (e) {
        console.log('FTS5 table creation skipped:', e.message);
    }

    // Note: FTS5 table is manually managed through setEntryTags and updateFtsTags functions

    // Check if migration is needed
    const needsMigration = db.prepare("SELECT COUNT(*) as count FROM research_entries").get().count > 0 &&
                          db.prepare("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='research_fts'").get().count === 0;

    if (needsMigration) {
        migrateExistingEntries();
    }

    // Seed Default Admin
    const admin = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
    if (!admin) {
        createUser('admin', 'admin123', 'admin');
        console.log('Default Admin Account Created: admin / admin123');
    }

    // Seed Test Editor
    const editor = db.prepare('SELECT * FROM users WHERE username = ?').get('editor');
    if (!editor) {
        createUser('editor', 'editor123', 'editor');
        console.log('Test Editor Account Created: editor / editor123');
    }

    // Seed Test Reader
    const reader = db.prepare('SELECT * FROM users WHERE username = ?').get('reader');
    if (!reader) {
        createUser('reader', 'reader123', 'reader');
        console.log('Test Reader Account Created: reader / reader123');
    }

    seedResearch();
};

const seedResearch = () => {
    // Check if database already has data
    const existingEntries = db.prepare('SELECT COUNT(*) as count FROM research_entries').get();
    if (existingEntries.count > 0) {
        console.log('Database already seeded, skipping seed data.');
        return;
    }

    console.log('Seeding Extended WW2 Knowledge Graph with Tags...');

    const samples = [
        {
            title: 'Operation Overlord',
            content: 'Operation Overlord was the codename for the [[Battle of Normandy]], the Allied operation that launched the successful invasion of German-occupied Western Europe during World War II. The operation commenced on 6 June 1944 with the [[D-Day]] landings. A 1,200-plane airborne assault preceded an amphibious assault involving more than 5,000 vessels. Nearly 160,000 troops crossed the English Channel on 6 June, and more than two million Allied troops were in France by the end of August.',
            tags: ['WW2', 'Military Operation', 'Allied Forces', '1944']
        },
        {
            title: 'Battle of Normandy',
            content: 'The Battle of Normandy lasted from June 1944 to August 1944, resulting in the Allied liberation of Western Europe from Nazi Germany\'s control. Key conflicts included the landings at [[Omaha Beach]], [[Pointe du Hoc]], and the capture of [[Pegasus Bridge]]. The battle concluded with the Liberation of Paris and the fall of the Falaise Pocket.',
            tags: ['WW2', 'France', '1944', 'Allied Victory']
        },
        {
            title: 'D-Day',
            content: 'D-Day (June 6, 1944) marked the start of [[Operation Overlord]]. More than 156,000 American, British, and Canadian troops stormed 50 miles of Normandy\'s fiercely defended beaches. It remains the largest seaborne invasion in history. The operation was overseen by General [[Dwight D. Eisenhower]].',
            tags: ['WW2', '1944', 'Normandy', 'Invasion']
        },
        {
            title: 'Omaha Beach',
            content: 'Omaha Beach was the code name for one of the five sectors of the Allied invasion of German-occupied France in the Normandy landings. It was the most heavily defended beach, assigned to the US 1st and 29th Infantry Divisions. The opposing German 352nd Infantry Division, under Field Marshal [[Erwin Rommel]]\'s broader command defenses, inflicted heavy casualties.',
            tags: ['WW2', 'Normandy', '1944', 'US Forces']
        },
        {
            title: 'Dwight D. Eisenhower',
            content: 'General Dwight David "Ike" Eisenhower was the Supreme Commander of the Allied Expeditionary Force in Europe. He planned and supervised the invasion of North Africa in Operation Torch in 1942–1943 and the successful invasion of Normandy in 1944–1945 from the Western Front.',
            tags: ['WW2', 'Allied Commander', 'US', 'Biography']
        },
        {
            title: 'Erwin Rommel',
            content: 'Erwin Rommel, popularly known as the Desert Fox, was a German field marshal of World War II. In 1944, he was entrusted with the defense of the French coast against the anticipated Allied invasion ([[Operation Overlord]]). He strengthened the Atlantic Wall significantly but was absent on [[D-Day]] due to his wife\'s birthday.',
            tags: ['WW2', 'German Commander', 'Biography', 'Atlantic Wall']
        },
        {
            title: '101st Airborne Division',
            content: 'The 101st Airborne Division ("Screaming Eagles") is a specialized modular light infantry division of the US Army. During World War II, it was renowned for its role in [[Operation Overlord]], the airborne landings in the Netherlands (Operation Market Garden), and the Battle of the Bulge.',
            tags: ['WW2', 'US Forces', 'Airborne', 'Military Unit']
        },
        {
            title: 'Pointe du Hoc',
            content: 'Pointe du Hoc is a promontory with a 100 ft (30 m) cliff overlooking the English Channel on the northwestern coast of Normandy. During World War II it was the highest point between Utah Beach to the west and [[Omaha Beach]] to the east. The German army fortified the area with concrete casemates and gun pits. On [[D-Day]], the United States Army Ranger Assault Group assaulted and captured Pointe du Hoc after scaling the cliffs.',
            tags: ['WW2', 'Normandy', 'US Forces', '1944']
        },
        {
            title: 'Pegasus Bridge',
            content: 'Pegasus Bridge, originally the Bénouville Bridge, is a road bridge over the Caen Canal, between Caen and Ouistreham in Normandy. The successful capture of the bridge was a critical objective of the British airborne troops during the opening minutes of the Allied invasion of Normandy.',
            tags: ['WW2', 'Normandy', 'British Forces', '1944']
        }
    ];

    const insert = db.prepare(`
        INSERT INTO research_entries (title, content, asset_path, sha256_hash)
        VALUES (?, ?, ?, ?)
    `);

    samples.forEach(s => {
        const sortedTags = (s.tags || []).slice().sort();
        const tagsString = sortedTags.join(',');

        const masterHash = crypto
            .createHash('sha256')
            .update(`${s.title}|${s.content}|${tagsString}|no-asset`)
            .digest('hex');

        const result = insert.run(s.title, s.content, null, masterHash);
        const entryId = result.lastInsertRowid;

        // Add tags
        if (s.tags) {
            setEntryTags(entryId, s.tags);
        }
    });
    console.log('Extended WW2 Knowledge Graph Seeded with Tags.');
};

const createUser = (username, password, role) => {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    
    try {
        const insert = db.prepare('INSERT INTO users (username, salt, hash, role) VALUES (?, ?, ?, ?)');
        insert.run(username, salt, hash, role);
        return { success: true };
    } catch (error) {
        return { success: false, message: error.message };
    }
};

const verifyUser = (username, password) => {
    const user = db.prepare('SELECT * FROM users WHERE username = ? AND active = 1').get(username);
    if (!user) return { success: false, message: 'User not found or deactivated' };

    const hash = crypto.scryptSync(password, user.salt, 64).toString('hex');
    if (hash === user.hash) {
        return { success: true, role: user.role, username: user.username };
    }
    return { success: false, message: 'Invalid credentials' };
};

const getAllUsers = () => {
    return db.prepare('SELECT id, username, role, active, created_at FROM users ORDER BY created_at DESC').all();
};

const deleteUser = (username) => {
    try {
        db.prepare('DELETE FROM users WHERE username = ?').run(username);
        return { success: true };
    } catch (error) {
        return { success: false, message: error.message };
    }
};

const updateUserRole = (username, newRole) => {
    try {
        db.prepare('UPDATE users SET role = ? WHERE username = ?').run(newRole, username);
        return { success: true };
    } catch (error) {
        return { success: false, message: error.message };
    }
};

const toggleUserActive = (username) => {
    try {
        const user = db.prepare('SELECT active FROM users WHERE username = ?').get(username);
        if (!user) return { success: false, message: 'User not found' };

        const newActive = user.active === 1 ? 0 : 1;
        db.prepare('UPDATE users SET active = ? WHERE username = ?').run(newActive, username);
        return { success: true, active: newActive };
    } catch (error) {
        return { success: false, message: error.message };
    }
};

/**
 * Saves assets using Content-Addressable logic in the Hardened path.
 */
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

const verifyIntegrity = () => {
  const entries = db.prepare('SELECT * FROM research_entries').all();
  const compromised = [];

  for (const entry of entries) {
    let currentAssetHash = 'no-asset';
    let isAssetValid = true;
    let reason = null;

    if (entry.asset_path) {
      const filePath = path.join(assetDir, entry.asset_path);
      if (fs.existsSync(filePath)) {
        const fileBuffer = fs.readFileSync(filePath);
        currentAssetHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
      } else {
        isAssetValid = false;
        reason = 'Asset Missing';
      }
    }

    // Get tags for this entry
    const tags = getEntryTags(entry.id);
    const sortedTags = tags.map(t => t.name).sort();
    const tagsString = sortedTags.join(',');

    const calculatedMasterHash = crypto
      .createHash('sha256')
      .update(`${entry.title}|${entry.content}|${tagsString}|${isAssetValid ? currentAssetHash : 'no-asset'}`)
      .digest('hex');

    if (calculatedMasterHash !== entry.sha256_hash) {
      compromised.push({
        id: entry.id,
        title: entry.title,
        reason: reason || 'Metadata/Content Tampered',
      });
    } else if (!isAssetValid) {
        // Fallback if hash matches (unlikely if asset missing implies hash change, but for safety)
         compromised.push({
            id: entry.id,
            title: entry.title,
            reason: reason
        });
    }
  }
  return compromised;
};

/**
 * Get or create a tag (case-insensitive)
 * Returns tag ID
 */
const getOrCreateTag = (tagName) => {
  const normalized = tagName.trim();
  if (!normalized) return null;

  // Try to find existing tag (case-insensitive due to COLLATE NOCASE)
  let tag = db.prepare('SELECT id FROM tags WHERE name = ?').get(normalized);

  if (!tag) {
    // Create new tag
    const result = db.prepare('INSERT INTO tags (name) VALUES (?)').run(normalized);
    return result.lastInsertRowid;
  }

  return tag.id;
};

/**
 * Associate tags with an entry
 * @param {number} entryId
 * @param {string[]} tagNames - Array of tag names
 */
const setEntryTags = (entryId, tagNames = []) => {
  // Clear existing associations
  db.prepare('DELETE FROM entry_tags WHERE entry_id = ?').run(entryId);

  // Add new associations
  const insertLink = db.prepare('INSERT OR IGNORE INTO entry_tags (entry_id, tag_id) VALUES (?, ?)');

  for (const tagName of tagNames) {
    const tagId = getOrCreateTag(tagName);
    if (tagId) {
      insertLink.run(entryId, tagId);
    }
  }

  // Update FTS5 tags column
  updateFtsTags(entryId);
};

/**
 * Get all tags for an entry
 */
const getEntryTags = (entryId) => {
  return db.prepare(`
    SELECT t.id, t.name
    FROM tags t
    INNER JOIN entry_tags et ON et.tag_id = t.id
    WHERE et.entry_id = ?
    ORDER BY t.name
  `).all(entryId);
};

/**
 * Get all unique tags with usage count (for autocomplete)
 */
const getAllTags = () => {
  return db.prepare(`
    SELECT t.id, t.name, COUNT(et.entry_id) as count
    FROM tags t
    LEFT JOIN entry_tags et ON et.tag_id = t.id
    GROUP BY t.id, t.name
    ORDER BY count DESC, t.name ASC
  `).all();
};

/**
 * Update FTS5 entry for a specific entry
 */
const updateFtsTags = (entryId) => {
  const entry = db.prepare('SELECT * FROM research_entries WHERE id = ?').get(entryId);
  if (!entry) return;

  const tags = getEntryTags(entryId);
  const tagString = tags.map(t => t.name).join(' ');

  // Delete existing FTS5 entry
  db.prepare('DELETE FROM research_fts WHERE rowid = ?').run(entryId);

  // Insert updated FTS5 entry
  db.prepare('INSERT INTO research_fts(rowid, title, content, tags) VALUES (?, ?, ?, ?)')
    .run(entryId, entry.title, entry.content, tagString);
};

/**
 * Search entries using FTS5
 * @param {string} query - Search query
 * @returns {Array} Matching entry IDs ranked by relevance
 */
const searchEntries = (query) => {
  if (!query || !query.trim()) {
    return [];
  }

  // FTS5 query syntax: searches across title, content, and tags
  const results = db.prepare(`
    SELECT rowid, rank
    FROM research_fts
    WHERE research_fts MATCH ?
    ORDER BY rank
    LIMIT 50
  `).all(query);

  return results.map(r => r.rowid);
};

module.exports = {
  initDB,
  db,
  saveAssetWithHash,
  verifyIntegrity,
  createUser,
  verifyUser,
  getAllUsers,
  deleteUser,
  updateUserRole,
  toggleUserActive,
  assetDir,
  getOrCreateTag,
  setEntryTags,
  getEntryTags,
  getAllTags,
  searchEntries
};
