const mongoose = require('mongoose');

let isConnectedToRealMongo = false;
let mongoMemoryServerInstance = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const uri = process.env.MONGODB_URI;

  if (uri && uri.trim().length > 0 && !uri.includes('your_mongodb_cluster') && !uri.includes('username:password')) {
    try {
      console.log(`[Database] Attempting connection to MongoDB Atlas URI: ${uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`);
      const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 4000 });
      console.log(`[Database] Connected to remote MongoDB Atlas: ${conn.connection.host}`);
      isConnectedToRealMongo = true;
      return conn;
    } catch (err) {
      console.warn(`[Database] MongoDB Atlas connection unavailable (${err.message}). Activating embedded zero-setup document store.`);
    }
  }

  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    if (!mongoMemoryServerInstance) {
      mongoMemoryServerInstance = await MongoMemoryServer.create();
    }
    const memUri = mongoMemoryServerInstance.getUri();
    const conn = await mongoose.connect(memUri);
    console.log(`[Database] Connected to embedded in-memory MongoDB (${memUri}). Mongoose models ready.`);
    isConnectedToRealMongo = false;
    return conn;
  } catch (memErr) {
    console.error('[Database] Failed to start embedded MongoDB in-memory server:', memErr.message);
    throw memErr;
  }
};

const disconnectDB = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongoMemoryServerInstance) {
      await mongoMemoryServerInstance.stop();
      mongoMemoryServerInstance = null;
    }
  } catch (err) {
    console.warn('[Database] Error during disconnect:', err.message);
  }
};

const isRealMongo = () => isConnectedToRealMongo;

module.exports = { connectDB, disconnectDB, isRealMongo };

