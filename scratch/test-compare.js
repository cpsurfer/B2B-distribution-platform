const { MongoClient } = require('mongodb');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// Parse env
try {
  const envContent = fs.readFileSync('.env.local', 'utf-8');
  envContent.split('\n').forEach(line => {
    if (line.trim().startsWith('#') || !line.trim()) return;
    const parts = line.split('=');
    if (parts.length >= 2) {
      process.env[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
  });
} catch (err) {}

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'cig-bid';

async function testCompare() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    
    const user = await db.collection('users').findOne({ phone: '9999999999' });
    if (!user) {
      console.log('Admin user 9999999999 not found in DB!');
      return;
    }
    
    console.log('Database Admin Info:');
    console.log(`- Phone: ${user.phone}`);
    console.log(`- Password Hash: ${user.password}`);
    
    // Compare password
    const testPassword = 'adminpassword123';
    const isMatch = await bcrypt.compare(testPassword, user.password);
    console.log(`\nTesting comparison with "${testPassword}":`);
    console.log(`Match Result: ${isMatch ? '✅ MATCHES!' : '❌ DOES NOT MATCH!'}`);

    // If it fails, let's create a new hash here and test it
    if (!isMatch) {
      console.log('\nCreating new hash manually...');
      const salt = await bcrypt.genSalt(10);
      const newHash = await bcrypt.hash(testPassword, salt);
      console.log(`New Hash: ${newHash}`);
      const testMatch = await bcrypt.compare(testPassword, newHash);
      console.log(`New Hash Match Result: ${testMatch ? '✅ MATCHES!' : '❌ DOES NOT MATCH!'}`);
    }

  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

testCompare();
