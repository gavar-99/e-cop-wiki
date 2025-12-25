const { spawn } = require('child_process');
const path = require('path');
const { app } = require('electron');

class IPFSSidecar {
  constructor() {
    // Path to your bundled kubo binary
    this.binary = path.join(app.getAppPath(), 'bin', 'kubo', 'ipfs.exe');
    this.child = null;
  }

  start() {
    const ipfsRepoPath = path.join(app.getPath('userData'), 'ipfs-repo');
    const env = {
      ...process.env,
      IPFS_PATH: ipfsRepoPath,
    };

    // Check for private swarm key in the repo
    // Kubo looks for 'swarm.key' in IPFS_PATH automatically.
    const swarmKeyPath = path.join(ipfsRepoPath, 'swarm.key');
    if (require('fs').existsSync(swarmKeyPath)) {
      env.LIBP2P_FORCE_PNET = '1'; // Force Private Network mode
    }

    this.child = spawn(this.binary, ['daemon', '--enable-gc'], { env });

    this.child.stdout.on('data', (data) => {
      if (data.toString().includes('Daemon is ready')) {
        console.log('IPFS Sidecar: Private Swarm Online.');
      }
    });
  }

  stop() {
    try {
      if (this.child) {
        this.child.kill();
        this.child = null;
      }
    } catch (error) {
      console.error('IPFS Sidecar Cleanup Error:', error);
    }
  }
}

module.exports = new IPFSSidecar();
