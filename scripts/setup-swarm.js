const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const repoPath = path.join(__dirname, '../config/ipfs-repo');
const swarmKeyPath = path.join(repoPath, 'swarm.key');

function initSwarm() {
  console.log('Initializing E-Cop Private Swarm...');

  // 1. Create config directory if it doesn't exist
  if (!fs.existsSync(repoPath)) {
    fs.mkdirSync(repoPath, { recursive: true });
  }

  // 2. Generate a Swarm Key if it doesn't exist
  // A Swarm Key is required for Private IPFS networks
  if (!fs.existsSync(swarmKeyPath)) {
    const key =
      '/key/swarm/psk/1.0.0/\n/base16/\n' + require('crypto').randomBytes(32).toString('hex');
    fs.writeFileSync(swarmKeyPath, key);
    console.log('✅ Private Swarm Key generated.');
  }

  console.log("🚀 Setup complete. Use 'npm start' to launch the vault.");
}

initSwarm();
