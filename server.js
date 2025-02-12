require('dotenv').config();
const cors = require('cors');
const express = require('express');
const axios = require('axios');
const path = require('path');
const qs = require('qs');
const { webcrypto } = require('crypto');
const { subtle } = webcrypto;

const app = express();
app.use(cors());


// Spotify API credentials
const CLIENT_ID = process.env.client_id;
const REDIRECT_URI = 'http://localhost:5000/callback';
const SCOPES = 'user-top-read';

// Serve static files from the "src" directory
app.use(express.static(path.join(__dirname, 'src')));

app.get('/api/top-tracks', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1]; // Extract Bearer token

  if (!token) {
    return res.status(401).json({ error: "No access token provided" });
  }

  try {
    const response = await axios.get('https://api.spotify.com/v1/me/top/tracks', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    res.json(response.data); // Send Spotify data to frontend
  } catch (error) {
    console.error("Error fetching Spotify top tracks:", error.response?.data || error);
    res.status(500).json({ error: "Failed to fetch top tracks" });
  }
});


// Helper function to generate a random string
function generateRandomString(length) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// Store the codeVerifier in memory
let codeVerifier = generateRandomString(128);

async function generatePKCE() {
  const buffer = new TextEncoder().encode(codeVerifier);
  const digest = await subtle.digest('SHA-256', buffer);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}


// Compute PKCE code verifier and challenge before starting server
(async () => {
  const codeChallenge = await generatePKCE();
  
  const AUTH_URL = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&scope=${encodeURIComponent(SCOPES)}&code_challenge_method=S256&code_challenge=${codeChallenge}`;

  app.get('/login', (req, res) => {
    res.redirect(AUTH_URL);
  });
})();


  app.get('/callback', async (req, res) => {
    const code = req.query.code;
  
    if (!code) {
      return res.status(400).send('No authorization code provided.');
    }
  
    const tokenUrl = 'https://accounts.spotify.com/api/token';
    const payload = {
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      code_verifier: codeVerifier, // Use stored codeVerifier
    };
  
    try {
      const response = await axios.post(tokenUrl, qs.stringify(payload), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
  
      const { access_token } = response.data;
      console.log('Access Token:', access_token);
  
      res.redirect(`/?access_token=${access_token}`);
    } catch (error) {
      console.error('Error fetching access token:', error.response?.data || error);
      res.status(500).send('Error fetching access token.');
    }
  });
  

  const PORT = 5000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
