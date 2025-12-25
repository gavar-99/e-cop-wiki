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

        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            salt TEXT NOT NULL,
            hash TEXT NOT NULL,
            role TEXT NOT NULL
        );
    `);

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
    // Clear old data for the upgrade
    try {
        db.prepare('DELETE FROM research_entries').run();
        // Reset auto-increment
        db.prepare("DELETE FROM sqlite_sequence WHERE name='research_entries'").run();
    } catch (e) {
        console.log('Seed cleanup skipped:', e.message);
    }

    console.log('Seeding Extended WW2 Knowledge Graph...');

    const samples = [
        {
            title: 'Operation Overlord',
            content: 'Operation Overlord was the codename for the [[Battle of Normandy]], the Allied operation that launched the successful invasion of German-occupied Western Europe during World War II. The operation commenced on 6 June 1944 with the [[D-Day]] landings. A 1,200-plane airborne assault preceded an amphibious assault involving more than 5,000 vessels. Nearly 160,000 troops crossed the English Channel on 6 June, and more than two million Allied troops were in France by the end of August.'
        },
        {
            title: 'Battle of Normandy',
            content: 'The Battle of Normandy lasted from June 1944 to August 1944, resulting in the Allied liberation of Western Europe from Nazi Germany’s control. Key conflicts included the landings at [[Omaha Beach]], [[Pointe du Hoc]], and the capture of [[Pegasus Bridge]]. The battle concluded with the Liberation of Paris and the fall of the Falaise Pocket.'
        },
        {
            title: 'D-Day',
            content: 'D-Day (June 6, 1944) marked the start of [[Operation Overlord]]. More than 156,000 American, British, and Canadian troops stormed 50 miles of Normandy\'s fiercely defended beaches. It remains the largest seaborne invasion in history. The operation was overseen by General [[Dwight D. Eisenhower]].'
        },
        {
            title: 'Omaha Beach',
            content: 'Omaha Beach was the code name for one of the five sectors of the Allied invasion of German-occupied France in the Normandy landings. It was the most heavily defended beach, assigned to the US 1st and 29th Infantry Divisions. The opposing German 352nd Infantry Division, under Field Marshal [[Erwin Rommel]]\'s broader command defenses, inflicted heavy casualties.'
        },
        {
            title: 'Dwight D. Eisenhower',
            content: 'General Dwight David "Ike" Eisenhower was the Supreme Commander of the Allied Expeditionary Force in Europe. He planned and supervised the invasion of North Africa in Operation Torch in 1942–1943 and the successful invasion of Normandy in 1944–1945 from the Western Front.'
        },
        {
            title: 'Erwin Rommel',
            content: 'Erwin Rommel, popularly known as the Desert Fox, was a German field marshal of World War II. In 1944, he was entrusted with the defense of the French coast against the anticipated Allied invasion ([[Operation Overlord]]). He strengthened the Atlantic Wall significantly but was absent on [[D-Day]] due to his wife\'s birthday.'
        },
        {
            title: '101st Airborne Division',
            content: 'The 101st Airborne Division ("Screaming Eagles") is a specialized modular light infantry division of the US Army. During World War II, it was renowned for its role in [[Operation Overlord]], the airborne landings in the Netherlands (Operation Market Garden), and the Battle of the Bulge.'
        },
        {
            title: 'Pointe du Hoc',
            content: 'Pointe du Hoc is a promontory with a 100 ft (30 m) cliff overlooking the English Channel on the northwestern coast of Normandy. During World War II it was the highest point between Utah Beach to the west and [[Omaha Beach]] to the east. The German army fortified the area with concrete casemates and gun pits. On [[D-Day]], the United States Army Ranger Assault Group assaulted and captured Pointe du Hoc after scaling the cliffs.'
        },
        {
            title: 'Pegasus Bridge',
            content: 'Pegasus Bridge, originally the Bénouville Bridge, is a road bridge over the Caen Canal, between Caen and Ouistreham in Normandy. The successful capture of the bridge was a critical objective of the British airborne troops during the opening minutes of the Allied invasion of Normandy.'
        }
    ];

    const insert = db.prepare(`
        INSERT INTO research_entries (title, content, asset_path, sha256_hash)
        VALUES (?, ?, ?, ?)
    `);

    samples.forEach(s => {
        const masterHash = crypto
            .createHash('sha256')
            .update(`${s.title}|${s.content}|no-asset`)
            .digest('hex');
        
        insert.run(s.title, s.content, null, masterHash);
    });
    console.log('Extended WW2 Knowledge Graph Seeded.');
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
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user) return { success: false, message: 'User not found' };

    const hash = crypto.scryptSync(password, user.salt, 64).toString('hex');
    if (hash === user.hash) {
        return { success: true, role: user.role, username: user.username };
    }
    return { success: false, message: 'Invalid credentials' };
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

    const calculatedMasterHash = crypto
      .createHash('sha256')
      .update(`${entry.title}|${entry.content}|${isAssetValid ? currentAssetHash : 'no-asset'}`)
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

module.exports = { initDB, db, saveAssetWithHash, verifyIntegrity, createUser, verifyUser, assetDir };
