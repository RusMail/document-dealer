const express = require('express');
const cors = require('cors');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const authRoutes = require('./routes/auth');
const contractorRoutes = require('./routes/contractors');
const documentRoutes = require('./routes/documents');

require('dotenv').config();
console.log('JWT_SECRET loaded:', process.env.JWT_SECRET ? 'YES' : 'NO');
console.log('JWT_SECRET value:', process.env.JWT_SECRET);

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/contractors', contractorRoutes);
app.use('/api/documents', documentRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
