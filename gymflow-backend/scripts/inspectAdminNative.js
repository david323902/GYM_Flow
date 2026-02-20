const { MongoClient } = require('mongodb');
require('dotenv').config({ path: './server/.env' });

async function inspect() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/gymflow';
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('gymflow');
    const admin = await db.collection('admins').findOne({ email: 'admin@gymflow.com' });
    console.log('=== Admin document ===');
    console.log(admin);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

inspect();
