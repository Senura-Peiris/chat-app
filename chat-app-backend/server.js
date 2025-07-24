const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const authRoutes = require('./routes/auth');

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);

// Serve static files from the uploads folder (absolute path)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


console.log("Loaded env keys:", Object.keys(process.env));
console.log("ATLAS_URI:", process.env.ATLAS_URI);

mongoose.connect(process.env.ATLAS_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('✅ Connected to MongoDB Atlas');

  // List collections in the current database
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  console.log('📦 Collections in the connected database:');
  collections.forEach(col => console.log(` - ${col.name}`));

  // OPTIONAL: List databases (admin privilege required)
  const admin = db.admin();
  const result = await admin.listDatabases();
  console.log('🗃️ Databases on this cluster:');
  result.databases.forEach(db => {
    console.log(` - ${db.name}`);
  });
})
.catch((err) => console.error('❌ MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
