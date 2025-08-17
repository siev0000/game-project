require('dotenv').config();
const { MongoClient } = require('mongodb');

(async () => {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    console.log("✅ Connected");
    const db = client.db();
    console.log("DB:", db.databaseName);
    await client.close();
  } catch (e) {
    console.error("❌ MongoDB error:", e.message);
  }
})();
