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

// Helper function to generate a random string, length of 128
function generateRandomString(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + characters[x % characters.length], "");
}

//Also go into Hostinger and Add VPS for nodeJS backend. don't use render. unnecessary
//change this -> https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow
// Compute PKCE code verifier and challenge before starting server
const sha256 = async (plain) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
}

const base64encode = (input) => {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

const hashed = await sha256(codeVerifier);
const codeChallenge = base64encode(hashed);

(async () => {
  const codeVerifier = generateRandomString(128);
  const buffer = new TextEncoder().encode(codeVerifier);
  const digest = await subtle.digest('SHA-256', buffer);
  const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const AUTH_URL = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&scope=${encodeURIComponent(SCOPES)}&code_challenge_method=S256&code_challenge=${codeChallenge}`;

  // Routes
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'index.html'));
  });

  app.get('/login', (req, res) => {
    res.redirect(AUTH_URL);
  });

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
      code_verifier: codeVerifier,
    };

    try {
      const response = await axios.post(tokenUrl, qs.stringify(payload), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { access_token } = response.data;
      console.log('Access Token:', access_token);

      // Redirect back to the main page (index.html) with the access token
      res.redirect(`/?access_token=${access_token}`);
    } catch (error) {
      console.error('Error fetching access token:', error.response?.data || error);
      res.status(500).send('Error fetching access token.');
    }
  });

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

  const PORT = 5000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
})();
