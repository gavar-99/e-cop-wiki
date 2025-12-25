// Set Test Mode BEFORE requiring dbManager
process.env.TEST_MODE = 'true';

const { initDB, db, verifyIntegrity, assetDir } = require('../main/db/dbManager');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- Starting Integrity Shield Test ---');

// 1. Initialize DB
initDB();
console.log('DB Initialized.');

// 2. Clear previous test data
db.prepare('DELETE FROM research_entries').run();

// 3. Create a Valid Entry
const title = 'Test Entry';
const content = 'This is a valid test content.';
const assetHash = 'no-asset'; // Simulating text-only entry

const masterHash = crypto
    .createHash('sha256')
    .update(`${title}|${content}|${assetHash}`)
    .digest('hex');

db.prepare(`
    INSERT INTO research_entries (title, content, asset_path, sha256_hash)
    VALUES (?, ?, ?, ?)
`).run(title, content, null, masterHash);

console.log('Valid entry inserted.');

// 4. Verify Integrity (Should pass)
let issues = verifyIntegrity();
assert.strictEqual(issues.length, 0, 'Should have 0 integrity issues initially');
console.log('✅ PASS: Initial Integrity Check');

// 5. Tamper with the entry (Change content without updating hash)
db.prepare("UPDATE research_entries SET content = 'HACKED CONTENT' WHERE title = ?").run(title);
console.log('Entry tampered.');

// 6. Verify Integrity (Should fail)
issues = verifyIntegrity();
assert.strictEqual(issues.length, 1, 'Should detect 1 integrity issue');
assert.strictEqual(issues[0].title, title);
assert.ok(issues[0].reason.includes('Tampered'));
console.log('✅ PASS: Tamper Detection');

console.log('--- Test Complete: Success ---');
process.exit(0);
