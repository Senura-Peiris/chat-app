const { MongoClient } = require("mongodb");
require("dotenv").config({ path: "./.env" });

async function main() {
  const Db = process.env.ATLAS_URI;
  const client = new MongoClient(Db);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB successfully!");

    const collections = await client.db("Chatme").collections();
    console.log("📦 Collections in 'Chatme' DB:");
    collections.forEach((collection) =>
      console.log(`- ${collection.s.namespace.collection}`)
    );
  } catch (e) {
    console.error("❌ MongoDB connection failed:", e.message);
  } finally {
    await client.close();
  }
}

main();
