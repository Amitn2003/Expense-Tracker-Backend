// backend/routes/loginRoute.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
const DB_API_BASE = process.env.DB_API_BASE; // e.g., http://localhost:7000 or your API endpoint

// POST /api/login
router.post('/login', async (req, res) => {
  const { gmail, user_password } = req.body;

  if (!gmail || !user_password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  try {
    // Step 1: Verify user login credentials
    const loginRes = await axios.get(`${DB_API_BASE}/LOGIN/GET_JIT/${gmail}/${user_password}`);
    const items = loginRes.data.items;

    if (!items || items.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const { reg_id } = items[0];

    // Step 2: Fetch full user info from TOTAL_INFO/FILTER_GET/:reg_id
    const userRes = await axios.get(`${DB_API_BASE}/TOTAL_INFO/FILTER_GET/${reg_id}`);
    const userInfo = userRes.data.items && userRes.data.items[0];

    if (!userInfo) {
      return res.status(404).json({ success: false, message: 'User info not found' });
    }

    // Remove password before sending to frontend
    const { user_password: _, ...userWithoutPassword } = userInfo;

    // Step 3: Sign JWT token with user info
    const token = jwt.sign(userWithoutPassword, JWT_SECRET, { expiresIn: '2h' });

    return res.json({ success: true, token, user: userWithoutPassword });
  } catch (err) {
    console.error('Login error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
