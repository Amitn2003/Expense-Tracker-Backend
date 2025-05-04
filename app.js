const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require("axios");

// Load environment variables
dotenv.config();

const authRoutes = require('./routes/authRoutes');
const verifyToken = require('./middleware/authMiddleware');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Environment variables
const PORT = process.env.PORT || 5000;
const DB_URL = process.env.MONGO_URI;
const DB_API_URL = process.env.DB_API_URL;
const JWT_SECRET = process.env.JWT_SECRET;

// Connect to MongoDB
mongoose.connect(DB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB Connected');
}).catch((err) => {
  console.error('MongoDB Connection Error:', err);
});

// Sample route
app.get('/', (req, res) => {
  res.send('Backend is running...');
});


app.use('/api', authRoutes);


app.get('/api/dashboard', verifyToken, (req, res) => {
  res.json({ message: 'Welcome to the protected dashboard', user: req.user });
});


// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
