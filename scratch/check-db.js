const { MongoClient } = require('mongodb');
const fs = require('fs');

// Manually parse .env.local
try {
  const envContent = fs.readFileSync('.env.local', 'utf-8');
  envContent.split('\n').forEach(line => {
    // Ignore comments and empty lines
    if (line.trim().startsWith('#') || !line.trim()) return;
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      process.env[key] = val;
    }
  });
} catch (err) {
  console.error('Error reading .env.local file:', err);
}

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'cig-bid';

if (!uri) {
  console.error('MONGODB_URI is not set in process.env');
  process.exit(1);
}

async function checkDb() {
  console.log('Connecting to cloud MongoDB Atlas database...');
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('Connected successfully!');
    const db = client.db(dbName);
    
    // List all users
    const users = await db.collection('users').find({}).toArray();
    console.log('\n--- Registered Users in Database ---');
    if (users.length === 0) {
      console.log('No users found in database!');
    } else {
      users.forEach(u => {
        console.log(`- Shop Name: ${u.businessName || 'N/A'}`);
        console.log(`  Phone: ${u.phone}`);
        console.log(`  Role: ${u.role}`);
        console.log(`  Approved: ${u.isApproved}`);
        console.log(`  Created At: ${u.createdAt}`);
        console.log(`  Password Hash: ${u.password ? u.password.substring(0, 15) : 'NONE'}...`);
        console.log('-----------------------------------');
      });
    }

  } catch (err) {
    console.error('Error connecting to database:', err);
  } finally {
    await client.close();
  }
}

checkDb();
