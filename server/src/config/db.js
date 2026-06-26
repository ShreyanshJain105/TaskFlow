const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    // Fail loudly at startup rather than getting cryptic errors later
    console.error('MONGO_URI is not set. Check your .env file.');
    process.exit(1);
  }

  const conn = await mongoose.connect(uri);
  console.log(`MongoDB connected: ${conn.connection.host}`);
};

module.exports = connectDB;
