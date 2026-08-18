const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');


dotenv.config();

const { connectDB } = require('./config/db');
const BlockchainLedger = require('./blockchain/ledger');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');


const authRoutes = require('./routes/auth');
const certificateRoutes = require('./routes/certificates');
const verifyRoutes = require('./routes/verify');
const consensusRoutes = require('./routes/consensus');
const blockchainRoutes = require('./routes/blockchain');
const auditRoutes = require('./routes/audit');
const demoRoutes = require('./routes/demo');

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Parsing Middleware
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

const uploadsPath = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));

app.use('/api', apiLimiter);


app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    system: 'Credora v2 Credential Verification Engine',
    team: 'DeepThinkers (HV2026-0001)',
    problemStatement: 'HV-CYB-03',
    timestamp: new Date().toISOString(),
    database: 'MongoDB Atlas / Active',
    cloudStorage: process.env.CLOUDINARY_CLOUD_NAME ? 'Cloudinary Active' : 'Local Fallback Storage',
    blockchainMode: process.env.USE_REAL_CHAIN === 'true' ? 'Public Testnet + Local Ledger' : 'Local SHA-256 Ledger',
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/certificates', consensusRoutes);
app.use('/api/verify', verifyRoutes);
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/demo', demoRoutes);

// Centralized Error Handling
app.use(errorHandler);

const User = require('./models/User');
const { seedData } = require('./seed');

// Start server
const startServer = async () => {
  try {
    await connectDB();
    await BlockchainLedger.initLedger();

    const userCount = await User.countDocuments();
    if (userCount === 0) {
      
      await seedData(false);
    }

    app.listen(PORT, () => {
      
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app;
