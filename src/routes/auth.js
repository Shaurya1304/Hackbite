const express = require('express');
const router = express.Router();
const { signInWithPopup } = require('firebase/auth');
const { auth, githubProvider } = require('../config/firebase');

// Auth status check
router.get('/status', (req, res) => {
  if (req.session && req.session.user) {
    return res.json({ 
      isLoggedIn: true, 
      user: req.session.user 
    });
  }
  res.json({ isLoggedIn: false });
});

// Login route
router.get('/github', (req, res) => {
  // Store the original URL to redirect after login
  req.session.returnTo = req.query.returnTo || '/';
  res.render('login');
});

// Handle GitHub login callback
router.post('/github/callback', async (req, res) => {
  try {
    console.log('GitHub callback received');
    const { user, accessToken } = req.body;
    
    if (!user) {
      console.error('Missing user data in callback');
      return res.status(400).json({ error: 'User data not provided' });
    }
    
    console.log('User data received:', { 
      uid: user.uid,
      displayName: user.displayName || user.providerData?.[0]?.displayName,
      email: user.email || user.providerData?.[0]?.email,
      accessTokenProvided: !!accessToken
    });
    
    // Store user in session
    req.session.user = {
      uid: user.uid,
      displayName: user.displayName || user.providerData?.[0]?.displayName || 'GitHub User',
      email: user.email || user.providerData?.[0]?.email,
      photoURL: user.photoURL || user.providerData?.[0]?.photoURL,
      accessToken: accessToken // Store GitHub access token
    };
    
    console.log('User session created successfully');
    
    // Always redirect to home after login (the dashboard)
    return res.json({ success: true, redirectUrl: '/' });
  } catch (error) {
    console.error('Error with GitHub callback:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Logout route
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.redirect('/');
  });
});

module.exports = router; 