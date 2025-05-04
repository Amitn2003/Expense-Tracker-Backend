const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const router = express.Router();

const DB_API_URL = process.env.DB_API_URL;
const JWT_SECRET = process.env.JWT_SECRET;





router.post("/register-step1", async (req, res) => {
  try {
    // const requestData = {
    //   FIRST_NAME: 'hht',
    //   SECOND_NAME: 'rbvfb',
    //   GMAIL: 'regerg@fdhg.regd',
    //   PHONE_NUMBER: '35435435345',
    //   AGE: 32, // Ensure AGE is a number
    //   GENDER: 'male'
    // };
    const requestData = {
      FIRST_NAME: req.body.FIRST_NAME,
      SECOND_NAME: req.body.SECOND_NAME,
      GMAIL: req.body.GMAIL,
      PHONE_NUMBER: req.body.PHONE_NUMBER,
      AGE: Number(req.body.AGE),
      GENDER: req.body.GENDER
    };
    console.log(JSON.stringify(requestData))
    console.log(`${process.env.DB_API_URL}/REG/POST/`)
    // const response = await axios.post(`${process.env.DB_API_URL}/REG/POST/`, requestData );
    await fetch(`${process.env.DB_API_URL}/REG/POST/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestData)
    })
    .then(response => response.text()) // Get the response as text (HTML)
    .then(html => {
      // Check if the error message is present in the HTML
      const errorMatch = html.match(/Error: ORA-\d{5}: unique constraint \((.*?)\) violated/);
      if (errorMatch) {
        console.error('Oracle Error:', errorMatch[0]);
      } else {
        console.log('Request was successful');
      }
    })
    .catch(error => {
      console.error('Network or other error:', error);
    });



    try {
      const response = await fetch(`${process.env.DB_API_URL}/REG/GET/`);
      const data = await response.json(); // Parse the JSON from the response
      console.log(data); // Print the response data
    
      const matchedUser = data.items.find((user) => {
        return (
          user.gmail &&
          req.body.GMAIL &&
          user.gmail.toLowerCase() === requestData.GMAIL.toLowerCase()
        );
      });
      console.log(matchedUser)
      
    
      if (!matchedUser) {
        return res.status(404).json({ error: "regId not found" });
      }
    
      res.json({ success: true, reg_id: matchedUser.reg_id, user : matchedUser });
    } catch (error) {
      console.error("Error fetching or processing data:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  } catch (err) {
    console.log("Catch error ",err)
    console.error("API Error:", err.message);
    res.status(500).json({ success: false, error: "Registration failed" , errorMsg : err});
  }
});









router.put("/register-step2/:regId", async (req, res) => {
  const { regId } = req.params;
  console.log(regId, req.body)
  console.log(JSON.stringify(req.body))
  let userData =  JSON.stringify(req.body);
  try {
    const response = await fetch(
      `${process.env.DB_API_URL}/USER/PUT/${regId}/`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: userData,
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // const putRes = await response.json();
    res.json({ success: true});
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Step 2 failed" });
  }
});









// POST /auth/login
router.post('/login', async (req, res) => {
  const { GMAIL, PASSWORD } = req.body;
  console.log(req.body, GMAIL, PASSWORD)

  if (!GMAIL || !PASSWORD) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  try {
    // Step 1: Verify user login credentials
    // const loginRes = await axios.get(`${DB_API_BASE}/LOGIN/GET_JIT/${GMAIL}/${PASSWORD}`);
    // const items = loginRes.data.items;
    const loginResponse = await fetch(`${DB_API_URL}/LOGIN/GET_JIT/${GMAIL}/${PASSWORD}`);
    if (!loginResponse.ok) {
      throw new Error(`Login API responded with status ${loginResponse.status}`);
    }
    const loginData = await loginResponse.json();
    const items = loginData.items;

    if (!items || items.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const { reg_id } = items[0];

    // Step 2: Fetch full user info from TOTAL_INFO/FILTER_GET/:reg_id
    const userResponse = await fetch(`${DB_API_URL}/TOTAL_INFO/FILTER_GET/${reg_id}`);
    
    if (!userResponse.ok) {
      throw new Error(`User info API responded with status ${userResponse.status}`);
    }
    const userData = await userResponse.json();
    const userInfo = userData.items && userData.items[0];

    if (!userInfo) {
      return res.status(404).json({ success: false, message: 'User info not found' });
    }

    // Remove password before sending to frontend
    const { user_password: _, ...userWithoutPassword } = userInfo;

    // Step 3: Sign JWT token with user info
    console.log(JWT_SECRET, userWithoutPassword)
    const token = jwt.sign(userWithoutPassword, JWT_SECRET, { expiresIn: '2h' });

    return res.json({ success: true, token, user: userWithoutPassword });
  } catch (err) {
    console.error('Login error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});









































// router.post('/login', async (req, res) => {
//   const { user_name, user_password } = req.body;

//   try {
//     const response = await axios.get('http://YOUR_DB_API/TOTAL_INFO/GET/');
//     const users = response.data.items;

//     const user = users.find(
//       (u) =>
//         u.user_name === user_name && u.user_password === user_password
//     );

//     if (!user) return res.status(401).json({ message: 'Invalid credentials' });

//     const token = jwt.sign(
//       { user_id: user.user_id, user_name: user.user_name },
//       process.env.JWT_SECRET,
//       { expiresIn: '1h' }
//     );

//     res.json({ success: true, token, user });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Login failed' });
//   }
// });

module.exports = router;
