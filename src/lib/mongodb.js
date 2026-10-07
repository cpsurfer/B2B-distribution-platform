import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const options = {
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
};

let client;
let clientPromise;

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env.local');
}

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;

export async function getDb() {
  const conn = await clientPromise;
  const db = conn.db(process.env.MONGODB_DB_NAME || 'cig-bid');

  // Securely auto-seed the hardcoded admin user if not present in the database.
  // This reads the private ADMIN_PASSWORD and ADMIN_PHONE from .env.local on the server.
  try {
    const adminPhone = process.env.ADMIN_PHONE || '9999999999';
    const adminExists = await db.collection('users').findOne({ role: 'admin' });
    
    if (!adminExists) {
      // Dynamic import to prevent circular dependency structures
      const { hashPassword } = await import('./auth');
      const adminPassword = process.env.ADMIN_PASSWORD || 'adminpassword123';
      const hashedPassword = await hashPassword(adminPassword);
      
      await db.collection('users').insertOne({
        phone: adminPhone,
        password: hashedPassword,
        businessName: 'Admin Headquarters',
        email: process.env.ADMIN_EMAIL || 'admin@cigbid.com',
        role: 'admin',
        isApproved: true,
        createdAt: new Date(),
      });
      console.log('Secure hardcoded admin user initialized.');
    }
  } catch (error) {
    console.error('Error during database initialization/seeding:', error);
  }

  return db;
}
