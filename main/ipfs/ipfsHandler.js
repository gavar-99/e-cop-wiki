const path = require('path');
const fs = require('fs');
const { app } = require('electron');
const crypto = require('crypto');

/**
 * Interacts with the local IPFS node (Kubo)
 */
async function publishToSwarm(entry) {
  try {
    // 1. Prepare the JSON snapshot of the research
    const snapshot = {
      title: entry.title,
      content: entry.content,
      timestamp: entry.timestamp,
      sha256_hash: entry.sha256_hash,
      asset_name: entry.asset_path, // The hash-based filename
    };

    // 2. Add the JSON data to IPFS
    const formData = new FormData();
    const blob = new Blob([JSON.stringify(snapshot)], { type: 'application/json' });
    formData.append('file', blob);

    // Call local Kubo API (Add)
    const response = await fetch('http://127.0.0.1:5001/api/v0/add?pin=true', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    return { success: true, cid: data.Hash };
  } catch (error) {
    console.error('IPFS Publish Error:', error);
    return { success: false, message: error.message };
  }
}

async function connectToPeer(multiaddr) {
  try {
    const response = await fetch(
      `http://127.0.0.1:5001/api/v0/swarm/connect?arg=${encodeURIComponent(multiaddr)}`,
      { method: 'POST' }
    );
    const data = await response.json();
    if (data.Strings) {
      return { success: true, message: data.Strings[0] };
    }
    return { success: false, message: data.Message || 'Connection failed' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

async function getPeerId() {
    try {
        const response = await fetch('http://127.0.0.1:5001/api/v0/id', { method: 'POST' });
        const data = await response.json();
        return { success: true, id: data.ID, addresses: data.Addresses };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

async function createPrivateSwarm() {
    try {
        const keyVal = crypto.randomBytes(32).toString('hex');
        const keyContent = `/key/swarm/psk/1.0.0/\n/base16/\n${keyVal}`;
        
        const ipfsRepoPath = path.join(app.getPath('userData'), 'ipfs-repo');
        if (!fs.existsSync(ipfsRepoPath)) fs.mkdirSync(ipfsRepoPath, { recursive: true });
        
        fs.writeFileSync(path.join(ipfsRepoPath, 'swarm.key'), keyContent);
        return { success: true, message: 'Swarm Key Generated. Please Restart App.' };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

module.exports = { publishToSwarm, connectToPeer, getPeerId, createPrivateSwarm };
