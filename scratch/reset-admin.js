const { MongoClient } = require('mongodb');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// Manually parse .env.local
try {
  const envContent = fs.readFileSync('.env.local', 'utf-8');
  envContent.split('\n').forEach(line => {
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
  console.error('MONGODB_URI is not set');
  process.exit(1);
}

async function resetAdmin() {
  console.log('Connecting to cloud database to sync admin credentials...');
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    
    const adminPhone = process.env.ADMIN_PHONE || '9999999999';
    const adminPassword = process.env.ADMIN_PASSWORD || 'adminpassword123';
    
    // Hash the current password from .env.local
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    // Update the admin user record in the database
    const result = await db.collection('users').updateOne(
      { role: 'admin' },
      { 
        $set: { 
          phone: adminPhone,
          password: hashedPassword,
          businessName: 'Admin Headquarters',
          email: process.env.ADMIN_EMAIL || 'admin@cigbid.com',
          isApproved: true,
          createdAt: new Date()
        } 
      },
      { upsert: true }
    );

    console.log('\n✅ Admin credentials synced successfully!');
    console.log(`- Admin Phone Number: ${adminPhone}`);
    console.log(`- Password set to: ${adminPassword} (synced from your env config)`);
    
  } catch (err) {
    console.error('Failed to sync admin credentials:', err);
  } finally {
    await client.close();
  }
}

resetAdmin();
