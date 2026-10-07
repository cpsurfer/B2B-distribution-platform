const { MongoMemoryServer } = require('mongodb-memory-server');
const { spawn } = require('child_process');

(async () => {
  try {
    // Start MongoDB Memory Server
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    console.log('✅ In-memory MongoDB started at:', uri);

    // Set Environment Variables
    process.env.MONGODB_URI = uri;
    process.env.MONGODB_DB_NAME = 'cig-bid';
    process.env.JWT_SECRET = 'local-secret-12345';
    process.env.ADMIN_PHONE = '9999999999';
    process.env.ADMIN_PASSWORD = 'admin';

    // Start Next.js Development Server
    // Use npm.cmd on Windows to avoid execution policy issues
    const isWin = process.platform === 'win32';
    const npmCmd = isWin ? 'npm.cmd' : 'npm';
    
    console.log('🚀 Starting Next.js development server...');
    const child = spawn(npmCmd, ['run', 'dev'], {
      stdio: 'inherit',
      shell: true,
      env: process.env
    });

    child.on('close', (code) => {
      console.log('Next.js process exited with code', code);
      mongod.stop();
    });

    process.on('SIGINT', async () => {
      console.log('Stopping server...');
      await mongod.stop();
      process.exit();
    });

  } catch (err) {
    console.error('Failed to start development environment:', err);
    process.exit(1);
  }
})();
