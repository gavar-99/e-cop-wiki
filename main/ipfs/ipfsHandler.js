const path = require('path');
const fs = require('fs');
const { app } = require('electron');

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

module.exports = { publishToSwarm };
