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
    const env = { ...process.env, IPFS_PATH: path.join(app.getAppPath(), 'config', 'ipfs-repo') };

    // Check for private swarm key
    const swarmKeyPath = path.join(app.getAppPath(), 'config', 'swarm.key');
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
    if (this.child) this.child.kill(); // Ensure node closes with app
  }
}

module.exports = new IPFSSidecar();
